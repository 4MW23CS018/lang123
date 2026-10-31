import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getSessionUser, assertAuthorized } from "./auth";

export const get = query({
  args: {
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. If session token provided, derive verified user
    if (args.sessionToken) {
      const auth = await getSessionUser(ctx, args.sessionToken);
      if (!auth) return null;
      // If a specific userId was also requested, prevent accessing other users' private profiles
      if (args.userId && args.userId !== auth.user._id) {
        throw new Error("Unauthorized: Access denied to another user's profile.");
      }
      return auth.user;
    }

    // 2. Fallback to userId
    if (args.userId) {
      return await ctx.db.get(args.userId);
    }

    return null;
  },
});

export const getLeaderboard = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .take(50);
    // Sort by totalXp descending
    users.sort((a, b) => (b.totalXp || b.xp || 0) - (a.totalXp || a.xp || 0));
    return users.slice(0, 10);
  },
});

export const updateDailyGoal = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.optional(v.string()),
    dailyGoal: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await assertAuthorized(ctx, args.sessionToken, args.userId);
    }
    await ctx.db.patch(args.userId, {
      dailyGoal: args.dailyGoal,
    });
  },
});
