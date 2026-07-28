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

/** The meaningful words in a name, lowercased (single characters dropped). */
function words(name: string): Set<string> {
  return new Set(name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2));
}

/**
 * Whether two ingredient names share a word. The LLM occasionally maps an
 * ingredient onto an unrelated catalog entry (e.g. "milk" -> "plain flour");
 * if that entry has a density, the mismatched volume is then silently converted
 * to mass. Requiring a shared word rejects those gross mismatches while still
 * allowing genuine matches (which always share the head noun).
 */
function sharesWord(a: string, b: string): boolean {
  const wa = words(a);
  for (const w of words(b)) if (wa.has(w)) return true;
  return false;
}

/**
 * Map a validated LLM parse onto domain entities. Matched ingredients (id in the
 * catalog) are linked as-is. Misses become new ingredients: unit family from the
 * pack unit, aisle from the category, density from the curated map, pack from the
 * LLM. All deterministic — no maths, no invented densities.
 */
export function resolveParsedRecipe(
  parsed: ParsedRecipe,
  catalog: { id: string; canonicalName: string }[],
): SaveInput {
  const catalogNameById = new Map(catalog.map((c) => [c.id, c.canonicalName]));
  const recipeId = slugId("rec", parsed.title);
  const recipe: Recipe = {
    id: recipeId,
    title: parsed.title,
    servingsOriginal: parsed.servings,
    servingsTarget: parsed.servings,
    scale: 1,
  };

  const newById = new Map<string, Ingredient>();
  const recipeIngredients: RecipeIngredient[] = [];

  parsed.ingredients.forEach((item, index) => {
    // Accept the LLM's catalog match only if it names the same thing — a shared
    // word guards against unrelated mismatches whose density would corrupt the
    // aggregate. A rejected match falls back to a name-derived id (which still
    // reuses an existing ingredient of that name via the slug).
    const catalogName =
      item.matchedIngredientId !== null
        ? catalogNameById.get(item.matchedIngredientId)
        : undefined;
    const matched = catalogName !== undefined && sharesWord(item.canonicalName, catalogName);
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
