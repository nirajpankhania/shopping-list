import type { UnitFamily } from "../units";

export interface Recipe {
  id: string;
  title: string;
  sourceUrl?: string;
  servingsOriginal: number;
  servingsTarget: number;
  /** How many of this recipe are on the list (people or days) — every quantity is
   *  multiplied by it. 0 means saved but off the list (no re-parse to add back). */
  scale: number;
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
   * The family you shop this ingredient in — flour in grams (MASS), milk in
   * millilitres (VOLUME). Consulted in lib/list/project to decide whether an
   * aggregated total is resolved into mass or volume via the density.
   */
  unitFamily: UnitFamily;
  aisle: string;
  densityGPerMl?: number;
  packSize: number;
  packUnit: string;
  packLabel: string;
}

export interface ListOverride {
  ingredientId: string;
  checked: boolean;
  /** A user-set amount that replaces the recipe-derived requirement. null = use
   *  the derived amount. It's an explicit "buy this much", so an edited line
   *  shows no pantry tag. */
  manualQuantity: number | null;
  manualUnit: string | null;
  /** true drops the line from the list. Permanent — to get it back, re-add it as
   *  a manual item. */
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

/** A manual item as stored inside a saved plan (no id/checked — those are minted
 *  fresh when the plan is applied). */
export interface PlanManualItem {
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
}

/**
 * A saved list: a named snapshot of which recipes are on at what scale, plus the
 * manual items, so it can be re-applied week to week. Snapshots by value, so it
 * survives recipe edits (missing recipes are simply skipped on apply).
 */
export interface Plan {
  id: string;
  name: string;
  recipeScales: Record<string, number>;
  manualItems: PlanManualItem[];
}

/**
 * The persistence boundary. Async so a Postgres adapter can drop in behind the
 * same interface later without changing any consumer. Nothing outside lib/repo
 * implements this or touches SQL.
 */
export interface Repository {
  getRecipes(): Promise<Recipe[]>;
  setRecipeScale(id: string, scale: number): Promise<void>;
  deleteRecipe(id: string): Promise<void>;
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
  getPlans(): Promise<Plan[]>;
  savePlan(plan: Plan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  saveRecipe(input: {
    recipe: Recipe;
    newIngredients: Ingredient[];
    recipeIngredients: RecipeIngredient[];
  }): Promise<void>;
}
