from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import tempfile
from whisper_service import transcribe
from pronunciation import assess

app = Flask(__name__)
CORS(app)

LANGUAGE_CODES = {
    "kannada": "kn",
    "tamil": "ta",
    "telugu": "te",
    "malayalam": "ml"
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

if __name__ == '__main__':
    app.run(port=5000, debug=True)