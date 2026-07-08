import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    passwordHash: v.optional(v.string()),       // optional now
    xp: v.number(),
    totalXp: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastPracticeDate: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),   
    reminderTime: v.optional(v.string()),  
    preferences: v.optional(v.string()),    // JSON string of answers
    dailyGoal: v.optional(v.number()),      // XP target per day (default 50)
    dailyXp: v.optional(v.number()),        // XP earned today
    dailyXpDate: v.optional(v.string()),    // "YYYY-MM-DD" the dailyXp belongs to
    gems: v.optional(v.number()),           // Premium currency
    streakFreezes: v.optional(v.number()),  // Protects streak
    equippedBorder: v.optional(v.string()), // ID of the animated border
    unlockedBorders: v.optional(v.array(v.string())), // Array of border IDs owned
  }),

  lessons: defineTable({
    title: v.string(),
    language: v.string(),
    phrase: v.string(),
    phonetics: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    description: v.optional(v.string()),
    displayPhrase: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
    order: v.optional(v.number()),      // Path ordering
    unit: v.optional(v.number()),       // Unit grouping
    topic: v.optional(v.string()),      // Name of the unit
  }),

  assessments: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    transcription: v.string(),
    accuracy: v.number(),
    audioStorageId: v.string(),
    xpEarned: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  reviews: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    easeFactor: v.number(),
    interval: v.number(),
    nextReviewDate: v.number(),
  }).index("by_user_lesson", ["userId", "lessonId"]).index("by_user_date", ["userId", "nextReviewDate"]),

  achievements: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    unlockedAt: v.number(),
  }),
}); 