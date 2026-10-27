export const chapter01 = {
  id: "chapter01",
  title: "A Stranger in Town",
  titleKn: "ಹಳೆಯ ಊರಿಗೆ ಸ್ವಾಗತ",
  language: "Kannada",
  startingSceneId: "cafe",
  scenes: {
    cafe: {
      id: "cafe",
      locationName: "Old Town Café",
      locationNameKn: "ಹಳೆಯ ಊರಿನ ಕೆಫೆ",
      objective: "Greet the café owner and ask for a coffee in Kannada.",
      objectiveKn: "ಕೆಫೆ ಮಾಲೀಕರಿಗೆ ಶುಭ ಕೋರಿ ಒಂದು ಕಾಫಿ ಕೇಳಿ.",
      characters: [
        { id: "mira", name: "Mira", role: "Guide", position: "left", expression: "happy" },
        { id: "ravi", name: "Ravi", role: "Barista", position: "right", expression: "neutral" }
      ],
      nodes: {
        start: {
          speaker: "Mira",
          text: "ನಮಸ್ಕಾರ! ಹಳೆಯ ಊರಿಗೆ ಸ್ವಾಗತ.",
          translation: "Hello! Welcome to the old town.",
          expression: "happy",
          next: "cafe_intro"
        },
        cafe_intro: {
          speaker: "Mira",
          text: "ನಾವು ಈಗ ಕೆಫೆಯಲ್ಲಿದ್ದೇವೆ. ರವಿ ಅವರ ಬಳಿ ಕನ್ನಡದಲ್ಲಿ ಕಾಫಿ ಆರ್ಡರ್ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ!",
          translation: "We are at the café now. Try ordering a coffee from Ravi in Kannada!",
          expression: "happy",
          next: "greeting"
        },
        greeting: {
          speaker: "Ravi",
          text: "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನು ಬೇಕು?",
          translation: "Hello! What would you like?",
          expression: "neutral",
          allowVoice: true,
          targetPhrase: "ಒಂದು ಕಾಫಿ ಬೇಕು",
          targetTranslation: "I'd like a coffee",
          choices: [
            { id: "coffee", label: "ಒಂದು ಕಾಫಿ ಬೇಕು", sub: "I'd like a coffee", next: "success", intent: "order_coffee" },
            { id: "help", label: "ಸಹಾಯ ಬೇಕು", sub: "I need help", next: "help", intent: "ask_help", kind: "hint" },
            { id: "greet", label: "ನಮಸ್ಕಾರ", sub: "Say hello", next: "greet_reply", intent: "greeting" }
          ]
        },
        success: {
          speaker: "Ravi",
          text: "ಸರಿ! ಒಂದು ಕಾಫಿ ಕೊಡುತ್ತೇನೆ.",
          translation: "Of course! I'll get you a coffee.",
          expression: "happy",
          completeQuest: true,
          reward: { xp: 20, gems: 2 },
          end: true
        },
        help: {
          speaker: "Mira",
          text: "ಕಾಫಿ ಕೇಳಲು ಹೀಗೆ ಹೇಳಬಹುದು: “ಒಂದು ಕಾಫಿ ಬೇಕು.”",
          translation: "To ask for coffee, you can say: “ಒಂದು ಕಾಫಿ ಬೇಕು” (I would like one coffee).",
          expression: "thinking",
          allowVoice: true,
          targetPhrase: "ಒಂದು ಕಾಫಿ ಬೇಕು",
          targetTranslation: "I'd like a coffee",
          next: "greeting",
          choices: [
            { id: "coffee", label: "ಒಂದು ಕಾಫಿ ಬೇಕು", sub: "I'd like a coffee", next: "success", intent: "order_coffee" },
            { id: "back_to_greeting", label: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", sub: "Try ordering from Ravi", next: "greeting" }
          ]
        },
        greet_reply: {
          speaker: "Ravi",
          text: "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಕುಡಿಯಲು ಏನು ಬೇಕು? ಕಾಫಿ ಬೇಕಾದರೆ “ಒಂದು ಕಾಫಿ ಬೇಕು” ಎಂದು ಹೇಳಿ.",
          translation: "Hello! What would you like to drink? If you want coffee, say “ಒಂದು ಕಾಫಿ ಬೇಕು” (I'd like a coffee).",
          expression: "happy",
          allowVoice: true,
          targetPhrase: "ಒಂದು ಕಾಫಿ ಬೇಕು",
          targetTranslation: "I'd like a coffee",
          next: "greeting",
          choices: [
            { id: "coffee", label: "ಒಂದು ಕಾಫಿ ಬೇಕು", sub: "I'd like a coffee", next: "success", intent: "order_coffee" },
            { id: "help", label: "ಸಹಾಯ ಬೇಕು", sub: "I need help", next: "help", intent: "ask_help", kind: "hint" }
          ]
        },
        unclear: {
          speaker: "Mira",
          text: "ನನಗೆ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. “ಒಂದು ಕಾಫಿ ಬೇಕು” ಎಂದು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ ನೋಡಿ.",
          translation: "I didn't catch that clearly. Try saying: “ಒಂದು ಕಾಫಿ ಬೇಕು” (I'd like a coffee) once again.",
          expression: "thinking",
          allowVoice: true,
          targetPhrase: "ಒಂದು ಕಾಫಿ ಬೇಕು",
          targetTranslation: "I'd like a coffee",
          next: "greeting",
          choices: [
            { id: "coffee", label: "ಒಂದು ಕಾಫಿ ಬೇಕು", sub: "I'd like a coffee", next: "success", intent: "order_coffee" },
            { id: "help", label: "ಸಹಾಯ ಬೇಕು", sub: "I need help", next: "help", intent: "ask_help", kind: "hint" }
          ]
        }
      }
    }
  }
};
