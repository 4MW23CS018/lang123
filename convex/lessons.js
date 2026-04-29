import { query } from "./_generated/server";
import { v } from "convex/values"; 
export const list = query({
  handler: async (ctx) => await ctx.db.query("lessons").collect(),
});

export const getById = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});