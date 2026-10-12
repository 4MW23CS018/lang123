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
        start: { speaker: "Mira", text: "ನಮಸ್ಕಾರ! Welcome to the old town.", translation: "Hello! Welcome to the old town.", expression: "happy", next: "greeting" },
        greeting: {
          speaker: "Ravi", text: "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನು ಬೇಕು?", translation: "Hello! What would you like?",
          choices: [
            { id: "coffee", label: "Ask for coffee", next: "success", intent: "order_coffee" },
            { id: "help", label: "Ask for help", next: "help", intent: "ask_help" },
            { id: "hint", label: "I need a hint", kind: "hint", next: "hint" }
          ]
        },
        success: { speaker: "Ravi", text: "ಸರಿ! ಒಂದು ಕಾಫಿ.", translation: "Sure! One coffee.", expression: "happy", completeQuest: true, reward: { xp: 20, gems: 2 }, end: true },
        help: { speaker: "Ravi", text: "ಖಂಡಿತ! ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?", translation: "Of course! What help do you need?", expression: "happy", end: true },
        hint: { speaker: "Mira", text: "Try saying: “ಒಂದು ಕಾಫಿ ಬೇಕು” when ordering one coffee.", translation: "Try saying “ಒಂದು ಕಾಫಿ ಬೇಕು” when ordering one coffee.", expression: "thinking", next: "greeting" }
      }
    }
  }
};
