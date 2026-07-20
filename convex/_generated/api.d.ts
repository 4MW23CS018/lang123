/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as chatMessages from "../chatMessages.js";
import type * as chatbot from "../chatbot.js";
import type * as gamification from "../gamification.js";
import type * as http from "../http.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as lessons from "../lessons.js";
import type * as listUsers from "../listUsers.js";
import type * as preferences from "../preferences.js";
import type * as progress from "../progress.js";
import type * as quests from "../quests.js";
import type * as seedLessons from "../seedLessons.js";
import type * as seedPath from "../seedPath.js";
import type * as shop from "../shop.js";
import type * as speech from "../speech.js";
import type * as srs from "../srs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  chatMessages: typeof chatMessages;
  chatbot: typeof chatbot;
  gamification: typeof gamification;
  http: typeof http;
  knowledgeBase: typeof knowledgeBase;
  lessons: typeof lessons;
  listUsers: typeof listUsers;
  preferences: typeof preferences;
  progress: typeof progress;
  quests: typeof quests;
  seedLessons: typeof seedLessons;
  seedPath: typeof seedPath;
  shop: typeof shop;
  speech: typeof speech;
  srs: typeof srs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
