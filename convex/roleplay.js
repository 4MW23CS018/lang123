import { action, internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

export const chat = action({
  args: {
    userId: v.string(),
    language: v.string(),
    message: v.string(),
    scenarioId: v.string(),
    scenarioContext: v.string(),
  },
  handler: async (ctx, args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Get chat history for this specific scenario
    const conversationMessages = await ctx.runQuery(internal.roleplay.getHistory, {
      userId: args.userId,
      scenarioId: args.scenarioId,
    });

    const systemInstruction = `You are an AI language tutor playing a role in a conversational scenario.
Language: ${args.language}
Scenario: ${args.scenarioContext}

Rules:
1. Stay in character! Respond exactly as the character in the scenario would.
2. Respond primarily in ${args.language}, but keep it simple enough for a language learner.
3. Keep your responses short (1-2 sentences max) so the user can practice listening and speaking.
4. Do NOT output any English translation in your response, ONLY the ${args.language} text. (The frontend will handle translations if needed).`;

    const contents = [
      ...conversationMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      { role: "user", parts: [{ text: args.message }] },
    ];

    let assistantReply = "I am sorry, I cannot respond right now.";
    try {
      console.log(`[Roleplay] Calling gemini-3.8-flash for ${args.language} - ${args.scenarioId}`);
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        config: { systemInstruction, maxOutputTokens: 256 },
        contents,
      });
      assistantReply = response.text;
    } catch (err) {
      console.error("[Roleplay] gemini error:", err);
      assistantReply = `[Error] The AI is currently resting.`;
    }

    // Save messages
    await ctx.runMutation(internal.roleplay.saveMessages, {
      userId: args.userId,
      scenarioId: args.scenarioId,
      userMessage: args.message,
      assistantMessage: assistantReply,
    });

    return { reply: assistantReply };
  },
});

export const getHistory = internalQuery({
  args: { userId: v.string(), scenarioId: v.string() },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("roleplayMessages")
      .withIndex("by_user_scenario", (q) =>
        q.eq("userId", args.userId).eq("scenarioId", args.scenarioId)
      )
      .order("asc")
      .take(10); // Keep context short

    const formatted = [];
    for (const msg of history) {
      formatted.push({ role: "user", text: msg.userMessage });
      formatted.push({ role: "model", text: msg.assistantMessage });
    }
    return formatted;
  },
});

export const saveMessages = internalMutation({
  args: {
    userId: v.string(),
    scenarioId: v.string(),
    userMessage: v.string(),
    assistantMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("roleplayMessages", {
      userId: args.userId,
      scenarioId: args.scenarioId,
      userMessage: args.userMessage,
      assistantMessage: args.assistantMessage,
      timestamp: Date.now(),
    });
  },
});

export const getScenarioHistory = query({
  args: { userId: v.string(), scenarioId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roleplayMessages")
      .withIndex("by_user_scenario", (q) =>
        q.eq("userId", args.userId).eq("scenarioId", args.scenarioId)
      )
      .order("asc")
      .collect();
  }
});

export const clearHistory = mutation({
  args: { userId: v.string(), scenarioId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("roleplayMessages")
      .withIndex("by_user_scenario", (q) =>
        q.eq("userId", args.userId).eq("scenarioId", args.scenarioId)
      )
      .collect();
    
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  }
});
