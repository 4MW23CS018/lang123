from difflib import SequenceMatcher
import re

def clean(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return text

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def assess(transcription, expected):
    transcription = clean(transcription)
    expected = clean(expected)

    trans_words = transcription.split()
    expected_words = expected.split()

    # --- Signal 1: Sentence-level similarity ---
    sentence_sim = SequenceMatcher(None, expected, transcription).ratio()

    # --- Signal 2: Word-level partial credit ---
    # For each expected word, find the best-matching spoken word and accumulate
    # its similarity score instead of binary correct/incorrect.
    # e.g. "neevu" vs "nibu" = 0.50, "hegiddira" vs "hegibira" = 0.88
    word_score = 0.0
    word_breakdown = []

    for exp_word in expected_words:
        if trans_words:
            best_match = max(trans_words, key=lambda t: similar(exp_word, t))
            best_score = similar(exp_word, best_match)
        else:
            best_match = None
            best_score = 0.0
            
        word_score += best_score
        score_percent = round(best_score * 100)
        
        if score_percent >= 80:
            status = "correct"
        elif score_percent >= 50:
            status = "mispronounced"
        else:
            status = "missing"
            
        word_breakdown.append({
            "word": exp_word,
            "spoken_as": best_match if status != "missing" else None,
            "score": score_percent,
            "status": status
        })

    word_sim = word_score / len(expected_words) if expected_words else 0.0

    # --- Final accuracy: average of both signals ---
    # Produces natural scores like 68%, 85%, 94% instead of 0/50/100%
    accuracy = round(((sentence_sim + word_sim) / 2) * 100)

    return accuracy, word_breakdown