import type { UnitFamily } from "../units";

export interface Recipe {
  id: string;
  title: string;
  sourceUrl?: string;
  servingsOriginal: number;
  servingsTarget: number;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  rawText: string;
  quantity: number;
  unit: string;
  ingredientId: string;
  note?: string;
}

export interface Ingredient {
  id: string;
  canonicalName: string;
  /**
   * The ingredient's natural family. Informational for now — the pack unit
   * drives the shopping family used for rounding, so this is not yet consulted.
   */
  unitFamily: UnitFamily;
  aisle: string;
  densityGPerMl?: number;
  packSize: number;
  packUnit: string;
  packLabel: string;
  /** true when the aisle/pack were LLM-guessed rather than curated. */
  unverified: boolean;
}

export interface ListOverride {
  ingredientId: string;
  checked: boolean;
}

export type OverridePatch = Partial<Pick<ListOverride, "checked">>;

/**
 * A quantity of an ingredient the user already has at home. The list subtracts
 * this from what recipes need. Keyed by ingredient, so there is one pantry
 * amount per ingredient; recording a new amount replaces the old one.
 */
export interface PantryItem {
  ingredientId: string;
  quantity: number;
  unit: string;
}

/**
 * A list entry the user added by hand — something no recipe produced (bin bags,
 * an extra pint of milk). It carries its own aisle and checked state and lives
 * alongside the recipe-derived lines in the projected list.
 */
export interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
  checked: boolean;
}

/**
 * The persistence boundary. Async so a Postgres adapter can drop in behind the
 * same interface later without changing any consumer. Nothing outside lib/repo
 * implements this or touches SQL.
 */
export interface Repository {
  getRecipes(): Promise<Recipe[]>;
  getRecipeIngredients(): Promise<RecipeIngredient[]>;
  getIngredients(): Promise<Ingredient[]>;
  getOverrides(): Promise<ListOverride[]>;
  setOverride(ingredientId: string, patch: OverridePatch): Promise<void>;
  getPantry(): Promise<PantryItem[]>;
  setPantryItem(item: PantryItem): Promise<void>;
  removePantryItem(ingredientId: string): Promise<void>;
  getManualItems(): Promise<ManualItem[]>;
  addManualItem(item: ManualItem): Promise<void>;
  setManualItemChecked(id: string, checked: boolean): Promise<void>;
  removeManualItem(id: string): Promise<void>;
  saveRecipe(input: {
    recipe: Recipe;
    newIngredients: Ingredient[];
    recipeIngredients: RecipeIngredient[];
  }): Promise<void>;
}
