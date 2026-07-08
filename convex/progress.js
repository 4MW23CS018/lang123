import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_creation_time")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return {
      totalAssessments: assessments.length,
      recentAccuracy: assessments.slice(-5).reduce((acc, curr) => acc + curr.accuracy, 0) / Math.min(5, assessments.length || 1),
      streak: user.streak || 0,
      totalXp: user.totalXp || 0,
    };
  },
});

export const getCompletedLessonIds = query({
  args: { userId: v.optional(v.string()) }, // accept string id from localstorage
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // A lesson is completed if the user got >= 80% accuracy on it
    const completedLessonIds = [
      ...new Set(
        assessments.filter((a) => a.accuracy >= 80).map((a) => a.lessonId)
      ),
    ];
    return completedLessonIds;
  },
});
