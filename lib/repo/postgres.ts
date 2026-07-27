import { createDb, type Db } from "../../db/client";
import { recipes, ingredients, recipeIngredients, listOverrides } from "../../db/schema";
import type {
  Repository,
  Recipe,
  RecipeIngredient,
  Ingredient,
  ListOverride,
  OverridePatch,
} from "./types";

/**
 * Repository backed by Neon Postgres via Drizzle. Same contract as the in-memory
 * adapter — nothing outside lib/repo and db/ touches SQL. Nullable columns are
 * mapped back to the domain's optional (`undefined`) fields.
 */
export class PostgresRepository implements Repository {
  private readonly db: Db;

  constructor() {
    this.db = createDb();
  }

  async getRecipes(): Promise<Recipe[]> {
    const rows = await this.db.select().from(recipes);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      sourceUrl: r.sourceUrl ?? undefined,
      servingsOriginal: r.servingsOriginal,
      servingsTarget: r.servingsTarget,
    }));
  }

  async getRecipeIngredients(): Promise<RecipeIngredient[]> {
    const rows = await this.db.select().from(recipeIngredients);
    return rows.map((r) => ({
      id: r.id,
      recipeId: r.recipeId,
      rawText: r.rawText,
      quantity: r.quantity,
      unit: r.unit,
      ingredientId: r.ingredientId,
      note: r.note ?? undefined,
    }));
  }

  async getIngredients(): Promise<Ingredient[]> {
    const rows = await this.db.select().from(ingredients);
    return rows.map((r) => ({
      id: r.id,
      canonicalName: r.canonicalName,
      unitFamily: r.unitFamily,
      aisle: r.aisle,
      densityGPerMl: r.densityGPerMl ?? undefined,
      packSize: r.packSize,
      packUnit: r.packUnit,
      packLabel: r.packLabel,
      unverified: r.unverified,
    }));
  }

  async getOverrides(): Promise<ListOverride[]> {
    const rows = await this.db.select().from(listOverrides);
    return rows.map((r) => ({
      ingredientId: r.ingredientId,
      checked: r.checked,
      alreadyHave: r.alreadyHave,
    }));
  }

  async setOverride(ingredientId: string, patch: OverridePatch): Promise<void> {
    // Upsert with merge semantics: on insert, unspecified fields default to
    // false; on conflict, only the provided fields are updated.
    await this.db
      .insert(listOverrides)
      .values({
        ingredientId,
        checked: patch.checked ?? false,
        alreadyHave: patch.alreadyHave ?? false,
      })
      .onConflictDoUpdate({
        target: listOverrides.ingredientId,
        set: {
          ...(patch.checked !== undefined ? { checked: patch.checked } : {}),
          ...(patch.alreadyHave !== undefined ? { alreadyHave: patch.alreadyHave } : {}),
        },
      });
  }

  async saveRecipe(input: {
    recipe: Recipe;
    newIngredients: Ingredient[];
    recipeIngredients: RecipeIngredient[];
  }): Promise<void> {
    // Insert in FK-safe order. New ingredients may already exist (same slug id)
    // from a prior parse, so ignore conflicts. neon-http runs these sequentially.
    if (input.newIngredients.length > 0) {
      await this.db.insert(ingredients).values(input.newIngredients).onConflictDoNothing();
    }
    await this.db.insert(recipes).values(input.recipe).onConflictDoNothing();
    if (input.recipeIngredients.length > 0) {
      await this.db.insert(recipeIngredients).values(input.recipeIngredients).onConflictDoNothing();
    }
  }
}
