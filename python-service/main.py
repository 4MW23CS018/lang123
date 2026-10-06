from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import os
import io
import tempfile
from gtts import gTTS
from transcription import transcribe
from pronunciation import assess

app = Flask(__name__)
CORS(app)

LANGUAGE_CODES = {
    "kannada": "kn",
    "tamil": "ta",
    "telugu": "te",
    "malayalam": "ml",
    "tulu": "kn",     # Tulu uses Kannada script; closest TTS voice
    "kodava": "kn",   # Kodava uses Kannada script; closest TTS voice
}

@app.route('/assess', methods=['POST'])
def assess_audio():
    data = request.json
    phrase = data['phrase']
    language = data['language'].lower()
    phonetics = data.get('phonetics', '')

    # --- Accept either audio_url or audio_base64 ---
    if 'audio_base64' in data:
        audio_bytes = base64.b64decode(data['audio_base64'])
    elif 'audio_url' in data:
        import requests
        r = requests.get(data['audio_url'])
        audio_bytes = r.content
    else:
        return jsonify({'error': 'No audio provided'}), 400

    lang_code = LANGUAGE_CODES.get(language, language[:2])

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        print(f"[DEBUG] Processing audio file size: {os.path.getsize(tmp_path)} bytes for language '{language}'")

        # 1. Preprocess audio (format conversion, noise reduction, volume normalization, silence trimming)
        preprocessed_path = tmp_path
        try:
            from audio_preprocessor import preprocess
            preprocessed_path, _ = preprocess(tmp_path)
        except Exception as prep_err:
            print(f"[PREPROCESS WARN] Preprocessing failed, proceeding with raw audio: {prep_err}")
            preprocessed_path = tmp_path

        # 2. Local Whisper transcription (100% offline, zero rate limits, prompt-grounded)
        transcription = transcribe(preprocessed_path, language, phrase=phrase, phonetics=phonetics)

        
        # 3. Local scoring + optional AI tip (safe fallback if Gemini rate-limited)
        accuracy, word_breakdown, ai_tip = assess(transcription, phrase, phonetics, language)

        return jsonify({
            'transcription': transcription,
            'accuracy': accuracy,
            'word_breakdown': word_breakdown,
            'ai_tip': ai_tip
        })
    except Exception as e:
        safe_error = str(e).encode('ascii', 'backslashreplace').decode('ascii')
        print(f"[ERROR] {safe_error}")
        return jsonify({'error': safe_error}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'preprocessed_path' in locals() and preprocessed_path and preprocessed_path != tmp_path and os.path.exists(preprocessed_path):
            os.remove(preprocessed_path)


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    data = request.json
    language = data.get('language', '').lower()

    if 'audio_base64' in data:
        audio_bytes = base64.b64decode(data['audio_base64'])
    else:
        return jsonify({'error': 'No audio provided'}), 400

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        # Whisper handles raw webm files natively perfectly.
        # Skip heavy noise reduction preprocessing for chat to make it lightning fast.
        preprocessed_path = tmp_path

        # 2. Local Whisper transcription (Use selected language)
        transcribed_text = transcribe(preprocessed_path, language, phrase="", phonetics="")

        return jsonify({
            'text': transcribed_text
        })
    except Exception as e:
        safe_error = str(e).encode('ascii', 'backslashreplace').decode('ascii')
        print(f"[ERROR] {safe_error}")
        return jsonify({'error': safe_error}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'preprocessed_path' in locals() and preprocessed_path and preprocessed_path != tmp_path and os.path.exists(preprocessed_path):
            os.remove(preprocessed_path)


@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate audio pronunciation for a phrase in the given language."""
    data = request.json
    phrase = data.get('phrase', '')
    language = data.get('language', '').lower()

    if not phrase:
        return jsonify({'error': 'No phrase provided'}), 400

    import re
    cleaned_phrase = re.sub(r'\(.*?\)', '', phrase).strip()
    if not cleaned_phrase:
        cleaned_phrase = phrase

    lang_code = LANGUAGE_CODES.get(language, language[:2])

    try:
        tts = gTTS(text=cleaned_phrase, lang=lang_code, slow=True)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return send_file(
            audio_buffer,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='pronunciation.mp3'
        )
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)