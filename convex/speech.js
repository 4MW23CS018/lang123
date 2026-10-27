import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getAudioUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveAssessment = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    transcription: v.string(),
    accuracy: v.number(),
    audioStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const xpEarned = Math.round(args.accuracy * 0.2);
    
    await ctx.db.insert("assessments", {
      userId: args.userId,
      lessonId: args.lessonId,
      transcription: args.transcription,
      accuracy: args.accuracy,
      audioStorageId: args.audioStorageId,
      xpEarned,
      createdAt: Date.now(),
    });

    // Delegate to gamification module using internal mutation
    await ctx.scheduler.runAfter(0, internal.gamification.updateGamification, {
      userId: args.userId,
      xpEarned,
    });

    // Update SRS schedule
    await ctx.scheduler.runAfter(0, internal.srs.updateReview, {
      userId: args.userId,
      lessonId: args.lessonId,
      accuracy: args.accuracy,
    });

    return { xpEarned };
  },
});