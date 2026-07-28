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
  /** A user-set amount that replaces the recipe-derived requirement. null = use
   *  the derived amount. When set, the pantry is not subtracted — it's an
   *  explicit "buy this much". */
  manualQuantity: number | null;
  manualUnit: string | null;
  /** true drops the line from the list (recoverable from the Removed section). */
  removed: boolean;
}

/** A partial update. null clears a manual amount; omitting a field leaves it. */
export type OverridePatch = {
  checked?: boolean;
  manualQuantity?: number | null;
  manualUnit?: string | null;
  removed?: boolean;
};

/**
 * Something the user has at home, entered by name (not tied to a recipe). The
 * list tags a recipe line "in pantry" when a pantry entry's name matches and its
 * quantity covers the need. Keyed by (normalised) name, so re-adding replaces.
 */
export interface PantryItem {
  name: string;
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
  removePantryItem(name: string): Promise<void>;
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
