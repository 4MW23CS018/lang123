"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

// ── Alphabet & basics reference (static, embedded in prompt) ──
const BASICS_SUMMARY = {
  Kannada: "Vowels: ಅ(a) ಆ(aa) ಇ(i) ಈ(ii) ಉ(u) ಊ(uu) ಎ(e) ಏ(ee) ಐ(ai) ಒ(o) ಓ(oo) ಔ(au). Key consonants: ಕ(ka) ಖ(kha) ಗ(ga) ಘ(gha) ಚ(cha) ಛ(chha) ಜ(ja) ಟ(ta) ಡ(da) ಣ(na) ತ(tha) ದ(da) ನ(na) ಪ(pa) ಬ(ba) ಮ(ma) ಯ(ya) ರ(ra) ಲ(la) ವ(va) ಶ(sha) ಸ(sa) ಹ(ha). Numbers: ೦(sonne/0) ೧(ondu/1) ೨(eradu/2) ೩(mooru/3) ೪(naalku/4) ೫(aidu/5) ೬(aaru/6) ೭(eLu/7) ೮(entu/8) ೯(ombhattu/9) ೧೦(hattu/10).",
  Tamil: "Vowels: அ(a) ஆ(aa) இ(i) ஈ(ii) உ(u) ஊ(uu) எ(e) ஏ(ee) ஐ(ai) ஒ(o) ஓ(oo) ஔ(au). Key consonants: க(ka) ங(nga) ச(cha/sa) ஞ(nya) ட(ta) ண(nna) த(tha) ந(na) ப(pa) ம(ma) ய(ya) ர(ra) ல(la) வ(va) ழ(zha) ள(La) ற(Ra) ன(na). Numbers: ௦(suzhiyam/0) ௧(ondru/1) ௨(irandu/2) ௩(moondru/3) ௪(naangu/4) ௫(ainthu/5) ௬(aaru/6) ௭(yezhu/7) ௮(ettu/8) ௯(onbadhu/9) ௰(paththu/10).",
  Telugu: "Vowels: అ(a) ఆ(aa) ఇ(i) ఈ(ii) ఉ(u) ఊ(uu) ఎ(e) ఏ(ee) ఐ(ai) ఒ(o) ఓ(oo) ఔ(au). Key consonants: క(ka) ఖ(kha) గ(ga) ఘ(gha) చ(cha) ఛ(chha) జ(ja) ట(ta) డ(da) ణ(na) త(tha) ద(da) న(na) ప(pa) బ(ba) మ(ma) య(ya) ర(ra) ల(la) వ(va) శ(sha) స(sa) హ(ha). Numbers: ౦(sunna/0) ౧(okati/1) ౨(rendu/2) ౩(moodu/3) ౪(naalugu/4) ౫(aidu/5) ౬(aaru/6) ౭(edu/7) ౮(enimidi/8) ౯(tommidi/9) ౧౦(padi/10).",
  Malayalam: "Vowels: അ(a) ആ(aa) ഇ(i) ഈ(ii) ഉ(u) ഊ(uu) എ(e) ഏ(ee) ഐ(ai) ഒ(o) ഓ(oo) ഔ(au). Key consonants: ക(ka) ഖ(kha) ഗ(ga) ഘ(gha) ച(cha) ഛ(chha) ജ(ja) ട(ta) ഡ(da) ണ(na) ത(tha) ദ(da) ന(na) പ(pa) ബ(ba) മ(ma) യ(ya) ര(ra) ല(la) വ(va) ശ(sha) സ(sa) ഹ(ha). Numbers: ൦(poojyam/0) ൧(onnu/1) ൨(randu/2) ൩(moonnu/3) ൪(naalu/4) ൫(anchu/5) ൬(aaru/6) ൭(ezhu/7) ൮(ettu/8) ൯(ompathu/9) ൧൦(paththu/10).",
  Tulu: "Greetings: ನಮಸ್ಕಾರ (Na-mas-kaa-ra). How are you: ಎಂಚ ಉಲ್ಲ (En-cha Ul-la). Thank you: ಧನ್ಯವಾದ (Dhan-ya-vaa-da). Tulu uses the Kannada script.",
  Kodava: "Greetings: ನಮಸ್ಕಾರ (Na-mas-kaa-ra). How are you: ಎಂತ ಉಂಡ್ (En-tha Und). Kodava (Coorgi) uses the Kannada script.",
};

/**
 * Main RAG chat action:
 * 1. Retrieve — pull relevant context from Convex tables
 * 2. Augment — build a grounded system prompt
 * 3. Generate — send to Gemini
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
        limit: 10,
      }),
    ]);

    // ── 2. AUGMENT — build system prompt ─────────────────────
    let curriculumText = "";
    if (languageCtx && languageCtx.units) {
      for (const [unitName, phrases] of Object.entries(languageCtx.units)) {
        curriculumText += `\n### ${unitName}\n`;
        for (const p of phrases) {
          curriculumText += `- **${p.title}**: ${p.displayPhrase} | Phonetics: ${p.phonetics} | English: "${p.phrase}" | Difficulty: ${p.difficulty}\n`;
        }
      }
    }

    let progressText = "No progress data available.";
    if (userCtx) {
      progressText = `
- Name: ${userCtx.userName}
- Streak: ${userCtx.streak} days
- Total XP: ${userCtx.totalXp}
- Today's XP: ${userCtx.dailyXp}/${userCtx.dailyGoal}
- Completed lessons: ${userCtx.completedLessonCount}
- Recent scores: ${userCtx.recentAssessments.map((a) => `${a.lessonTitle}: ${a.accuracy}%`).join(", ") || "None yet"}
- Lessons due for review: ${userCtx.dueReviews.join(", ") || "None"}`;
    }

    const alphabetRef = BASICS_SUMMARY[args.language] || "No alphabet data available for this language.";

    // Build conversation history for multi-turn context
    let conversationHistory = "";
    if (conversationCtx && conversationCtx.length > 0) {
      conversationHistory = conversationCtx
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
    }

    const systemPrompt = `You are **EnZo** — a friendly, knowledgeable tutor for South Indian languages. You are currently helping the user learn **${args.language}**.

## Your Knowledge Base (Retrieved Context)

### Alphabet & Script Reference
${alphabetRef}

### Curriculum Phrases Available
${curriculumText || "No curriculum data loaded yet."}

### User's Progress
${progressText}

${conversationHistory ? `### Recent Conversation\n${conversationHistory}` : ""}

## Your Rules
1. **Always include native script, phonetic pronunciation (hyphen-separated syllables), and English translation** when teaching any phrase or word.
2. Use the EXACT phonetics format from the curriculum data above when available.
3. For grammar questions, give simple, clear explanations with examples.
4. If a question is outside your knowledge base, say so honestly — do NOT hallucinate phrases.
5. Encourage the user based on their actual progress data (streak, XP, completed lessons).
6. Keep responses concise but informative (2-4 paragraphs max).
7. For pronunciation tips, reference syllable-by-syllable breakdowns.
8. Use a warm, encouraging tone — like a supportive language partner.
9. If the user asks about a different language than ${args.language}, you can answer but note which language you're discussing.
10. Format important words/phrases in **bold** and use line breaks for readability.`;

    // ── 3. GENERATE ──────────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let assistantReply;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood! I'm ready to help teach " + args.language + ". How can I assist you?" }] },
          { role: "user", parts: [{ text: args.message }] },
        ],
      });
      assistantReply = response.text || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      assistantReply = "I'm having trouble connecting to my language brain right now. Please try again in a moment!";
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
