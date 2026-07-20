import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ── Save a user+assistant message pair (called by the chat action) ──
export const saveMessages = internalMutation({
  args: {
    userId: v.id("users"),
    language: v.string(),
    userMessage: v.string(),
    assistantMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("chatMessages", {
      userId: args.userId,
      role: "user",
      content: args.userMessage,
      language: args.language,
      createdAt: now,
    });
    await ctx.db.insert("chatMessages", {
      userId: args.userId,
      role: "assistant",
      content: args.assistantMessage,
      language: args.language,
      createdAt: now + 1, // ensure ordering
    });
  },
});

// ── Get chat history for a user + language (public, used by frontend) ──
export const getChatHistory = query({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_language", (q) =>
        q.eq("userId", args.userId).eq("language", args.language)
      )
      .order("asc")
      .take(100);

    return messages.map((m) => ({
      _id: m._id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  },
});

// ── Clear all chat history for a user + language ──
export const clearHistory = mutation({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_language", (q) =>
        q.eq("userId", args.userId).eq("language", args.language)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: messages.length };
  },
});
