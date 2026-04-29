export default function PronunciationFeedback({ feedback }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <p>Accuracy: <strong className="text-2xl">{feedback.accuracy}%</strong></p>
      <p>You said: "{feedback.transcription}"</p>
      {feedback.missing_words?.length > 0 && (
        <p className="text-red-500">
          Missing words: {feedback.missing_words.join(", ")}
        </p>
      )}
      <p className="text-green-600 font-bold mt-2">+{feedback.xpEarned} XP</p>
    </div>
  );
}