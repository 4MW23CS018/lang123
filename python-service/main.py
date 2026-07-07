from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import os
import io
import tempfile
from gtts import gTTS
from whisper_service import transcribe
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

        print(f"[DEBUG] file size: {os.path.getsize(tmp_path)} bytes")

        transcription = transcribe(tmp_path, lang_code)
        accuracy, missing_words = assess(transcription, phrase)

        print(f"[DEBUG] transcription: '{transcription}'")
        print(f"[DEBUG] accuracy: {accuracy}%")

        return jsonify({
            'transcription': transcription,
            'accuracy': accuracy,
            'missing_words': missing_words
        })
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate audio pronunciation for a phrase in the given language."""
    data = request.json
    phrase = data.get('phrase', '')
    language = data.get('language', '').lower()

    if not phrase:
        return jsonify({'error': 'No phrase provided'}), 400

    lang_code = LANGUAGE_CODES.get(language, language[:2])

    try:
        tts = gTTS(text=phrase, lang=lang_code, slow=True)
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