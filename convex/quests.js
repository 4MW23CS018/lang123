import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDailyProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);

    // 1. Practice 3 Lessons
    const assessmentsToday = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), startOfDay))
      .collect();

    const practiceCount = assessmentsToday.length;

    // 2. Score 90% or higher
    const highScores = assessmentsToday.filter(a => a.accuracy >= 90).length;

    // 3. Earn 50 XP
    const dailyXp = user.dailyXpDate === new Date(now).toISOString().slice(0, 10) ? (user.dailyXp || 0) : 0;
    const dailyGoal = user.dailyGoal || 50;

    return [
      {
        id: "practice_3",
        title: "Daily Practice",
        description: "Practice 3 lessons today",
        current: Math.min(practiceCount, 3),
        target: 3,
        icon: "📚",
        color: "var(--purple)",
      },
      {
        id: "score_90",
        title: "Sharpshooter",
        description: "Score 90% or higher on a lesson",
        current: Math.min(highScores, 1),
        target: 1,
        icon: "🎯",
        color: "var(--sky)",
      },
      {
        id: "earn_xp",
        title: "XP Grinder",
        description: `Earn ${dailyGoal} XP today`,
        current: Math.min(dailyXp, dailyGoal),
        target: dailyGoal,
        icon: "⚡",
        color: "var(--accent)",
      }
    ];
  },
});
