// scripts/seedCurriculum.mjs
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { RAW_CURRICULUM_BY_LANG } from "../src/data/treeCurriculum.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

async function main() {
  console.log("Connecting to Convex at:", process.env.VITE_CONVEX_URL);
  
  for (const [lang, items] of Object.entries(RAW_CURRICULUM_BY_LANG)) {
    if (!items || items.length === 0) continue;
    console.log(`Seeding ${items.length} phrases for ${lang}...`);

    const formatted = items.map(item => ({
      ...item,
      language: lang,
    }));

    // Seed in batches of 40 to avoid payload limits
    const BATCH_SIZE = 40;
    for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
      const batch = formatted.slice(i, i + BATCH_SIZE);
      const res = await client.mutation(api.lessons.batchSeedTreeLessons, { lessons: batch });
      console.log(`  Seeded batch ${Math.floor(i / BATCH_SIZE) + 1} (${res.seededCount} items)`);
    }
  }

  console.log("All language tree curricula seeded successfully!");
}

main().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

