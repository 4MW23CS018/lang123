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

    const systemInstruction = `You are EnZo, the player's trusty chibi RPG companion & language familiar in LangBridge!
Your quest is to guide the adventurer on their journey learning ${args.language}.

Language Basics: ${alphabetRef}
${curriculumText ? `Curriculum Scrolls:\n${curriculumText}` : ""}
${progressText ? `Adventurer Stats: ${progressText}` : ""}

Rules of the Companion:
1. Always provide: Native script + Phonetic breakdown in brackets [hy-phen-a-ted] + English translation.
2. Tone: Friendly, enthusiastic, and spirited like an anime/RPG companion (use playful companion terms like 'traveler', 'spell', 'scroll', 'quest' where natural, but stay focused and helpful).
3. Brevity: Be punchy and concise (1-2 short paragraphs max). Never overwhelm the adventurer.
4. Accuracy: Always teach authentic ${args.language} vocabulary, script, and natural phrasing.`;

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
          maxOutputTokens: 1024,
        },
        contents,
      });
      return response.text;
    };

    // Ultra-reliable candidate cascade: fast low-latency models first
    const candidateModels = ["gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash-lite"];
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[EnZo Companion] Calling model: ${modelName} for ${args.language}`);
        assistantReply = await callGemini(modelName);
        if (assistantReply && assistantReply.trim()) {
          lastError = null;
          break;
        }
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.code || "unknown";
        console.warn(`[EnZo] ${modelName} hit error (${status}): ${err?.message || String(err)}. Trying next companion model...`);
      }
    }

    // Smart companion fallback if AI API is completely throttled or offline
    if (!assistantReply) {
      console.warn("[EnZo] All candidate models failed, using companion fallback:", lastError);
      const q = args.message.toLowerCase();
      if (q.includes("hello") || q.includes("greet") || q.includes("hi")) {
        const greetings = {
          Kannada: "**ನಮಸ್ಕಾರ** [Na-mas-kaa-ra] — *Hello / Greetings!*\nA respectful greeting you can use anytime, traveler! ✨",
          Tamil: "**வணக்கம்** [Va-nak-kam] — *Hello / Greetings!*\nSay this with folded hands for a classic warm welcome! 🌟",
          Telugu: "**నమస్కారం** [Na-mas-kaa-ram] — *Hello / Greetings!*\nA polite and universal greeting on your quest! 📜",
          Malayalam: "**നമസ്കാരം** [Na-mas-kaa-ram] — *Hello / Greetings!*\nUse this to greet anyone warmly in Kerala! ✨",
          Tulu: "**ನಮಸ್ಕಾರ** [Na-mas-kaa-ra] / **ಸೊಲ್ಮೆಲು** [Sol-me-lu] — *Greetings / Thank you!* 🌟",
          Kodava: "**ನಮಸ್ಕಾರ** [Na-mas-kaa-ra] — *Greetings, adventurer!* 🗡️",
        };
        assistantReply = greetings[args.language] || greetings["Kannada"];
      } else if (q.includes("vowel") || q.includes("alphabet")) {
        assistantReply = `Here is your alphabet scroll for **${args.language}**:\n${alphabetRef}\n\nPractice tracing each character in the **Basics** tab to unlock their power! 📜✨`;
      } else if (q.includes("count") || q.includes("10") || q.includes("number")) {
        const numbers = {
          Kannada: "1: **ಒಂದು** [on-du], 2: **ಎರಡು** [e-ra-du], 3: **ಮೂರು** [moo-ru], 4: **ನಾಲ್ಕು** [naal-ku], 5: **ಐದು** [ai-du], 10: **ಹತ್ತು** [hat-tu]. 🔢",
          Tamil: "1: **ஒன்று** [on-ru], 2: **இரண்டு** [i-ran-du], 3: **மூன்று** [moon-ru], 4: **நான்கு** [naan-gu], 5: **ஐந்து** [ain-du], 10: **பத்து** [pat-thu]. 🔢",
          Telugu: "1: **ఒకటి** [o-ka-ti], 2: **రెండు** [ren-du], 3: **మూడు** [moo-du], 4: **నాలుగు** [naa-lu-gu], 5: **ఐదు** [ai-du], 10: **పది** [pa-di]. 🔢",
          Malayalam: "1: **ഒന്ന്** [onnu], 2: **രണ്ട്** [randu], 3: **മൂന്ന്** [moonnu], 4: **നാല്** [naalu], 5: **അഞ്ച്** [anchu], 10: **പത്ത്** [paththu]. 🔢",
        };
        assistantReply = numbers[args.language] || numbers["Kannada"];
      } else {
        assistantReply = `I'm catching my magical companion breath, adventurer! 🌟 Try asking me again in a moment, or try asking for greetings, vowels, or numbers in ${args.language}!`;
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
