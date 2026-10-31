import { mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hash password with SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

// Verify password against stored hash (backward-compatible)
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const hash1 = await hashPassword(password);
  if (hash1 === storedHash) return true;

  const encoder = new TextEncoder();
  const saltedData = encoder.encode(password + "_langbridge_salt_2026");
  const saltedBuffer = await crypto.subtle.digest("SHA-256", saltedData);
  const hash2 = bufferToHex(saltedBuffer);
  return hash2 === storedHash;
}

// Generate secure 6-digit OTP
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP before database storage
async function hashOtp(code) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + "_langbridge_otp_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

// Resend Email Helper
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

// ── 1. REGISTRATION & OTP SENDING ──

export const prepareSignup = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const cleanName = args.name.trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Check if verified account already exists with this email
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingByEmail && existingByEmail.emailVerified) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    // Check if verified account already exists with this username
    const existingByName = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", cleanName))
      .first();

    if (existingByName && existingByName._id !== existingByEmail?._id && existingByName.emailVerified) {
      throw new Error("This username is already taken. Please choose another.");
    }

    // Rate-limiting check for OTP requests (60 seconds)
    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", normalizedEmail).eq("type", "signup"))
      .first();

    if (existingOtp && Date.now() - existingOtp.lastSentAt < 60000) {
      const waitSecs = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSecs} seconds before requesting a new verification code.`);
    }

    const otp = generateOtpCode();
    const codeHash = await hashOtp(otp);
    const passwordHash = await hashPassword(args.password);

    // Create or update pending user record
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

    // Save/update OTP
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: "signup",
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
      });
    }

    return { otp, email: normalizedEmail };
  },
});

export const sendSignupOtp = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { otp, email } = await ctx.runMutation(internal.auth.prepareSignup, {
      name: args.name,
      email: args.email,
      password: args.password,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 24px; margin: 0; }
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
          <p>Hi ${args.name.trim()},</p>
          <p>Thank you for joining LangBridge. Enter the 6-digit verification code below to activate your account:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">⏰ This code expires in <strong>10 minutes</strong>. Never share this code with anyone.</p>
          <div class="footer">
            If you did not create a LangBridge account, you can safely ignore this email.<br>
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

// ── 2. OTP VERIFICATION ──

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
      .withIndex("by_email_type", (q) => q.eq("email", normalizedEmail).eq("type", "signup"))
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
      throw new Error("Too many failed attempts. Please request a new code.");
    }

    const computedHash = await hashOtp(cleanCode);
    if (computedHash !== otpRecord.codeHash) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1,
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      throw new Error(`Invalid code. ${remaining} attempt(s) remaining.`);
    }

    // Code is valid! Delete OTP record
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

    return user._id;
  },
});

// ── 3. RESEND OTP ──

export const prepareResendOtp = internalMutation({
  args: {
    email: v.string(),
    type: v.string(), // "signup" | "reset_password"
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", normalizedEmail).eq("type", args.type))
      .first();

    if (existingOtp && Date.now() - existingOtp.lastSentAt < 60000) {
      const waitSecs = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSecs}s before resending.`);
    }

    const otp = generateOtpCode();
    const codeHash = await hashOtp(otp);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: args.type,
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
      });
    }

    return { otp, email: normalizedEmail };
  },
});

export const resendOtp = action({
  args: {
    email: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const { otp, email } = await ctx.runMutation(internal.auth.prepareResendOtp, {
      email: args.email,
      type: args.type,
    });

    const isReset = args.type === "reset_password";
    const title = isReset ? "Reset Your Password" : "Verify Your Email";
    const desc = isReset
      ? "Use the verification code below to reset your LangBridge password:"
      : "Use the verification code below to complete your registration:";

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, sans-serif; background: #0b0f17; color: #f1f5f9; padding: 24px;">
        <div style="max-width: 480px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px 28px;">
          <h2 style="color: #ffffff; margin-top: 0;">${title}</h2>
          <p style="color: #94a3b8; line-height: 1.6;">${desc}</p>
          <div style="background: rgba(34,197,94,0.1); border: 2px solid #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22c55e;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">⏰ Valid for 10 minutes.</p>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaResend({
      to: email,
      subject: `${otp} is your LangBridge code`,
      html,
    });

    return { success: true };
  },
});

// ── 4. FORGOT PASSWORD & RESET WITH OTP ──

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
      throw new Error("This email is not yet verified. Please sign up or complete email verification first.");
    }

    const existingOtp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", normalizedEmail).eq("type", "reset_password"))
      .first();

    if (existingOtp && Date.now() - existingOtp.lastSentAt < 60000) {
      const waitSecs = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSecs} seconds before requesting another reset code.`);
    }

    const otp = generateOtpCode();
    const codeHash = await hashOtp(otp);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    if (existingOtp) {
      await ctx.db.patch(existingOtp._id, {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
      });
    } else {
      await ctx.db.insert("otpCodes", {
        email: normalizedEmail,
        codeHash,
        type: "reset_password",
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now(),
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
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Use the 6-digit code below to set a new password:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
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
      .withIndex("by_email_type", (q) => q.eq("email", normalizedEmail).eq("type", "reset_password"))
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

    const computedHash = await hashOtp(cleanCode);
    if (computedHash !== otpRecord.codeHash) {
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1,
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      throw new Error(`Invalid code. ${remaining} attempt(s) remaining.`);
    }

    // Code is valid! Delete OTP record
    await ctx.db.delete(otpRecord._id);

    // Update password
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("User record not found.");
    }

    const passwordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      passwordHash,
      emailVerified: true,
    });

    return user._id;
  },
});

// ── 5. LOGIN MUTATION (Supports Email OR Username) ──

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

    // 1. Try finding by email (case-insensitive)
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

    // Fallback search without index just in case of unindexed legacy users
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

    // Check email verification if an email is attached to the account
    if (user.email && user.emailVerified === false) {
      throw new Error("UNVERIFIED_EMAIL: Please verify your email before logging in.");
    }

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid password. Please try again.");
    }

    return user._id;
  },
});

// Legacy direct signup fallback (backward-compatible)
export const signup = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanName = args.name.trim();
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), cleanName))
      .first();

    if (existing) throw new Error("Username already taken.");

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      name: cleanName,
      passwordHash,
      emailVerified: true, // legacy accounts default to true
      xp: 0,
      totalXp: 0,
      streak: 0,
      dailyGoal: 50,
      dailyXp: 0,
      gems: 0,
      streakFreezes: 0,
      onboardingCompleted: false,
    });

    return userId;
  },
});
