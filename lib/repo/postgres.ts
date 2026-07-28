import { eq } from "drizzle-orm";
import { createDb, type Db } from "../../db/client";
import { recipes, ingredients, recipeIngredients, listOverrides, pantry, manualItems } from "../../db/schema";
import type {
  Repository,
  Recipe,
  RecipeIngredient,
  Ingredient,
  ListOverride,
  OverridePatch,
  PantryItem,
  ManualItem,
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
    }));
  }

  async setOverride(ingredientId: string, patch: OverridePatch): Promise<void> {
    // Upsert: insert the row, or update only the provided fields on conflict.
    await this.db
      .insert(listOverrides)
      .values({
        ingredientId,
        checked: patch.checked ?? false,
      })
      .onConflictDoUpdate({
        target: listOverrides.ingredientId,
        set: {
          ...(patch.checked !== undefined ? { checked: patch.checked } : {}),
        },
      });
  }

  async getPantry(): Promise<PantryItem[]> {
    const rows = await this.db.select().from(pantry);
    return rows.map((r) => ({
      ingredientId: r.ingredientId,
      quantity: r.quantity,
      unit: r.unit,
    }));
  }

  async setPantryItem(item: PantryItem): Promise<void> {
    // One amount per ingredient: insert, or overwrite the existing row.
    await this.db
      .insert(pantry)
      .values(item)
      .onConflictDoUpdate({
        target: pantry.ingredientId,
        set: { quantity: item.quantity, unit: item.unit },
      });
  }

  async removePantryItem(ingredientId: string): Promise<void> {
    await this.db.delete(pantry).where(eq(pantry.ingredientId, ingredientId));
  }

  async getManualItems(): Promise<ManualItem[]> {
    const rows = await this.db.select().from(manualItems);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      quantity: r.quantity,
      unit: r.unit,
      aisle: r.aisle,
      checked: r.checked,
    }));
  }

  async addManualItem(item: ManualItem): Promise<void> {
    await this.db.insert(manualItems).values(item);
  }

  async setManualItemChecked(id: string, checked: boolean): Promise<void> {
    await this.db.update(manualItems).set({ checked }).where(eq(manualItems.id, id));
  }

  async removeManualItem(id: string): Promise<void> {
    await this.db.delete(manualItems).where(eq(manualItems.id, id));
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
