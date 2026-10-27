/**
 * ConversationController.js
 * Evaluates learner utterances against the café roleplay scenario.
 * Features deterministic intent recognition with supportive fallbacks and optional AI enrichment.
 */

// Intent definitions with multilingual keyword patterns (Kannada script and Romanized phonetics)
const INTENT_RULES = [
  {
    intent: "ask_help",
    targetNode: "help",
    description: "Learner requests help, a hint, or asks how to say the phrase",
    patterns: [
      /ಸಹಾಯ/i,
      /ಹೇಗೆ\s*ಹೇಳ/i,
      /ಗೊತ್ತಿಲ್ಲ/i,
      /ತಿಳಿಯ/i,
      /ಹೇಳಿ/i,
      /\bhelp\b/i,
      /\bhint\b/i,
      /how\s*to\s*say/i,
      /what\s*to\s*say/i,
      /i\s*don'?t\s*know/i,
      /please\s*help/i,
      /what\s*should\s*i\s*say/i
    ]
  },
  {
    intent: "order_coffee",
    targetNode: "success",
    description: "Learner asks for coffee or expresses a desire for coffee",
    patterns: [
      /ಕಾಫಿ/i,
      /ಕಾಫೀ/i,
      /ಫಿಲ್ಟರ್/i,
      /\bcoffee\b/i,
      /\bkapi\b/i,
      /\bkafi\b/i,
      /\bkofi\b/i,
      /ಒಂದು\s*ಬೇಕು/i,
      /ವನ್ದ/i,
      /ವಂದು/i,
      /ಬೇಖ/i,
      /ಬೇಕ/i,
      /want\s*coffee/i,
      /order\s*coffee/i,
      /like\s*a?\s*coffee/i,
      /cup\s*of\s*coffee/i,
      /give\s*me\s*coffee/i
    ]
  },
  {
    intent: "greeting",
    targetNode: "greet_reply",
    description: "Learner greets Ravi or Mira without yet specifying an order",
    patterns: [
      /ನಮಸ್ಕಾರ/i,
      /ನಮಸ್ತೆ/i,
      /ಶುಭೋದಯ/i,
      /ಹಲೋ/i,
      /\bnamaskara\b/i,
      /\bnamaste\b/i,
      /\bhello\b/i,
      /\bhi\b/i,
      /\bhey\b/i,
      /good\s*morning/i
    ]
  }
];

/**
 * Deterministic classifier: matches recognized learner speech to a scenario branch.
 */
export function classifyUtterance(text) {
  if (!text || typeof text !== "string") {
    return {
      intent: "unclear",
      targetNode: "unclear",
      confidence: 0,
      matchedRule: null
    };
  }

  const cleanText = text.trim();

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(cleanText)) {
        return {
          intent: rule.intent,
          targetNode: rule.targetNode,
          confidence: 0.95,
          matchedRule: rule.description
        };
      }
    }
  }

  // Fallback for unclear or partially recognized input
  return {
    intent: "unclear",
    targetNode: "unclear",
    confidence: 0.2,
    matchedRule: "Unrecognized utterance"
  };
}

/**
 * Evaluates the learner's speech against the current node.
 * Uses deterministic classification, with optional AI fallback if available.
 */
export async function evaluateLearnerSpeech({
  transcript,
  currentNode,
  roleplayAction = null,
  userId = null,
  language = "Kannada"
}) {
  const cleanTranscript = (transcript || "").trim();

  if (!cleanTranscript) {
    return {
      success: false,
      error: "No speech recognized. Please try speaking again.",
      targetNode: currentNode.id || "greeting"
    };
  }

  // 1. Run deterministic intent classifier
  const classification = classifyUtterance(cleanTranscript);

  // If deterministic match has high confidence (e.g. coffee ordered, help asked, greeted), use it immediately!
  if (classification.confidence >= 0.8) {
    return {
      success: true,
      intent: classification.intent,
      targetNode: classification.targetNode,
      transcript: cleanTranscript,
      isAiGenerated: false
    };
  }

  // 2. If classification was unclear, try optional AI if available to see if Gemini understands the nuance
  if (roleplayAction && userId) {
    try {
      const aiResult = await Promise.race([
        roleplayAction({
          userId,
          language,
          message: cleanTranscript,
          scenarioId: "cafe_visual_novel",
          scenarioContext: "You are Ravi, the friendly owner of Old Town Café. A customer is talking to you. If they asked for coffee or drink, confirm politely. If they need help, guide them to say 'ಒಂದು ಕಾಫಿ ಬೇಕು'."
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 4000))
      ]);

      if (aiResult?.reply && !aiResult.reply.startsWith("[Error]")) {
        // Double-check if the learner actually intended coffee in their prompt
        const recheck = classifyUtterance(cleanTranscript);
        if (recheck.intent === "order_coffee") {
          return {
            success: true,
            intent: "order_coffee",
            targetNode: "success",
            transcript: cleanTranscript,
            customReply: aiResult.reply,
            isAiGenerated: true
          };
        }
      }
    } catch (aiErr) {
      console.warn("[ConversationController] AI service skipped or failed, using deterministic fallback:", aiErr.message);
    }
  }

  // 3. Fallback to supportive hint node so the user is never stuck
  return {
    success: true,
    intent: "unclear",
    targetNode: "unclear",
    transcript: cleanTranscript,
    isAiGenerated: false
  };
}
