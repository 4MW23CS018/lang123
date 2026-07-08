import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Prices for items
export const PRICES = {
  streak_freeze: 50,
  border_neon: 100,
  border_gold: 250,
  border_fire: 500,
};

export const buyItem = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.string(), // 'streak_freeze', 'border_neon', etc.
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

    // Process the purchase
    const updates = { gems: currentGems - price };

    if (args.itemId === "streak_freeze") {
      updates.streakFreezes = (user.streakFreezes || 0) + 1;
    } else if (args.itemId.startsWith("border_")) {
      const unlockedBorders = user.unlockedBorders || [];
      if (unlockedBorders.includes(args.itemId)) {
        throw new Error("You already own this border");
      }
      updates.unlockedBorders = [...unlockedBorders, args.itemId];
      updates.equippedBorder = args.itemId; // auto-equip
    }

    await ctx.db.patch(args.userId, updates);
    return { success: true, message: "Purchase successful!" };
  }
});

export const equipBorder = mutation({
  args: {
    userId: v.id("users"),
    borderId: v.string(), // or empty string to unequip
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (args.borderId !== "") {
      const unlocked = user.unlockedBorders || [];
      if (!unlocked.includes(args.borderId)) {
        throw new Error("You do not own this border");
      }
    }

    await ctx.db.patch(args.userId, { equippedBorder: args.borderId });
    return { success: true };
  }
});
