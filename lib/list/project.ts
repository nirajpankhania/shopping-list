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
   *  "100 g + 45 ml" when weight and volume can't be reconciled. Reflects the
   *  pantry: a partially-owned ingredient shows only the shortfall. */
  amount: string;
  /** true when the aisle was LLM-guessed rather than curated. Manual lines,
   *  whose aisle the user picked, are never flagged. */
  unverified: boolean;
}

export interface AisleGroup {
  aisle: string;
  lines: ListLine[];
}

/**
 * Project the shopping list at read time from stored recipes, ingredients,
 * overrides and pantry. All quantity maths is delegated to lib/units (via
 * coverageFor); this function only gathers, applies overrides, subtracts the
 * pantry, and groups. Same repository state in -> same list out.
 */
export async function projectList(repo: Repository): Promise<AisleGroup[]> {
  const [recipeIngredients, ingredients, overrides, pantry, manualItems] = await Promise.all([
    repo.getRecipeIngredients(),
    repo.getIngredients(),
    repo.getOverrides(),
    repo.getPantry(),
    repo.getManualItems(),
  ]);

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const overrideById = new Map(overrides.map((o) => [o.ingredientId, o]));
  const pantryById = new Map(pantry.map((p) => [p.ingredientId, p]));
  const byIngredient = itemsByIngredient(recipeIngredients);

  const lines: ListLine[] = [];
  for (const [ingredientId, items] of byIngredient) {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) continue; // a recipe references an ingredient we don't know
    const override = overrideById.get(ingredientId);

    const coverage = coverageFor(ingredient, items, pantryById.get(ingredientId));
    if (coverage.covered) continue; // fully in the pantry -> off the active list

    lines.push({
      id: ingredient.id,
      source: "recipe",
      name: ingredient.canonicalName,
      aisle: ingredient.aisle,
      checked: override?.checked ?? false,
      amount: coverage.amount,
      unverified: ingredient.unverified,
    });
  }

  // Hand-added entries sit alongside the recipe lines, in the same aisle order.
  for (const item of manualItems) {
    lines.push(manualLine(item));
  }

  return groupByAisle(lines);
}

/** A hand-added entry as a list line. Its amount is rendered through the same
 *  engine as recipe lines (so 1000 g reads "1 kg"); an unrecognised unit falls
 *  back to the raw text rather than throwing. */
function manualLine(item: ManualItem): ListLine {
  let amount: string;
  try {
    amount = formatMetric(toCanonical(item.quantity, item.unit));
  } catch {
    amount = `${item.quantity} ${item.unit}`;
  }
  return {
    id: item.id,
    source: "manual",
    name: item.name,
    aisle: item.aisle,
    checked: item.checked,
    amount,
    unverified: false,
  };
}

/** Gather every recipe quantity under the ingredient it resolves to. */
function itemsByIngredient(recipeIngredients: RecipeIngredient[]): Map<string, Item[]> {
  const map = new Map<string, Item[]>();
  for (const ri of recipeIngredients) {
    const list = map.get(ri.ingredientId) ?? [];
    list.push({ quantity: ri.quantity, unit: ri.unit });
    map.set(ri.ingredientId, list);
  }
  return map;
}

type Coverage =
  | { covered: true; need: Canonical; have: Canonical }
  | { covered: false; amount: string; need?: Canonical; have?: Canonical };

/**
 * Reconcile what recipes need for one ingredient against what's in the pantry.
 * All the quantity maths lives here so projectList and inPantryItems agree.
 */
function coverageFor(
  ingredient: Ingredient,
  items: Item[],
  pantryItem: PantryItem | undefined,
): Coverage {
  const totals = aggregate(items, { densityGPerMl: ingredient.densityGPerMl });

  // Refuse-to-guess: quantities in different families with no density to bridge
  // them. Surface both, and never let the pantry silently "cover" them.
  if (totals.length !== 1) {
    return { covered: false, amount: formatTotals(totals) };
  }

  // Express the requirement in the ingredient's shopping family (flour by
  // weight, milk by volume), converting via density where needed.
  let need = totals[0];
  if (need.family !== ingredient.unitFamily && ingredient.densityGPerMl !== undefined) {
    need = applyDensity(need, ingredient.unitFamily, ingredient.densityGPerMl);
  }

  const have = pantryItem ? pantryHave(ingredient, need.family, pantryItem) : undefined;
  if (!have) {
    return { covered: false, amount: formatMetric(need), need };
  }
  if (have.base >= need.base) {
    return { covered: true, need, have };
  }
  return {
    covered: false,
    amount: formatMetric({ family: need.family, base: need.base - have.base }),
    need,
    have,
  };
}

/**
 * The pantry amount converted into the requirement's family. Returns undefined
 * when it can't be bridged (unknown unit, or a cross-family gap with no density)
 * — in which case we ignore the pantry rather than guess a conversion.
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

export interface InPantryItem {
  ingredientId: string;
  name: string;
  /** Formatted requirement and pantry amount, so the user can see why it dropped
   *  off the active list — "in pantry" should always be inspectable. */
  need: string;
  have: string;
}

/**
 * Ingredients a recipe needs that the pantry fully covers. projectList drops
 * these from the active list; this surfaces them (with the numbers) so the user
 * can trust that "in pantry" means they genuinely have enough.
 */
export async function inPantryItems(repo: Repository): Promise<InPantryItem[]> {
  const [recipeIngredients, ingredients, pantry] = await Promise.all([
    repo.getRecipeIngredients(),
    repo.getIngredients(),
    repo.getPantry(),
  ]);

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  const pantryById = new Map(pantry.map((p) => [p.ingredientId, p]));
  const byIngredient = itemsByIngredient(recipeIngredients);

  const covered: InPantryItem[] = [];
  for (const [ingredientId, items] of byIngredient) {
    const ingredient = ingredientById.get(ingredientId);
    const pantryItem = pantryById.get(ingredientId);
    if (!ingredient || !pantryItem) continue;
    const coverage = coverageFor(ingredient, items, pantryItem);
    if (!coverage.covered) continue;
    covered.push({
      ingredientId,
      name: ingredient.canonicalName,
      need: formatMetric(coverage.need),
      have: formatMetric(coverage.have),
    });
  }

  return covered.sort((a, b) => a.name.localeCompare(b.name));
}
