import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for Convex file storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get the public URL of an uploaded file (used to send to Flask)
export const getAudioUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Save assessment result and award XP
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
      ...args,
      xpEarned,
      createdAt: Date.now(),
    });
    const user = await ctx.db.get(args.userId);
    await ctx.db.patch(args.userId, { xp: user.xp + xpEarned });
    return { xpEarned };
  },
});