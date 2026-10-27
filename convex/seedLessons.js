import { internalMutation } from "./_generated/server";

/**
 * Seed the lessons table with a rich set of phrases.
 * Run once via the Convex dashboard or CLI:
 *   npx convex run seedLessons:seed
 *
 * The mutation is idempotent-ish – it checks existing titles
 * before inserting so you can re-run safely.
 */

const LESSONS = [
  // ── Kannada ────────────────────────────────────────────────
  {
    title: "Hello – Namaskāra",
    language: "Kannada",
    phrase: "ನಮಸ್ಕಾರ",
    phonetics: "Na-mas-kaa-ra",
    difficulty: "beginner",
    description: "The universal Kannada greeting, used in both formal and informal settings.",
  },
  {
    title: "How are you?",
    language: "Kannada",
    phrase: "ನೀವು ಹೇಗಿದ್ದೀರಾ?",
    phonetics: "Nee-vu Hay-gid-dee-raa",
    difficulty: "beginner",
    description: "A polite way to ask someone how they are doing in Kannada.",
  },
  {
    title: "I am fine",
    language: "Kannada",
    phrase: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ",
    phonetics: "Naa-nu Chen-naa-gid-day-ne",
    difficulty: "beginner",
    description: "A common response meaning 'I am fine / I am doing well'.",
  },
  {
    title: "What is your name?",
    language: "Kannada",
    phrase: "ನಿಮ್ಮ ಹೆಸರು ಏನು?",
    phonetics: "Nim-ma He-sa-ru Ay-nu",
    difficulty: "beginner",
    description: "Ask someone their name in a polite way.",
  },
  {
    title: "My name is…",
    language: "Kannada",
    phrase: "ನನ್ನ ಹೆಸರು",
    phonetics: "Nan-na He-sa-ru",
    difficulty: "beginner",
    description: "Introduce yourself – just add your name after the phrase.",
  },
  {
    title: "Thank you",
    language: "Kannada",
    phrase: "ಧನ್ಯವಾದಗಳು",
    phonetics: "Dhan-ya-vaa-da-ga-lu",
    difficulty: "beginner",
    description: "Express gratitude in Kannada.",
  },
  {
    title: "Good morning",
    language: "Kannada",
    phrase: "ಶುಭೋದಯ",
    phonetics: "Shu-bho-da-ya",
    difficulty: "beginner",
    description: "A morning greeting meaning 'Good morning'.",
  },
  {
    title: "Where is this place?",
    language: "Kannada",
    phrase: "ಈ ಜಾಗ ಎಲ್ಲಿದೆ?",
    phonetics: "Ee Jaa-ga El-li-day",
    difficulty: "intermediate",
    description: "Ask for directions to a particular place.",
  },
  {
    title: "I don't understand",
    language: "Kannada",
    phrase: "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ",
    phonetics: "Na-na-ge Ar-tha-vaa-ga-lil-la",
    difficulty: "intermediate",
    description: "Tell someone you didn't understand what they said.",
  },
  {
    title: "Please speak slowly",
    language: "Kannada",
    phrase: "ದಯವಿಟ್ಟು ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ",
    phonetics: "Da-ya-vit-tu Ni-dhaa-na-vaa-gi Maa-ta-naa-di",
    difficulty: "intermediate",
    description: "Request someone to speak more slowly.",
  },
  {
    title: "How much does this cost?",
    language: "Kannada",
    phrase: "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
    phonetics: "I-da-ra Be-le Esh-tu",
    difficulty: "intermediate",
    description: "Ask the price of an item – essential for shopping!",
  },
  {
    title: "I like this very much",
    language: "Kannada",
    phrase: "ನನಗೆ ಇದು ತುಂಬಾ ಇಷ್ಟ",
    phonetics: "Na-na-ge I-du Tum-baa Ish-ta",
    difficulty: "intermediate",
    description: "Express that you really like something.",
  },

  // ── Tamil ──────────────────────────────────────────────────
  {
    title: "Hello – Vanakkam",
    language: "Tamil",
    phrase: "வணக்கம்",
    phonetics: "Va-nak-kam",
    difficulty: "beginner",
    description: "The classic Tamil greeting, suitable for all occasions.",
  },
  {
    title: "How are you?",
    language: "Tamil",
    phrase: "நீங்கள் எப்படி இருக்கிறீர்கள்?",
    phonetics: "Neeng-kal Ep-pa-di I-ruk-kee-reer-kal",
    difficulty: "beginner",
    description: "Politely ask how someone is doing in Tamil.",
  },
  {
    title: "Thank you",
    language: "Tamil",
    phrase: "நன்றி",
    phonetics: "Nan-dri",
    difficulty: "beginner",
    description: "Express gratitude in Tamil.",
  },
  {
    title: "What is your name?",
    language: "Tamil",
    phrase: "உங்கள் பெயர் என்ன?",
    phonetics: "Ung-kal Pe-yar En-na",
    difficulty: "beginner",
    description: "Ask someone their name in Tamil.",
  },
  {
    title: "I am fine",
    language: "Tamil",
    phrase: "நான் நலமாக இருக்கிறேன்",
    phonetics: "Naan Na-la-maa-ga I-ruk-ki-raen",
    difficulty: "beginner",
    description: "Respond that you are doing well.",
  },
  {
    title: "Where is the bus stop?",
    language: "Tamil",
    phrase: "பேருந்து நிலையம் எங்கே?",
    phonetics: "Pay-run-thu Ni-lai-yam Eng-gay",
    difficulty: "intermediate",
    description: "Ask for directions to the bus stop.",
  },

  // ── Telugu ─────────────────────────────────────────────────
  {
    title: "Hello – Namaskāram",
    language: "Telugu",
    phrase: "నమస్కారం",
    phonetics: "Na-mas-kaa-ram",
    difficulty: "beginner",
    description: "A respectful Telugu greeting.",
  },
  {
    title: "How are you?",
    language: "Telugu",
    phrase: "మీరు ఎలా ఉన్నారు?",
    phonetics: "Mee-ru E-laa Un-naa-ru",
    difficulty: "beginner",
    description: "Ask someone how they are in Telugu.",
  },
  {
    title: "Thank you",
    language: "Telugu",
    phrase: "ధన్యవాదాలు",
    phonetics: "Dhan-ya-vaa-daa-lu",
    difficulty: "beginner",
    description: "Express thanks in Telugu.",
  },
  {
    title: "What is your name?",
    language: "Telugu",
    phrase: "మీ పేరు ఏమిటి?",
    phonetics: "Mee Pay-ru Ay-mi-ti",
    difficulty: "beginner",
    description: "Ask someone's name in Telugu.",
  },
  {
    title: "Good night",
    language: "Telugu",
    phrase: "శుభ రాత్రి",
    phonetics: "Shu-bha Raa-tri",
    difficulty: "beginner",
    description: "Wish someone good night in Telugu.",
  },

  // ── Malayalam ───────────────────────────────────────────────
  {
    title: "Hello – Namaskāram",
    language: "Malayalam",
    phrase: "നമസ്കാരം",
    phonetics: "Na-mas-kaa-ram",
    difficulty: "beginner",
    description: "The standard Malayalam greeting.",
  },
  {
    title: "How are you?",
    language: "Malayalam",
    phrase: "സുഖമാണോ?",
    phonetics: "Su-kha-maa-no",
    difficulty: "beginner",
    description: "Ask someone how they are in Malayalam.",
  },
  {
    title: "Thank you",
    language: "Malayalam",
    phrase: "നന്ദി",
    phonetics: "Nan-di",
    difficulty: "beginner",
    description: "Say thank you in Malayalam.",
  },
  {
    title: "What is your name?",
    language: "Malayalam",
    phrase: "നിങ്ങളുടെ പേര് എന്താണ്?",
    phonetics: "Ning-ga-lu-de Payr En-thaan",
    difficulty: "beginner",
    description: "Ask someone their name in Malayalam.",
  },

  // ── Tulu ───────────────────────────────────────────────────
  {
    title: "Hello – Namaskāra",
    language: "Tulu",
    phrase: "ನಮಸ್ಕಾರ",
    phonetics: "Na-mas-kaa-ra",
    difficulty: "beginner",
    description: "A respectful Tulu greeting.",
  },
  {
    title: "How are you?",
    language: "Tulu",
    phrase: "ಎಂಚ ಉಲ್ಲ?",
    phonetics: "En-cha Ul-la",
    difficulty: "beginner",
    description: "Ask how someone is doing in Tulu.",
  },
  {
    title: "Thank you",
    language: "Tulu",
    phrase: "ಧನ್ಯವಾದ",
    phonetics: "Dhan-ya-vaa-da",
    difficulty: "beginner",
    description: "Express gratitude in Tulu.",
  },

  // ── Kodava ─────────────────────────────────────────────────
  {
    title: "Hello – Namaskāra",
    language: "Kodava",
    phrase: "ನಮಸ್ಕಾರ",
    phonetics: "Na-mas-kaa-ra",
    difficulty: "beginner",
    description: "A traditional Kodava greeting.",
  },
  {
    title: "How are you?",
    language: "Kodava",
    phrase: "ಎಂತ ಉಂಡ್?",
    phonetics: "En-tha Und",
    difficulty: "beginner",
    description: "Ask how someone is in the Kodava language.",
  },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fetch existing lessons to avoid duplicates
    const existing = await ctx.db.query("lessons").collect();
    const existingKeys = new Set(
      existing.map((l) => `${l.language}::${l.phrase}`)
    );

    let inserted = 0;
    let updated = 0;
    for (const lesson of LESSONS) {
      const key = `${lesson.language}::${lesson.phrase}`;
      if (!existingKeys.has(key)) {
        await ctx.db.insert("lessons", lesson);
        inserted++;
      } else {
        // Update existing lessons with phonetics if missing
        const existingLesson = existing.find(
          (l) => l.language === lesson.language && l.phrase === lesson.phrase
        );
        if (existingLesson && !existingLesson.phonetics && lesson.phonetics) {
          await ctx.db.patch(existingLesson._id, { phonetics: lesson.phonetics });
          updated++;
        }
      }
    }

    console.log(`Seeded ${inserted} new lessons, updated ${updated} with phonetics (${LESSONS.length - inserted - updated} unchanged).`);
    return { inserted, updated, skipped: LESSONS.length - inserted - updated };
  },
});
