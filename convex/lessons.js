import { query } from "./_generated/server";
import { v } from "convex/values"; 
export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("lessons").collect(),
});

export const listByLanguage = query({
  args: { language: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("language"), args.language))
      .collect(),
});

export const getById = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});