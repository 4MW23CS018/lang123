import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal queries used by the RAG chatbot action to retrieve
 * context from the database before sending to the LLM.
 */

// Fetch all lessons for a given language, organized by unit/topic
export const getLanguageContext = internalQuery({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_language", (q) => q.eq("language", args.language))
      .collect();

    // Group by unit/topic for structured context
    const units = {};
    for (const lesson of lessons) {
      const unitKey = lesson.unit
        ? `Unit ${lesson.unit}: ${lesson.topic || "General"}`
        : "Extra Phrases";
      if (!units[unitKey]) units[unitKey] = [];
      units[unitKey].push({
        title: lesson.title,
        phrase: lesson.phrase,
        displayPhrase: lesson.displayPhrase || lesson.phrase,
        phonetics: lesson.phonetics || "",
        difficulty: lesson.difficulty || "beginner",
        description: lesson.description || "",
      });
    }

    return { language: args.language, units, totalLessons: lessons.length };
  },
});

// Fetch the user's learning progress, assessments, and SRS reviews
export const getUserLearningContext = internalQuery({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Recent assessments
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    // Filter assessments for this language by joining with lessons
    const languageAssessments = [];
    for (const a of assessments) {
      const lesson = await ctx.db.get(a.lessonId);
      if (lesson && lesson.language.toLowerCase() === args.language.toLowerCase()) {
        languageAssessments.push({
          lessonTitle: lesson.title,
          accuracy: a.accuracy,
          xpEarned: a.xpEarned,
        });
      }
    }

    // Due SRS reviews
    const now = Date.now();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).lte("nextReviewDate", now)
      )
      .take(10);

    const dueReviewTitles = [];
    for (const review of reviews) {
      const lesson = await ctx.db.get(review.lessonId);
      if (lesson && lesson.language.toLowerCase() === args.language.toLowerCase()) {
        dueReviewTitles.push(lesson.title);
      }
    }

    // Completed lessons (>= 80% accuracy)
    const allAssessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const completedIds = new Set();
    for (const a of allAssessments) {
      if (a.accuracy >= 80) completedIds.add(a.lessonId);
    }

    return {
      userName: user.name,
      streak: user.streak || 0,
      totalXp: user.totalXp || 0,
      dailyXp: user.dailyXp || 0,
      dailyGoal: user.dailyGoal || 50,
      recentAssessments: languageAssessments.slice(0, 5),
      dueReviews: dueReviewTitles,
      completedLessonCount: completedIds.size,
    };
  },
});

// Fetch recent chat messages for conversational continuity
export const getConversationContext = internalQuery({
  args: {
    userId: v.id("users"),
    language: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_language", (q) =>
        q.eq("userId", args.userId).eq("language", args.language)
      )
      .order("desc")
      .take(limit);

    // Return in chronological order
    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));
  },
});
