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
  }),

  lessons: defineTable({
    title: v.string(),
    language: v.string(),
    phrase: v.string(),
    phonetics: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    description: v.optional(v.string()),
    displayPhrase: v.optional(v.string()),
  }),

  assessments: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    transcription: v.string(),
    accuracy: v.number(),
    audioStorageId: v.string(),
    xpEarned: v.number(),
    createdAt: v.number(),
  }),

  achievements: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    unlockedAt: v.number(),
  }),
}); 