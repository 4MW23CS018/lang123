import { mutation, action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ── UTILITY: BUFFER & HEX CONVERSION ──

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Constant-time string equality check to prevent timing attacks
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// HTML escape helper to prevent HTML injection in emails
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── 1. CRYPTOGRAPHIC PASSWORD HASHING (PBKDF2) & LEGACY MIGRATION ──

const PBKDF2_ITERATIONS = 100000;

async function hashPasswordPBKDF2(password, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 32 bytes
  );
  return bufferToHex(derivedBits);
}

// Creates a PBKDF2 password hash with a cryptographically secure 16-byte salt
export async function createPasswordHash(password) {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltHex = bufferToHex(saltBytes);
  const hashHex = await hashPasswordPBKDF2(password, saltBytes);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

// Verifies password against PBKDF2 or legacy SHA-256, indicating if migration is needed
async function verifyAndMigratePassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return { valid: false, needsMigration: false };
  }

  // 1. Modern PBKDF2 format
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 4) return { valid: false, needsMigration: false };
    const saltBytes = hexToBuffer(parts[2]);
    const computedHash = await hashPasswordPBKDF2(password, saltBytes);
    const valid = timingSafeEqual(computedHash, parts[3]);
    return { valid, needsMigration: false };
  }

  // 2. Legacy SHA-256 (raw)
  const enc = new TextEncoder();
  const rawDigest = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const rawHex = bufferToHex(rawDigest);
  if (timingSafeEqual(rawHex, storedHash)) {
    return { valid: true, needsMigration: true };
  }

  // 3. Legacy SHA-256 with static salt
  const saltedDigest = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(password + "_langbridge_salt_2026")
  );
  const saltedHex = bufferToHex(saltedDigest);
  if (timingSafeEqual(saltedHex, storedHash)) {
    return { valid: true, needsMigration: true };
  }

  return { valid: false, needsMigration: false };
}

// ── 2. CRYPTOGRAPHICALLY SECURE OTP & SERVER-SECRET HMAC ──

// Generates uniform 6-digit OTP using crypto.getRandomValues with rejection sampling
export function generateSecureOtp() {
  const range = 900000; // 100,000 to 999,999
  const maxAcceptable = Math.floor(0xffffffff / range) * range;
  const array = new Uint32Array(1);
  let rand;
  do {
    crypto.getRandomValues(array);
    rand = array[0];
  } while (rand >= maxAcceptable);
  return (100000 + (rand % range)).toString();
}

function getHmacSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.CONVEX_SITE_URL ||
    "langbridge-default-secure-entropy-hmac-salt"
  );
}

// Computes HMAC-SHA256 signature for the OTP bound to email and operation type
export async function computeOtpHmac(email, type, code) {
  const secret = getHmacSecret();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = enc.encode(`${email.toLowerCase()}:${type}:${code}`);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return bufferToHex(signature);
}

// ── 3. SESSION TOKEN MANAGEMENT ──

export function generateSecureToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

export async function hashToken(token) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return bufferToHex(digest);
}

// Creates a server-side session for an authenticated user (valid for 30 days)
async function createSession(ctx, userId) {
  const rawToken = generateSecureToken();
  const sessionTokenHash = await hashToken(rawToken);
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

  await ctx.db.insert("sessions", {
    userId,
    sessionTokenHash,
    expiresAt,
    createdAt: now,
    lastActiveAt: now,
  });

  return rawToken;
}

// Internal helper to verify a session token and fetch the authenticated user
export async function getSessionUser(ctx, sessionToken) {
  if (!sessionToken || typeof sessionToken !== "string") return null;

  const tokenHash = await hashToken(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("sessionTokenHash", tokenHash))
    .first();

  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    await ctx.db.delete(session._id);
    return null;
  }

  // Update last active if more than 1 hour has elapsed
  if (Date.now() - session.lastActiveAt > 60 * 60 * 1000) {
    await ctx.db.patch(session._id, { lastActiveAt: Date.now() });
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    await ctx.db.delete(session._id);
    return null;
  }

  return { session, user };
}

// Assertion helper for protected queries/mutations
export async function assertAuthorized(ctx, sessionToken, targetUserId) {
  if (!sessionToken) {
    throw new Error("Unauthorized: Authentication session required.");
  }
  const result = await getSessionUser(ctx, sessionToken);
  if (!result || !result.user) {
    throw new Error("Unauthorized: Invalid or expired session.");
  }
  if (targetUserId && result.user._id !== targetUserId) {
    throw new Error("Forbidden: Access denied to other user's resource.");
  }
  return result.user;
}

// ── 4. RESEND EMAIL DELIVERY ──

async function sendEmailViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured in Convex environment. Set it using: npx convex env set RESEND_API_KEY re_..."
    );
  }

  const fromEmail = process.env.EMAIL_FROM || "LangBridge <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Resend Delivery Error]", res.status, errorText);
    let parsedMsg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      parsedMsg = parsed.message || errorText;
    } catch (_) {}
    throw new Error(`Email delivery failed: ${parsedMsg}`);
  }

  return await res.json();
}

// ── 5. REGISTRATION WITH CRYPTOGRAPHIC OTP & RATE LIMITING ──

export const prepareSignup = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const cleanName = args.name.trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Account eligibility: email must not belong to an active verified user
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingByEmail && existingByEmail.emailVerified) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    // Account eligibility: username must not belong to an active verified user
    const existingByName = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", cleanName))
      .first();

    if (
      existingByName &&
      existingByName.emailVerified &&
      existingByName._id !== existingByEmail?._id
    ) {
      throw new Error("This username is already taken. Please choose another.");
    }

    // Comprehensive rate-limiting checks
    const now = Date.now();
    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", normalizedEmail).eq("type", "signup")
      )
      .first();

    const ONE_HOUR = 60 * 60 * 1000;
    let sendCount = 1;
    let windowStart = now;

    if (existingOtp) {
      // 1. Cooldown rate limit (60 seconds between requests)
      if (now - existingOtp.lastSentAt < 60000) {
        const waitSecs = Math.ceil((60000 - (now - existingOtp.lastSentAt)) / 1000);
        throw new Error(`Please wait ${waitSecs} seconds before requesting a new code.`);
      }

      // 2. Window rate limit (max 5 requests per hour)
      if (now - existingOtp.windowStart < ONE_HOUR) {
        if (existingOtp.sendCount >= 5) {
          const waitMins = Math.ceil((ONE_HOUR - (now - existingOtp.windowStart)) / 60000);
          throw new Error(
            `Rate limit exceeded: Maximum 5 verification codes per hour. Please try again in ${waitMins} minutes.`
          );
        }
        sendCount = existingOtp.sendCount + 1;
        windowStart = existingOtp.windowStart;
      }
    }

    // Generate cryptographic OTP and HMAC
    const otp = generateSecureOtp();
    const codeHash = await computeOtpHmac(normalizedEmail, "signup", otp);
    const passwordHash = await createPasswordHash(args.password);

    // Create or update pending unverified user
    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        name: cleanName,
        passwordHash,
        emailVerified: false,
      });
    } else {
      await ctx.db.insert("users", {
        name: cleanName,
        email: normalizedEmail,
        emailVerified: false,
        passwordHash,
        xp: 0,
        totalXp: 0,
        streak: 0,
        dailyGoal: 50,
        dailyXp: 0,
        gems: 0,
        streakFreezes: 0,
        onboardingCompleted: false,
      });
    }

    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: "signup",
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    }

    return { otp, email: normalizedEmail, name: cleanName };
  },
});

export const sendSignupOtp = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { otp, email, name } = await ctx.runMutation(internal.auth.prepareSignup, {
      name: args.name,
      email: args.email,
      password: args.password,
    });

    // Escape all user-controlled values to prevent HTML injection in emails
    const safeName = escapeHtml(name);
    const safeOtp = escapeHtml(otp);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
          .container { max-width: 480px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
          .brand { font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 20px; }
          .brand-accent { color: #22c55e; }
          h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
          p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
          .otp-box { background: rgba(34, 197, 94, 0.1); border: 2px solid #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22c55e; }
          .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">Lang<span class="brand-accent">Bridge</span></div>
          <h2>Verify Your Email</h2>
          <p>Hi ${safeName},</p>
          <p>Enter the 6-digit verification code below to complete your registration and activate your account:</p>
          <div class="otp-box">
            <div class="otp-code">${safeOtp}</div>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">⏰ This code expires in <strong>10 minutes</strong>. Never share this code with anyone.</p>
          <div class="footer">
            If you did not register for LangBridge, you can safely ignore this email.<br>
            &copy; ${new Date().getFullYear()} LangBridge.
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaResend({
      to: email,
      subject: `${otp} is your LangBridge verification code`,
      html,
    });

    return { success: true, email };
  },
});

// ── 6. VERIFY OTP AND ESTABLISH AUTHENTICATED SESSION ──

export const verifySignupOtp = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const cleanCode = args.code.trim();

    const otpRecord = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", normalizedEmail).eq("type", "signup")
      )
      .first();

    if (!otpRecord) {
      throw new Error("No pending verification found. Please request a new code.");
    }

    if (Date.now() > otpRecord.expiresAt) {
      await ctx.db.delete(otpRecord._id);
      throw new Error("Verification code has expired. Please request a new code.");
    }

    if (otpRecord.attempts >= 5) {
      await ctx.db.delete(otpRecord._id);
      throw new Error(
        "Too many failed attempts. This code has been invalidated. Please request a new code."
      );
    }

    // Verify HMAC using timing-safe comparison
    const computedHmac = await computeOtpHmac(normalizedEmail, "signup", cleanCode);
    if (!timingSafeEqual(computedHmac, otpRecord.codeHash)) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1,
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      throw new Error(`Invalid code. ${remaining} attempt(s) remaining.`);
    }

    // Success: Delete OTP record
    await ctx.db.delete(otpRecord._id);

    // Activate the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("User record not found. Please sign up again.");
    }

    await ctx.db.patch(user._id, {
      emailVerified: true,
    });

    // Create secure session
    const sessionToken = await createSession(ctx, user._id);
    return { userId: user._id, sessionToken };
  },
});

// ── 7. RESEND OTP WITH RATE LIMIT & ELIGIBILITY CHECKS ──

export const prepareResendOtp = internalMutation({
  args: {
    email: v.string(),
    type: v.union(v.literal("signup"), v.literal("reset_password")),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    // Verify account eligibility for the specified type
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (args.type === "signup") {
      if (!user || user.emailVerified) {
        throw new Error("No pending unverified registration found for this email.");
      }
    } else if (args.type === "reset_password") {
      if (!user || !user.emailVerified) {
        throw new Error("No active verified account found for this email address.");
      }
    }

    const now = Date.now();
    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", normalizedEmail).eq("type", args.type)
      )
      .first();

    const ONE_HOUR = 60 * 60 * 1000;
    let sendCount = 1;
    let windowStart = now;

    if (existingOtp) {
      // Cooldown check
      if (now - existingOtp.lastSentAt < 60000) {
        const waitSecs = Math.ceil((60000 - (now - existingOtp.lastSentAt)) / 1000);
        throw new Error(`Please wait ${waitSecs}s before requesting a new code.`);
      }

      // Hourly quota check
      if (now - existingOtp.windowStart < ONE_HOUR) {
        if (existingOtp.sendCount >= 5) {
          const waitMins = Math.ceil((ONE_HOUR - (now - existingOtp.windowStart)) / 60000);
          throw new Error(
            `Rate limit exceeded: Maximum 5 verification codes per hour. Please wait ${waitMins} minutes.`
          );
        }
        sendCount = existingOtp.sendCount + 1;
        windowStart = existingOtp.windowStart;
      }
    }

    const otp = generateSecureOtp();
    const codeHash = await computeOtpHmac(normalizedEmail, args.type, otp);
    const expiresAt = now + 10 * 60 * 1000;

    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: args.type,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    }

    return { otp, email: normalizedEmail, name: user.name };
  },
});

export const resendOtp = action({
  args: {
    email: v.string(),
    type: v.union(v.literal("signup"), v.literal("reset_password")),
  },
  handler: async (ctx, args) => {
    const { otp, email, name } = await ctx.runMutation(internal.auth.prepareResendOtp, {
      email: args.email,
      type: args.type,
    });

    const isReset = args.type === "reset_password";
    const title = isReset ? "Reset Your Password" : "Verify Your Email";
    const desc = isReset
      ? "Use the verification code below to reset your LangBridge password:"
      : "Use the verification code below to complete your registration:";

    const safeName = escapeHtml(name);
    const safeOtp = escapeHtml(otp);

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px 28px;">
          <h2 style="color: #ffffff; margin-top: 0;">${title}</h2>
          <p style="color: #cbd5e1;">Hi ${safeName},</p>
          <p style="color: #94a3b8; line-height: 1.6;">${desc}</p>
          <div style="background: rgba(34,197,94,0.1); border: 2px solid #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22c55e;">${safeOtp}</span>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">⏰ Valid for 10 minutes.</p>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaResend({
      to: email,
      subject: `${otp} is your LangBridge verification code`,
      html,
    });

    return { success: true };
  },
});

// ── 8. FORGOT PASSWORD & PASSWORD RESET (REVOKES EXISTING SESSIONS) ──

export const preparePasswordReset = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("No registered account found with that email address.");
    }

    if (!user.emailVerified) {
      throw new Error(
        "This email is not yet verified. Please sign up or complete email verification first."
      );
    }

    const now = Date.now();
    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", normalizedEmail).eq("type", "reset_password")
      )
      .first();

    const ONE_HOUR = 60 * 60 * 1000;
    let sendCount = 1;
    let windowStart = now;

    if (existingOtp) {
      if (now - existingOtp.lastSentAt < 60000) {
        const waitSecs = Math.ceil((60000 - (now - existingOtp.lastSentAt)) / 1000);
        throw new Error(`Please wait ${waitSecs} seconds before requesting another reset code.`);
      }

      if (now - existingOtp.windowStart < ONE_HOUR) {
        if (existingOtp.sendCount >= 5) {
          const waitMins = Math.ceil((ONE_HOUR - (now - existingOtp.windowStart)) / 60000);
          throw new Error(
            `Rate limit exceeded: Maximum 5 reset requests per hour. Please wait ${waitMins} minutes.`
          );
        }
        sendCount = existingOtp.sendCount + 1;
        windowStart = existingOtp.windowStart;
      }
    }

    const otp = generateSecureOtp();
    const codeHash = await computeOtpHmac(normalizedEmail, "reset_password", otp);
    const expiresAt = now + 10 * 60 * 1000;

    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: "reset_password",
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        sendCount,
        windowStart,
      });
    }

    return { otp, email: normalizedEmail, name: user.name };
  },
});

export const sendPasswordResetOtp = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { otp, email, name } = await ctx.runMutation(internal.auth.preparePasswordReset, {
      email: args.email,
    });

    const safeName = escapeHtml(name);
    const safeOtp = escapeHtml(otp);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
          .container { max-width: 480px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px 28px; }
          .brand { font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 20px; }
          .brand-accent { color: #f59e0b; }
          h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
          p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
          .otp-box { background: rgba(245, 158, 11, 0.1); border: 2px solid #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; }
          .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">Lang<span class="brand-accent">Bridge</span></div>
          <h2>Reset Your Password</h2>
          <p>Hi ${safeName},</p>
          <p>We received a request to reset your password. Use the 6-digit code below to set a new password:</p>
          <div class="otp-box">
            <div class="otp-code">${safeOtp}</div>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">⏰ Valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} LangBridge.
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaResend({
      to: email,
      subject: `${otp} is your LangBridge password reset code`,
      html,
    });

    return { success: true };
  },
});

export const resetPasswordWithOtp = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const cleanCode = args.code.trim();

    if (args.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const otpRecord = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) =>
        q.eq("email", normalizedEmail).eq("type", "reset_password")
      )
      .first();

    if (!otpRecord) {
      throw new Error("No password reset request found. Please request a new code.");
    }

    if (Date.now() > otpRecord.expiresAt) {
      await ctx.db.delete(otpRecord._id);
      throw new Error("Reset code has expired. Please request a new code.");
    }

    if (otpRecord.attempts >= 5) {
      await ctx.db.delete(otpRecord._id);
      throw new Error("Too many failed attempts. Please request a new reset code.");
    }

    const computedHmac = await computeOtpHmac(normalizedEmail, "reset_password", cleanCode);
    if (!timingSafeEqual(computedHmac, otpRecord.codeHash)) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1,
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      throw new Error(`Invalid code. ${remaining} attempt(s) remaining.`);
    }

    // Code is valid! Delete OTP record
    await ctx.db.delete(otpRecord._id);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("User record not found.");
    }

    // Update password with PBKDF2 hash
    const passwordHash = await createPasswordHash(args.newPassword);
    await ctx.db.patch(user._id, {
      passwordHash,
      emailVerified: true,
    });

    // REVOKE ALL EXISTING SESSIONS across all devices (Requirement 11)
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.delete(session._id);
    }

    // Issue a single fresh session for this device
    const sessionToken = await createSession(ctx, user._id);
    return { userId: user._id, sessionToken };
  },
});

// ── 9. LOGIN WITH AUTOMATIC PBKDF2 MIGRATION & SESSION CREATION ──

export const login = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailOrUsername: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const queryTerm = (args.emailOrUsername || args.email || args.name || "").trim();

    if (!queryTerm) {
      throw new Error("Please enter your email or username.");
    }

    // 1. Try finding user by email
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", queryTerm.toLowerCase()))
      .first();

    // 2. If not found by email, try finding by name (username)
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", queryTerm))
        .first();
    }

    // Fallback unindexed search for legacy records
    if (!user) {
      user = await ctx.db
        .query("users")
        .filter((q) =>
          q.or(
            q.eq(q.field("name"), queryTerm),
            q.eq(q.field("email"), queryTerm.toLowerCase())
          )
        )
        .first();
    }

    if (!user) {
      throw new Error("No account found with that email or username.");
    }

    // Enforce email verification if email exists on account
    if (user.email && user.emailVerified === false) {
      throw new Error("UNVERIFIED_EMAIL: Please verify your email before logging in.");
    }

    // Verify password with backward compatibility and in-place PBKDF2 migration
    const { valid, needsMigration } = await verifyAndMigratePassword(
      args.password,
      user.passwordHash
    );

    if (!valid) {
      throw new Error("Invalid password. Please try again.");
    }

    // If legacy hash matched, upgrade password hash to PBKDF2 in-place (Requirement 1)
    if (needsMigration) {
      const newHash = await createPasswordHash(args.password);
      await ctx.db.patch(user._id, { passwordHash: newHash });
    }

    // Issue authentic server session token (Requirement 5)
    const sessionToken = await createSession(ctx, user._id);
    return { userId: user._id, sessionToken };
  },
});

// ── 10. SESSION VALIDATION & LOGOUT ──

export const validateSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await getSessionUser(ctx, args.sessionToken);
    if (!result) return { valid: false, user: null };
    return { valid: true, user: result.user };
  },
});

export const logout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("sessionTokenHash", tokenHash))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

// ── 11. REMOVAL OF UNVERIFIED SIGNUP BYPASS & LEGACY MIGRATION ──

// Legacy signup is explicitly disabled to prevent verification bypass (Requirement 4)
export const signup = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async () => {
    throw new Error(
      "Direct unverified registration is disabled. Please use registration with email verification."
    );
  },
});

// Migration helper to ensure all existing legitimate accounts have emailVerified: true
export const migrateLegacyUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let migratedCount = 0;
    for (const user of users) {
      if (user.emailVerified === undefined) {
        await ctx.db.patch(user._id, { emailVerified: true });
        migratedCount++;
      }
    }
    return { success: true, migratedCount, totalUsers: users.length };
  },
});

// ── 12. CLEANUP OF EXPIRED OTPS AND ABANDONED PENDING ACCOUNTS ──

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Clean expired OTP codes
    const otps = await ctx.db.query("otpCodes").collect();
    let deletedOtps = 0;
    for (const otp of otps) {
      if (otp.expiresAt < now || now - otp.lastSentAt > 2 * 60 * 60 * 1000) {
        await ctx.db.delete(otp._id);
        deletedOtps++;
      }
    }

    // 2. Clean abandoned unverified pending user registrations (> 24 hours old)
    const unverifiedUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("emailVerified"), false))
      .collect();
    let deletedPendingUsers = 0;
    for (const u of unverifiedUsers) {
      if (now - u._creationTime > 24 * 60 * 60 * 1000) {
        await ctx.db.delete(u._id);
        deletedPendingUsers++;
      }
    }

    // 3. Clean expired sessions
    const sessions = await ctx.db.query("sessions").collect();
    let deletedSessions = 0;
    for (const s of sessions) {
      if (s.expiresAt < now) {
        await ctx.db.delete(s._id);
        deletedSessions++;
      }
    }

    return { deletedOtps, deletedPendingUsers, deletedSessions };
  },
});
