// src/data/treeCurriculum.js
/**
 * LangBridge Interactive Branching Phrase Tree Curriculum
 * Master curriculum registry and hierarchical graph utilities.
 */

import { KANNADA_CURRICULUM } from "./languages/kannada.js";
import { TAMIL_CURRICULUM } from "./languages/tamil.js";
import { TELUGU_CURRICULUM } from "./languages/telugu.js";
import { MALAYALAM_CURRICULUM } from "./languages/malayalam.js";
import { TULU_CURRICULUM } from "./languages/tulu.js";
import { KODAVA_CURRICULUM } from "./languages/kodava.js";

export const CATEGORIES = [
  {
    id: "greetings",
    name: "Greetings & Introductions",
    icon: "Handshake",
    description: "Everyday welcomes, polite introductions, and first meetings",
    color: "#22c55e",
    accentBg: "rgba(34, 197, 94, 0.12)",
    accentBorder: "rgba(34, 197, 94, 0.25)",
  },
  {
    id: "conversations",
    name: "Everyday Conversations",
    icon: "MessageCircle",
    description: "Common check-ins, casual inquiries, and daily social banter",
    color: "#3b82f6",
    accentBg: "rgba(59, 130, 246, 0.12)",
    accentBorder: "rgba(59, 130, 246, 0.25)",
  },
  {
    id: "family",
    name: "Family & Relationships",
    icon: "Users",
    description: "Speaking about parents, siblings, relatives, and loved ones",
    color: "#ec4899",
    accentBg: "rgba(236, 72, 153, 0.12)",
    accentBorder: "rgba(236, 72, 153, 0.25)",
  },
  {
    id: "food",
    name: "Food & Dining",
    icon: "Utensils",
    description: "Ordering meals, asking for items, flavors, and bills",
    color: "#f59e0b",
    accentBg: "rgba(245, 158, 11, 0.12)",
    accentBorder: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: "shopping",
    name: "Shopping & Money",
    icon: "ShoppingBag",
    description: "Bargaining, inquiring prices, sizes, and making payments",
    color: "#8b5cf6",
    accentBg: "rgba(139, 92, 246, 0.12)",
    accentBorder: "rgba(139, 92, 246, 0.25)",
  },
  {
    id: "travel",
    name: "Travel & Transportation",
    icon: "Bus",
    description: "Buses, autos, train stations, tickets, and fares",
    color: "#06b6d4",
    accentBg: "rgba(6, 182, 212, 0.12)",
    accentBorder: "rgba(6, 182, 212, 0.25)",
  },
  {
    id: "directions",
    name: "Directions & Locations",
    icon: "Compass",
    description: "Asking for places, turns, distances, and nearby landmarks",
    color: "#14b8a6",
    accentBg: "rgba(20, 184, 166, 0.12)",
    accentBorder: "rgba(20, 184, 166, 0.25)",
  },
  {
    id: "education",
    name: "Education & College",
    icon: "GraduationCap",
    description: "Classrooms, exams, asking doubts, and student life",
    color: "#6366f1",
    accentBg: "rgba(99, 102, 241, 0.12)",
    accentBorder: "rgba(99, 102, 241, 0.25)",
  },
  {
    id: "work",
    name: "Work & Profession",
    icon: "Briefcase",
    description: "Office interactions, careers, meetings, and assistance",
    color: "#d97706",
    accentBg: "rgba(217, 119, 6, 0.12)",
    accentBorder: "rgba(217, 119, 6, 0.25)",
  },
  {
    id: "health",
    name: "Health & Emergencies",
    icon: "HeartPulse",
    description: "Describing symptoms, consulting doctors, and urgent help",
    color: "#ef4444",
    accentBg: "rgba(239, 68, 68, 0.12)",
    accentBorder: "rgba(239, 68, 68, 0.25)",
  },
  {
    id: "time",
    name: "Time & Daily Routine",
    icon: "Clock",
    description: "Telling time, morning routines, appointments, and schedules",
    color: "#84cc16",
    accentBg: "rgba(132, 204, 22, 0.12)",
    accentBorder: "rgba(132, 204, 22, 0.25)",
  },
  {
    id: "social",
    name: "Social Conversations",
    icon: "Sparkles",
    description: "Gratitude, apologies, festive congratulations, and good wishes",
    color: "#a855f7",
    accentBg: "rgba(168, 85, 247, 0.12)",
    accentBorder: "rgba(168, 85, 247, 0.25)",
  },
];

export const RAW_CURRICULUM_BY_LANG = {
  Kannada: KANNADA_CURRICULUM,
  Tamil: TAMIL_CURRICULUM,
  Telugu: TELUGU_CURRICULUM,
  Malayalam: MALAYALAM_CURRICULUM,
  Tulu: TULU_CURRICULUM,
  Kodava: KODAVA_CURRICULUM,
};

/**
 * Personalizes phrase text, replacing {Name} or placeholder names with the real logged-in username.
 */
export function personalizePhrase(text, userName) {
  if (!text || typeof text !== "string") return text;
  const nameToUse = userName && userName.trim() ? userName.trim() : "Friend";
  return text
    .replace(/{Name}/g, nameToUse)
    .replace(/{userName}/g, nameToUse);
}

/**
 * Normalizes a list of phrases for a language and combines them with real database documents.
 * Ensures every node has a resolved lesson `_id` where available.
 */
export function getUnifiedLessons(language, dbLessons = [], userName = "") {
  const rawList = RAW_CURRICULUM_BY_LANG[language] || [];
  
  // Build lookup of DB lessons by nodeKey, or by (language + phrase)
  const dbByKey = new Map();
  const dbByPhrase = new Map();
  for (const l of dbLessons) {
    if (l.nodeKey) dbByKey.set(l.nodeKey, l);
    if (l.phrase) dbByPhrase.set(l.phrase.trim(), l);
  }

  // Map raw static curriculum with DB records and substitute username
  return rawList.map((item) => {
    const matchedDb = dbByKey.get(item.nodeKey) || dbByPhrase.get(item.phrase?.trim());
    return {
      ...item,
      language,
      phrase: personalizePhrase(item.phrase, userName),
      displayPhrase: personalizePhrase(item.displayPhrase || item.phrase, userName),
      phonetics: personalizePhrase(item.phonetics, userName),
      meaning: personalizePhrase(item.meaning, userName),
      title: personalizePhrase(item.title, userName),
      context: personalizePhrase(item.context, userName),
      _id: matchedDb ? matchedDb._id : `curriculum_${item.nodeKey}`,
      dbLessonId: matchedDb ? matchedDb._id : null,
      unit: item.unit || 1,
      topic: item.topic || item.categoryId,
    };
  });
}

/**
 * Returns all lesson nodes belonging to a particular category.
 */
export function getCategoryLessons(language, categoryId, dbLessons = [], userName = "") {
  const unified = getUnifiedLessons(language, dbLessons, userName);
  return unified.filter((item) => item.categoryId === categoryId);
}

/**
 * Builds the hierarchical branching tree structure for a given category.
 * Calculates:
 *  - status: "completed" | "available" | "locked" | "current"
 *  - prerequisite: info on which parent must be completed
 *  - children: array of child node trees
 */
export function buildCategoryTree(language, categoryId, completedLessonIds = [], dbLessons = [], userName = "") {
  const items = getCategoryLessons(language, categoryId, dbLessons, userName);
  if (items.length === 0) return { roots: [], allNodes: [], completedCount: 0, totalCount: 0 };

  const completedSet = new Set(completedLessonIds.map(String));
  const nodeMap = new Map();

  // First pass: initialize all nodes
  for (const item of items) {
    nodeMap.set(item.nodeKey, {
      ...item,
      children: [],
      isCompleted: false,
      isUnlocked: false,
      status: "locked",
      prerequisite: null,
    });
  }

  // Second pass: determine completion status
  for (const node of nodeMap.values()) {
    // Check if node is completed in DB
    const isCompleted = (node.dbLessonId && completedSet.has(String(node.dbLessonId))) ||
                        completedSet.has(String(node._id));
    node.isCompleted = isCompleted;
  }

  // Third pass: determine unlocking hierarchy
  // Rule:
  //  1. Roots (parentKey is null) are always unlocked.
  //  2. Children are unlocked IF their parent is completed.
  for (const node of nodeMap.values()) {
    if (!node.parentKey) {
      node.isUnlocked = true;
    } else {
      const parent = nodeMap.get(node.parentKey);
      if (parent) {
        node.isUnlocked = parent.isCompleted;
        if (!parent.isCompleted) {
          node.prerequisite = {
            nodeKey: parent.nodeKey,
            title: parent.title,
            phrase: parent.phrase,
          };
        }
      } else {
        // Fallback: if parent not found in this category, unlock
        node.isUnlocked = true;
      }
    }

    if (node.isCompleted) {
      node.status = "completed";
    } else if (node.isUnlocked) {
      node.status = "available";
    } else {
      node.status = "locked";
    }
  }

  // Fourth pass: build parent -> children tree
  const roots = [];
  for (const node of nodeMap.values()) {
    if (!node.parentKey) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentKey);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  // Mark the first available uncompleted node as "current" if needed
  let hasCurrent = false;
  for (const node of nodeMap.values()) {
    if (node.status === "available" && !hasCurrent) {
      node.status = "current";
      hasCurrent = true;
    }
  }

  const allNodes = Array.from(nodeMap.values());
  const completedCount = allNodes.filter((n) => n.isCompleted).length;
  const totalCount = allNodes.length;

  return {
    roots,
    allNodes,
    completedCount,
    totalCount,
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

/**
 * Computes progress stats for all 12 categories for a language.
 */
export function getCategoriesStats(language, completedLessonIds = [], dbLessons = [], userName = "") {
  return CATEGORIES.map((cat) => {
    const tree = buildCategoryTree(language, cat.id, completedLessonIds, dbLessons, userName);
    return {
      ...cat,
      totalPhrases: tree.totalCount,
      completedPhrases: tree.completedCount,
      progressPercent: tree.progressPercent,
      isMastered: tree.totalCount > 0 && tree.completedCount === tree.totalCount,
      isStarted: tree.completedCount > 0,
      hasPhrases: tree.totalCount > 0,
    };
  });
}

/**
 * Overall summary progress for the learning language.
 */
export function getOverallLanguageStats(language, completedLessonIds = [], dbLessons = [], userName = "") {
  const unified = getUnifiedLessons(language, dbLessons, userName);
  const completedSet = new Set(completedLessonIds.map(String));

  const totalPhrases = unified.length;
  const completedPhrases = unified.filter(
    (item) => (item.dbLessonId && completedSet.has(String(item.dbLessonId))) || completedSet.has(String(item._id))
  ).length;

  const percentage = totalPhrases > 0 ? Math.round((completedPhrases / totalPhrases) * 100) : 0;

  return {
    totalPhrases,
    completedPhrases,
    percentage,
  };
}
