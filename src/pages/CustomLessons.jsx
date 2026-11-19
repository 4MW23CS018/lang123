import React, { useState, useMemo } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../components/hooks/useLanguage";
import {
  Sparkles,
  Bot,
  ArrowLeft,
  Plus,
  Play,
  CheckCircle2,
  BookOpen,
  Compass,
} from "lucide-react";

const SUGGESTED_TOPICS = [
  "Ordering filter coffee at a local darshini",
  "Asking for auto-rickshaw fare and bargaining",
  "Buying vegetables and fruits at the morning market",
  "Greeting neighbors and friendly casual small talk",
  "Asking for directions to the nearest metro station",
  "Ordering dinner with specific dietary requests",
];

export default function CustomLessons() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { language, current: languageMeta } = useLanguage();

  const lessons = useQuery(api.lessons.listByLanguage, { language });
  const completedLessonIds = useQuery(api.progress.getCompletedLessonIds, { userId }) || [];

  const generateLesson = useAction(api.ai.generateCustomLesson);
  const createLesson = useMutation(api.lessons.create);

  const [topicInput, setTopicInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const customLessons = useMemo(() => {
    return (lessons || []).filter((l) => l.isCustom);
  }, [lessons]);

  const handleCreate = async (topicToUse) => {
    const finalTopic = (topicToUse || topicInput).trim();
    if (!finalTopic) return;

    setErrorMsg("");
    setIsAiGenerating(true);
    try {
      const newLesson = await generateLesson({ language, topic: finalTopic });
      const id = await createLesson({ ...newLesson, isCustom: true });
      setIsAiGenerating(false);
      setTopicInput("");
      navigate(`/practice/${id}`);
    } catch (err) {
      setIsAiGenerating(false);
      setErrorMsg(err.message || "Failed to generate lesson. Please check your AI API key.");
    }
  };

  return (
    <div
      style={{
        padding: "20px 20px 80px",
        maxWidth: 1040,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Back button & Page Header */}
      <div>
        <Link
          to="/lessons"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 12,
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ArrowLeft size={16} />
          <span>Back to Curriculum Tree</span>
        </Link>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1
                style={{
                  color: "var(--text-primary)",
                  fontSize: "clamp(22px, 3.5vw, 28px)",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Custom AI Practice Lessons
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "2px 0 0" }}>
                Generate customized situational dialogues tailored for your daily needs in {language}.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: 999,
              padding: "5px 14px",
            }}
          >
            <span style={{ fontSize: 15 }}>{languageMeta?.emoji || "🗣️"}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13 }}>
              {language}
            </span>
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 18,
          border: "1px solid var(--border-subtle)",
          padding: "24px 22px",
          boxShadow: "var(--card-shadow)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={18} color="var(--accent)" />
          <h2 style={{ fontSize: 16, fontWeight: 750, color: "var(--text-primary)", margin: 0 }}>
            Create a New AI Conversation Lesson
          </h2>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAiGenerating) handleCreate();
            }}
            placeholder={`e.g. Asking for a bus ticket to Majestic in ${language}...`}
            disabled={isAiGenerating}
            style={{
              flex: 1,
              minWidth: 260,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1.5px solid var(--border-default)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
          />
          <button
            onClick={() => handleCreate()}
            disabled={isAiGenerating || !topicInput.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 12,
              background: isAiGenerating || !topicInput.trim() ? "var(--bg-elevated)" : "var(--accent)",
              color: isAiGenerating || !topicInput.trim() ? "var(--text-muted)" : "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: isAiGenerating || !topicInput.trim() ? "not-allowed" : "pointer",
              boxShadow: isAiGenerating || !topicInput.trim() ? "none" : "0 4px 16px rgba(34, 197, 94, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={16} />
            <span>{isAiGenerating ? "Generating Lesson…" : "Generate Lesson"}</span>
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#ef4444",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Suggestion Quick Chips */}
        <div>
          <p
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              color: "var(--text-muted)",
              margin: "0 0 8px",
            }}
          >
            Quick Topic Ideas
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTED_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCreate(topic)}
                disabled={isAiGenerating}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  cursor: isAiGenerating ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              >
                + {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Existing Custom Lessons Grid */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 750, color: "var(--text-primary)", margin: 0 }}>
            Your Generated Lessons ({customLessons.length})
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Saved to your profile
          </span>
        </div>

        {customLessons.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              borderRadius: 18,
              background: "var(--bg-elevated)",
              border: "1px dashed var(--border-subtle)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "var(--bg-card)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Compass size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 750, color: "var(--text-primary)" }}>
                No custom lessons yet
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", maxWidth: 420 }}>
                Enter any situation above or click one of the quick suggestions to create your very first personalized AI practice session!
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {customLessons.map((lesson) => {
              const isCompleted = completedLessonIds.includes(lesson._id);
              return (
                <div
                  key={lesson._id}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 14,
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "var(--card-shadow)",
                    transition: "all 0.18s ease",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--accent-bg)",
                          color: "var(--accent)",
                        }}
                      >
                        AI Lesson
                      </span>
                      {isCompleted && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          <CheckCircle2 size={12} /> Practiced
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 750,
                        color: "var(--text-primary)",
                        margin: "0 0 4px",
                      }}
                    >
                      {lesson.title}
                    </h3>
                    {lesson.phrase && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          margin: 0,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {lesson.phrase}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/practice/${lesson._id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 650,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent)";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-elevated)";
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.borderColor = "var(--border-default)";
                    }}
                  >
                    <Play size={13} />
                    <span>Practice Dialogue</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
