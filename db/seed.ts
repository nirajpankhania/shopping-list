import { config } from "dotenv";
config({ path: ".env.local" }); // load DATABASE_URL for this standalone script

import { createDb } from "./client";
import { recipes, ingredients, recipeIngredients, listOverrides } from "./schema";
import {
  SEED_RECIPES,
  SEED_INGREDIENTS,
  SEED_RECIPE_INGREDIENTS,
} from "../lib/repo/seed-data";

async function seed(): Promise<void> {
  const db = createDb();

  // Clear in FK-safe order, then insert in FK-safe order. Idempotent.
  await db.delete(listOverrides);
  await db.delete(recipeIngredients);
  await db.delete(recipes);
  await db.delete(ingredients);

  await db.insert(ingredients).values(SEED_INGREDIENTS);
  await db.insert(recipes).values(SEED_RECIPES);
  await db.insert(recipeIngredients).values(SEED_RECIPE_INGREDIENTS);

  console.log(
    `Seeded ${SEED_RECIPES.length} recipes, ${SEED_INGREDIENTS.length} ingredients, ${SEED_RECIPE_INGREDIENTS.length} recipe-ingredients.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
