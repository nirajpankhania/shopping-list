import type { Ingredient, Recipe, RecipeIngredient } from "../repo/types";
import type { ParsedRecipe } from "../llm/schema";
import { UNITS } from "../units";
import { aisleForCategory } from "../aisles/aisles";
import { densityFor } from "./densities";

export interface SaveInput {
  recipe: Recipe;
  newIngredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
}

/** Deterministic id from a name, so re-parsing the same ingredient reuses it. */
function slugId(prefix: string, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `${prefix}_${slug}`;
}

/**
 * Map a validated LLM parse onto domain entities. Matched ingredients (id in the
 * catalog) are linked as-is. Misses become new, unverified ingredients: unit
 * family from the pack unit, aisle from the category, density from the curated
 * map, pack from the LLM. All deterministic — no maths, no invented densities.
 */
export function resolveParsedRecipe(parsed: ParsedRecipe, catalogIds: Set<string>): SaveInput {
  const recipeId = slugId("rec", parsed.title);
  const recipe: Recipe = {
    id: recipeId,
    title: parsed.title,
    servingsOriginal: parsed.servings,
    servingsTarget: parsed.servings,
  };

  const newById = new Map<string, Ingredient>();
  const recipeIngredients: RecipeIngredient[] = [];

  parsed.ingredients.forEach((item, index) => {
    const matched =
      item.matchedIngredientId !== null && catalogIds.has(item.matchedIngredientId);
    const ingredientId = matched
      ? item.matchedIngredientId!
      : slugId("ing", item.canonicalName);

    if (!matched && !newById.has(ingredientId)) {
      const packDef = UNITS[item.packUnit];
      newById.set(ingredientId, {
        id: ingredientId,
        canonicalName: item.canonicalName,
        unitFamily: packDef.family,
        aisle: aisleForCategory(item.category),
        densityGPerMl: densityFor(item.canonicalName),
        packSize: item.packSize,
        packUnit: item.packUnit,
        packLabel: item.packLabel,
        unverified: true,
      });
    }

    recipeIngredients.push({
      id: `${recipeId}_ri_${index}`,
      recipeId,
      rawText: item.rawText,
      quantity: item.quantity,
      unit: item.unit,
      ingredientId,
      note: item.note,
    });
  });

  return { recipe, newIngredients: [...newById.values()], recipeIngredients };
}
