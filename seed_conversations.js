import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

async function seed() {
  const lessons = [
    {
      title: "Greetings: How are you?",
      language: "kannada",
      phrase: "ಹೇಗಿದ್ದೀರಾ?",
      displayPhrase: "ಹೇಗಿದ್ದೀರಾ?",
      phonetics: "Hēgiddīrā?",
      difficulty: "beginner",
      description: "A formal and polite way to ask 'How are you?' in Kannada.",
      order: 10,
    },
    {
      title: "Introductions: What is your name?",
      language: "kannada",
      phrase: "ನಿಮ್ಮ ಹೆಸರು ಏನು?",
      displayPhrase: "ನಿಮ್ಮ ಹೆಸರು ಏನು?",
      phonetics: "Nimma hesaru ēnu?",
      difficulty: "beginner",
      description: "Ask someone for their name politely.",
      order: 11,
    },
    {
      title: "Gratitude: Thank you",
      language: "kannada",
      phrase: "ಧನ್ಯವಾದಗಳು",
      displayPhrase: "ಧನ್ಯವಾದಗಳು",
      phonetics: "Dhanyavādagalu",
      difficulty: "beginner",
      description: "The standard way to say 'Thank you' in Kannada.",
      order: 12,
    }
  ];

  for (const lesson of lessons) {
    await client.mutation("lessons:create", lesson);
    console.log(`Added lesson: ${lesson.title}`);
  }
}

seed().catch(console.error);
