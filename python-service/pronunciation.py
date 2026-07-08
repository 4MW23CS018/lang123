from difflib import SequenceMatcher
import re

def clean(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return text

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
try:
    client = genai.Client()
except Exception:
    client = None

def get_ai_tip(expected, transcription, word_breakdown, language):
    if not client:
        return None
    mistakes = [w for w in word_breakdown if w['status'] != 'correct']
    if not mistakes:
        return None
        
    mistakes_str = ", ".join([f"Expected '{w['word']}' but heard '{w['spoken_as']}'" for w in mistakes])
    
    prompt = f"""You are a gentle {language} language tutor. The student tried to say: '{expected}'.
They said: '{transcription}'.
Specific mistakes: {mistakes_str}

Give a 1-sentence tip on how to improve the pronunciation of the specific sounds they got wrong. Be extremely concise. Focus purely on phonetic placement (e.g. lips, tongue) or sound. No greetings."""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"AI Tip Error: {e}")
        return None

def _calculate_score(transcription, expected):
    transcription = clean(transcription)
    expected = clean(expected)

    trans_words = transcription.split()
    expected_words = expected.split()

    # --- Signal 1: Sentence-level similarity ---
    sentence_sim = SequenceMatcher(None, expected, transcription).ratio()

    # --- Signal 2: Word-level partial credit ---
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
    accuracy = round(((sentence_sim + word_sim) / 2) * 100)
    
    return accuracy, word_breakdown

def assess(transcription, expected_native, expected_phonetics="", language="Language"):
    # Compare against native script
    acc_native, breakdown_native = _calculate_score(transcription, expected_native)
    
    # Compare against phonetics (if available, e.g. "namaskara")
    acc_phonetics = 0
    breakdown_phonetics = []
    if expected_phonetics:
        acc_phonetics, breakdown_phonetics = _calculate_score(transcription, expected_phonetics)
        
    # Return the one with the higher accuracy
    if acc_phonetics > acc_native:
        return acc_phonetics, breakdown_phonetics, None
    else:
        return acc_native, breakdown_native, None