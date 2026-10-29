import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://moonlit-magpie-152.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export default convex;
