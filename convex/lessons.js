import { query } from "./_generated/server";
import { v } from "convex/values"; 
export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("lessons").collect(),
});

export const listByLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .collect();
    
    // Sort by order (official path lessons first), then by creation/id
    return lessons.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  },
});

export const getById = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

import { mutation } from "./_generated/server";
export const create = mutation({
  args: {
    title: v.string(),
    language: v.string(),
    phrase: v.string(),
    phonetics: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    description: v.optional(v.string()),
    displayPhrase: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", args);
  },
});