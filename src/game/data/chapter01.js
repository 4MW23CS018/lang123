export const chapter01 = {
  id: "chapter01",
  title: "A Stranger in Town",
  language: "Kannada",
  startingSceneId: "cafe",
  scenes: {
    cafe: {
      id: "cafe",
      locationName: "Old Town Café",
      objective: "Greet the café owner and ask for a coffee.",
      characters: [
        { id: "mira", name: "Mira", position: "left", expression: "happy" },
        { id: "ravi", name: "Ravi", position: "right", expression: "neutral" }
      ],
      nodes: {
        start: {
          speaker: "Mira",
          text: "ನಮಸ್ಕಾರ! ಹಳೆಯ ಊರಿಗೆ ಸ್ವಾಗತ.",
          translation: "Hello! Welcome to the old town.",
          expression: "happy",
          next: "greeting"
        },
        greeting: {
          speaker: "Ravi",
          text: "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನು ಬೇಕು?",
          translation: "Hello! What would you like?",
          expression: "neutral",
          choices: [
            { id: "coffee", label: "Ask for coffee", next: "success", intent: "order_coffee" },
            { id: "help", label: "Ask for help", next: "help", intent: "ask_help" },
            { id: "hint", label: "I need a hint", kind: "hint", next: "hint" }
          ]
        },
        success: {
          speaker: "Ravi",
          text: "ಸರಿ! ಒಂದು ಕಾಫಿ ಕೊಡುತ್ತೇನೆ.",
          translation: "Of course! I'll get you one coffee.",
          expression: "happy",
          completeQuest: true,
          reward: { xp: 20, gems: 2 },
          end: true
        },
        help: {
          speaker: "Ravi",
          text: "ಖಂಡಿತ! ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?",
          translation: "Of course! What help do you need?",
          expression: "happy",
          next: "greeting"
        },
        hint: {
          speaker: "Mira",
          text: "ಕಾಫಿ ಕೇಳಲು ಹೀಗೆ ಹೇಳಬಹುದು: “ಒಂದು ಕಾಫಿ ಬೇಕು.”",
          translation: "To ask for coffee, you can say: “ಒಂದು ಕಾಫಿ ಬೇಕು” (I would like one coffee).",
          expression: "thinking",
          next: "greeting"
        }
      }
    }
  }
};
