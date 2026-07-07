import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getLeaderboard = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .take(50);
    // Sort by totalXp descending (no index available, so sort in JS)
    users.sort((a, b) => (b.totalXp || b.xp || 0) - (a.totalXp || a.xp || 0));
    return users.slice(0, 10);
  },
});