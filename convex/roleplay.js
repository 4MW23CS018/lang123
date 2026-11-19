import { action, internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const IN_CHARACTER_FALLBACKS = {
  cafe: {
    kannada: [
      { keywords: ["ಸಕ್ಕರೆ", "sugar", "sweet", "ಕಡಿಮೆ"], reply: "ಸರಿ, ಕಡಿಮೆ ಸಕ್ಕರೆ ಹಾಕಿ ಬಿಸಿ ಫಿಲ್ಟರ್ ಕಾಫಿ ಸಿದ್ಧಪಡಿಸುತ್ತೇನೆ!" },
      { keywords: ["ಎಷ್ಟು", "ದುಡ್ಡು", "price", "bill", "cost", "ರೂಪಾಯಿ"], reply: "ಒಟ್ಟು ಇಪ್ಪತ್ತು ರೂಪಾಯಿ ಆಗುತ್ತದೆ. ಗೂಗಲ್ ಪೇ ಅಥವಾ ನಗದು ನೀಡಬಹುದು." },
      { keywords: ["ಧನ್ಯವಾದ", "thanks", "thank"], reply: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು! ಕಾಫಿ ಆನಂದಿಸಿ, ಮತ್ತೆ ಬನ್ನಿ." },
      { keywords: [], reply: "ನಮಸ್ಕಾರ! ನಮ್ಮ ಸ್ಪೆಷಲ್ ಬಿಸಿ ಫಿಲ್ಟರ್ ಕಾಫಿ ಸಿದ್ಧವಾಗಿದೆ. ನಿಮಗೆ ಎಷ್ಟು ಸಕ್ಕರೆ ಬೇಕು?" }
    ],
    tamil: [
      { keywords: ["சர்க்கரை", "sugar", "sweet"], reply: "சரி, குறைவான சர்க்கரையுடன் சூடான ஃபில்டர் காபி தருகிறேன்!" },
      { keywords: ["எவ்வளவு", "பணம்", "விலை", "price", "bill"], reply: "மொத்தம் இருபது ரூபாய். ரொக்கம் அல்லது யூபிஐ மூலம் செலுத்தலாம்." },
      { keywords: ["நன்றி", "thanks"], reply: "மிக்க நன்றி! காபியை ரசித்து குடியுங்கள், மீண்டும் வாருங்கள்." },
      { keywords: [], reply: "வணக்கம்! சுவையான சூடான ஃபில்டர் காபி தயார். உங்களுக்கு எவ்வளவு சர்க்கரை வேண்டும்?" }
    ],
    telugu: [
      { keywords: ["చక్కెర", "sugar", "తీపి"], reply: "సరే, తక్కువ చక్కెరతో వేడి ఫిల్టర్ కాఫీ సిద్ధం చేస్తాను!" },
      { keywords: ["ఎంత", "ధర", "డబ్బు", "bill", "price"], reply: "మొత్తం ఇరవై రూపాయలు. నగదు లేదా యూపీఐ ద్వారా చెల్లించవచ్చు." },
      { keywords: ["ధన్యవాదాలు", "thanks"], reply: "చాలా ధన్యవాదాలు! కాఫీ ఆస్వాదించండి, మళ్లీ రండి." },
      { keywords: [], reply: "నమస్కారం! మా స్పెషల్ వేడి ఫిల్టర్ కాఫీ సిద్ధంగా ఉంది. మీకు ఎంత చక్కెర కావాలి?" }
    ],
    malayalam: [
      { keywords: ["പഞ്ചസാര", "sugar", "മധുരം"], reply: "ശരി, കുറഞ്ഞ പഞ്ചസാര ചേർത്ത് ചൂടുള്ള ഫിൽട്ടർ കോഫി തരാം!" },
      { keywords: ["എത്ര", "വില", "പണം", "bill", "price"], reply: "ആകെ ഇരുപത് രൂപ. പണമായോ യുപിഐ വഴിയോ നൽകാം." },
      { keywords: ["നന്ദി", "thanks"], reply: "വളരെ നന്ദി! കോഫി ആസ്വദിക്കൂ, വീണ്ടും വരൂ." },
      { keywords: [], reply: "നമസ്കാരം! ഞങ്ങളുടെ സ്പെഷ്യൽ ചൂടുള്ള ഫിൽട്ടർ കോഫി തയ്യാറാണ്. എത്ര പഞ്ചസാര വേണം?" }
    ],
  },
  directions: {
    kannada: [
      { keywords: ["ಎಲ್ಲಿ", "ದಾರಿ", "ಬಸ್", "stand", "stop"], reply: "ಮುಂದೆ ಚೌಕದವರೆಗೆ ಹೋಗಿ, ಅಲ್ಲಿಂದ ಎಡಕ್ಕೆ ತಿರುಗಿದರೆ ನೇರವಾಗಿ ಬಸ್ ನಿಲ್ದಾಣ ಕಾಣಿಸುತ್ತದೆ." },
      { keywords: ["ದೂರ", "far", "ಹತ್ತಿರ"], reply: "ಇಲ್ಲಿಂದ ಕೇವಲ ಐದು ನಿಮಿಷಗಳ ನಡಿಗೆ, ತುಂಬಾ ಹತ್ತಿರದಲ್ಲಿದೆ." },
      { keywords: ["ಧನ್ಯವಾದ", "thanks"], reply: "ಪರವಾಗಿಲ್ಲ, ಪ್ರಯಾಣ ಶುಭವಾಗಿರಲಿ!" },
      { keywords: [], reply: "ನಮಸ್ಕಾರ! ಮುಂದೆ ಹೋಗಿ ಎಡಕ್ಕೆ ತಿರುಗಿ, ಅಲ್ಲಿ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ನಿಲ್ದಾಣ ಸಿಗುತ್ತದೆ." }
    ],
    tamil: [
      { keywords: ["எங்கே", "வழி", "பேருந்து", "bus"], reply: "நேராக சந்திப்பு வரை சென்று இடதுபுறம் திரும்பினால் பேருந்து நிலையம் தெரியும்." },
      { keywords: ["தூரம்", "பக்கம்", "far"], reply: "இங்கிருந்து ஐந்து நிமிட நடைபயணம் தான், மிக அருகில் உள்ளது." },
      { keywords: ["நன்றி", "thanks"], reply: "பரவாயில்லை, உங்கள் பயணம் இனிதாக அமையட்டும்!" },
      { keywords: [], reply: "வணக்கம்! நேராகச் சென்று இடப்பக்கம் திரும்புங்கள், அங்கே பேருந்து நிறுத்தம் உள்ளது." }
    ],
    telugu: [
      { keywords: ["ఎక్కడ", "దారి", "బస్", "bus"], reply: "ముందుకు చౌరస్తా వరకు వెళ్లి ఎడమవైపు తిరిగితే బస్ స్టాండ్ కనిపిస్తుంది." },
      { keywords: ["దూరం", "far"], reply: "ఇక్కడి నుండి కేవలం ఐదు నిమిషాల నడక మాత్రమే, చాలా దగ్గర." },
      { keywords: ["ధన్యవాదాలు", "thanks"], reply: "పర్వాలేదు, మీ ప్రయాణం శుభప్రదం కావాలి!" },
      { keywords: [], reply: "నమస్కారం! ముందుకు వెళ్లి ఎడమవైపు తిరగండి, అక్కడ బస్ స్టాప్ ఉంటుంది." }
    ],
    malayalam: [
      { keywords: ["എവിടെ", "വഴി", "ബസ്", "bus"], reply: "നേരെ കവല വരെ പോയി ഇടത്തോട്ട് തിരിഞ്ഞാൽ ബസ് സ്റ്റാൻഡ് കാണാം." },
      { keywords: ["ദൂരം", "far"], reply: "ഇവിടെനിന്ന് അഞ്ച് മിനിറ്റ് നടത്തം മാത്രം, വളരെ അടുത്താണ്." },
      { keywords: ["നന്ദി", "thanks"], reply: "സാരമില്ല, യാത്ര ശുഭകരമാകട്ടെ!" },
      { keywords: [], reply: "നമസ്കാരം! നേരെ പോയി ഇടത്തേക്ക് തിരിയുക, അവിടെ ബസ് സ്റ്റോപ്പ് ഉണ്ട്." }
    ],
  },
  market: {
    kannada: [
      { keywords: ["ಕಡಿಮೆ", "ಬೆಲೆ", "bargain", "discount"], reply: "ಸರಿ ನಿಮಗಾಗಿ ಎಂಭತ್ತು ರೂಪಾಯಿಗೆ ಕೊಡುತ್ತೇನೆ, ಮಾವಿನ ಹಣ್ಣು ತುಂಬಾ ಸಿಹಿಯಾಗಿದೆ!" },
      { keywords: ["ಎಷ್ಟು", "rate", "cost", "price"], reply: "ಒಂದು ಕೆಜಿ ತಾಜಾ ಮಾವಿನ ಹಣ್ಣಿಗೆ ನೂರು ರೂಪಾಯಿ. ಎಷ್ಟು ಕೆಜಿ ಕಟ್ಟಲಿ?" },
      { keywords: ["ಧನ್ಯವಾದ", "thanks"], reply: "ಧನ್ಯವಾದಗಳು! ಹಣ್ಣುಗಳು ತುಂಬಾ ಇಷ್ಟವಾಗುತ್ತವೆ, ಮತ್ತೆ ಬನ್ನಿ." },
      { keywords: [], reply: "ಬನ್ನಿ ಸ್ವಾಮಿ! ತಾಜಾ ಮಾವಿನ ಹಣ್ಣುಗಳು ಮತ್ತು ಸೇಬುಗಳು ಇವೆ. ಎಷ್ಟು ಕೆಜಿ ಬೇಕು?" }
    ],
    tamil: [
      { keywords: ["குறைக்க", "விலை", "bargain"], reply: "சரி உங்களுக்காக எண்பது ரூபாய்க்குத் தருகிறேன், மாம்பழம் மிக இனிப்பானது!" },
      { keywords: ["எவ்வளவு", "rate", "price"], reply: "ஒரு கிலோ புதிய மாம்பழம் நூறு ரூபாய். எத்தனை கிலோ போடட்டும்?" },
      { keywords: ["நன்றி", "thanks"], reply: "மிக்க நன்றி! மீண்டும் எங்கள் கடைக்கு வாருங்கள்." },
      { keywords: [], reply: "வாருங்கள்! புதிய மாம்பழங்கள் மற்றும் ஆப்பிள்கள் உள்ளன. எத்தனை கிலோ வேண்டும்?" }
    ],
    telugu: [
      { keywords: ["తగ్గించు", "ధర", "bargain"], reply: "సరే మీకోసం ఎనభై రూపాయలకే ఇస్తాను, మామిడి పండ్లు చాలా తియ్యగా ఉన్నాయి!" },
      { keywords: ["ఎంత", "rate", "price"], reply: "ఒక కేజీ తాజా మామిడి పండ్లు వంద రూపాయలు. ఎన్ని కేజీలు కట్టమంటారు?" },
      { keywords: ["ధన్యవాదాలు", "thanks"], reply: "చాలా ధన్యవాదాలు! మళ్లీ రండి." },
      { keywords: [], reply: "రండి బాబు! తాజా మామిడి పండ్లు ఉన్నాయి. ఎంత కావాలి?" }
    ],
    malayalam: [
      { keywords: ["കുറയ്ക്കുമോ", "വില", "bargain"], reply: "ശരി നിങ്ങൾക്കായി എൺപത് രൂപയ്ക്ക് തരാം, മാമ്പഴം നല്ല മധുരമുള്ളതാണ്!" },
      { keywords: ["എത്ര", "rate", "price"], reply: "ഒരു കിലോ പുതിയ മാമ്പഴത്തിന് നൂറു രൂപ. എത്ര കിലോ എടുക്കട്ടെ?" },
      { keywords: ["നന്ദി", "thanks"], reply: "വളരെ നന്ദി! വീണ്ടും വരൂ." },
      { keywords: [], reply: "വരൂ! നല്ല പുതിയ മാമ്പഴവും ആപ്പിളും ഉണ്ട്. എത്ര കിലോ വേണം?" }
    ],
  }
};

function getInCharacterFallback(scenarioId, language, userMessage) {
  const langKey = (language || "kannada").toLowerCase();
  const scenarioKey = (scenarioId || "cafe").toLowerCase();
  const scenarioData = IN_CHARACTER_FALLBACKS[scenarioKey] || IN_CHARACTER_FALLBACKS.cafe;
  const langList = scenarioData[langKey] || scenarioData.kannada;
  
  const text = (userMessage || "").toLowerCase();
  for (const item of langList) {
    if (item.keywords.length > 0 && item.keywords.some(k => text.includes(k.toLowerCase()))) {
      return item.reply;
    }
  }
  // Default fallback for this scenario/language
  const defaultItem = langList.find(i => i.keywords.length === 0);
  return defaultItem ? defaultItem.reply : langList[0].reply;
}

export const chat = action({
  args: {
    userId: v.string(),
    language: v.string(),
    message: v.string(),
    scenarioId: v.string(),
    scenarioContext: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get chat history for this specific scenario
    const rawHistory = await ctx.runQuery(internal.roleplay.getHistory, {
      userId: args.userId,
      scenarioId: args.scenarioId,
    });

    // Sanitize conversation messages: exclude previous errors
    const conversationMessages = [];
    for (const m of rawHistory) {
      if (m.text && !m.text.startsWith("[Error]")) {
        conversationMessages.push({
          role: m.role,
          parts: [{ text: m.text }]
        });
      }
    }

    const systemInstruction = `You are an AI language tutor playing a role in a conversational scenario.
Language: ${args.language}
Scenario: ${args.scenarioContext}

Rules:
1. Stay in character! Respond exactly as the character in the scenario would.
2. Respond primarily in ${args.language}, but keep it simple enough for a language learner.
3. Keep your responses short (1-2 sentences max) so the user can practice listening and speaking.
4. Do NOT output any English translation in your response, ONLY the ${args.language} text.`;

    const contents = [
      ...conversationMessages,
      { role: "user", parts: [{ text: args.message }] },
    ];

    let assistantReply = null;

    // 2. Try Gemini API if key is present
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const candidateModels = ["gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash-lite"];

      for (const modelName of candidateModels) {
        try {
          console.log(`[Roleplay] Calling ${modelName} for ${args.language} - ${args.scenarioId}`);
          const response = await ai.models.generateContent({
            model: modelName,
            config: {
              systemInstruction,
              maxOutputTokens: 256,
              thinkingConfig: { thinkingBudget: 0 }
            },
            contents,
          });
          const generated = response.text?.trim();
          if (generated) {
            assistantReply = generated;
            break;
          }
        } catch (err) {
          console.warn(`[Roleplay] ${modelName} failed:`, err?.message || err);
        }
      }
    }

    // 3. Graceful in-character fallback: NEVER show "[Error] The AI is currently resting"
    if (!assistantReply) {
      console.log(`[Roleplay] Using in-character fallback response for ${args.scenarioId} (${args.language})`);
      assistantReply = getInCharacterFallback(args.scenarioId, args.language, args.message);
    }

    // 4. Save messages
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
