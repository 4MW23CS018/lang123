import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SpeechRecorder from "../components/SpeechRecorder";

export default function LessonDetail() {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const lesson = useQuery(api.lessons.getById, { id });

  if (!lesson || !userId) return <p className="container">Loading...</p>;

  return (
    <main className="container mt-4">
      <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
      <p className="text-gray-500 mb-6">Language: {lesson.language}</p>
      <SpeechRecorder
        phrase={lesson.phrase}
        language={lesson.language}
        userId={userId}
        lessonId={lesson._id}
      />
    </main>
  );
}