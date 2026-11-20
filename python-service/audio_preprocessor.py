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


class AudioPreprocessingError(Exception):
    """Raised when input media cannot be decoded for preprocessing."""


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
    created_output_path = output_path is None
    if created_output_path:
        fd, output_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

    converted_path = output_path + ".conv.wav"
    source_path = converted_path
    completed = False
    try:
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-threads", "8",
            "-i", input_path,
            "-ar", str(TARGET_SAMPLE_RATE),
            "-ac", "1",
            "-sample_fmt", "s16",
            "-loglevel", "error",
            converted_path
        ]

        try:
            res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        except Exception as e:
            raise AudioPreprocessingError(
                f"FFmpeg execution failed: {e}"
            ) from e

        if res.returncode != 0:
            diagnostic = res.stderr.strip() or "no FFmpeg diagnostic was provided"
            raise AudioPreprocessingError(
                f"FFmpeg conversion failed with code {res.returncode}: {diagnostic}"
            )

        try:
            converted_size = os.path.getsize(converted_path)
        except OSError as e:
            raise AudioPreprocessingError(
                f"FFmpeg did not create a readable output file: {e}"
            ) from e

        if converted_size == 0:
            raise AudioPreprocessingError("FFmpeg produced an empty output file")

        # Step 2: Load as numpy array
        try:
            samples, sr = sf.read(source_path, dtype='float32')
        except Exception as e:
            raise AudioPreprocessingError(
                f"Converted audio could not be read: {e}"
            ) from e

        if sr != TARGET_SAMPLE_RATE:
            raise AudioPreprocessingError(
                f"Converted audio has unexpected sample rate {sr} Hz; "
                f"expected {TARGET_SAMPLE_RATE} Hz"
            )

        # Ensure mono
        if samples.ndim > 1:
            samples = np.mean(samples, axis=1)

        if len(samples) == 0:
            raise AudioPreprocessingError("Decoded audio is empty")

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

        stats = {
            "input_size_bytes": input_size,
            "output_size_bytes": output_size,
            "original_duration_ms": original_duration_ms,
            "processed_duration_ms": processed_duration_ms,
        }

        print(f"[PREPROCESS] Done: {original_duration_ms}ms -> {processed_duration_ms}ms")
        completed = True
        return output_path, stats
    finally:
        if converted_path != input_path and os.path.exists(converted_path):
            try:
                os.remove(converted_path)
            except OSError as cleanup_error:
                print(f"[PREPROCESS CLEANUP WARN] Could not remove conversion file: {cleanup_error}")

        if created_output_path and not completed and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError as cleanup_error:
                print(f"[PREPROCESS CLEANUP WARN] Could not remove output file: {cleanup_error}")
