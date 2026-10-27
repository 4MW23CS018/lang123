"""
Audio Preprocessing Pipeline for Speech Recognition
=====================================================
Lightweight preprocessing for browser-recorded audio:
1. Convert to WAV 16kHz mono (optimal for Whisper)
2. Gentle noise reduction (spectral gating)
3. Volume normalization
4. Silence trimming
"""

import os
import subprocess
import tempfile
import numpy as np
import soundfile as sf

try:
    import noisereduce as nr
    HAS_NOISE_REDUCE = True
except Exception as e:
    print(f"[PREPROCESS WARN] noisereduce not available: {e}")
    HAS_NOISE_REDUCE = False


# ── Configuration ──────────────────────────────────────────────────────────────
TARGET_SAMPLE_RATE = 16000       # Whisper's native sample rate
NOISE_REDUCE_PROP = 0.3           # Gentle noise reduction (was 0.6 — too aggressive)
NOISE_REDUCE_STATIONARY = True    # True = assume stationary noise (fan, hum)
NORMALIZE_TARGET_PEAK = 0.7       # Target peak amplitude to avoid clipping


def preprocess(input_path, output_path=None):
    """
    Lightweight preprocessing pipeline:
    1. Convert to WAV 16kHz mono via ffmpeg
    2. Gentle noise reduction
    3. Normalize volume
    4. Trim silence

    Returns: (preprocessed_file_path, stats_dict)
    """
    print(f"[PREPROCESS] Starting pipeline for: {input_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    input_size = os.path.getsize(input_path)

    # Step 1: Convert to 16kHz mono WAV using ffmpeg directly
    if output_path is None:
        fd, output_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

    converted_path = output_path + ".conv.wav"
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ar", str(TARGET_SAMPLE_RATE),
        "-ac", "1",
        "-sample_fmt", "s16",
        "-loglevel", "error",
        converted_path
    ]

    try:
        res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[PREPROCESS] ffmpeg conversion failed with code {res.returncode}: {res.stderr}")
            converted_path = input_path
    except Exception as e:
        print(f"[PREPROCESS] ffmpeg execution failed: {e}, using raw file")
        converted_path = input_path

    # Step 2: Load as numpy array
    try:
        samples, sr = sf.read(converted_path, dtype='float32')
    except Exception as e:
        print(f"[PREPROCESS] Failed to read converted audio: {e}")
        if os.path.exists(converted_path) and converted_path != input_path:
            try:
                os.remove(converted_path)
            except OSError:
                pass
        return input_path, {"error": str(e)}

    # Ensure mono
    if samples.ndim > 1:
        samples = np.mean(samples, axis=1)

    if len(samples) == 0:
        print("[PREPROCESS] Audio sample is empty")
        if os.path.exists(converted_path) and converted_path != input_path:
            try:
                os.remove(converted_path)
            except OSError:
                pass
        return input_path, {"error": "Empty audio"}

    original_duration_ms = int(len(samples) / sr * 1000)
    print(f"[PREPROCESS] Audio: {original_duration_ms}ms, {sr}Hz")

    # Step 3: Gentle noise reduction (skip for short clips < 3.5s for instant speed)
    if HAS_NOISE_REDUCE:
        if original_duration_ms > 3500:
            try:
                samples = nr.reduce_noise(
                    y=samples,
                    sr=sr,
                    prop_decrease=NOISE_REDUCE_PROP,
                    stationary=NOISE_REDUCE_STATIONARY,
                    n_fft=512,
                    hop_length=128,
                )
                print("[PREPROCESS] Noise reduction applied")
            except Exception as e:
                print(f"[PREPROCESS] Noise reduction skipped: {e}")
        else:
            print(f"[PREPROCESS] Skipped noise reduction for short clip ({original_duration_ms}ms) for fast execution")


    # Step 4: Normalize volume (only if audio is not near-silent)
    peak = float(np.max(np.abs(samples)))
    if peak > 0.001:
        samples = samples * (NORMALIZE_TARGET_PEAK / peak)
        print(f"[PREPROCESS] Normalized (peak was {peak:.3f})")
    else:
        print(f"[PREPROCESS] Skipped normalization (peak {peak:.5f} near zero)")

    # Step 5: Trim silence from edges
    threshold = 0.01
    above = np.abs(samples) > threshold
    if np.any(above):
        indices = np.where(above)[0]
        pad = min(int(0.05 * sr), len(samples))  # 50ms padding
        start = max(0, indices[0] - pad)
        end = min(len(samples), indices[-1] + pad)
        trimmed = samples[start:end]
        if len(trimmed) > 0:
            trimmed_pct = round((1 - len(trimmed) / len(samples)) * 100, 1)
            print(f"[PREPROCESS] Trimmed {trimmed_pct}% silence")
            samples = trimmed

    processed_duration_ms = int(len(samples) / sr * 1000)

    # Export
    sf.write(output_path, samples, sr)
    output_size = os.path.getsize(output_path)

    # Clean up intermediate file
    if os.path.exists(converted_path) and converted_path != input_path:
        try:
            os.remove(converted_path)
        except OSError:
            pass

    stats = {
        "input_size_bytes": input_size,
        "output_size_bytes": output_size,
        "original_duration_ms": original_duration_ms,
        "processed_duration_ms": processed_duration_ms,
    }

    print(f"[PREPROCESS] Done: {original_duration_ms}ms -> {processed_duration_ms}ms")
    return output_path, stats

