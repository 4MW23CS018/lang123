import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveOnboarding = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.string(),
    reminderTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      onboardingCompleted: true,
      preferences: args.preferences,
      reminderTime: args.reminderTime,
    });
  },
});