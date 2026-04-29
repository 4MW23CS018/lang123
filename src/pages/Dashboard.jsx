import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const userId = localStorage.getItem("userId");
  const lessons = useQuery(api.lessons.list);
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  if (!lessons || !user) return <p className="container">Loading...</p>;

  return (
    <main className="container mt-4">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user.name}!
      </h1>
      <div className="lessons-grid">
        {lessons.map((lesson) => (
          <Link
            key={lesson._id}
            to={`/lesson/${lesson._id}`}
            className="card"
          >
            <h2 className="font-semibold text-lg">{lesson.title}</h2>
            <p className="text-gray-500">{lesson.language}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}