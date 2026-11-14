import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../components/hooks/useLanguage";
import {
  CATEGORIES,
  buildCategoryTree,
  getCategoriesStats,
  getOverallLanguageStats,
} from "../data/treeCurriculum";
import LessonProgressHeader from "../components/lessons/LessonProgressHeader";
import CategorySelector from "../components/lessons/CategorySelector";
import PhraseTree from "../components/lessons/PhraseTree";
import PhraseDetailsPanel from "../components/lessons/PhraseDetailsPanel";
import { Sparkles, Bot } from "lucide-react";

/**
 * CustomLessonRow
 * Renders user-generated AI lessons in a neat row.
 */
function CustomLessonRow({ lesson, color = "var(--accent)" }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Link to={`/practice/${lesson._id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          borderRadius: 14,
          background: isHovered ? "var(--bg-elevated)" : "var(--bg-base)",
          border: `1px ${isHovered ? "solid var(--accent)" : "dashed var(--border-subtle)"}`,
          transition: "all 0.18s ease-out",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent-bg)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bot size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 700,
              margin: "0 0 3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lesson.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--accent-bg)",
                color: "var(--accent)",
              }}
            >
              AI Generated
            </span>
            {lesson.phrase && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lesson.phrase}
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            color: isHovered ? color : "var(--text-faint)",
            fontSize: 15,
            transition: "transform 0.15s",
            transform: isHovered ? "translateX(3px)" : "none",
            display: "inline-block",
          }}
        >
          →
        </span>
      </div>
    </Link>
  );
}

/**
 * Lessons Page
 * Interactive Contextual Branching Conversational Phrase Tree Map
 */
export default function Lessons() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const storedUserName = localStorage.getItem("userName");
  const { language } = useLanguage();

  // Convex Subscriptions
  const lessons = useQuery(api.lessons.listByLanguage, { language });
  const completedLessonIds = useQuery(api.progress.getCompletedLessonIds, { userId }) || [];
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  // Determine user's real name for conversational personalization
  const userName = user?.name || storedUserName || "Friend";

  // AI Actions
  const generateLesson = useAction(api.ai.generateCustomLesson);
  const createLesson = useMutation(api.lessons.create);

  // Category Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState("greetings");
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Overall & Category Progress Calculations with personalized name
  const categoriesStats = useMemo(() => {
    return getCategoriesStats(language, completedLessonIds, lessons || [], userName);
  }, [language, completedLessonIds, lessons, userName]);

  const overallStats = useMemo(() => {
    return getOverallLanguageStats(language, completedLessonIds, lessons || [], userName);
  }, [language, completedLessonIds, lessons, userName]);

  // Active Category Meta & Tree
  const currentCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCategoryId) || CATEGORIES[0];
  }, [selectedCategoryId]);

  const currentCategoryTree = useMemo(() => {
    return buildCategoryTree(language, selectedCategoryId, completedLessonIds, lessons || [], userName);
  }, [language, selectedCategoryId, completedLessonIds, lessons, userName]);

  // Auto-select initial node if none selected or on category change
  useEffect(() => {
    if (currentCategoryTree.allNodes.length > 0) {
      const initial =
        currentCategoryTree.allNodes.find((n) => n.status === "current") ||
        currentCategoryTree.allNodes.find((n) => n.status === "available") ||
        currentCategoryTree.roots[0] ||
        currentCategoryTree.allNodes[0];

      setSelectedNode(initial || null);
    } else {
      setSelectedNode(null);
      setIsDetailsOpen(false);
    }
  }, [selectedCategoryId, currentCategoryTree]);

  // Node Click Handler
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsDetailsOpen(true);
  };

  // AI Custom Lesson Generator
  const handleGenerateAiLesson = () => {
    const topic = prompt(
      `What would you like to practice in ${language}? (e.g., 'Ordering masala dosa at a restaurant', 'Asking for bus fare', or 'Friendly workplace greeting')`
    );
    if (!topic || !topic.trim()) return;

    setIsAiGenerating(true);
    generateLesson({ language, topic: topic.trim() })
      .then((newLesson) => {
        return createLesson({ ...newLesson, isCustom: true });
      })
      .then((id) => {
        setIsAiGenerating(false);
        navigate(`/practice/${id}`);
      })
      .catch((err) => {
        setIsAiGenerating(false);
        alert(`Failed to generate lesson: ${err.message}`);
      });
  };

  // Custom AI Lessons
  const customLessons = useMemo(() => {
    return (lessons || []).filter((l) => l.isCustom);
  }, [lessons]);

  // Loading state
  if (lessons === undefined) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 600 }}>
          Building {language} conversational phrase tree…
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px 20px 100px",
        maxWidth: 1240,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* 1. Header with Language Mastery, Streak & Stats */}
      <LessonProgressHeader
        language={language}
        overallProgress={overallStats.percentage}
        completedPhrases={overallStats.completedPhrases}
        totalPhrases={overallStats.totalPhrases}
        userStreak={user?.streak ?? 0}
        userPoints={user?.points ?? 0}
      />

      {/* 2. Interactive Category Carousel (12 Categories) */}
      <CategorySelector
        categories={categoriesStats}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
        }}
      />

      {/* 3. Main Contextual Phrase Tree Canvas / Branch View */}
      <PhraseTree
        categoryTree={currentCategoryTree}
        selectedNode={selectedNode}
        onSelectNode={handleNodeClick}
        category={currentCategory}
        language={language}
        onOpenAiPrompt={handleGenerateAiLesson}
      />

      {/* 4. Slide-over Details Drawer */}
      {isDetailsOpen && selectedNode && (
        <PhraseDetailsPanel
          node={selectedNode}
          onClose={() => setIsDetailsOpen(false)}
          onSelectNode={(newNode) => setSelectedNode(newNode)}
          category={currentCategory}
          language={language}
          allNodes={currentCategoryTree.allNodes}
        />
      )}

      {/* 5. AI Custom Lessons & Extra Practice Section */}
      <div
        style={{
          marginTop: 20,
          padding: "28px 24px",
          borderRadius: 20,
          background: "var(--bg-elevated)",
          border: "1px dashed var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <h3
              style={{
                color: "var(--text-primary)",
                fontSize: 18,
                fontWeight: 800,
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={18} color="var(--accent)" />
              Custom Conversational Practice
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
              Need to learn a specific dialogue or situational topic? Generate an authentic AI lesson tailored for you.
            </p>
          </div>

          <button
            onClick={handleGenerateAiLesson}
            disabled={isAiGenerating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: isAiGenerating ? "wait" : "pointer",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            <Bot size={16} />
            <span>{isAiGenerating ? "Generating Dialogue…" : "Generate AI Lesson"}</span>
          </button>
        </div>

        {/* Existing Custom Lessons List */}
        {customLessons.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Your Custom Lessons ({customLessons.length})
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {customLessons.map((lesson) => (
                <CustomLessonRow key={lesson._id} lesson={lesson} color="var(--accent)" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
