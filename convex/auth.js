import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

// PBKDF2 hash helper
async function hashPBKDF2(password, saltBytes) {
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
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bufferToHex(derivedBits);
}

// Hash password with SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

// Verify password against stored hash (supports PBKDF2, salted SHA-256, and raw SHA-256)
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  // PBKDF2 check
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length === 4) {
      const saltBytes = hexToBuffer(parts[2]);
      const computed = await hashPBKDF2(password, saltBytes);
      if (computed === parts[3]) return true;
    }
  }

  // SHA-256 check
  const newHash = await hashPassword(password);
  if (newHash === storedHash) return true;

  // Salted SHA-256 check
  const encoder = new TextEncoder();
  const saltedData = encoder.encode(password + "_langbridge_salt_2026");
  const saltedBuffer = await crypto.subtle.digest("SHA-256", saltedData);
  const saltedHash = bufferToHex(saltedBuffer);
  return saltedHash === storedHash;
}

export const signup = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanName = args.name.trim();
    if (!cleanName) throw new Error("Please enter a username.");
    if (args.password.length < 3) throw new Error("Password must be at least 3 characters.");

    const cleanLower = cleanName.toLowerCase();

    // Check if user already exists (case-insensitive to prevent duplicate accounts and confusion)
    const allUsers = await ctx.db.query("users").collect();
    const existing = allUsers.find(
      (u) => u.name && u.name.trim().toLowerCase() === cleanLower
    );

    if (existing) {
      // If the user entered the correct password for their existing account, seamlessly log them in!
      const valid = await verifyPassword(args.password, existing.passwordHash);
      if (valid) {
        return {
          userId: existing._id,
          name: existing.name,
          onboardingCompleted: !!existing.onboardingCompleted,
          isExistingUser: true,
        };
      }

      // If password did not match, raise clear error
      throw new Error("USERNAME_ALREADY_TAKEN");
    }

    const passwordHash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      name: cleanName,
      passwordHash,
      emailVerified: true,
      xp: 0,
      totalXp: 0,
      streak: 0,
      dailyGoal: 50,
      dailyXp: 0,
      gems: 0,
      streakFreezes: 0,
      onboardingCompleted: false,
    });

    return {
      userId,
      name: cleanName,
      onboardingCompleted: false,
      isExistingUser: false,
    };
  },
});

export const login = mutation({
  args: {
    name: v.optional(v.string()),
    emailOrUsername: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const term = (args.name || args.emailOrUsername || "").trim();
    const termLower = term.toLowerCase();

    // 1. Direct match query
    let user = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("name"), term),
          q.eq(q.field("email"), termLower)
        )
      )
      .first();

    // 2. Case-insensitive fallback if exact case differed
    if (!user) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(
        (u) =>
          (u.name && u.name.trim().toLowerCase() === termLower) ||
          (u.email && u.email.trim().toLowerCase() === termLower)
      );
    }

    if (!user) throw new Error("No account found with that username.");

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) throw new Error("Invalid password. Please try again.");

    return user._id;
  },
});
