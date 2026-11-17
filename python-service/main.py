from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import binascii
import os
import io
import tempfile
from gtts import gTTS
from transcription import transcribe
from pronunciation import assess

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()

if APP_ENV not in ("development", "production"):
    raise RuntimeError(
        "APP_ENV must be either 'development' or 'production'"
    )
# to use less audio file size , max size 14 MB defined  
try:
    MAX_REQUEST_BYTES = int(
        os.getenv("MAX_REQUEST_BYTES", str(14 * 1024 * 1024))
    )
except ValueError as error:
    raise RuntimeError(
        "MAX_REQUEST_BYTES must be a positive integer"
    ) from error

if MAX_REQUEST_BYTES <= 0:
    raise RuntimeError(
        "MAX_REQUEST_BYTES must be a positive integer"
    )

app.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES

configured_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")

if APP_ENV == "production" and not configured_origins.strip():
    raise RuntimeError(
        "CORS_ALLOWED_ORIGINS must be configured in production"
    )
    # Default local development URLs for Vite/React
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in configured_origins.split(",")
    if origin.strip()
]

if APP_ENV == "development" and not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

CORS(
    app,
    resources={
        r"/*": {
            "origins": allowed_origins,
            "methods": ["GET", "HEAD", "POST", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "Bypass-Tunnel-Reminder",
            ],
        }
    },
)

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
    if not request.is_json:
        return jsonify({'error': 'Request body must be JSON'}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object'}), 400

    if 'audio_url' in data:
        return jsonify({'error': 'audio_url is not supported; send audio_base64'}), 400

    phrase = data.get('phrase')
    if not isinstance(phrase, str) or not phrase.strip():
        return jsonify({'error': 'phrase must be a nonempty string'}), 400

    language = data.get('language')
    if not isinstance(language, str) or not language.strip():
        return jsonify({'error': 'language must be a nonempty string'}), 400
    language = language.strip().lower()

    phonetics = data.get('phonetics', '')
    if not isinstance(phonetics, str):
        return jsonify({'error': 'phonetics must be a string'}), 400

    encoded_audio = data.get('audio_base64')
    if not isinstance(encoded_audio, str):
        return jsonify({'error': 'audio_base64 must be a string'}), 400

    try:
        audio_bytes = base64.b64decode(encoded_audio, validate=True)
    except (binascii.Error, ValueError):
        return jsonify({'error': 'audio_base64 must contain valid Base64 data'}), 400

    if not audio_bytes:
        return jsonify({'error': 'Audio data must not be empty'}), 400

    lang_code = LANGUAGE_CODES.get(language, language[:2])

    tmp_path = None
    preprocessed_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name
            tmp.write(audio_bytes)

        print(f"[DEBUG] Processing audio file size: {os.path.getsize(tmp_path)} bytes for language '{language}'")

        # 1. Preprocess audio (format conversion, noise reduction, volume normalization, silence trimming)
        try:
            from audio_preprocessor import AudioPreprocessingError, preprocess
            preprocessed_path, _ = preprocess(tmp_path)
        except AudioPreprocessingError:
            return jsonify({'error': 'Audio is empty, corrupt, or unsupported'}), 400

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
        return jsonify({'error': 'Audio assessment failed'}), 500
    finally:
        for path in (preprocessed_path, tmp_path):
            if path:
                try:
                    os.remove(path)
                except FileNotFoundError:
                    pass
                except OSError as cleanup_error:
                    print(f"[CLEANUP WARN] Could not remove temporary audio file: {cleanup_error}")


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    data = request.json or {}
    language = data.get('language', '').lower()

    if 'audio_base64' in data and data['audio_base64']:
        base64_len = len(data['audio_base64'])
        audio_bytes = base64.b64decode(data['audio_base64'])
    else:
        return jsonify({'error': 'No audio provided'}), 400

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        file_size = os.path.getsize(tmp_path)
        print(f"[TRANSCRIBE] Payload received: base64_chars={base64_len}, decoded_file_size={file_size} bytes, language='{language}'")

        if file_size < 300:
            print("[TRANSCRIBE WARN] Recorded audio file is too short/empty (< 300 bytes), skipping transcription")
            return jsonify({'text': ''})

        # Local Faster-Whisper transcription
        transcribed_text = transcribe(tmp_path, language, phrase="", phonetics="")

        return jsonify({
            'text': transcribed_text
        })
    except Exception as e:
        safe_error = str(e).encode('ascii', 'backslashreplace').decode('ascii')
        print(f"[ERROR in /transcribe] {safe_error}")
        return jsonify({'error': safe_error}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate audio pronunciation for a phrase in the given language."""
    data = request.json or {}
    phrase = data.get('phrase', '')
    language = data.get('language', '').lower()

    if not phrase:
        return jsonify({'error': 'No phrase provided'}), 400

    import re
    cleaned_phrase = re.sub(r'\(.*?\)', '', phrase).strip()
    if not cleaned_phrase:
        cleaned_phrase = phrase

    # 1. Primary: Use gemini-3.8-flash-lite-tts
    try:
        from pronunciation import client
        if client:
            resp = client.models.generate_content(
                model='gemini-3.8-flash-lite-tts',
                contents=cleaned_phrase,
            )
            if resp.candidates and resp.candidates[0].content.parts:
                part = resp.candidates[0].content.parts[0]
                if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                    audio_buffer = io.BytesIO(part.inline_data.data)
                    mime_type = part.inline_data.mime_type or 'audio/wav'
                    download_ext = 'wav' if 'wav' in mime_type else 'mp3'
                    return send_file(
                        audio_buffer,
                        mimetype=mime_type,
                        as_attachment=False,
                        download_name=f'pronunciation.{download_ext}'
                    )
    except Exception as gemini_err:
        print(f"[TTS WARN] gemini-3.8-flash-lite-tts failed, falling back to gTTS: {gemini_err}")

    # 2. Fallback: gTTS
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


@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'langbridge-speech-service'})

@app.errorhandler(413)
def request_too_large(error):
    return jsonify({"error": "Your Request is too large"}), 413

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)