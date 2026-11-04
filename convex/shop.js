import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Prices for items (in Gems)
export const PRICES = {
  // Utilities
  streak_freeze: 50,

  // Avatar Frames
  border_neon: 100,
  border_gold: 250,
  border_fire: 500,
  border_amethyst: 350,
  border_cosmic: 450,

  // Profile Banners
  banner_synthwave: 150,
  banner_cosmic: 300,
  banner_inferno: 450,
  banner_sakura: 250,
  banner_temple: 400,
};

export const buyItem = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.string(), // 'streak_freeze', 'border_neon', 'banner_synthwave', etc.
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const price = PRICES[args.itemId];
    if (price === undefined) throw new Error("Invalid item ID");

    const currentGems = user.gems || 0;
    if (currentGems < price) {
      throw new Error("Not enough gems");
    }

    const updates = { gems: currentGems - price };

    if (args.itemId === "streak_freeze") {
      updates.streakFreezes = (user.streakFreezes || 0) + 1;
    } else if (args.itemId.startsWith("border_")) {
      const unlockedBorders = user.unlockedBorders || ["border_default"];
      if (unlockedBorders.includes(args.itemId)) {
        throw new Error("You already own this avatar frame");
      }
      updates.unlockedBorders = [...unlockedBorders, args.itemId];
      updates.equippedBorder = args.itemId; // auto-equip on purchase
    } else if (args.itemId.startsWith("banner_")) {
      const unlockedBanners = user.unlockedBanners || ["banner_default"];
      if (unlockedBanners.includes(args.itemId)) {
        throw new Error("You already own this profile banner");
      }
      updates.unlockedBanners = [...unlockedBanners, args.itemId];
      updates.equippedBanner = args.itemId; // auto-equip on purchase
    }

    await ctx.db.patch(args.userId, updates);
    return { success: true, message: "Purchase successful!" };
  },
});

export const equipBorder = mutation({
  args: {
    userId: v.id("users"),
    borderId: v.string(), // or "border_default"
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const target = args.borderId || "border_default";
    if (target !== "border_default") {
      const unlocked = user.unlockedBorders || ["border_default"];
      if (!unlocked.includes(target)) {
        throw new Error("You do not own this avatar frame");
      }
    }

    await ctx.db.patch(args.userId, { equippedBorder: target });
    return { success: true };
  },
});

export const equipBanner = mutation({
  args: {
    userId: v.id("users"),
    bannerId: v.string(), // or "banner_default"
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const target = args.bannerId || "banner_default";
    if (target !== "banner_default") {
      const unlocked = user.unlockedBanners || ["banner_default"];
      if (!unlocked.includes(target)) {
        throw new Error("You do not own this profile banner");
      }
    }

    await ctx.db.patch(args.userId, { equippedBanner: target });
    return { success: true };
  },
});
