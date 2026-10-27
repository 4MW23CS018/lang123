from difflib import SequenceMatcher
import re
import unicodedata
from google import genai
from dotenv import load_dotenv

load_dotenv()

try:
    from indic_transliteration import sanscript
    from indic_transliteration.sanscript import transliterate
    HAS_INDIC_TRANS = True
except Exception:
    HAS_INDIC_TRANS = False

try:
    client = genai.Client()
except Exception:
    client = None

# Script mapping for indic-transliteration
SCRIPT_MAP = {
    "kannada": getattr(sanscript, "KANNADA", "kannada") if HAS_INDIC_TRANS else None,
    "tamil": getattr(sanscript, "TAMIL", "tamil") if HAS_INDIC_TRANS else None,
    "telugu": getattr(sanscript, "TELUGU", "telugu") if HAS_INDIC_TRANS else None,
    "malayalam": getattr(sanscript, "MALAYALAM", "malayalam") if HAS_INDIC_TRANS else None,
    "tulu": getattr(sanscript, "KANNADA", "kannada") if HAS_INDIC_TRANS else None,
    "kodava": getattr(sanscript, "KANNADA", "kannada") if HAS_INDIC_TRANS else None,
}

# Fallback phonetic maps for Indic digits & characters
CHAR_PHONETIC_MAP = {
    '೦': 'sonne', '೧': 'ondu', '೨': 'eradu', '೩': 'mooru', '೪': 'naalku',
    '೫': 'aidu', '೬': 'aaru', '೭': 'elu', '೮': 'entu', '೯': 'ombhattu',
    '௦': 'sonna', '௧': 'ondru', '௨': 'irandu', '௩': 'moondru', '௪': 'naangu',
    '௫': 'ainthu', '௬': 'aaru', '௭': 'ezhu', '௮': 'ettu', '௯': 'onbadhu',
}

def to_latin(text, language="kannada"):
    if not text:
        return ""
    text = re.sub(r"\([^)]*\)", "", text).strip()
    
    # Check fallback map first for character/number matches
    for k, v in CHAR_PHONETIC_MAP.items():
        text = text.replace(k, v)

    if HAS_INDIC_TRANS:
        script = SCRIPT_MAP.get((language or "kannada").lower())
        if script:
            try:
                res = transliterate(text, script, sanscript.ITRANS)
                return res.lower().strip()
            except Exception:
                pass
    return text.lower().strip()

def clean(text):
    if not text:
        return ""
    # Strip parenthetical annotations e.g. "೦ (0)" -> "೦"
    text = re.sub(r"\([^)]*\)", "", text)
    # Strip punctuation and symbol characters, while preserving all Indic characters (including combining marks/viramas) and alphanumeric
    cleaned = ''.join(c for c in text if not unicodedata.category(c).startswith('P') and not unicodedata.category(c).startswith('S'))
    return re.sub(r"\s+", " ", cleaned).strip().lower()

def similar(a, b, language="kannada"):
    if not a or not b:
        return 0.0
    
    a_clean, b_clean = clean(a), clean(b)
    if not a_clean or not b_clean:
        return 0.0

    # 1. Direct clean similarity
    sim_direct = SequenceMatcher(None, a_clean, b_clean).ratio()
    if sim_direct > 0.85:
        return sim_direct

    # 2. Transliterated Latin similarity (normalizing w/v)
    a_lat = clean(to_latin(a, language)).replace('w', 'v')
    b_lat = clean(to_latin(b, language)).replace('w', 'v')
    sim_lat = SequenceMatcher(None, a_lat, b_lat).ratio()

    # 3. Cross-mix
    sim_cross1 = SequenceMatcher(None, a_clean, b_lat).ratio()
    sim_cross2 = SequenceMatcher(None, a_lat, b_clean).ratio()

    return max(sim_direct, sim_lat, sim_cross1, sim_cross2)

def detect_partial_word(expected_word, spoken_word, language="kannada"):
    """
    Detects if spoken_word is a partial utterance of expected_word
    (e.g. 'dhanya' spoken for 'dhanyawadagalu').
    Returns dict with details or None.
    """
    if not expected_word or not spoken_word:
        return None

    exp_clean = clean(expected_word)
    spk_clean = clean(spoken_word)

    if not exp_clean or not spk_clean:
        return None

    # Exact match check
    if exp_clean == spk_clean:
        return None

    exp_lat = clean(to_latin(expected_word, language)).replace('w', 'v')
    spk_lat = clean(to_latin(spoken_word, language)).replace('w', 'v')

    if exp_lat == spk_lat:
        return None

    # Check substring / prefix / suffix via SequenceMatcher
    sm = SequenceMatcher(None, exp_lat, spk_lat)
    match = sm.find_longest_match(0, len(exp_lat), 0, len(spk_lat))

    # Minimum match size of 3 chars, covering at least 55% of what was spoken
    if match.size >= 3 and (match.size / max(len(spk_lat), 1) >= 0.55):
        before_missed = exp_lat[:match.a]
        after_missed = exp_lat[match.a + match.size:]

        if before_missed or after_missed:
            score = round((match.size / max(len(exp_lat), 1)) * 100)

            # Build human-friendly description of what was missed
            if after_missed and not before_missed:
                if after_missed == 'galu':
                    missing_desc = "galu"
                elif 'galu' in after_missed:
                    missing_desc = f"{after_missed} (missed 'galu')"
                else:
                    missing_desc = after_missed
                note = f"You only told '{spoken_word}' and didnt say '{missing_desc}'."
                primary_missing = after_missed
            elif before_missed and not after_missed:
                note = f"You only told '{spoken_word}' and missed the beginning '{before_missed}'."
                primary_missing = before_missed
            else:
                missing_combo = f"{before_missed}...{after_missed}".strip('.')
                note = f"You told '{spoken_word}', but missed '{missing_combo}'."
                primary_missing = after_missed or before_missed

            return {
                'spoken_part': spoken_word,
                'matched_part': exp_lat[match.a : match.a + match.size],
                'missing_part': primary_missing,
                'before_missed': before_missed,
                'after_missed': after_missed,
                'score': score,
                'note': note
            }

    return None

def build_deterministic_tip(expected, transcription, word_breakdown, language="kannada"):
    """
    Constructs an explicit, intelligent diagnostic tip directly from
    the Faster-Whisper transcribed words vs expected phrase.
    """
    if not transcription or not transcription.strip():
        return "We did not hear any speech. Please speak closer to your microphone."

    mistakes = [w for w in word_breakdown if w.get('status') != 'correct']
    if not mistakes:
        return f"Great job! You pronounced '{expected}' clearly."

    # 1. Check for specific partial-word notes (e.g. 'dhanya' for 'dhanyawadagalu')
    partial_notes = [w['note'] for w in word_breakdown if w.get('status') == 'partial' and w.get('note')]
    if partial_notes:
        return " ".join(partial_notes)

    # 2. Check for missing words in multi-word phrase
    spoken_words = [w['word'] for w in word_breakdown if w.get('status') == 'correct']
    missing_words = [w['word'] for w in word_breakdown if w.get('status') == 'missing']
    mispronounced = [w for w in word_breakdown if w.get('status') == 'mispronounced']

    if spoken_words and missing_words:
        spoken_str = " ".join(spoken_words)
        missing_str = " ".join(missing_words)
        return f"You only told '{spoken_str}' and didnt say '{missing_str}'."

    if mispronounced:
        first_mis = mispronounced[0]
        heard = first_mis.get('spoken_as') or transcription
        return f"You said '{heard}' instead of '{first_mis['word']}'."

    if missing_words:
        return f"You missed saying '{' '.join(missing_words)}'."

    return f"Keep practicing! Aim to pronounce each syllable of '{expected}'."

def get_ai_tip(expected, transcription, word_breakdown, language, deterministic_tip=None):
    """
    AI tip generator using Gemini (gemini-3.5-flash-lite / gemini-3.8-flash).
    Falls back directly to the deterministic tip if Gemini is unavailable,
    rate-limited, or errors out.
    """
    fallback_tip = deterministic_tip or build_deterministic_tip(expected, transcription, word_breakdown, language)

    if not client:
        return fallback_tip

    mistakes = [w for w in word_breakdown if w.get('status') != 'correct']
    if not mistakes:
        return fallback_tip

    mistakes_str = ", ".join([
        f"Expected '{w['word']}' but heard '{w.get('spoken_as', 'nothing')}'" +
        (f" (partial: {w['note']})" if w.get('note') else "")
        for w in mistakes
    ])

    prompt = f"""You are a warm, supportive {language} tutor.
The student tried to say: '{expected}'.
What the speech recognition heard: '{transcription}'.
Diagnostic findings: {deterministic_tip}
Mistakes: {mistakes_str}

Give a 1-sentence tip encouraging them and explaining clearly what they said vs what was missed (e.g. if they only said part of the word/phrase). Be direct, concise, and friendly."""

    for model_name in ['gemini-3.5-flash-lite', 'gemini-3.8-flash']:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text and response.text.strip():
                return response.text.strip()
        except Exception as e:
            safe_e = str(e).encode('ascii', 'backslashreplace').decode('ascii')
            print(f"[AI TIP NOTICE] Model {model_name} failed: {safe_e}")

    return fallback_tip

def _calculate_score(transcription, expected, expected_phonetics="", language="kannada"):
    trans_clean = clean(transcription)
    exp_clean = clean(expected)

    if not trans_clean or not exp_clean:
        words = expected.split()
        return 0, [{
            "word": w,
            "spoken_as": None,
            "score": 0,
            "status": "missing",
            "spoken_part": None,
            "missing_part": w,
            "note": f"Did not hear '{w}'"
        } for w in words]

    trans_words = trans_clean.split()
    raw_trans_words = transcription.split()
    expected_words = expected.split()

    # Sentence-level similarity
    sentence_sim = similar(exp_clean, trans_clean, language)

    # Word-level partial credit
    word_score = 0.0
    word_breakdown = []

    for idx, exp_word in enumerate(expected_words):
        if trans_words:
            # Best matching word in transcription
            best_idx = max(range(len(trans_words)), key=lambda i: similar(exp_word, trans_words[i], language))
            best_clean_match = trans_words[best_idx]
            best_raw_match = raw_trans_words[best_idx] if best_idx < len(raw_trans_words) else best_clean_match
            best_score = similar(exp_word, best_clean_match, language)
        else:
            best_raw_match = None
            best_score = 0.0

        # Check for partial word match (e.g. 'dhanya' spoken for 'dhanyawadagalu')
        partial_info = detect_partial_word(exp_word, best_raw_match or transcription, language) if best_raw_match else None

        score_percent = round(best_score * 100)

        if score_percent >= 80:
            status = "correct"
            note = None
            spoken_part = exp_word
            missing_part = None
        elif partial_info:
            status = "partial"
            score_percent = max(score_percent, partial_info['score'])
            note = partial_info['note']
            spoken_part = partial_info['spoken_part']
            missing_part = partial_info['missing_part']
        elif score_percent >= 40:
            status = "mispronounced"
            note = f"Heard '{best_raw_match}' instead of '{exp_word}'"
            spoken_part = best_raw_match
            missing_part = exp_word
        else:
            status = "missing"
            note = f"Didnt say '{exp_word}'"
            spoken_part = None
            missing_part = exp_word

        word_score += (score_percent / 100.0)

        word_breakdown.append({
            "word": exp_word,
            "spoken_as": best_raw_match if status != "missing" else None,
            "spoken_part": spoken_part,
            "missing_part": missing_part,
            "score": score_percent,
            "status": status,
            "note": note
        })

    word_sim = word_score / len(expected_words) if expected_words else 0.0
    accuracy = round(((sentence_sim * 0.4) + (word_sim * 0.6)) * 100)

    return accuracy, word_breakdown

def assess(transcription, expected_native, expected_phonetics="", language="Language"):
    # Compare against native script
    acc_native, breakdown_native = _calculate_score(transcription, expected_native, expected_phonetics, language)
    
    # Compare against phonetics if available
    acc_phonetics = 0
    breakdown_phonetics = []
    if expected_phonetics:
        acc_phonetics, breakdown_phonetics = _calculate_score(transcription, expected_phonetics, expected_phonetics, language)
        
    # Pick whichever match is better (native vs phonetics)
    if acc_phonetics > acc_native:
        accuracy = acc_phonetics
        word_breakdown = breakdown_phonetics
        target = expected_phonetics
    else:
        accuracy = acc_native
        word_breakdown = breakdown_native
        target = expected_native

    # Build reliable deterministic diagnostic tip
    deterministic_tip = build_deterministic_tip(target, transcription, word_breakdown, language)

    # Generate AI tip (with fallback to deterministic_tip)
    ai_tip = get_ai_tip(target, transcription, word_breakdown, language, deterministic_tip=deterministic_tip)
    
    return accuracy, word_breakdown, ai_tip