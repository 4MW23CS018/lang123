import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
/*import convex from "../lib/convex"; */  
import PronunciationFeedback from "./PronunciationFeedback";

export default function SpeechRecorder({ phrase, language, userId, lessonId }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(false);

  const generateUploadUrl = useMutation(api.speech.generateUploadUrl);
  const saveAssessment = useMutation(api.speech.saveAssessment);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

const submit = async () => {
  if (!audioBlob) return;
  setProcessing(true);

  try {
    // 1. Convert audioBlob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        // Remove the prefix "data:audio/webm;base64,"
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
    });

    console.log("1. Audio base64 length:", base64.length);

    // 2. Upload to Convex storage (still needed for record keeping)
    const uploadUrl = await generateUploadUrl();
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": audioBlob.type },
      body: audioBlob,
    });
    const { storageId } = await uploadResult.json();
    console.log("2. Storage ID:", storageId);

    // 3. Call Flask with base64 audio
    console.log("3. Sending to Flask...");
    const flaskResponse = await fetch("http://localhost:5000/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio_base64: base64,
        phrase: phrase,
        language: language,
      }),
    });
    console.log("4. Flask response status:", flaskResponse.status);

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      throw new Error(`Flask error: ${flaskResponse.status} - ${errorText}`);
    }

    const assessment = await flaskResponse.json();
    console.log("5. Flask assessment:", assessment);

    // 4. Save result to Convex
    console.log("6. Saving assessment...");
    const { xpEarned } = await saveAssessment({
      userId,
      lessonId,
      transcription: assessment.transcription,
      accuracy: assessment.accuracy,
      audioStorageId: storageId,
    });
    console.log("7. XP earned:", xpEarned);

    setFeedback({ ...assessment, xpEarned });
    console.log("8. Success!");
  } catch (err) {
    console.error("FAILED:", err);
    alert(`Failed to analyze audio.\n${err.message}`);
  } finally {
    setProcessing(false);
  }
};

  return (
    <div className="space-y-4">
      <p className="text-lg">
        Say: <strong className="text-indigo-600">{phrase}</strong>
      </p>
      <div className="flex gap-2">
        {!recording ? (
          <button onClick={start} className="bg-indigo-600 text-white px-4 py-2 rounded">
            Start Recording
          </button>
        ) : (
          <button onClick={stop} className="bg-red-500 text-white px-4 py-2 rounded">
            Stop
          </button>
        )}
      </div>
      {audioBlob && (
        <div>
          <audio src={URL.createObjectURL(audioBlob)} controls className="w-full mb-2" />
          <button
            onClick={submit}
            disabled={processing}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {processing ? "Analyzing..." : "Check Pronunciation"}
          </button>
        </div>
      )}
      {feedback && <PronunciationFeedback feedback={feedback} />}
    </div>
  );
}