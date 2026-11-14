import { query, mutation } from "./_generated/server";
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
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const normalizedId = ctx.db.normalizeId("lessons", args.id);
      if (normalizedId) {
        const byId = await ctx.db.get(normalizedId);
        if (byId) return byId;
      }
    } catch (_) {}
    return await ctx.db
      .query("lessons")
      .withIndex("by_nodeKey", (q) => q.eq("nodeKey", args.id))
      .first();
  },
});

export const getByNodeKey = query({
  args: { nodeKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_nodeKey", (q) => q.eq("nodeKey", args.nodeKey))
      .first();
  },
});

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
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", args);
  },
});

export const ensureLesson = mutation({
  args: {
    nodeKey: v.string(),
    parentKey: v.optional(v.string()),
    categoryId: v.string(),
    level: v.number(),
    title: v.string(),
    language: v.string(),
    phrase: v.string(),
    phonetics: v.optional(v.string()),
    meaning: v.optional(v.string()),
    description: v.optional(v.string()),
    context: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    contentReviewStatus: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if lesson with this nodeKey already exists
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_nodeKey", (q) => q.eq("nodeKey", args.nodeKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        phrase: args.phrase,
        phonetics: args.phonetics,
        meaning: args.meaning,
        context: args.context,
        difficulty: args.difficulty,
        contentReviewStatus: args.contentReviewStatus,
        categoryId: args.categoryId,
        level: args.level,
        parentKey: args.parentKey,
      });
      return existing._id;
    }

    // Also check if an older lesson with same language and phrase exists
    const byPhrase = await ctx.db
      .query("lessons")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .filter((q) => q.eq(q.field("phrase"), args.phrase))
      .first();

    if (byPhrase) {
      await ctx.db.patch(byPhrase._id, {
        nodeKey: args.nodeKey,
        parentKey: args.parentKey,
        categoryId: args.categoryId,
        level: args.level,
        meaning: args.meaning,
        context: args.context,
        contentReviewStatus: args.contentReviewStatus,
        phonetics: args.phonetics || byPhrase.phonetics,
      });
      return byPhrase._id;
    }

    return await ctx.db.insert("lessons", {
      title: args.title,
      language: args.language,
      phrase: args.phrase,
      phonetics: args.phonetics,
      difficulty: args.difficulty || "beginner",
      description: args.description || args.meaning,
      displayPhrase: `${args.phrase} (${args.phonetics || ""})`,
      isCustom: false,
      order: args.order || 99,
      nodeKey: args.nodeKey,
      parentKey: args.parentKey,
      categoryId: args.categoryId,
      level: args.level,
      meaning: args.meaning,
      context: args.context,
      contentReviewStatus: args.contentReviewStatus || "verified",
    });
  },
});

export const batchSeedTreeLessons = mutation({
  args: {
    lessons: v.array(
      v.object({
        nodeKey: v.string(),
        parentKey: v.optional(v.union(v.string(), v.null())),
        categoryId: v.string(),
        level: v.number(),
        title: v.string(),
        language: v.string(),
        phrase: v.string(),
        phonetics: v.optional(v.string()),
        meaning: v.optional(v.string()),
        context: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        contentReviewStatus: v.optional(v.string()),
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const keyToId = new Map();

    for (const item of args.lessons) {
      const parentKey = item.parentKey || undefined;
      const existing = await ctx.db
        .query("lessons")
        .withIndex("by_nodeKey", (q) => q.eq("nodeKey", item.nodeKey))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: item.title,
          phrase: item.phrase,
          phonetics: item.phonetics,
          meaning: item.meaning,
          context: item.context,
          difficulty: item.difficulty,
          contentReviewStatus: item.contentReviewStatus,
          categoryId: item.categoryId,
          level: item.level,
          parentKey,
        });
        keyToId.set(item.nodeKey, existing._id);
      } else {
        const byPhrase = await ctx.db
          .query("lessons")
          .withIndex("by_language", (q) => q.eq("language", item.language))
          .filter((q) => q.eq(q.field("phrase"), item.phrase))
          .first();

        if (byPhrase) {
          await ctx.db.patch(byPhrase._id, {
            nodeKey: item.nodeKey,
            parentKey,
            categoryId: item.categoryId,
            level: item.level,
            meaning: item.meaning,
            context: item.context,
            contentReviewStatus: item.contentReviewStatus,
            phonetics: item.phonetics || byPhrase.phonetics,
          });
          keyToId.set(item.nodeKey, byPhrase._id);
        } else {
          const newId = await ctx.db.insert("lessons", {
            title: item.title,
            language: item.language,
            phrase: item.phrase,
            phonetics: item.phonetics,
            difficulty: item.difficulty || "beginner",
            description: item.meaning || item.title,
            displayPhrase: `${item.phrase} (${item.phonetics || ""})`,
            isCustom: false,
            order: item.order || 99,
            nodeKey: item.nodeKey,
            parentKey,
            categoryId: item.categoryId,
            level: item.level,
            meaning: item.meaning,
            context: item.context,
            contentReviewStatus: item.contentReviewStatus || "verified",
          });
          keyToId.set(item.nodeKey, newId);
        }
      }
    }

    // Link parentId if parent exists
    for (const item of args.lessons) {
      if (item.parentKey && keyToId.has(item.parentKey)) {
        const childId = keyToId.get(item.nodeKey);
        const parentId = keyToId.get(item.parentKey);
        if (childId && parentId) {
          await ctx.db.patch(childId, { parentId });
        }
      }
    }

    return { seededCount: args.lessons.length };
  },
});
