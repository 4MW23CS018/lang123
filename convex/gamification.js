import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const updateGamification = internalMutation({
  args: {
    userId: v.id("users"),
    xpEarned: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    let newStreak = user.streak || 0;
    let lastPracticeDate = user.lastPracticeDate || 0;

    if (now - lastPracticeDate < oneDay * 2 && now - lastPracticeDate > oneDay) {
      newStreak += 1;
    } else if (now - lastPracticeDate >= oneDay * 2) {
      newStreak = 1;
    } else if (lastPracticeDate === 0) {
      newStreak = 1;
    }

    const newTotalXp = (user.totalXp || 0) + args.xpEarned;
    const newXp = (user.xp || 0) + args.xpEarned;
    
    // Earn 1 Gem for every 5 XP earned (minimum 1 gem)
    const gemsEarned = Math.max(1, Math.floor(args.xpEarned / 5));
    const newGems = (user.gems || 0) + gemsEarned;

    // Daily XP tracking — reset if new day
    const todayStr = new Date(now).toISOString().slice(0, 10); // "YYYY-MM-DD"
    const storedDate = user.dailyXpDate || "";
    const isNewDay = storedDate !== todayStr;
    const newDailyXp = isNewDay ? args.xpEarned : (user.dailyXp || 0) + args.xpEarned;

    await ctx.db.patch(args.userId, {
      xp: newXp,
      totalXp: newTotalXp,
      streak: newStreak,
      lastPracticeDate: now,
      dailyXp: newDailyXp,
      dailyXpDate: todayStr,
      gems: newGems,
    });

    // Check for achievements
    if (newStreak === 7) {
      await ctx.db.insert("achievements", {
        userId: args.userId,
        name: "7 Day Streak",
        description: "You practiced for 7 days in a row!",
        unlockedAt: now,
      });
    }

    // Check if daily goal met
    const dailyGoal = user.dailyGoal || 50;
    const dailyGoalMet = newDailyXp >= dailyGoal;

    if (dailyGoalMet && (isNewDay || (user.dailyXp || 0) < dailyGoal)) {
      // Just crossed the goal threshold
      await ctx.db.insert("achievements", {
        userId: args.userId,
        name: "Daily Goal Crushed",
        description: `Hit your daily goal of ${dailyGoal} XP!`,
        unlockedAt: now,
      });
    }
  },
});

