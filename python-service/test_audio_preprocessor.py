import base64
import importlib
import os
import sys
import tempfile
import types
import unittest
from unittest import mock

import numpy as np
import soundfile as sf

import audio_preprocessor as preprocessor


class AudioPreprocessorTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.input_path = os.path.join(self.temp_dir.name, "input.media")
        with open(self.input_path, "wb") as audio_file:
            audio_file.write(b"input media")

    def _write_intermediate(self, command, sample_rate=16000, samples=None):
        output_path = command[-1]
        if samples is None:
            samples = np.array([0.2, -0.2, 0.1], dtype="float32")
        sf.write(output_path, samples, sample_rate)

    def _run_conversion(self, sample_rate=16000, samples=None):
        def convert(command, **kwargs):
            self._write_intermediate(command, sample_rate, samples)
            return types.SimpleNamespace(returncode=0, stderr="")

        return mock.patch.object(preprocessor.subprocess, "run", side_effect=convert)

    def test_success_converts_and_preserves_postprocessing(self):
        with self._run_conversion() as run:
            output_path, _ = preprocessor.preprocess(self.input_path)

        self.addCleanup(lambda: os.path.exists(output_path) and os.remove(output_path))
        samples, sample_rate = sf.read(output_path)
        self.assertEqual(sample_rate, 16000)
        self.assertEqual(samples.ndim, 1)
        self.assertGreater(len(samples), 0)
        run.assert_called_once()
        self.assertFalse(os.path.exists(output_path + ".conv.wav"))

    def test_nonzero_exit_is_rejected(self):
        with mock.patch.object(
            preprocessor.subprocess,
            "run",
            return_value=types.SimpleNamespace(returncode=1, stderr="decode failed"),
        ):
            with self.assertRaisesRegex(preprocessor.AudioPreprocessingError, "decode failed"):
                preprocessor.preprocess(self.input_path)

    def test_subprocess_exceptions_are_rejected(self):
        for error in (FileNotFoundError("ffmpeg missing"), RuntimeError("spawn failed")):
            with self.subTest(error=error):
                with mock.patch.object(preprocessor.subprocess, "run", side_effect=error):
                    with self.assertRaises(preprocessor.AudioPreprocessingError):
                        preprocessor.preprocess(self.input_path)

    def test_missing_intermediate_is_rejected(self):
        with mock.patch.object(
            preprocessor.subprocess,
            "run",
            return_value=types.SimpleNamespace(returncode=0, stderr=""),
        ):
            with self.assertRaisesRegex(preprocessor.AudioPreprocessingError, "output file"):
                preprocessor.preprocess(self.input_path)

    def test_empty_intermediate_is_rejected(self):
        def convert(command, **kwargs):
            open(command[-1], "wb").close()
            return types.SimpleNamespace(returncode=0, stderr="")

        with mock.patch.object(preprocessor.subprocess, "run", side_effect=convert):
            with self.assertRaisesRegex(preprocessor.AudioPreprocessingError, "empty output"):
                preprocessor.preprocess(self.input_path)

    def test_unreadable_intermediate_is_rejected(self):
        def convert(command, **kwargs):
            with open(command[-1], "wb") as output_file:
                output_file.write(b"not a WAV")
            return types.SimpleNamespace(returncode=0, stderr="")

        with mock.patch.object(preprocessor.subprocess, "run", side_effect=convert):
            with self.assertRaisesRegex(preprocessor.AudioPreprocessingError, "could not be read"):
                preprocessor.preprocess(self.input_path)

    def test_unexpected_sample_rate_is_rejected(self):
        with self._run_conversion(sample_rate=8000):
            with self.assertRaisesRegex(preprocessor.AudioPreprocessingError, "expected 16000"):
                preprocessor.preprocess(self.input_path)

    def test_cleanup_attempts_are_independent_on_failure(self):
        original_remove = os.remove
        remove_attempts = []

        def fail_intermediate_remove(path):
            remove_attempts.append(path)
            if path.endswith(".conv.wav"):
                raise PermissionError("simulated cleanup failure")
            original_remove(path)

        with self._run_conversion(sample_rate=8000):
            with mock.patch.object(preprocessor.os, "remove", side_effect=fail_intermediate_remove):
                with self.assertRaises(preprocessor.AudioPreprocessingError):
                    preprocessor.preprocess(self.input_path)

        self.assertEqual(len(remove_attempts), 2)
        self.assertTrue(remove_attempts[0].endswith(".conv.wav"))
        self.assertTrue(os.path.exists(remove_attempts[0]))
        self.assertFalse(os.path.exists(remove_attempts[1]))
        original_remove(remove_attempts[0])


class AssessEndpointTests(unittest.TestCase):
    def test_preprocessing_error_prevents_whisper_call(self):
        transcription = types.ModuleType("transcription")
        transcription.transcribe = mock.Mock(side_effect=AssertionError("Whisper must not run"))
        pronunciation = types.ModuleType("pronunciation")
        pronunciation.assess = mock.Mock()

        missing = object()
        original_main = sys.modules.pop("main", missing)
        try:
            with mock.patch.dict(
                sys.modules,
                {"transcription": transcription, "pronunciation": pronunciation},
            ):
                main = importlib.import_module("main")
                with mock.patch.object(
                    preprocessor,
                    "preprocess",
                    side_effect=preprocessor.AudioPreprocessingError("conversion failed"),
                ):
                    response = main.app.test_client().post(
                        "/assess",
                        json={
                            "phrase": "hello",
                            "language": "english",
                            "audio_base64": base64.b64encode(b"audio").decode("ascii"),
                        },
                    )
        finally:
            if original_main is missing:
                sys.modules.pop("main", None)
            else:
                sys.modules["main"] = original_main

        self.assertEqual(response.status_code, 400)
        transcription.transcribe.assert_not_called()
        pronunciation.assess.assert_not_called()


if __name__ == "__main__":
    unittest.main()
