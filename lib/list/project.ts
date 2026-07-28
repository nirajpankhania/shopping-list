import type {
  Repository,
  Ingredient,
  RecipeIngredient,
  PantryItem,
  ManualItem,
} from "../repo/types";
import {
  aggregate,
  applyDensity,
  toCanonical,
  formatMetric,
  formatTotals,
  UNITS,
  type Item,
  type Canonical,
  type UnitFamily,
} from "../units";
import { aisleRank } from "../aisles/aisles";

export interface ListLine {
  /** Ingredient id for recipe-derived lines; manual-item id for manual lines. */
  id: string;
  /** Which store a check-off or removal writes to. */
  source: "recipe" | "manual";
  name: string;
  aisle: string;
  checked: boolean;
  /** How much you need, in the ingredient's shopping unit — e.g. "340 g", or
   *  "100 g + 45 ml" when weight and volume can't be reconciled. */
  amount: string;
  /** The line's unit family, so an amount edit can offer sensible units. */
  family: UnitFamily;
  /** true when the amount is a user override rather than the derived requirement. */
  edited: boolean;
  /** Set when a pantry entry matches this line by name: "in pantry" (you have
   *  enough) or e.g. "150 g in pantry" (you have some). The line stays on the
   *  list either way — the tag just says whether you still need to buy it. */
  pantryTag?: string;
}

export interface AisleGroup {
  aisle: string;
  lines: ListLine[];
}

/** Normalise a name for pantry matching: lowercased, trimmed, single spaces. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Project the shopping list at read time from stored recipes, ingredients,
 * overrides, pantry and manual items. All quantity maths is delegated to
 * lib/units; this function gathers, applies overrides, tags what's in the
 * pantry, and groups. Same repository state in -> same list out.
 */
export async function projectList(repo: Repository): Promise<AisleGroup[]> {
  const [recipes, recipeIngredients, ingredients, overrides, pantry, manualItems] =
    await Promise.all([
      repo.getRecipes(),
      repo.getRecipeIngredients(),
      repo.getIngredients(),
      repo.getOverrides(),
      repo.getPantry(),
      repo.getManualItems(),
    ]);

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const overrideById = new Map(overrides.map((o) => [o.ingredientId, o]));
  const pantryByName = new Map(pantry.map((p) => [normalizeName(p.name), p]));
  // Active recipes only; each contributes its quantities times its scale.
  const scaleByRecipe = new Map(recipes.filter((r) => r.active).map((r) => [r.id, r.scale]));
  const byIngredient = itemsByIngredient(recipeIngredients, scaleByRecipe);

  const lines: ListLine[] = [];
  for (const [ingredientId, items] of byIngredient) {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) continue; // a recipe references an ingredient we don't know
    const override = overrideById.get(ingredientId);
    if (override?.removed) continue; // removed by hand -> off the list for good

    const manualQuantity = override?.manualQuantity ?? null;
    const manualUnit = override?.manualUnit ?? null;
    const edited = manualQuantity != null && manualUnit != null;

    let amount: string;
    let pantryTag: string | undefined;
    if (edited) {
      // An explicit "buy this much" replaces the requirement; no pantry tag.
      amount = formatQuantity(manualQuantity, manualUnit);
    } else {
      const totals = aggregate(items, { densityGPerMl: ingredient.densityGPerMl });
      if (totals.length !== 1) {
        // Refuse-to-guess: quantities in different families with no density to
        // bridge them. Surface both; a pantry tag would be meaningless here.
        amount = formatTotals(totals);
      } else {
        let need = totals[0];
        if (need.family !== ingredient.unitFamily && ingredient.densityGPerMl !== undefined) {
          need = applyDensity(need, ingredient.unitFamily, ingredient.densityGPerMl);
        }
        amount = formatMetric(need);
        pantryTag = pantryTagFor(
          ingredient,
          need,
          pantryByName.get(normalizeName(ingredient.canonicalName)),
        );
      }
    }

    lines.push({
      id: ingredient.id,
      source: "recipe",
      name: ingredient.canonicalName,
      aisle: ingredient.aisle,
      checked: override?.checked ?? false,
      amount,
      family: ingredient.unitFamily,
      edited,
      pantryTag,
    });
  }

  // Hand-added entries sit alongside the recipe lines, in the same aisle order.
  for (const item of manualItems) {
    lines.push(manualLine(item));
  }

  return groupByAisle(lines);
}

/**
 * Gather every recipe quantity under the ingredient it resolves to, scaled by
 * its recipe's multiplier. Lines from recipes not in `scaleByRecipe` (inactive)
 * are skipped — so an ingredient with no active recipe yields no list line.
 */
function itemsByIngredient(
  recipeIngredients: RecipeIngredient[],
  scaleByRecipe: Map<string, number>,
): Map<string, Item[]> {
  const map = new Map<string, Item[]>();
  for (const ri of recipeIngredients) {
    const scale = scaleByRecipe.get(ri.recipeId);
    if (scale === undefined) continue; // inactive recipe -> excluded
    const list = map.get(ri.ingredientId) ?? [];
    list.push({ quantity: ri.quantity * scale, unit: ri.unit });
    map.set(ri.ingredientId, list);
  }
  return map;
}

/**
 * The pantry tag for a recipe line: undefined (no matching pantry entry),
 * "in pantry" (the pantry amount covers the need), or "<amount> in pantry"
 * (some, but not enough). The line is never dropped — the user decides.
 */
function pantryTagFor(
  ingredient: Ingredient,
  need: Canonical,
  pantryItem: PantryItem | undefined,
): string | undefined {
  if (!pantryItem) return undefined;
  const have = pantryHave(ingredient, need.family, pantryItem);
  if (!have || have.base <= 0) return undefined;
  return have.base >= need.base ? "in pantry" : `${formatMetric(have)} in pantry`;
}

/**
 * The pantry amount converted into the requirement's family. Returns undefined
 * when it can't be bridged (unknown unit, or a cross-family gap with no density)
 * — in which case we don't tag rather than guess a conversion.
 */
function pantryHave(
  ingredient: Ingredient,
  needFamily: UnitFamily,
  pantryItem: PantryItem,
): Canonical | undefined {
  try {
    const have = toCanonical(pantryItem.quantity, pantryItem.unit);
    if (have.family === needFamily) return have;
    if (ingredient.densityGPerMl === undefined) return undefined;
    return applyDensity(have, needFamily, ingredient.densityGPerMl);
  } catch {
    return undefined;
  }
}

/** Render a quantity through the same engine as recipe lines (so 1000 g reads
 *  "1 kg"); an unrecognised unit falls back to the raw text rather than throwing. */
function formatQuantity(quantity: number, unit: string): string {
  try {
    return formatMetric(toCanonical(quantity, unit));
  } catch {
    return `${quantity} ${unit}`;
  }
}

/** A hand-added entry as a list line. */
function manualLine(item: ManualItem): ListLine {
  return {
    id: item.id,
    source: "manual",
    name: item.name,
    aisle: item.aisle,
    checked: item.checked,
    amount: formatQuantity(item.quantity, item.unit),
    family: UNITS[item.unit]?.family ?? "COUNT",
    edited: false,
  };
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
