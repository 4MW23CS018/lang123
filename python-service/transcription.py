from faster_whisper import WhisperModel
import os

# Load Whisper 'base' model locally (configured with multi-threading for speed)
cpu_threads = max(1, (os.cpu_count() or 4) // 2)
print(f"[WHISPER] Loading local Whisper model 'base' with {cpu_threads} CPU threads...")
try:
    model = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=cpu_threads)
    print("[WHISPER] Local model loaded successfully!")
except Exception as e:
    print(f"[WHISPER ERROR] Failed to load base model, trying tiny: {e}")
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

def transcribe(audio_path, language_name=None, phrase="", phonetics=""):
    """
    Transcribes audio locally using faster-whisper.
    Fast (< 1s), zero API cost, high accuracy.
    """
    lang_code = LANG_MAP.get(language_name.lower(), None) if language_name else None
    
    # Construct initial prompt to ground Whisper in expected script/sounds
    prompt_parts = []
    if language_name:
        prompt_parts.append(f"{language_name} speech practice")
    if phrase:
        prompt_parts.append(phrase)
    if phonetics:
        prompt_parts.append(phonetics)
    initial_prompt = ", ".join(prompt_parts) if prompt_parts else None

    print(f"[WHISPER] Transcribing audio (lang filter: {lang_code if lang_code else 'auto'})...")
    
    kwargs = {
        "beam_size": 1,
        "vad_filter": False,
        "condition_on_previous_text": False,
        "temperature": 0.0,
    }
    if lang_code:
        kwargs["language"] = lang_code
    if initial_prompt:
        kwargs["initial_prompt"] = initial_prompt

    segments, info = model.transcribe(audio_path, **kwargs)
    
    text = " ".join([s.text.strip() for s in segments]).strip()
    safe_text = text.encode('ascii', 'backslashreplace').decode('ascii')
    print(f"[WHISPER SUCCESS] Spoken text: '{safe_text}' (lang prob: {info.language_probability:.2f})")
    return text