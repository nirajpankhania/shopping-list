import type {
  Repository,
  Recipe,
  RecipeIngredient,
  Ingredient,
  ListOverride,
  OverridePatch,
} from "./types";
import {
  SEED_RECIPES,
  SEED_INGREDIENTS,
  SEED_RECIPE_INGREDIENTS,
} from "./seed-data";

/**
 * In-memory Repository seeded with a few demo recipes. Zero infrastructure —
 * the demo fallback used when DATABASE_URL is not set, and in tests. Reads
 * return copies so callers can't mutate the store by accident.
 */
export class InMemoryRepository implements Repository {
  private readonly recipes: Recipe[] = [...SEED_RECIPES];
  private readonly recipeIngredients: RecipeIngredient[] = [...SEED_RECIPE_INGREDIENTS];
  private readonly ingredients: Ingredient[] = [...SEED_INGREDIENTS];
  private readonly overrides = new Map<string, ListOverride>();

  async getRecipes(): Promise<Recipe[]> {
    return [...this.recipes];
  }

  async getRecipeIngredients(): Promise<RecipeIngredient[]> {
    return [...this.recipeIngredients];
  }

  async getIngredients(): Promise<Ingredient[]> {
    return [...this.ingredients];
  }

  async getOverrides(): Promise<ListOverride[]> {
    return [...this.overrides.values()];
  }

  async setOverride(ingredientId: string, patch: OverridePatch): Promise<void> {
    const current = this.overrides.get(ingredientId) ?? {
      ingredientId,
      checked: false,
      alreadyHave: false,
    };
    this.overrides.set(ingredientId, { ...current, ...patch });
  }
}
