"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

// ── Compact alphabet reference (minimal tokens) ──
const BASICS_SUMMARY = {
  Kannada: "Vowels: ಅ-ಔ(a-au). Consonants: ಕ(ka)-ಹ(ha). Numbers: ೦-೯(0-9), ೧೦(hattu). Kannada script.",
  Tamil: "Vowels: அ-ஔ(a-au). Consonants: க(ka)-ன(na), special: ழ(zha) ள(La) ற(Ra). Numbers: ௦-௯(0-9), ௰(10). Tamil script.",
  Telugu: "Vowels: అ-ఔ(a-au). Consonants: క(ka)-హ(ha). Numbers: ౦-౯(0-9), ౧౦(padi). Telugu script.",
  Malayalam: "Vowels: അ-ഔ(a-au). Consonants: ക(ka)-ഹ(ha). Numbers: ൦-൯(0-9), ൧൦(paththu). Malayalam script.",
  Tulu: "Uses Kannada script. Greetings: ನಮಸ್ಕಾರ(Na-mas-kaa-ra). How are you: ಎಂಚ ಉಲ್ಲ(En-cha Ul-la).",
  Kodava: "Uses Kannada script. Greetings: ನಮಸ್ಕಾರ(Na-mas-kaa-ra). How are you: ಎಂತ ಉಂಡ್(En-tha Und).",
};

/**
 * Main RAG chat action (token-optimized for free-tier Gemini):
 * 1. Retrieve — pull relevant context from Convex tables
 * 2. Augment — build a compact system prompt
 * 3. Generate — send to Gemini with retry + fallback
 * 4. Store — save both messages to chatMessages table
 */
export const chat = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // ── 1. RETRIEVE ──────────────────────────────────────────
    const [languageCtx, userCtx, conversationCtx] = await Promise.all([
      ctx.runQuery(internal.knowledgeBase.getLanguageContext, {
        language: args.language,
      }),
      ctx.runQuery(internal.knowledgeBase.getUserLearningContext, {
        userId: args.userId,
        language: args.language,
      }),
      ctx.runQuery(internal.knowledgeBase.getConversationContext, {
        userId: args.userId,
        language: args.language,
        limit: 4, // Reduced from 10 to save tokens
      }),
    ]);

    // ── 2. AUGMENT — build compact system prompt ─────────────
    // Compact curriculum: only include up to 15 phrases, short format
    let curriculumText = "";
    if (languageCtx && languageCtx.units) {
      let count = 0;
      for (const [unitName, phrases] of Object.entries(languageCtx.units)) {
        if (count >= 15) break;
        curriculumText += `\n**${unitName}**: `;
        const items = [];
        for (const p of phrases) {
          if (count >= 15) break;
          items.push(`${p.displayPhrase} [${p.phonetics}] = "${p.phrase}"`);
          count++;
        }
        curriculumText += items.join("; ") + "\n";
      }
    }

    // Compact progress
    let progressText = "";
    if (userCtx) {
      const parts = [`${userCtx.userName}`, `🔥${userCtx.streak}d`, `⚡${userCtx.totalXp}XP`, `${userCtx.completedLessonCount} lessons done`];
      if (userCtx.recentAssessments.length > 0) {
        parts.push("Recent: " + userCtx.recentAssessments.slice(0, 3).map((a) => `${a.lessonTitle}:${a.accuracy}%`).join(", "));
      }
      if (userCtx.dueReviews.length > 0) {
        parts.push("Review: " + userCtx.dueReviews.slice(0, 3).join(", "));
      }
      progressText = parts.join(" | ");
    }

    const alphabetRef = BASICS_SUMMARY[args.language] || "";

    // Build compact conversation history (last 4 messages only)
    const conversationMessages = [];
    if (conversationCtx && conversationCtx.length > 0) {
      for (const m of conversationCtx) {
        conversationMessages.push({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        });
      }
    }

    const systemInstruction = `You are EnZo, a friendly ${args.language} language tutor.

Script: ${alphabetRef}
${curriculumText ? `Curriculum:\n${curriculumText}` : ""}
${progressText ? `Student: ${progressText}` : ""}

Rules: Always give native script + phonetics (hyphenated syllables) + English. Use curriculum phonetics when available. Be concise (2-3 paragraphs max). Encourage the student. Don't hallucinate phrases.`;

    // ── 3. GENERATE ─────────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let assistantReply;

    const callGemini = async (model) => {
      const contents = [
        ...conversationMessages,
        { role: "user", parts: [{ text: args.message }] },
      ];

      const response = await ai.models.generateContent({
        model,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 2048,
          thinkingConfig: {
            thinkingBudget: 0, // Disable thinking to prevent reasoning leaking into output
          },
        },
        contents,
      });
      return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
    };

    try {
      console.log("[EnZo] Calling gemini-3.8-flash for", args.language);
      assistantReply = await callGemini("gemini-3.8-flash");
    } catch (err) {
      const status = err?.status || err?.code || "unknown";
      console.error(`[EnZo] gemini-3.8-flash failed (${status}):`, err?.message || String(err));

      // Fallback: gemini-3.5-pro
      try {
        console.log("[EnZo] Falling back to gemini-3.5-pro...");
        await new Promise((r) => setTimeout(r, 1000));
        assistantReply = await callGemini("gemini-3.5-pro");
        console.log("[EnZo] Fallback to gemini-3.5-pro succeeded for", args.language);
      } catch (retryErr) {
        const retryStatus = retryErr?.status || retryErr?.code || "unknown";
        console.error(`[EnZo] Fallback also failed (${retryStatus}):`, retryErr?.message || String(retryErr));
        assistantReply = "I'm a bit overloaded right now! Please wait about a minute and try again. 💤";
      }
    }

    // ── 4. STORE — persist both messages ─────────────────────
    await ctx.runMutation(internal.chatMessages.saveMessages, {
      userId: args.userId,
      language: args.language,
      userMessage: args.message,
      assistantMessage: assistantReply,
    });

    return { reply: assistantReply };
  },
});
