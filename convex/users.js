import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    let avatarUrl = user.avatarUrl || null;
    if (user.avatarStorageId) {
      const storageUrl = await ctx.storage.getUrl(user.avatarStorageId);
      if (storageUrl) avatarUrl = storageUrl;
    }

    return {
      ...user,
      avatarUrl,
      equippedBanner: user.equippedBanner || "banner_default",
      equippedBorder: user.equippedBorder || "border_default",
      unlockedBorders: user.unlockedBorders?.length ? user.unlockedBorders : ["border_default"],
      unlockedBanners: user.unlockedBanners?.length ? user.unlockedBanners : ["banner_default"],
      maxStreak: Math.max(user.maxStreak || 0, user.streak || 0),
    };
  },
});

export const getProfileStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalAssessments = assessments.length;
    let avgAccuracy = 0;
    if (totalAssessments > 0) {
      const sum = assessments.reduce((acc, a) => acc + (a.accuracy || 0), 0);
      avgAccuracy = Math.round(sum / totalAssessments);
    }

    return {
      totalAssessments,
      avgAccuracy,
    };
  },
});

export const getLeaderboard = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users") 
      .take(50); //logic
    users.sort((a, b) => (b.totalXp || b.xp || 0) - (a.totalXp || a.xp || 0));
    return users.slice(0, 10);
  },
});

export const generateAvatarUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAvatar = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const avatarUrl = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(args.userId, {
      avatarStorageId: args.storageId,
      avatarUrl: avatarUrl || undefined,
    });

    return { success: true, avatarUrl };
  },
});

export const removeAvatar = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      avatarStorageId: undefined,
      avatarUrl: undefined,
    });

    return { success: true };
  },
});

export const updateBestLanguage = mutation({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      bestLanguage: args.language,
    });

    return { success: true };
  },
});

export const updateDailyGoal = mutation({
  args: {
    userId: v.id("users"),
    dailyGoal: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      dailyGoal: args.dailyGoal,
    });
  },
});
