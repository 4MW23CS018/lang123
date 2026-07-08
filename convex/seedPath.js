import { mutation } from "./_generated/server";

const CURRICULUM = {
  Kannada: [
    { unit: 1, topic: "Greetings", title: "Hello", phrase: "ನಮಸ್ಕಾರ", phonetics: "na-mas-ka-ra", difficulty: "beginner", displayPhrase: "ನಮಸ್ಕಾರ (na-mas-ka-ra)" },
    { unit: 1, topic: "Greetings", title: "Welcome", phrase: "ಸ್ವಾಗತ", phonetics: "swa-ga-ta", difficulty: "beginner", displayPhrase: "ಸ್ವಾಗತ (swa-ga-ta)" },
    { unit: 1, topic: "Greetings", title: "How are you?", phrase: "ನೀವು ಹೇಗಿದ್ದೀರಿ?", phonetics: "nee-vu he-gid-di-ri?", difficulty: "beginner", displayPhrase: "ನೀವು ಹೇಗಿದ್ದೀರಿ? (nee-vu he-gid-di-ri?)" },
    { unit: 1, topic: "Greetings", title: "I am fine", phrase: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ", phonetics: "naa-nu chen-na-gid-de-ne", difficulty: "beginner", displayPhrase: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ (naa-nu chen-na-gid-de-ne)" },
    { unit: 2, topic: "Basic Phrases", title: "Yes and No", phrase: "ಹೌದು, ಇಲ್ಲ", phonetics: "hau-du, il-la", difficulty: "beginner", displayPhrase: "ಹೌದು, ಇಲ್ಲ (hau-du, il-la)" },
    { unit: 2, topic: "Basic Phrases", title: "Thank you", phrase: "ಧನ್ಯವಾದಗಳು", phonetics: "dhan-ya-va-da-ga-lu", difficulty: "beginner", displayPhrase: "ಧನ್ಯವಾದಗಳು (dhan-ya-va-da-ga-lu)" },
    { unit: 2, topic: "Basic Phrases", title: "What is your name?", phrase: "ನಿಮ್ಮ ಹೆಸರು ಏನು?", phonetics: "nim-ma he-sa-ru e-nu?", difficulty: "intermediate", displayPhrase: "ನಿಮ್ಮ ಹೆಸರು ಏನು? (nim-ma he-sa-ru e-nu?)" },
    { unit: 3, topic: "Food", title: "I want water", phrase: "ನನಗೆ ನೀರು ಬೇಕು", phonetics: "na-na-ge nee-ru be-ku", difficulty: "intermediate", displayPhrase: "ನನಗೆ ನೀರು ಬೇಕು (na-na-ge nee-ru be-ku)" },
    { unit: 3, topic: "Food", title: "Food is delicious", phrase: "ಊಟ ರುಚಿಯಾಗಿದೆ", phonetics: "oo-ta ru-chi-ya-gi-de", difficulty: "intermediate", displayPhrase: "ಊಟ ರುಚಿಯಾಗಿದೆ (oo-ta ru-chi-ya-gi-de)" },
  ],
  Tamil: [
    { unit: 1, topic: "Greetings", title: "Hello", phrase: "வணக்கம்", phonetics: "va-nak-kam", difficulty: "beginner", displayPhrase: "வணக்கம் (va-nak-kam)" },
    { unit: 1, topic: "Greetings", title: "Welcome", phrase: "நல்வரவு", phonetics: "nal-va-ra-vu", difficulty: "beginner", displayPhrase: "நல்வரவு (nal-va-ra-vu)" },
    { unit: 1, topic: "Greetings", title: "How are you?", phrase: "நீங்கள் எப்படி இருக்கிறீர்கள்?", phonetics: "neen-gal ep-pa-di i-ruk-ki-reer-gal?", difficulty: "beginner", displayPhrase: "நீங்கள் எப்படி இருக்கிறீர்கள்? (neen-gal ep-pa-di i-ruk-ki-reer-gal?)" },
    { unit: 1, topic: "Greetings", title: "I am fine", phrase: "நான் நன்றாக இருக்கிறேன்", phonetics: "naan nan-raa-ga i-ruk-ki-ren", difficulty: "beginner", displayPhrase: "நான் நன்றாக இருக்கிறேன் (naan nan-raa-ga i-ruk-ki-ren)" },
    { unit: 2, topic: "Basic Phrases", title: "Yes and No", phrase: "ஆம், இல்லை", phonetics: "aam, il-lai", difficulty: "beginner", displayPhrase: "ஆம், இல்லை (aam, il-lai)" },
    { unit: 2, topic: "Basic Phrases", title: "Thank you", phrase: "நன்றி", phonetics: "nan-dri", difficulty: "beginner", displayPhrase: "நன்றி (nan-dri)" },
    { unit: 2, topic: "Basic Phrases", title: "What is your name?", phrase: "உங்கள் பெயர் என்ன?", phonetics: "un-gal pe-yar en-na?", difficulty: "intermediate", displayPhrase: "உங்கள் பெயர் என்ன? (un-gal pe-yar en-na?)" },
    { unit: 3, topic: "Food", title: "I want water", phrase: "எனக்கு தண்ணீர் வேண்டும்", phonetics: "e-nak-ku than-neer ven-dum", difficulty: "intermediate", displayPhrase: "எனக்கு தண்ணீர் வேண்டும் (e-nak-ku than-neer ven-dum)" },
    { unit: 3, topic: "Food", title: "Food is delicious", phrase: "உணவு சுவையாக இருக்கிறது", phonetics: "u-na-vu su-vai-ya-ga i-ruk-ki-ra-thu", difficulty: "intermediate", displayPhrase: "உணவு சுவையாக இருக்கிறது (u-na-vu su-vai-ya-ga i-ruk-ki-ra-thu)" },
  ],
  Telugu: [
    { unit: 1, topic: "Greetings", title: "Hello", phrase: "నమస్కారం", phonetics: "na-mas-ka-ram", difficulty: "beginner", displayPhrase: "నమస్కారం (na-mas-ka-ram)" },
    { unit: 1, topic: "Greetings", title: "Welcome", phrase: "స్వాగతం", phonetics: "swa-ga-tam", difficulty: "beginner", displayPhrase: "స్వాగతం (swa-ga-tam)" },
    { unit: 1, topic: "Greetings", title: "How are you?", phrase: "మీరు ఎలా ఉన్నారు?", phonetics: "mee-ru e-la un-na-ru?", difficulty: "beginner", displayPhrase: "మీరు ఎలా ఉన్నారు? (mee-ru e-la un-na-ru?)" },
    { unit: 1, topic: "Greetings", title: "I am fine", phrase: "నేను బాగున్నాను", phonetics: "ne-nu ba-gun-na-nu", difficulty: "beginner", displayPhrase: "నేను బాగున్నాను (ne-nu ba-gun-na-nu)" },
    { unit: 2, topic: "Basic Phrases", title: "Yes and No", phrase: "అవును, లేదు", phonetics: "a-vu-nu, le-du", difficulty: "beginner", displayPhrase: "అవును, లేదు (a-vu-nu, le-du)" },
    { unit: 2, topic: "Basic Phrases", title: "Thank you", phrase: "ధన్యవాదాలు", phonetics: "dhan-ya-va-da-lu", difficulty: "beginner", displayPhrase: "ధన్యవాదాలు (dhan-ya-va-da-lu)" },
    { unit: 2, topic: "Basic Phrases", title: "What is your name?", phrase: "మీ పేరు ఏమిటి?", phonetics: "mee pe-ru e-mi-ti?", difficulty: "intermediate", displayPhrase: "మీ పేరు ఏమిటి? (mee pe-ru e-mi-ti?)" },
    { unit: 3, topic: "Food", title: "I want water", phrase: "నాకు నీళ్లు కావాలి", phonetics: "naa-ku neel-lu kaa-va-li", difficulty: "intermediate", displayPhrase: "నాకు నీళ్లు కావాలి (naa-ku neel-lu kaa-va-li)" },
    { unit: 3, topic: "Food", title: "Food is delicious", phrase: "భోజనం రుచిగా ఉంది", phonetics: "bho-ja-nam ru-chi-ga un-di", difficulty: "intermediate", displayPhrase: "భోజనం రుచిగా ఉంది (bho-ja-nam ru-chi-ga un-di)" },
  ],
  Malayalam: [
    { unit: 1, topic: "Greetings", title: "Hello", phrase: "നമസ്കാരം", phonetics: "na-mas-ka-ram", difficulty: "beginner", displayPhrase: "നമസ്കാരം (na-mas-ka-ram)" },
    { unit: 1, topic: "Greetings", title: "Welcome", phrase: "സ്വാഗതം", phonetics: "swa-ga-tham", difficulty: "beginner", displayPhrase: "സ്വാഗതം (swa-ga-tham)" },
    { unit: 1, topic: "Greetings", title: "How are you?", phrase: "സുഖമാണോ?", phonetics: "su-kha-maa-no?", difficulty: "beginner", displayPhrase: "സുഖമാണോ? (su-kha-maa-no?)" },
    { unit: 1, topic: "Greetings", title: "I am fine", phrase: "എനിക്ക് സുഖമാണ്", phonetics: "e-nik-ku su-kha-maa-nu", difficulty: "beginner", displayPhrase: "എനിക്ക് സുഖമാണ് (e-nik-ku su-kha-maa-nu)" },
    { unit: 2, topic: "Basic Phrases", title: "Yes and No", phrase: "അതെ, അല്ല", phonetics: "a-the, al-la", difficulty: "beginner", displayPhrase: "അതെ, അല്ല (a-the, al-la)" },
    { unit: 2, topic: "Basic Phrases", title: "Thank you", phrase: "നന്ദി", phonetics: "nan-di", difficulty: "beginner", displayPhrase: "നന്ദി (nan-di)" },
    { unit: 2, topic: "Basic Phrases", title: "What is your name?", phrase: "നിങ്ങളുടെ പേരെന്താണ്?", phonetics: "nin-ga-lu-de pe-ren-thaa-nu?", difficulty: "intermediate", displayPhrase: "നിങ്ങളുടെ പേരെന്താണ്? (nin-ga-lu-de pe-ren-thaa-nu?)" },
    { unit: 3, topic: "Food", title: "I want water", phrase: "എനിക്ക് വെള്ളം വേണം", phonetics: "e-nik-ku vel-lam ve-nam", difficulty: "intermediate", displayPhrase: "എനിക്ക് വെള്ളം വേണം (e-nik-ku vel-lam ve-nam)" },
    { unit: 3, topic: "Food", title: "Food is delicious", phrase: "ഭക്ഷണം രുചികരമാണ്", phonetics: "bhak-sha-nam ru-chi-ka-ra-maa-nu", difficulty: "intermediate", displayPhrase: "ഭക്ഷണം രുചികരമാണ് (bhak-sha-nam ru-chi-ka-ra-maa-nu)" },
  ]
};

export default mutation(async (ctx) => {
  console.log("Starting DB wipe...");
  
  // 1. Delete old official lessons
  const oldLessons = await ctx.db.query("lessons").filter(q => q.neq(q.field("isCustom"), true)).collect();
  for (const l of oldLessons) {
    await ctx.db.delete(l._id);
  }
  
  // 2. Insert new structured curriculum
  console.log("Seeding new path curriculum...");
  for (const [language, lessons] of Object.entries(CURRICULUM)) {
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      await ctx.db.insert("lessons", {
        title: l.title,
        language,
        phrase: l.phrase,
        phonetics: l.phonetics,
        difficulty: l.difficulty,
        displayPhrase: l.displayPhrase,
        isCustom: false,
        unit: l.unit,
        topic: l.topic,
        order: i + 1, // 1-indexed order within the language
      });
    }
  }
  
  console.log("Seeding complete!");
  return "Seeded successfully";
});
