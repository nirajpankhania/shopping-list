import type { Repository, Ingredient, ListOverride } from "../repo/types";
import {
  aggregate,
  applyDensity,
  roundToPacks,
  formatMetric,
  formatTotals,
  UNITS,
  type Item,
} from "../units";
import { aisleRank } from "../aisles/aisles";

export interface ListLine {
  ingredientId: string;
  name: string;
  aisle: string;
  checked: boolean;
  /** Either a pack line ("1 × 400 g tin ...") or separated quantities ("400 g + 30 ml"). */
  display: string;
  /** Whole packs to buy, or null when quantities can't be reconciled into one pack. */
  packs: number | null;
  /** The underlying recipe requirement, for inspection behind the pack quantity. */
  requirement: string;
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
  };

  const totals = aggregate(items, { densityGPerMl: ingredient.densityGPerMl });

  const packDef = UNITS[ingredient.packUnit];
  if (!packDef) throw new Error(`Unknown pack unit: ${ingredient.packUnit}`);

  // Refuse-to-guess: quantities in different families with no density to bridge
  // them. Surface both rather than inventing a conversion.
  if (totals.length !== 1) {
    const display = formatTotals(totals);
    return { ...base, display, packs: null, requirement: display };
  }

  // A single total: bring it into the pack's family (via density where the pack
  // is sold by weight but the recipe gave a volume, or vice versa), then round
  // up to whole packs.
  let total = totals[0];
  if (total.family !== packDef.family && ingredient.densityGPerMl !== undefined) {
    total = applyDensity(total, packDef.family, ingredient.densityGPerMl);
  }
  if (total.family !== packDef.family) {
    // No density to reconcile with the pack unit — show the quantity as-is.
    const display = formatTotals([total]);
    return { ...base, display, packs: null, requirement: display };
  }

  const result = roundToPacks(total, {
    size: ingredient.packSize,
    unit: ingredient.packUnit,
    label: ingredient.packLabel,
  });
  return {
    ...base,
    display: result.display,
    packs: result.packs,
    requirement: formatMetric(total),
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
