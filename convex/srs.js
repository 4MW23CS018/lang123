import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// SM-2 Spaced Repetition Algorithm
export const updateReview = internalMutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    accuracy: v.number(), // 0-100
  },
  handler: async (ctx, args) => {
    // Convert accuracy to SM-2 quality (0-5)
    let q = 0;
    if (args.accuracy >= 95) q = 5;
    else if (args.accuracy >= 85) q = 4;
    else if (args.accuracy >= 75) q = 3;
    else if (args.accuracy >= 60) q = 2;
    else if (args.accuracy >= 40) q = 1;
    
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .first();

    let easeFactor = 2.5;
    let interval = 0;

    if (existing) {
      easeFactor = existing.easeFactor;
      interval = existing.interval;
    }

    if (q < 3) {
      // Failed, reset interval
      interval = 1;
    } else {
      // Success, calculate next interval
      if (interval === 0) {
        interval = 1;
      } else if (interval === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    // Update ease factor
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

    if (existing) {
      await ctx.db.patch(existing._id, {
        easeFactor,
        interval,
        nextReviewDate,
      });
    } else {
      await ctx.db.insert("reviews", {
        userId: args.userId,
        lessonId: args.lessonId,
        easeFactor,
        interval,
        nextReviewDate,
      });
    }
  },
});

export const getDueReviews = query({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).lte("nextReviewDate", now)
      )
      .collect();

    // Fetch the lesson details for the due reviews and filter by language
    const dueLessons = [];
    for (const review of reviews) {
      const lesson = await ctx.db.get(review.lessonId);
      if (lesson && lesson.language.toLowerCase() === args.language.toLowerCase()) {
        dueLessons.push(lesson);
      }
    }
    
    return dueLessons;
  },
});
