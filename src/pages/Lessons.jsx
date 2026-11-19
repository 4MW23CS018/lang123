import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
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

/**
 * Lessons Page
 * Interactive Contextual Branching Conversational Phrase Tree Map
 */
export default function Lessons() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const storedUserName = localStorage.getItem("userName");
  const { language, current: languageMeta } = useLanguage();

  // Convex Subscriptions
  const lessons = useQuery(api.lessons.listByLanguage, { language });
  const rawCompleted = useQuery(api.progress.getCompletedLessonIds, { userId });
  const completedLessonIds = useMemo(() => rawCompleted || [], [rawCompleted]);
  const user = useQuery(api.users.get, userId ? { userId } : "skip");

  // Determine user's real name for conversational personalization
  const userName = user?.name || storedUserName || "Friend";

  // Category Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState("greetings");
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // Stable selection of node without triggering render loops
  useEffect(() => {
    if (currentCategoryTree.allNodes.length > 0) {
      setSelectedNode((prev) => {
        if (prev && currentCategoryTree.allNodes.some((n) => n.nodeKey === prev.nodeKey)) {
          return prev;
        }
        return (
          currentCategoryTree.allNodes.find((n) => n.status === "current") ||
          currentCategoryTree.allNodes.find((n) => n.status === "available") ||
          currentCategoryTree.roots[0] ||
          currentCategoryTree.allNodes[0] ||
          null
        );
      });
    } else {
      setSelectedNode(null);
      setIsDetailsOpen(false);
    }
  }, [selectedCategoryId, currentCategoryTree.allNodes.length]);

  // Close details panel and sync browser history cleanly
  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    if (window.history.state?.modal === "phraseDetails") {
      try {
        window.history.back();
      } catch {}
    }
  };

  // Handle browser back gesture / button & Escape key to close open details panel smoothly without freezing
  useEffect(() => {
    const handlePopState = () => {
      setIsDetailsOpen(false);
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseDetails();
    };
    window.addEventListener("popstate", handlePopState, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, []);

  // Node Click Handler with history state support for mobile back gesture
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsDetailsOpen(true);
    try {
      window.history.pushState({ modal: "phraseDetails" }, "");
    } catch {}
  };

  // Navigate to AI Custom Lessons Page
  const handleOpenCustomLessons = () => {
    navigate("/custom-lessons");
  };

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
        padding: "16px 20px 80px",
        maxWidth: 1240,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* 1. Clean Compact Header with Custom Lessons Link */}
      <LessonProgressHeader
        language={language}
        languageMeta={languageMeta}
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
        onOpenAiPrompt={handleOpenCustomLessons}
      />

      {/* 4. Slide-over Details Drawer */}
      {isDetailsOpen && selectedNode && (
        <PhraseDetailsPanel
          node={selectedNode}
          onClose={handleCloseDetails}
          onSelectNode={(newNode) => setSelectedNode(newNode)}
          category={currentCategory}
          language={language}
          allNodes={currentCategoryTree.allNodes}
        />
      )}
    </div>
  );
}
