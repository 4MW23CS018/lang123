from faster_whisper import WhisperModel

model = WhisperModel("tiny", device="cpu", compute_type="int8")

def transcribe(audio_path, language_code):
    segments, _ = model.transcribe(audio_path, language=language_code)
    return " ".join([s.text.strip() for s in segments])