// Inventory conventions and scope, checked against the references below:
// Kannada: 13 independent vowels + 34 consonants. Anusvara (ಂ) and visarga
//   (ಃ) are yogavahas/special signs, not vowels or consonants. This common
//   school inventory omits rare long vocalic-r and vocalic-l forms.
// Tamil: 12 independent vowels + 18 consonants. Aytam (ஃ) is separate;
//   Grantha letters are outside the core Tamil consonant inventory.
// Telugu: 14 independent vowels + 36 traditional chart consonants. The often
//   quoted 16-vowel school count includes anusvara (అం) and visarga (అః),
//   which are kept under specialCharacters here. ఌ/ౡ are uncommon and omitted;
//   క్ష is traditionally charted as a consonant although it is a conjunct;
//   ఱ is rare/historical and retained because it occurs in the selected chart.
// Malayalam: 13 independent vowels + 36 consonants. The common 15-item
//   syllabary count includes anusvara (അം) and visarga (അഃ), kept separately.
//   Long vocalic-r and vocalic-l forms are uncommon and omitted.
// Tulu: Tulu-Tigalari encodes 14 independent vowel letters and 36 consonants.
//   Vocalic R/RR/L/LL are Sanskrit-derived script letters and are distinguished
//   from ordinary beginner vowels. Six additional phonemic vowel records
//   (short e/o, unrounded u/long u, and the open-mid pair) have no standardized
//   independent glyph. Vowel+virama sequences are not presented as independent
//   letters; unsupported sounds remain visibly marked. Tulu numerals 1–10 are
//   chart-derived forms mapped to application PUA text glyphs; zero has no
//   verified artwork in this workspace. Published
//   numeral proposals use unassigned points (including U+113F0..U+113FB and
//   U+113F6..U+113FF); the app uses none of those proposed code points.
// Kodava: the selected Kodava Lipi chart has no Unicode encoding or documented
//   font mapping. Its mapped inventory here is 11 vowel forms, 24 consonants,
//   anusvara, and visarga. Kannada-derived aspirate placeholders and vowels
//   absent from that chart are excluded. Its additional "zh" form is not mapped
//   because this dataset has no verified semantic association. Kannada-script
//   char/tts values remain semantic data; displayChar uses the app's documented
//   PUA font mapping. The /ë/ phonemic distinction is not a native chart glyph.
//   Existing Kodava numeral PNGs had no source chart or attribution in this
//   workspace, so they were removed and are not mapped as native Kodava text
//   glyphs. Number names and values remain in the dataset. See the generated mapping report at
//   public/fonts/LangBridgeGlyphMapping.md.
// Tulu sources: Unicode chart/spec at
// https://www.unicode.org/charts/script/chart_Tulu_Tigalari.html and
// https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-15/.
// Experimental vowel notation follows Unicode proposal L2/21-086 but is not
// assigned standalone characters. Tulu numerals follow Prithvi Tuluve's CC
// BY-SA 4.0 chart; Kodava Lipi follows RaithaPade's CC0 chart. See
// public/reference/ATTRIBUTION.md and https://www.kodavatakk.org/about.
// Tulu numeral proposals: https://www.unicode.org/L2/L2025/25020-tulu-tigalari-numerals.pdf
// and https://www.unicode.org/L2/L2025/25063-tulu-tigalari-characters.pdf
// References: Kannada https://vtu.ac.in/pdf/cbcs/201718/kan2.pdf
// Tamil https://www.open.edu/openlearn/languages/beginners-tamil-taster-course/content-section-2
// Tamil Lexicon entry for எஃகு: https://agarathi.com/word/%E0%AE%8E%E0%AE%83%E0%AE%95%E0%AF%81
// Telugu https://teachmetelugu.com/learn-telugu/telugu-alphabet-course/introduction/
// Malayalam https://malayalam.la.utexas.edu/resources/pronunciation-the-basics/
// Tulu Lexicon in Kannada orthography: https://www.unicode.org/L2/L2021/21210-tulu-tigalari.pdf
// Tulu Academy inventory: https://www.unicode.org/L2/2022/22034-tulu-ktsa-proposal.pdf
// Tulu Lexicon portal: https://tuludictionary.in/dictionary/cgi-bin/web/html/main.html
// Kodava alphabet/numeral primer: https://ciil.gov.in/primers/Kodava_Primer.pdf
// Kodava transliteration, words and orthographic limits: https://www.kodavatakk.org/about
// Kodava numbers 1–10: https://www.kodavatakk.org/blog/common-kodava-takk-phrases
// Tulu number forms 1–10: https://www.easytulu.com/p/numbers-in-tulu.html
// Published Tulu sources found for zero conflict; no source claim is attached
// to the requested `sonye` pronunciation or to an unverified zero glyph.

export const BASICS_DATA = {
  Kannada: {
    vowels: [
      { char: 'ಅ', ph: 'a', ex: 'ಅಮ್ಮ', exPh: 'amma', exEn: 'Mother', tts: 'ಅ, ಅಮ್ಮ' },
      { char: 'ಆ', ph: 'aa', ex: 'ಆನೆ', exPh: 'aane', exEn: 'Elephant', tts: 'ಆ, ಆನೆ' },
      { char: 'ಇ', ph: 'i', ex: 'ಇಲಿ', exPh: 'ili', exEn: 'Rat', tts: 'ಇ, ಇಲಿ' },
      { char: 'ಈ', ph: 'ii', ex: 'ಈರುಳ್ಳಿ', exPh: 'eerulli', exEn: 'Onion', tts: 'ಈ, ಈರುಳ್ಳಿ' },
      { char: 'ಉ', ph: 'u', ex: 'ಉಗುರು', exPh: 'uguru', exEn: 'Nail', tts: 'ಉ, ಉಗುರು' },
      { char: 'ಊ', ph: 'uu', ex: 'ಊಟ', exPh: 'oota', exEn: 'Meal', tts: 'ಊ, ಊಟ' },
      { char: 'ಋ', ph: 'ru', ex: 'ಋಷಿ', exPh: 'rushi', exEn: 'Sage', tts: 'ಋ, ಋಷಿ' },
      { char: 'ಎ', ph: 'e', ex: 'ಎಲೆ', exPh: 'ele', exEn: 'Leaf', tts: 'ಎ, ಎಲೆ' },
      { char: 'ಏ', ph: 'ee', ex: 'ಏಡಿ', exPh: 'eedi', exEn: 'Crab', tts: 'ಏ, ಏಡಿ' },
      { char: 'ಐ', ph: 'ai', ex: 'ಐದು', exPh: 'aidu', exEn: 'Five', tts: 'ಐ, ಐದು' },
      { char: 'ಒ', ph: 'o', ex: 'ಒಂಟೆ', exPh: 'onte', exEn: 'Camel', tts: 'ಒ, ಒಂಟೆ' },
      { char: 'ಓ', ph: 'oo', ex: 'ಓಟ', exPh: 'oota', exEn: 'Run', tts: 'ಓ, ಓಟ' },
      { char: 'ಔ', ph: 'au', ex: 'ಔಷಧ', exPh: 'aushadha', exEn: 'Medicine', tts: 'ಔ, ಔಷಧ' },
    ],
    consonants: [
      { char: 'ಕ', ph: 'ka', ex: 'ಕಮಲ', exPh: 'kamala', exEn: 'Lotus', tts: 'ಕ, ಕಮಲ' },
      { char: 'ಖ', ph: 'kha', ex: 'ಖಡ್ಗ', exPh: 'khadga', exEn: 'Sword', tts: 'ಖ, ಖಡ್ಗ' },
      { char: 'ಗ', ph: 'ga', ex: 'ಗಡಿಯಾರ', exPh: 'gadiyara', exEn: 'Clock', tts: 'ಗ, ಗಡಿಯಾರ' },
      { char: 'ಘ', ph: 'gha', ex: 'ಘಂಟೆ', exPh: 'ghante', exEn: 'Bell', tts: 'ಘ, ಘಂಟೆ' },
      { char: 'ಙ', ph: 'nga', tts: 'ಙ' },
      { char: 'ಚ', ph: 'cha', ex: 'ಚಕ್ರ', exPh: 'chakra', exEn: 'Wheel', tts: 'ಚ, ಚಕ್ರ' },
      { char: 'ಛ', ph: 'chha', ex: 'ಛತ್ರಿ', exPh: 'chhatri', exEn: 'Umbrella', tts: 'ಛ, ಛತ್ರಿ' },
      { char: 'ಜ', ph: 'ja', ex: 'ಜನ', exPh: 'jana', exEn: 'People', tts: 'ಜ, ಜನ' },
      { char: 'ಝ', ph: 'jha', ex: 'ಝರಿ', exPh: 'jhari', exEn: 'Waterfall', tts: 'ಝ, ಝರಿ' },
      { char: 'ಞ', ph: 'nya', tts: 'ಞ' },
      { char: 'ಟ', ph: 'ṭa', ex: 'ಟೊಮೇಟೊ', exPh: 'ṭomēṭo', exEn: 'Tomato', tts: 'ಟ, ಟೊಮೇಟೊ' },
      { char: 'ಠ', ph: 'ṭha', ex: 'ಠಕ್ಕನೆ', exPh: 'ṭhakkane', exEn: 'Suddenly', tts: 'ಠ, ಠಕ್ಕನೆ' },
      { char: 'ಡ', ph: 'ḍa', ex: 'ಡಬ್ಬಿ', exPh: 'ḍabbi', exEn: 'Box', tts: 'ಡ, ಡಬ್ಬಿ' },
      { char: 'ಢ', ph: 'ḍha', tts: 'ಢ' },
      { char: 'ಣ', ph: 'ṇa', ex: 'ಅಣು', exPh: 'aṇu', exEn: 'Atom', tts: 'ಣ, ಅಣು' },
      { char: 'ತ', ph: 'ta', ex: 'ತಲೆ', exPh: 'tale', exEn: 'Head', tts: 'ತ, ತಲೆ' },
      { char: 'ಥ', ph: 'tha', ex: 'ಥರ್ಮಸ್', exPh: 'tharmas', exEn: 'Thermos flask', tts: 'ಥ, ಥರ್ಮಸ್' },
      { char: 'ದ', ph: 'da', ex: 'ದಾರಿ', exPh: 'daari', exEn: 'Path', tts: 'ದ, ದಾರಿ' },
      { char: 'ಧ', ph: 'dha', ex: 'ಧನ', exPh: 'dhana', exEn: 'Wealth', tts: 'ಧ, ಧನ' },
      { char: 'ನ', ph: 'na', ex: 'ನದಿ', exPh: 'nadi', exEn: 'River', tts: 'ನ, ನದಿ' },
      { char: 'ಪ', ph: 'pa', ex: 'ಪಟಾಕಿ', exPh: 'paṭāki', exEn: 'Firecracker', tts: 'ಪ, ಪಟಾಕಿ' },
      { char: 'ಫ', ph: 'pha', ex: 'ಫಲ', exPh: 'phala', exEn: 'Fruit', tts: 'ಫ, ಫಲ' },
      { char: 'ಬ', ph: 'ba', ex: 'ಬಾಳೆ', exPh: 'bāḷe', exEn: 'Banana', tts: 'ಬ, ಬಾಳೆ' },
      { char: 'ಭ', ph: 'bha', ex: 'ಭಾರತ', exPh: 'bhārata', exEn: 'India', tts: 'ಭ, ಭಾರತ' },
      { char: 'ಮ', ph: 'ma', ex: 'ಮನೆ', exPh: 'mane', exEn: 'House', tts: 'ಮ, ಮನೆ' },
      { char: 'ಯ', ph: 'ya', ex: 'ಯಕ್ಷ', exPh: 'yakṣa', exEn: 'Yaksha', tts: 'ಯ, ಯಕ್ಷ' },
      { char: 'ರ', ph: 'ra', ex: 'ರಥ', exPh: 'ratha', exEn: 'Chariot', tts: 'ರ, ರಥ' },
      { char: 'ಲ', ph: 'la', ex: 'ಲತೆ', exPh: 'late', exEn: 'Creeper', tts: 'ಲ, ಲತೆ' },
      { char: 'ವ', ph: 'va', ex: 'ವನ', exPh: 'vana', exEn: 'Forest', tts: 'ವ, ವನ' },
      { char: 'ಶ', ph: 'sha', ex: 'ಶಶಿ', exPh: 'shashi', exEn: 'Moon', tts: 'ಶ, ಶಶಿ' },
      { char: 'ಷ', ph: 'ṣa', ex: 'ಷಟ್ಕೋನ', exPh: 'ṣaṭkōna', exEn: 'Hexagon', tts: 'ಷ, ಷಟ್ಕೋನ' },
      { char: 'ಸ', ph: 'sa', ex: 'ಸಸಿ', exPh: 'sasi', exEn: 'Seedling', tts: 'ಸ, ಸಸಿ' },
      { char: 'ಹ', ph: 'ha', ex: 'ಹಸು', exPh: 'hasu', exEn: 'Cow', tts: 'ಹ, ಹಸು' },
      { char: 'ಳ', ph: 'ḷa', ex: 'ಹಳ್ಳಿ', exPh: 'haḷḷi', exEn: 'Village', tts: 'ಳ, ಹಳ್ಳಿ' },
    ],
    specialCharacters: [
      { char: 'ಅಂ', ph: 'anusvāra (ṃ)', ex: 'ಅಂಬರ', exPh: 'ambara', exEn: 'Sky', tts: 'ಅಂಬರ', note: 'Yogavaha nasal sign; it is separate from the independent vowels and consonants.' },
      { char: 'ಅಃ', ph: 'visarga (ḥ)', ex: 'ದುಃಖ', exPh: 'duḥkha', exEn: 'Sorrow', tts: 'ದುಃಖ', note: 'Yogavaha sign for a post-vocalic breath; it is separate from the independent vowels and consonants.' },
    ],
    numbers: [
      { char: '೦ (0)', ph: 'sonne', val: 0, tts: 'ಸೊನ್ನೆ' }, { char: '೧ (1)', ph: 'ondu', val: 1, tts: 'ಒಂದು' },
      { char: '೨ (2)', ph: 'eradu', val: 2, tts: 'ಎರಡು' }, { char: '೩ (3)', ph: 'mooru', val: 3, tts: 'ಮೂರು' },
      { char: '೪ (4)', ph: 'naalku', val: 4, tts: 'ನಾಲ್ಕು' }, { char: '೫ (5)', ph: 'aidu', val: 5, tts: 'ಐದು' },
      { char: '೬ (6)', ph: 'aaru', val: 6, tts: 'ಆರು' }, { char: '೭ (7)', ph: 'eLu', val: 7, tts: 'ಏಳು' },
      { char: '೮ (8)', ph: 'entu', val: 8, tts: 'ಎಂಟು' }, { char: '೯ (9)', ph: 'ombhattu', val: 9, tts: 'ಒಂಬತ್ತು' },
      { char: '೧೦ (10)', ph: 'hattu', val: 10, tts: 'ಹತ್ತು' },
    ]
  },
  Tamil: {
    vowels: [
      { char: 'அ', ph: 'a', ex: 'அம்மா', exPh: 'amma', exEn: 'Mother', tts: 'அ, அம்மா' },
      { char: 'ஆ', ph: 'aa', ex: 'ஆடு', exPh: 'aadu', exEn: 'Goat', tts: 'ஆ, ஆடு' },
      { char: 'இ', ph: 'i', ex: 'இலை', exPh: 'ilai', exEn: 'Leaf', tts: 'இ, இலை' },
      { char: 'ஈ', ph: 'ii', ex: 'ஈ', exPh: 'ee', exEn: 'Fly', tts: 'ஈ, ஈ' },
      { char: 'உ', ph: 'u', ex: 'உலக்கை', exPh: 'ulakkai', exEn: 'Pestle', tts: 'உ, உலக்கை' },
      { char: 'ஊ', ph: 'uu', ex: 'ஊஞ்சல்', exPh: 'oonjal', exEn: 'Swing', tts: 'ஊ, ஊஞ்சல்' },
      { char: 'எ', ph: 'e', ex: 'எலி', exPh: 'eli', exEn: 'Rat', tts: 'எ, எலி' },
      { char: 'ஏ', ph: 'ee', ex: 'ஏணி', exPh: 'eeni', exEn: 'Ladder', tts: 'ஏ, ஏணி' },
      { char: 'ஐ', ph: 'ai', ex: 'ஐந்து', exPh: 'ainthu', exEn: 'Five', tts: 'ஐ, ஐந்து' },
      { char: 'ஒ', ph: 'o', ex: 'ஒட்டகம்', exPh: 'ottagam', exEn: 'Camel', tts: 'ஒ, ஒட்டகம்' },
      { char: 'ஓ', ph: 'oo', ex: 'ஓடம்', exPh: 'odam', exEn: 'Boat', tts: 'ஓ, ஓடம்' },
      { char: 'ஔ', ph: 'au', ex: 'ஔவையார்', exPh: 'auvaiyar', exEn: 'Auvaiyar', tts: 'ஔ, ஔவையார்' },
    ],
    consonants: [
      { char: 'க', ph: 'ka', ex: 'கப்பல்', exPh: 'kappal', exEn: 'Ship', tts: 'க, கப்பல்' },
      { char: 'ங', ph: 'nga', ex: 'ஙனம்', exPh: 'nganam', exEn: 'Kind; manner', tts: 'ங, ஙனம்' },
      { char: 'ச', ph: 'cha/sa', ex: 'சக்கரம்', exPh: 'sakkaram', exEn: 'Wheel', tts: 'ச, சக்கரம்' },
      { char: 'ஞ', ph: 'nya', ex: 'ஞாயிறு', exPh: 'nyayiru', exEn: 'Sunday', tts: 'ஞ, ஞாயிறு' },
      { char: 'ட', ph: 'ta', ex: 'படம்', exPh: 'padam', exEn: 'Picture', tts: 'ட, படம்' },
      { char: 'ண', ph: 'nna', ex: 'கிணறு', exPh: 'kinaru', exEn: 'Well', tts: 'ண, கிணறு' },
      { char: 'த', ph: 'tha', ex: 'தவளை', exPh: 'thavalai', exEn: 'Frog', tts: 'த, தவளை' },
      { char: 'ந', ph: 'na', ex: 'நண்டு', exPh: 'nandu', exEn: 'Crab', tts: 'ந, நண்டு' },
      { char: 'ப', ph: 'pa', ex: 'பட்டம்', exPh: 'pattam', exEn: 'Kite', tts: 'ப, பட்டம்' },
      { char: 'ம', ph: 'ma', ex: 'மரம்', exPh: 'maram', exEn: 'Tree', tts: 'ம, மரம்' },
      { char: 'ய', ph: 'ya', ex: 'யானை', exPh: 'yāṉai', exEn: 'Elephant', tts: 'ய, யானை' },
      { char: 'ர', ph: 'ra', ex: 'ரதம்', exPh: 'radham', exEn: 'Chariot', tts: 'ர, ரதம்' },
      { char: 'ல', ph: 'la', ex: 'லட்டு', exPh: 'laṭṭu', exEn: 'Sweet', tts: 'ல, லட்டு' },
      { char: 'வ', ph: 'va', ex: 'வனம்', exPh: 'vanam', exEn: 'Forest', tts: 'வ, வனம்' },
      { char: 'ழ', ph: 'ḻa', ex: 'தமிழ்', exPh: 'tamiḻ', exEn: 'Tamil', tts: 'ழ, தமிழ்' },
      { char: 'ள', ph: 'ḷa', ex: 'குளம்', exPh: 'kuḷam', exEn: 'Pond', tts: 'ள, குளம்' },
      { char: 'ற', ph: 'ṟa', ex: 'அறம்', exPh: 'aṟam', exEn: 'Virtue', tts: 'ற, அறம்' },
      { char: 'ன', ph: 'ṉa', ex: 'மனிதன்', exPh: 'maṉitaṉ', exEn: 'Human', tts: 'ன, மனிதன்' },
    ],
    specialCharacters: [
      { char: 'ஃ', ph: 'āytam', ex: 'எஃகு', exPh: 'eḥku', exEn: 'Steel', tts: 'எஃகு', note: 'The Tamil special letter āytam. It has no single general standalone pronunciation; its value is context-dependent, as in எஃகு (eḥku). It is not simply pronounced “ak”.' },
    ],
    numbers: [
      { char: '௦ (0)', ph: 'suzhiyam', val: 0, tts: 'சுழியம்' }, { char: '௧ (1)', ph: 'ondru', val: 1, tts: 'ஒன்று' },
      { char: '௨ (2)', ph: 'irandu', val: 2, tts: 'இரண்டு' }, { char: '௩ (3)', ph: 'moondru', val: 3, tts: 'மூன்று' },
      { char: '௪ (4)', ph: 'naangu', val: 4, tts: 'நான்கு' }, { char: '௫ (5)', ph: 'ainthu', val: 5, tts: 'ஐந்து' },
      { char: '௬ (6)', ph: 'aaru', val: 6, tts: 'ஆறு' }, { char: '௭ (7)', ph: 'yezhu', val: 7, tts: 'ஏழு' },
      { char: '௮ (8)', ph: 'ettu', val: 8, tts: 'எட்டு' }, { char: '௯ (9)', ph: 'onbadhu', val: 9, tts: 'ஒன்பது' },
      { char: '௰ (10)', ph: 'paththu', val: 10, tts: 'பத்து' },
    ]
  },
  Telugu: {
    vowels: [
      { char: 'అ', ph: 'a', ex: 'అమ్మ', exPh: 'amma', exEn: 'Mother', tts: 'అ, అమ్మ' },
      { char: 'ఆ', ph: 'aa', ex: 'ఆవు', exPh: 'aavu', exEn: 'Cow', tts: 'ఆ, ఆవు' },
      { char: 'ఇ', ph: 'i', ex: 'ఇల్లు', exPh: 'illu', exEn: 'House', tts: 'ఇ, ఇల్లు' },
      { char: 'ఈ', ph: 'ii', ex: 'ఈగ', exPh: 'eega', exEn: 'Fly', tts: 'ఈ, ఈగ' },
      { char: 'ఉ', ph: 'u', ex: 'ఉడత', exPh: 'udatha', exEn: 'Squirrel', tts: 'ఉ, ఉడత' },
      { char: 'ఊ', ph: 'uu', ex: 'ఊయల', exPh: 'ooyala', exEn: 'Swing', tts: 'ఊ, ఊయల' },
      { char: 'ఋ', ph: 'ṛu', ex: 'ఋషి', exPh: 'ṛuṣi', exEn: 'Sage', tts: 'ఋ, ఋషి' },
      { char: 'ౠ', ph: 'ṝu', tts: 'ౠ' },
      { char: 'ఎ', ph: 'e', ex: 'ఎలుక', exPh: 'eluka', exEn: 'Rat', tts: 'ఎ, ఎలుక' },
      { char: 'ఏ', ph: 'ee', ex: 'ఏనుగు', exPh: 'eenugu', exEn: 'Elephant', tts: 'ఏ, ఏనుగు' },
      { char: 'ఐ', ph: 'ai', ex: 'ఐదు', exPh: 'aidu', exEn: 'Five', tts: 'ఐ, ఐదు' },
      { char: 'ఒ', ph: 'o', ex: 'ఒంటె', exPh: 'onte', exEn: 'Camel', tts: 'ఒ, ఒంటె' },
      { char: 'ఓ', ph: 'oo', ex: 'ఓడ', exPh: 'ooda', exEn: 'Ship', tts: 'ఓ, ఓడ' },
      { char: 'ఔ', ph: 'au', ex: 'ఔషధం', exPh: 'aushadham', exEn: 'Medicine', tts: 'ఔ, ఔషధం' },
    ],
    consonants: [
      { char: 'క', ph: 'ka', ex: 'కమలం', exPh: 'kamalam', exEn: 'Lotus', tts: 'క, కమలం' },
      { char: 'ఖ', ph: 'kha', ex: 'ఖడ్గం', exPh: 'khadgam', exEn: 'Sword', tts: 'ఖ, ఖడ్గం' },
      { char: 'గ', ph: 'ga', ex: 'గడియారం', exPh: 'gadiyaram', exEn: 'Clock', tts: 'గ, గడియారం' },
      { char: 'ఘ', ph: 'gha', ex: 'ఘటం', exPh: 'ghatam', exEn: 'Pot', tts: 'ఘ, ఘటం' },
      { char: 'ఙ', ph: 'ṅa', tts: 'ఙ' },
      { char: 'చ', ph: 'cha', ex: 'చక్రం', exPh: 'chakram', exEn: 'Wheel', tts: 'చ, చక్రం' },
      { char: 'ఛ', ph: 'chha', ex: 'ఛత్రం', exPh: 'chhatram', exEn: 'Umbrella', tts: 'ఛ, ఛత్రం' },
      { char: 'జ', ph: 'ja', ex: 'జలం', exPh: 'jalam', exEn: 'Water', tts: 'జ, జలం' },
      { char: 'ఝ', ph: 'jha', ex: 'ఝషం', exPh: 'jhasham', exEn: 'Fish', tts: 'ఝ, ఝషం' },
      { char: 'ఞ', ph: 'ña', tts: 'ఞ' },
      { char: 'ట', ph: 'ṭa', ex: 'టమాటా', exPh: 'ṭamāṭā', exEn: 'Tomato', tts: 'ట, టమాటా' },
      { char: 'ఠ', ph: 'ṭha', ex: 'కంఠం', exPh: 'kaṇṭham', exEn: 'Throat', tts: 'ఠ, కంఠం' },
      { char: 'డ', ph: 'ḍa', ex: 'డబ్బు', exPh: 'ḍabbu', exEn: 'Money', tts: 'డ, డబ్బు' },
      { char: 'ఢ', ph: 'ḍha', ex: 'దృఢం', exPh: 'dṛḍham', exEn: 'Firm; strong', tts: 'ఢ, దృఢం' },
      { char: 'ణ', ph: 'ṇa', ex: 'గణితం', exPh: 'gaṇitam', exEn: 'Mathematics', tts: 'ణ, గణితం' },
      { char: 'త', ph: 'ta', ex: 'తల', exPh: 'tala', exEn: 'Head', tts: 'త, తల' },
      { char: 'థ', ph: 'tha', ex: 'రథం', exPh: 'ratham', exEn: 'Chariot', tts: 'థ, రథం' },
      { char: 'ద', ph: 'da', ex: 'దారి', exPh: 'dāri', exEn: 'Road', tts: 'ద, దారి' },
      { char: 'ధ', ph: 'dha', ex: 'ధనం', exPh: 'dhanam', exEn: 'Wealth', tts: 'ధ, ధనం' },
      { char: 'న', ph: 'na', ex: 'నది', exPh: 'nadi', exEn: 'River', tts: 'న, నది' },
      { char: 'ప', ph: 'pa', ex: 'పండు', exPh: 'paṇḍu', exEn: 'Fruit', tts: 'ప, పండు' },
      { char: 'ఫ', ph: 'pha', ex: 'ఫలం', exPh: 'phalam', exEn: 'Fruit', tts: 'ఫ, ఫలం' },
      { char: 'బ', ph: 'ba', ex: 'బడి', exPh: 'baḍi', exEn: 'School', tts: 'బ, బడి' },
      { char: 'భ', ph: 'bha', ex: 'భయం', exPh: 'bhayam', exEn: 'Fear', tts: 'భ, భయం' },
      { char: 'మ', ph: 'ma', ex: 'మామిడి', exPh: 'māmiḍi', exEn: 'Mango', tts: 'మ, మామిడి' },
      { char: 'య', ph: 'ya', ex: 'యంత్రం', exPh: 'yantram', exEn: 'Machine', tts: 'య, యంత్రం' },
      { char: 'ర', ph: 'ra', ex: 'రథం', exPh: 'ratham', exEn: 'Chariot', tts: 'ర, రథం' },
      { char: 'ల', ph: 'la', ex: 'లత', exPh: 'lata', exEn: 'Creeper', tts: 'ల, లత' },
      { char: 'వ', ph: 'va', ex: 'వనం', exPh: 'vanam', exEn: 'Forest', tts: 'వ, వనం' },
      { char: 'శ', ph: 'śa', ex: 'శశి', exPh: 'śaśi', exEn: 'Moon', tts: 'శ, శశి' },
      { char: 'ష', ph: 'ṣa', ex: 'షట్కోణం', exPh: 'ṣaṭkōṇam', exEn: 'Hexagon', tts: 'ష, షట్కోణం' },
      { char: 'స', ph: 'sa', ex: 'సమయం', exPh: 'samayam', exEn: 'Time', tts: 'స, సమయం' },
      { char: 'హ', ph: 'ha', ex: 'హంస', exPh: 'haṃsa', exEn: 'Swan', tts: 'హ, హంస' },
      { char: 'ళ', ph: 'ḷa', ex: 'కళ', exPh: 'kaḷa', exEn: 'Art', tts: 'ళ, కళ' },
      { char: 'క్ష', ph: 'kṣa', ex: 'క్షమ', exPh: 'kṣama', exEn: 'Forgiveness', tts: 'క్ష, క్షమ' },
      { char: 'ఱ', ph: 'ṟa', tts: 'ఱ' },
    ],
    specialCharacters: [
      { char: 'అం', ph: 'anusvāra (ṃ)', ex: 'అంశం', exPh: 'aṃśam', exEn: 'Part', tts: 'అం, అంశం', note: 'A nasal sign (yogavaha), conventionally shown after the vowels in many Telugu charts.' },
      { char: 'అః', ph: 'visarga (ḥ)', tts: 'అః', note: 'A post-vocalic breath sign (yogavaha), conventionally shown after the vowels in many Telugu charts.' },
    ],
    numbers: [
      { char: '౦ (0)', ph: 'sunna', val: 0, tts: 'సున్న' }, { char: '౧ (1)', ph: 'okati', val: 1, tts: 'ఒకటి' },
      { char: '౨ (2)', ph: 'rendu', val: 2, tts: 'రెండు' }, { char: '౩ (3)', ph: 'moodu', val: 3, tts: 'మూడు' },
      { char: '౪ (4)', ph: 'naalugu', val: 4, tts: 'నాలుగు' }, { char: '౫ (5)', ph: 'aidu', val: 5, tts: 'ఐదు' },
      { char: '౬ (6)', ph: 'aaru', val: 6, tts: 'ఆరు' }, { char: '౭ (7)', ph: 'edu', val: 7, tts: 'ఏడు' },
      { char: '౮ (8)', ph: 'enimidi', val: 8, tts: 'ఎనిమిది' }, { char: '౯ (9)', ph: 'tommidi', val: 9, tts: 'తొమ్మిది' },
      { char: '౧౦ (10)', ph: 'padi', val: 10, tts: 'పది' },
    ]
  },
  Malayalam: {
    vowels: [
      { char: 'അ', ph: 'a', ex: 'അമ്മ', exPh: 'amma', exEn: 'Mother', tts: 'അ, അമ്മ' },
      { char: 'ആ', ph: 'aa', ex: 'ആന', exPh: 'aana', exEn: 'Elephant', tts: 'ആ, ആന' },
      { char: 'ഇ', ph: 'i', ex: 'ഇല', exPh: 'ila', exEn: 'Leaf', tts: 'ഇ, ഇല' },
      { char: 'ഈ', ph: 'ii', ex: 'ഈച്ച', exPh: 'eecha', exEn: 'Fly', tts: 'ഈ, ഈച്ച' },
      { char: 'ഉ', ph: 'u', ex: 'ഉറുമ്പ്', exPh: 'urumbu', exEn: 'Ant', tts: 'ഉ, ഉറുമ്പ്' },
      { char: 'ഊ', ph: 'uu', ex: 'ഊഞ്ഞാൽ', exPh: 'oonjaal', exEn: 'Swing', tts: 'ഊ, ഊഞ്ഞാൽ' },
      { char: 'ഋ', ph: 'ṛu', ex: 'ഋഷി', exPh: 'ṛṣi', exEn: 'Sage', tts: 'ഋ, ഋഷി' },
      { char: 'എ', ph: 'e', ex: 'എലി', exPh: 'eli', exEn: 'Rat', tts: 'എ, എലി' },
      { char: 'ഏ', ph: 'ee', ex: 'ഏണി', exPh: 'eeni', exEn: 'Ladder', tts: 'ഏ, ഏണി' },
      { char: 'ഐ', ph: 'ai', ex: 'ഐസ്', exPh: 'ice', exEn: 'Ice', tts: 'ഐ, ഐസ്' },
      { char: 'ഒ', ph: 'o', ex: 'ഒട്ടകം', exPh: 'ottakam', exEn: 'Camel', tts: 'ഒ, ഒട്ടകം' },
      { char: 'ഓ', ph: 'oo', ex: 'ഓടം', exPh: 'oodam', exEn: 'Boat', tts: 'ഓ, ഓടം' },
      { char: 'ഔ', ph: 'au', ex: 'ഔഷധം', exPh: 'aushadham', exEn: 'Medicine', tts: 'ഔ, ഔഷധം' },
    ],
    consonants: [
      { char: 'ക', ph: 'ka', ex: 'കപ്പൽ', exPh: 'kappal', exEn: 'Ship', tts: 'ക, കപ്പൽ' },
      { char: 'ഖ', ph: 'kha', ex: 'ഖഡ്ഗം', exPh: 'khadgam', exEn: 'Sword', tts: 'ഖ, ഖഡ്ഗം' },
      { char: 'ഗ', ph: 'ga', ex: 'ഗരുഡൻ', exPh: 'garudan', exEn: 'Eagle', tts: 'ഗ, ഗരുഡൻ' },
      { char: 'ഘ', ph: 'gha', ex: 'ഘടികാരം', exPh: 'ghatikaram', exEn: 'Clock', tts: 'ഘ, ഘടികാരം' },
      { char: 'ങ', ph: 'nga', ex: 'മാങ്ങ', exPh: 'maanga', exEn: 'Mango', tts: 'ങ, മാങ്ങ' },
      { char: 'ച', ph: 'cha', ex: 'ചക്രം', exPh: 'chakram', exEn: 'Wheel', tts: 'ച, ചക്രം' },
      { char: 'ഛ', ph: 'chha', ex: 'ഛത്രം', exPh: 'chhatram', exEn: 'Umbrella', tts: 'ഛ, ഛത്രം' },
      { char: 'ജ', ph: 'ja', ex: 'ജലം', exPh: 'jalam', exEn: 'Water', tts: 'ജ, ജലം' },
      { char: 'ഝ', ph: 'jha', ex: 'ഝഷം', exPh: 'jhasham', exEn: 'Fish', tts: 'ഝ, ഝഷം' },
      { char: 'ഞ', ph: 'nya', ex: 'ഞണ്ട്', exPh: 'njandu', exEn: 'Crab', tts: 'ഞ, ഞണ്ട്' },
      { char: 'ട', ph: 'ṭa', ex: 'ടിക്കറ്റ്', exPh: 'ṭikkaṟṟŭ', exEn: 'Ticket', tts: 'ട, ടിക്കറ്റ്' },
      { char: 'ഠ', ph: 'ṭha', ex: 'കണ്ഠം', exPh: 'kaṇṭham', exEn: 'Throat', tts: 'ഠ, കണ്ഠം' },
      { char: 'ഡ', ph: 'ḍa', ex: 'ഡബ്ബ', exPh: 'ḍabba', exEn: 'Box', tts: 'ഡ, ഡബ്ബ' },
      { char: 'ഢ', ph: 'ḍha', ex: 'ദൃഢം', exPh: 'dṛḍhaṃ', exEn: 'Firm; strong', tts: 'ഢ, ദൃഢം' },
      { char: 'ണ', ph: 'ṇa', ex: 'പണം', exPh: 'paṇaṃ', exEn: 'Money', tts: 'ണ, പണം' },
      { char: 'ത', ph: 'ta', ex: 'തല', exPh: 'tala', exEn: 'Head', tts: 'ത, തല' },
      { char: 'ഥ', ph: 'tha', ex: 'രഥം', exPh: 'rathaṃ', exEn: 'Chariot', tts: 'ഥ, രഥം' },
      { char: 'ദ', ph: 'da', ex: 'ദിവസം', exPh: 'divasaṃ', exEn: 'Day', tts: 'ദ, ദിവസം' },
      { char: 'ധ', ph: 'dha', ex: 'ധനം', exPh: 'dhanaṃ', exEn: 'Wealth', tts: 'ധ, ധനം' },
      { char: 'ന', ph: 'na', ex: 'നദി', exPh: 'nadi', exEn: 'River', tts: 'ന, നദി' },
      { char: 'പ', ph: 'pa', ex: 'പഴം', exPh: 'paḻaṃ', exEn: 'Fruit', tts: 'പ, പഴം' },
      { char: 'ഫ', ph: 'pha', ex: 'ഫലം', exPh: 'phalaṃ', exEn: 'Fruit', tts: 'ഫ, ഫലം' },
      { char: 'ബ', ph: 'ba', ex: 'ബലൂൺ', exPh: 'balūṇ', exEn: 'Balloon', tts: 'ബ, ബലൂൺ' },
      { char: 'ഭ', ph: 'bha', ex: 'ഭയം', exPh: 'bhayaṃ', exEn: 'Fear', tts: 'ഭ, ഭയം' },
      { char: 'മ', ph: 'ma', ex: 'മരം', exPh: 'maraṃ', exEn: 'Tree', tts: 'മ, മരം' },
      { char: 'യ', ph: 'ya', ex: 'യാത്ര', exPh: 'yātra', exEn: 'Journey', tts: 'യ, യാത്ര' },
      { char: 'ര', ph: 'ra', ex: 'രഥം', exPh: 'rathaṃ', exEn: 'Chariot', tts: 'ര, രഥം' },
      { char: 'ല', ph: 'la', ex: 'ലത', exPh: 'lata', exEn: 'Creeper', tts: 'ല, ലത' },
      { char: 'വ', ph: 'va', ex: 'വനം', exPh: 'vanaṃ', exEn: 'Forest', tts: 'വ, വനം' },
      { char: 'ശ', ph: 'śa', ex: 'ശശി', exPh: 'śaśi', exEn: 'Moon', tts: 'ശ, ശശി' },
      { char: 'ഷ', ph: 'ṣa', ex: 'ഷർട്ട്', exPh: 'ṣaṟṟŭ', exEn: 'Shirt', tts: 'ഷ, ഷർട്ട്' },
      { char: 'സ', ph: 'sa', ex: 'സമയം', exPh: 'samayaṃ', exEn: 'Time', tts: 'സ, സമയം' },
      { char: 'ഹ', ph: 'ha', ex: 'ഹംസം', exPh: 'haṃsaṃ', exEn: 'Swan', tts: 'ഹ, ഹംസം' },
      { char: 'ള', ph: 'ḷa', ex: 'പള്ളി', exPh: 'paḷḷi', exEn: 'Church', tts: 'ള, പള്ളി' },
      { char: 'ഴ', ph: 'ḻa', ex: 'മലയാളം', exPh: 'malayāḷaṃ', exEn: 'Malayalam', tts: 'ഴ, മലയാളം' },
      { char: 'റ', ph: 'ṟa', ex: 'കാറ്റ്', exPh: 'kāṟṟŭ', exEn: 'Wind', tts: 'റ, കാറ്റ്' },
    ],
    specialCharacters: [
      { char: 'അം', ph: 'anusvāra (ṃ)', tts: 'അം', note: 'A nasal sign (anusvāra), treated separately from independent vowels and consonants.' },
      { char: 'അഃ', ph: 'visarga (ḥ)', tts: 'അഃ', note: 'A post-vocalic breath sign (visarga), treated separately from independent vowels and consonants.' },
    ],
    numbers: [
      { char: '൦ (0)', ph: 'poojyam', val: 0, tts: 'പൂജ്യം' }, { char: '൧ (1)', ph: 'onnu', val: 1, tts: 'ഒന്ന്' },
      { char: '൨ (2)', ph: 'randu', val: 2, tts: 'രണ്ട്' }, { char: '൩ (3)', ph: 'moonnu', val: 3, tts: 'മൂന്ന്' },
      { char: '൪ (4)', ph: 'naalu', val: 4, tts: 'നാല്' }, { char: '൫ (5)', ph: 'anchu', val: 5, tts: 'അഞ്ച്' },
      { char: '൬ (6)', ph: 'aaru', val: 6, tts: 'ആറ്' }, { char: '൭ (7)', ph: 'ezhu', val: 7, tts: 'ഏഴ്' },
      { char: '൮ (8)', ph: 'ettu', val: 8, tts: 'എട്ട്' }, { char: '൯ (9)', ph: 'ompathu', val: 9, tts: 'ഒൻപത്' },
      { char: '൧൦ (10)', ph: 'paththu', val: 10, tts: 'പത്ത്' },
    ],
  },
  Tulu: {
    vowels: [
      { char: String.fromCodePoint(0x11380), ph: 'a', tts: 'ಅ' },
      { char: String.fromCodePoint(0x11381), ph: 'ā', tts: 'ಆ' },
      { char: String.fromCodePoint(0x11382), ph: 'i', tts: 'ಇ' },
      { char: String.fromCodePoint(0x11383), ph: 'ī', tts: 'ಈ' },
      { char: String.fromCodePoint(0x11384), ph: 'u', tts: 'ಉ' },
      { char: String.fromCodePoint(0x11385), ph: 'ū', tts: 'ಊ' },
      { char: String.fromCodePoint(0x11386), ph: 'ṛ', tts: 'ಋ', note: 'Sanskrit-derived vocalic R letter retained from the Unicode script inventory; distinguished from ordinary beginner Tulu vowels.' },
      { char: String.fromCodePoint(0x11387), ph: 'ṝ', tts: String.fromCodePoint(0x11387), note: 'Rare Sanskrit-derived vocalic RR letter in the Unicode script inventory; not asserted as a productive Tulu vowel.' },
      { char: String.fromCodePoint(0x11388), ph: 'ḷ', tts: String.fromCodePoint(0x11388), note: 'Rare Sanskrit-derived vocalic L letter in the Unicode script inventory; not asserted as a productive Tulu vowel.' },
      { char: String.fromCodePoint(0x11389), ph: 'ḹ', tts: String.fromCodePoint(0x11389), note: 'Rare Sanskrit-derived vocalic LL letter in the Unicode script inventory; not asserted as a productive Tulu vowel.' },
      { id: 'tulu-vowel-e', char: null, ph: 'e', tts: 'ಎ' , nativeGlyphUnavailable: true, note: 'Short e has no assigned independent Tulu-Tigalari code point in Unicode 18; no Kannada glyph is substituted.' },
      { char: String.fromCodePoint(0x1138B), ph: 'ē', tts: 'ಏ' },
      { char: String.fromCodePoint(0x1138E), ph: 'ai', tts: 'ಐ' },
      { id: 'tulu-vowel-o', char: null, ph: 'o', tts: 'ಒ' , nativeGlyphUnavailable: true, note: 'Short o has no assigned independent Tulu-Tigalari code point in Unicode 18; no Kannada glyph is substituted.' },
      { char: String.fromCodePoint(0x11390), ph: 'ō', tts: 'ಓ' },
      { char: String.fromCodePoint(0x11391), ph: 'au', tts: 'ಔ' },
      { id: 'tulu-vowel-unrounded-u', char: null, ph: 'ụ', tts: 'ಅ್', nativeGlyphUnavailable: true, note: 'The Tulu Lexicon describes this short unrounded vowel with Kannada vowel-plus-virama notation; no standardized Tulu-Tigalari independent glyph is available.' },
      { id: 'tulu-vowel-unrounded-uu', char: null, ph: 'ụ̄', tts: 'ಆ್', nativeGlyphUnavailable: true, note: 'The Tulu Lexicon describes this long unrounded vowel with Kannada vowel-plus-virama notation; no standardized Tulu-Tigalari independent glyph is available.' },
      { id: 'tulu-vowel-open-e', char: null, ph: 'ɛ', tts: 'ಎ್', nativeGlyphUnavailable: true, note: 'The Tulu Lexicon uses ಎ + virama to describe this short open-mid vowel, but Unicode 18 assigns no independent Tulu-Tigalari glyph.' },
      { id: 'tulu-vowel-open-ee', char: null, ph: 'ɛ̄', tts: 'ಏ್', nativeGlyphUnavailable: true, note: 'The Tulu Lexicon uses ಏ + virama to describe this long open-mid vowel, but Unicode 18 assigns no independent Tulu-Tigalari glyph.' },
    ],
    consonants: [
      { char: String.fromCodePoint(0x11392), ph: 'ka', tts: 'ಕ' }, { char: String.fromCodePoint(0x11393), ph: 'kha', tts: 'ಖ' },
      { char: String.fromCodePoint(0x11394), ph: 'ga', tts: 'ಗ' }, { char: String.fromCodePoint(0x11395), ph: 'gha', tts: 'ಘ' },
      { char: String.fromCodePoint(0x11396), ph: 'ṅa', tts: 'ಙ' }, { char: String.fromCodePoint(0x11397), ph: 'ca', tts: 'ಚ' },
      { char: String.fromCodePoint(0x11398), ph: 'cha', tts: 'ಛ' }, { char: String.fromCodePoint(0x11399), ph: 'ja', tts: 'ಜ' },
      { char: String.fromCodePoint(0x1139A), ph: 'jha', tts: 'ಝ' }, { char: String.fromCodePoint(0x1139B), ph: 'ña', tts: 'ಞ' },
      { char: String.fromCodePoint(0x1139C), ph: 'ṭa', tts: 'ಟ' }, { char: String.fromCodePoint(0x1139D), ph: 'ṭha', tts: 'ಠ' },
      { char: String.fromCodePoint(0x1139E), ph: 'ḍa', tts: 'ಡ' }, { char: String.fromCodePoint(0x1139F), ph: 'ḍha', tts: 'ಢ' },
      { char: String.fromCodePoint(0x113A0), ph: 'ṇa', tts: 'ಣ' }, { char: String.fromCodePoint(0x113A1), ph: 'ta', tts: 'ತ' },
      { char: String.fromCodePoint(0x113A2), ph: 'tha', tts: 'ಥ' }, { char: String.fromCodePoint(0x113A3), ph: 'da', tts: 'ದ' },
      { char: String.fromCodePoint(0x113A4), ph: 'dha', tts: 'ಧ' }, { char: String.fromCodePoint(0x113A5), ph: 'na', tts: 'ನ' },
      { char: String.fromCodePoint(0x113A6), ph: 'pa', tts: 'ಪ' }, { char: String.fromCodePoint(0x113A7), ph: 'pha', tts: 'ಫ' },
      { char: String.fromCodePoint(0x113A8), ph: 'ba', tts: 'ಬ' }, { char: String.fromCodePoint(0x113A9), ph: 'bha', tts: 'ಭ' },
      { char: String.fromCodePoint(0x113AA), ph: 'ma', tts: 'ಮ' }, { char: String.fromCodePoint(0x113AB), ph: 'ya', tts: 'ಯ' },
      { char: String.fromCodePoint(0x113AC), ph: 'ra', tts: 'ರ' }, { char: String.fromCodePoint(0x113AD), ph: 'la', tts: 'ಲ' },
      { char: String.fromCodePoint(0x113AE), ph: 'va', tts: 'ವ' }, { char: String.fromCodePoint(0x113AF), ph: 'śa', tts: 'ಶ' },
      { char: String.fromCodePoint(0x113B0), ph: 'ṣa', tts: 'ಷ' }, { char: String.fromCodePoint(0x113B1), ph: 'sa', tts: 'ಸ' },
      { char: String.fromCodePoint(0x113B2), ph: 'ha', tts: 'ಹ' }, { char: String.fromCodePoint(0x113B3), ph: 'ḷa', tts: 'ಳ' },
      { char: String.fromCodePoint(0x113B4), ph: 'ṟa', tts: 'ಱ', note: 'Unicode names this rare Dravidian consonant LETTER RRA; the Kannada-script pronunciation field preserves the Tulu-specific distinction from ರ.' },
      { char: String.fromCodePoint(0x113B5), ph: 'ḻa', tts: 'ೞ', note: 'Unicode names this rare Dravidian consonant LETTER LLLA; the Kannada-script pronunciation field preserves the Tulu-specific distinction from ಳ.' },
    ],
    specialCharacters: [
      { char: String.fromCodePoint(0x11380, 0x113CC), ph: 'anusvāra (ṃ)', tts: 'ಅಂ', note: 'Tulu yogavaha nasal sign, classified separately from vowels and consonants.' },
      { char: String.fromCodePoint(0x11380, 0x113CD), ph: 'visarga (ḥ)', tts: 'ಅಃ', note: 'Tulu yogavaha post-vocalic breath sign, classified separately from vowels and consonants.' },
    ],
    numbers: [
      { id: 'tulu-number-0', char: null, ph: 'sonye', val: 0, tts: 'sonye', nativeGlyphUnavailable: true, note: 'No verified Tulu zero numeral glyph is available in the local source assets.' },
      { id: 'tulu-number-1', char: null, displayChar: '\uF100', ph: 'onji', val: 1, tts: 'onji' },
      { id: 'tulu-number-2', char: null, displayChar: '\uF101', ph: 'raDD', val: 2, tts: 'raDD' },
      { id: 'tulu-number-3', char: null, displayChar: '\uF102', ph: 'mUji', val: 3, tts: 'mUji' },
      { id: 'tulu-number-4', char: null, displayChar: '\uF103', ph: 'nAl', val: 4, tts: 'nAl' },
      { id: 'tulu-number-5', char: null, displayChar: '\uF104', ph: 'ain', val: 5, tts: 'ain' },
      { id: 'tulu-number-6', char: null, displayChar: '\uF105', ph: 'Aji', val: 6, tts: 'Aji' },
      { id: 'tulu-number-7', char: null, displayChar: '\uF106', ph: 'El', val: 7, tts: 'El' },
      { id: 'tulu-number-8', char: null, displayChar: '\uF107', ph: 'enma', val: 8, tts: 'enma' },
      { id: 'tulu-number-9', char: null, displayChar: '\uF108', ph: 'orumba', val: 9, tts: 'orumba' },
      { id: 'tulu-number-10', char: null, displayChar: '\uF109', ph: 'patt', val: 10, tts: 'patt' },
    ],
  },
  Kodava: {
    vowels: [
      { char: 'ಅ', displayChar: '\uE000', ph: 'a', tts: 'ಅ', glyphAsset: '/glyphs/kodava/vowel-a.svg' }, { char: 'ಆ', displayChar: '\uE001', ph: 'ā', tts: 'ಆ', glyphAsset: '/glyphs/kodava/vowel-aa.svg' },
      { char: 'ಇ', displayChar: '\uE002', ph: 'i', tts: 'ಇ', glyphAsset: '/glyphs/kodava/vowel-i.svg' }, { char: 'ಈ', displayChar: '\uE003', ph: 'ī', tts: 'ಈ', glyphAsset: '/glyphs/kodava/vowel-ii.svg' },
      { char: 'ಉ', displayChar: '\uE004', ph: 'u', tts: 'ಉ', glyphAsset: '/glyphs/kodava/vowel-u.svg' }, { char: 'ಊ', displayChar: '\uE005', ph: 'ū', tts: 'ಊ', glyphAsset: '/glyphs/kodava/vowel-uu.svg' },
      { char: 'ಎ', displayChar: '\uE006', ph: 'e', tts: 'ಎ', glyphAsset: '/glyphs/kodava/vowel-e.svg' },
      { char: 'ಏ', displayChar: '\uE007', ph: 'ē', tts: 'ಏ', glyphAsset: '/glyphs/kodava/vowel-ee.svg' }, { char: 'ಐ', displayChar: '\uE008', ph: 'ai', tts: 'ಐ', glyphAsset: '/glyphs/kodava/vowel-ai.svg' },
      { char: 'ಒ', displayChar: '\uE009', ph: 'o', tts: 'ಒ', glyphAsset: '/glyphs/kodava/vowel-o.svg' }, { char: 'ಓ', displayChar: '\uE00A', ph: 'ō', tts: 'ಓ', glyphAsset: '/glyphs/kodava/vowel-oo.svg' },
    ],
    consonants: [
      { char: 'ಕ', displayChar: '\uE00B', ph: 'ka', tts: 'ಕ', glyphAsset: '/glyphs/kodava/consonant-ka.svg' }, { char: 'ಗ', displayChar: '\uE00C', ph: 'ga', tts: 'ಗ', glyphAsset: '/glyphs/kodava/consonant-ga.svg' },
      { char: 'ಙ', displayChar: '\uE00D', ph: 'ṅa', tts: 'ಙ', glyphAsset: '/glyphs/kodava/consonant-nga.svg' }, { char: 'ಚ', displayChar: '\uE00E', ph: 'ca', tts: 'ಚ', glyphAsset: '/glyphs/kodava/consonant-ca.svg' },
      { char: 'ಜ', displayChar: '\uE00F', ph: 'ja', tts: 'ಜ', glyphAsset: '/glyphs/kodava/consonant-ja.svg' }, { char: 'ಞ', displayChar: '\uE010', ph: 'ña', tts: 'ಞ', glyphAsset: '/glyphs/kodava/consonant-nya.svg' },
      { char: 'ಟ', displayChar: '\uE011', ph: 'ṭa', tts: 'ಟ', glyphAsset: '/glyphs/kodava/consonant-tta.svg' }, { char: 'ಡ', displayChar: '\uE012', ph: 'ḍa', tts: 'ಡ', glyphAsset: '/glyphs/kodava/consonant-dda.svg' },
      { char: 'ಣ', displayChar: '\uE013', ph: 'ṇa', tts: 'ಣ', glyphAsset: '/glyphs/kodava/consonant-nna.svg' }, { char: 'ತ', displayChar: '\uE014', ph: 'ta', tts: 'ತ', glyphAsset: '/glyphs/kodava/consonant-ta.svg' },
      { char: 'ದ', displayChar: '\uE015', ph: 'da', tts: 'ದ', glyphAsset: '/glyphs/kodava/consonant-da.svg' }, { char: 'ನ', displayChar: '\uE016', ph: 'na', tts: 'ನ', glyphAsset: '/glyphs/kodava/consonant-na.svg' },
      { char: 'ಪ', displayChar: '\uE017', ph: 'pa', tts: 'ಪ', glyphAsset: '/glyphs/kodava/consonant-pa.svg' }, { char: 'ಬ', displayChar: '\uE018', ph: 'ba', tts: 'ಬ', glyphAsset: '/glyphs/kodava/consonant-ba.svg' },
      { char: 'ಮ', displayChar: '\uE019', ph: 'ma', tts: 'ಮ', glyphAsset: '/glyphs/kodava/consonant-ma.svg' }, { char: 'ಯ', displayChar: '\uE01A', ph: 'ya', tts: 'ಯ', glyphAsset: '/glyphs/kodava/consonant-ya.svg' },
      { char: 'ರ', displayChar: '\uE01B', ph: 'ra', tts: 'ರ', glyphAsset: '/glyphs/kodava/consonant-ra.svg' }, { char: 'ಲ', displayChar: '\uE01C', ph: 'la', tts: 'ಲ', glyphAsset: '/glyphs/kodava/consonant-la.svg' },
      { char: 'ವ', displayChar: '\uE01D', ph: 'va', tts: 'ವ', glyphAsset: '/glyphs/kodava/consonant-va.svg' }, { char: 'ಶ', displayChar: '\uE01E', ph: 'śa', tts: 'ಶ', glyphAsset: '/glyphs/kodava/consonant-sha.svg' },
      { char: 'ಷ', displayChar: '\uE01F', ph: 'ṣa', tts: 'ಷ', glyphAsset: '/glyphs/kodava/consonant-ssa.svg' }, { char: 'ಸ', displayChar: '\uE020', ph: 'sa', tts: 'ಸ', glyphAsset: '/glyphs/kodava/consonant-sa.svg' },
      { char: 'ಹ', displayChar: '\uE021', ph: 'ha', tts: 'ಹ', glyphAsset: '/glyphs/kodava/consonant-ha.svg' }, { char: 'ಳ', displayChar: '\uE022', ph: 'ḷa', tts: 'ಳ', glyphAsset: '/glyphs/kodava/consonant-lla.svg' },
    ],
    specialCharacters: [
      { char: 'ಅಂ', displayChar: '\uE023', ph: 'anusvāra (ṃ)', tts: 'ಅಂ', note: 'The selected Kodava Lipi chart labels this sign as “aṃ”; the semantic character remains in Kannada orthography.', glyphAsset: '/glyphs/kodava/special-anusvara.svg' },
      { char: 'ಅಃ', displayChar: '\uE024', ph: 'visarga (ḥ)', tts: 'ಅಃ', note: 'The selected Kodava Lipi chart labels this sign as “aḥ”; the semantic character remains in Kannada orthography.', glyphAsset: '/glyphs/kodava/special-visarga.svg' },
    ],
    numbers: [
      { id: 'kodava-number-1', char: null, ph: 'ondh', val: 1, tts: 'ondh', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-2', char: null, ph: 'dhand', val: 2, tts: 'dhand', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-3', char: null, ph: 'moondh', val: 3, tts: 'moondh', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-4', char: null, ph: 'naal', val: 4, tts: 'naal', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-5', char: null, ph: 'anji', val: 5, tts: 'anji', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-6', char: null, ph: 'aar', val: 6, tts: 'aar', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-7', char: null, ph: 'eel', val: 7, tts: 'eel', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-8', char: null, ph: 'ett', val: 8, tts: 'ett', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-9', char: null, ph: 'woyimbadh', val: 9, tts: 'woyimbadh', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
      { id: 'kodava-number-10', char: null, ph: 'patth', val: 10, tts: 'patth', nativeGlyphUnavailable: true, note: 'No verified native Kodava numeral glyph is available; the number and pronunciation are retained.' },
    ],
  }
};
