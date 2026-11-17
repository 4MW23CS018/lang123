from faster_whisper import WhisperModel
import os
import re
from collections import Counter

# Load Whisper model locally.
# The 'small' model provides reliable multilingual/Indic phonetic modeling,
# whereas 'base' frequently collapses into numeric or repetition hallucinations on Kannada.
cpu_threads = 2 #max(1, (os.cpu_count() or 4) // 2)
MODEL_NAME = os.environ.get("WHISPER_MODEL", "small")
print(f"[WHISPER] Loading local Whisper model '{MODEL_NAME}' with {cpu_threads} CPU threads...")
try:
    model = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8", cpu_threads=cpu_threads)
    print(f"[WHISPER] Local model '{MODEL_NAME}' loaded successfully!")
except Exception as e:
    print(f"[WHISPER WARN] Failed to load '{MODEL_NAME}', falling back to 'base': {e}")
    try:
        model = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=cpu_threads)
        print("[WHISPER] Local model 'base' loaded successfully!")
    except Exception as e2:
        print(f"[WHISPER WARN] Failed to load 'base', falling back to 'tiny': {e2}")
        model = WhisperModel("tiny", device="cpu", compute_type="int8", cpu_threads=cpu_threads)

LANG_MAP = {
    "english": "en",
    "kannada": "kn",
    "tamil": "ta",
    "telugu": "te",
    "malayalam": "ml",
    "tulu": "kn",
    "kodava": "kn",
}


def is_hallucination(text):
    """
    Detect obvious Whisper hallucinations:
    1. Pure numbers and punctuation (e.g. '1-2-3-4-5', '1-2-5-5')
    2. Repeated character loops (e.g. 'ನನನನನ', 'ಲಿಲಿಲಿಲಿಲಿ')
    3. Repeated word loops (e.g. 'ಬೇಕು ಬೇಕು ಬೇಕು ಬೇಕು')
    """
    if not text:
        return True

    clean = text.strip()

    # 1. Pure digits and punctuation / dashes
    if re.fullmatch(r"[\d\s,\.\-–—:;!?()\[\]/]+", clean):
        return True

    # 2. Repeated character loops (same character 4+ times in a row)
    if re.search(r"(.)\1{4,}", clean):
        return True

    # 3. Repeated word loops (same word 3+ times consecutively or overwhelming frequency)
    words = clean.split()
    if len(words) >= 4:
        counts = Counter(words)
        _, freq = counts.most_common(1)[0]
        if freq / len(words) >= 0.75:
            return True

    return False


def normalize_indic_script(text, language_name="kannada"):
    """
    Converts Devanagari script output from Whisper to Kannada script
    when target language is Kannada (or Tulu/Kodava).
    In Whisper's multilingual training, Indic phonetics are mapped into
    Devanagari (0x0900..0x097F). In Unicode, Kannada (0x0C80..0x0CFF)
    mirrors Devanagari by a fixed offset of +0x0380.
    """
    if not text:
        return ""

    lang = (language_name or "").lower()
    if lang not in ("kannada", "kn", "tulu", "kodava"):
        return text

    # Check if text contains Devanagari characters
    has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in text)
    if not has_devanagari:
        return text

    res = []
    for ch in text:
        cp = ord(ch)
        if 0x0900 <= cp <= 0x097F:
            res.append(chr(cp + 0x0380))
        else:
            res.append(ch)
    return "".join(res)


def transcribe(audio_path, language_name=None, phrase="", phonetics=""):
    """
    Transcribes audio locally using Faster-Whisper.
    Applies explicit language constraints, hallucination filtering,
    and Indic script normalization.
    """
    language_name = (language_name or "").strip().lower()
    lang_code = LANG_MAP.get(language_name)

    audio_size = os.path.getsize(audio_path) if os.path.exists(audio_path) else 0
    print(
        f"[WHISPER] Starting transcription: target_language={lang_code or 'auto'} ({language_name}), "
        f"audio_file_size={audio_size} bytes"
    )

    # In pronunciation assessment mode, a reference phrase is provided.
    # In open roleplay mode, do not inject arbitrary script prompts that trigger token looping.
    prompt_parts = []
    if phrase and phrase.strip():
        prompt_parts.append(phrase.strip())
    if phonetics and phonetics.strip():
        prompt_parts.append(phonetics.strip())
    initial_prompt = ", ".join(prompt_parts) if prompt_parts else None

    kwargs = {
        "task": "transcribe",
        "beam_size": 5,
        "vad_filter": True,
        "condition_on_previous_text": False,
        "temperature": 0.0,
        "no_speech_threshold": 0.6,
        "repetition_penalty": 1.2,
    }

    if lang_code:
        kwargs["language"] = lang_code

    if initial_prompt:
        kwargs["initial_prompt"] = initial_prompt

    segments, info = model.transcribe(audio_path, **kwargs)
    segments = list(segments)

    raw_text = " ".join(
        segment.text.strip()
        for segment in segments
        if segment.text.strip()
    ).strip()

    duration = getattr(info, "duration", 0.0)
    det_lang = getattr(info, "language", lang_code or "unknown")
    prob = getattr(info, "language_probability", 0.0)

    print(
        f"[WHISPER] Audio duration={duration:.2f}s, detected_language={det_lang}, "
        f"probability={prob:.2f}, raw_text={raw_text!r}"
    )

    # Detect and reject obvious model hallucinations
    if is_hallucination(raw_text):
        print(f"[WHISPER WARN] Detected repetitive/hallucinated transcript: {raw_text!r}. Rejecting as invalid.")
        return ""

    # Normalize Indic script to Kannada script
    final_text = normalize_indic_script(raw_text, language_name)
    print(f"[WHISPER SUCCESS] Final normalized transcript: {final_text!r}")

    return final_text
