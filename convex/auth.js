import { mutation } from "./_generated/server";
import { v } from "convex/values";

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hash password with SHA-256 + salt
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

// Verify password against stored hash  
async function verifyPassword(password, storedHash) {
  const newHash = await hashPassword(password);
  return newHash === storedHash;
}

export const signup = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) throw new Error("User already exists");

    const passwordHash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      name: args.name,
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

    return userId;
  },
});

export const login = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!user) throw new Error("User not found");

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) throw new Error("Invalid password");

    return user._id;
  },
});