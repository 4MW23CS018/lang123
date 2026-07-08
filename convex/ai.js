"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";

export const generateCustomLesson = action({
  args: {
    language: v.string(),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are a curriculum designer for a language learning app teaching ${args.language}.
The user wants to practice: "${args.topic}".
Generate a single, extremely natural, everyday phrase related to this topic.
The phrase should not be too long (max 6-8 words).
CRITICAL RULE: The phrase MUST be completely generic and widely applicable. Do NOT include any specific names of people, restaurants, cities, or places unless the user explicitly requested them in their topic.

Return a strict JSON object (NO markdown formatting, just the raw JSON) with the following structure:
{
  "title": "A short English title for the phrase (e.g. 'Ordering coffee')",
  "phrase": "The English translation of the phrase",
  "displayPhrase": "The phrase written in the native script of ${args.language} (if applicable, else same as phonetic)",
  "phonetics": "The phonetic spelling of the phrase for an English speaker, broken into syllables with hyphens (e.g. 'nam-as-ka-ra')",
  "difficulty": "beginner"
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text || "";
    // Clean up potential markdown formatting block if the AI ignored the instruction
    const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    let lessonData;
    try {
        lessonData = JSON.parse(cleanedText);
    } catch (e) {
        throw new Error("Failed to parse AI response: " + cleanedText);
    }
    
    return {
        ...lessonData,
        language: args.language,
        description: `Custom AI generated lesson for: ${args.topic}`
    };
  },
});
