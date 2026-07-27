import type { Repository, Ingredient, ListOverride } from "../repo/types";
import {
  aggregate,
  applyDensity,
  formatMetric,
  formatTotals,
  type Item,
} from "../units";
import { aisleRank } from "../aisles/aisles";

export interface ListLine {
  ingredientId: string;
  name: string;
  aisle: string;
  checked: boolean;
  /** How much you need, in the ingredient's shopping unit — e.g. "340 g", or
   *  "100 g + 45 ml" when weight and volume can't be reconciled. */
  amount: string;
  /** true when the aisle was LLM-guessed rather than curated. */
  unverified: boolean;
}

export interface AisleGroup {
  aisle: string;
  lines: ListLine[];
}

/**
 * Project the shopping list at read time from stored recipes, ingredients and
 * overrides. All quantity maths is delegated to lib/units; this function only
 * gathers, applies overrides, and groups. Same repository state in -> same list
 * out.
 */
export async function projectList(repo: Repository): Promise<AisleGroup[]> {
  const [recipeIngredients, ingredients, overrides] = await Promise.all([
    repo.getRecipeIngredients(),
    repo.getIngredients(),
    repo.getOverrides(),
  ]);

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const overrideById = new Map(overrides.map((o) => [o.ingredientId, o]));

  // Gather every recipe quantity under the ingredient it resolves to.
  const itemsByIngredient = new Map<string, Item[]>();
  for (const ri of recipeIngredients) {
    const list = itemsByIngredient.get(ri.ingredientId) ?? [];
    list.push({ quantity: ri.quantity, unit: ri.unit });
    itemsByIngredient.set(ri.ingredientId, list);
  }

  const lines: ListLine[] = [];
  for (const [ingredientId, items] of itemsByIngredient) {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) continue; // a recipe references an ingredient we don't know
    const override = overrideById.get(ingredientId);
    if (override?.alreadyHave) continue; // "already have" drops it from the list

    lines.push(toLine(ingredient, items, override));
  }

  return groupByAisle(lines);
}

function toLine(
  ingredient: Ingredient,
  items: Item[],
  override: ListOverride | undefined,
): ListLine {
  const base = {
    ingredientId: ingredient.id,
    name: ingredient.canonicalName,
    aisle: ingredient.aisle,
    checked: override?.checked ?? false,
    unverified: ingredient.unverified,
  };

  const totals = aggregate(items, { densityGPerMl: ingredient.densityGPerMl });

  // Refuse-to-guess: quantities in different families with no density to bridge
  // them. Surface both rather than inventing a conversion.
  if (totals.length !== 1) {
    return { ...base, amount: formatTotals(totals) };
  }

  // A single total: express it in the ingredient's natural shopping family
  // (flour by weight, milk by volume), converting via density where needed.
  let total = totals[0];
  if (total.family !== ingredient.unitFamily && ingredient.densityGPerMl !== undefined) {
    total = applyDensity(total, ingredient.unitFamily, ingredient.densityGPerMl);
  }
  return { ...base, amount: formatMetric(total) };
}

function groupByAisle(lines: ListLine[]): AisleGroup[] {
  const byAisle = new Map<string, ListLine[]>();
  for (const line of lines) {
    const group = byAisle.get(line.aisle) ?? [];
    group.push(line);
    byAisle.set(line.aisle, group);
  }

  return [...byAisle.entries()]
    .map(([aisle, groupLines]) => ({
      aisle,
      lines: groupLines.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => aisleRank(a.aisle) - aisleRank(b.aisle));
}

export interface OwnedItem {
  ingredientId: string;
  name: string;
}

/**
 * The ingredients the user has marked "already have" and that actually appear
 * in a recipe. projectList drops these from the active list; this surfaces them
 * as a separate section so an owned staple can be put back on the list.
 */
export async function alreadyHaveItems(repo: Repository): Promise<OwnedItem[]> {
  const [ingredients, overrides, recipeIngredients] = await Promise.all([
    repo.getIngredients(),
    repo.getOverrides(),
    repo.getRecipeIngredients(),
  ]);

  const usedIngredientIds = new Set(recipeIngredients.map((ri) => ri.ingredientId));
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  return overrides
    .filter((o) => o.alreadyHave && usedIngredientIds.has(o.ingredientId))
    .map((o) => ({
      ingredientId: o.ingredientId,
      name: ingredientById.get(o.ingredientId)?.canonicalName ?? o.ingredientId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
