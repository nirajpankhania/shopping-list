"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repo/instance";
import { normalizeName } from "@/lib/list/project";
import { parseRecipe, ParseError } from "@/lib/llm/parse";
import { resolveParsedRecipe } from "@/lib/parse/resolve";
import { KNOWN_UNITS, CATEGORIES, type ParsedRecipe } from "@/lib/llm/schema";
import { AISLE_ORDER } from "@/lib/aisles/aisles";

/** Toggle whether a recipe-derived line is checked off. */
export async function toggleChecked(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const checked = formData.get("checked") === "true";
  await repo.setOverride(id, { checked: !checked });
  revalidatePath("/");
}

/** Toggle whether a hand-added line is checked off. */
export async function toggleManualChecked(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const checked = formData.get("checked") === "true";
  await repo.setManualItemChecked(id, !checked);
  revalidatePath("/");
}

/** Add a list entry that isn't from a recipe. Ignores an empty or non-positive
 *  entry (the form also enforces this client-side). */
export async function addManualItem(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit"));
  if (!name || !isUnit(unit) || !Number.isFinite(quantity) || quantity <= 0) return;
  // An unknown aisle isn't worth rejecting a valid item over — default it to "Other".
  const aisleInput = String(formData.get("aisle"));
  const aisle = AISLE_ORDER.includes(aisleInput) ? aisleInput : "Other";
  await repo.addManualItem({ id: randomUUID(), name, quantity, unit, aisle, checked: false });
  revalidatePath("/");
}

/** Remove a hand-added line. */
export async function removeManualItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.removeManualItem(id);
  revalidatePath("/");
}

/** Override a recipe line's amount with an explicit quantity to buy. */
export async function editQuantity(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit"));
  if (!id || !isUnit(unit) || !Number.isFinite(quantity) || quantity <= 0) return;
  await repo.setOverride(id, { manualQuantity: quantity, manualUnit: unit });
  revalidatePath("/");
}

/** Clear an amount override, back to the recipe-derived requirement. */
export async function resetQuantity(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.setOverride(id, { manualQuantity: null, manualUnit: null });
  revalidatePath("/");
}

/** Drop a recipe line from the list. Permanent — to get it back, add it as a
 *  manual item. */
export async function removeRecipeLine(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.setOverride(id, { removed: true });
  revalidatePath("/");
}

/** Record something the user has at home, by name. A blank name or non-positive
 *  amount is ignored — use clearPantryItem to remove one. */
export async function savePantryItem(formData: FormData): Promise<void> {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit"));
  if (!name || !isUnit(unit) || !Number.isFinite(quantity) || quantity <= 0) return;
  await repo.setPantryItem({ name, quantity, unit });
  revalidatePath("/pantry");
  revalidatePath("/");
}

/** Remove a pantry entry, so its "in pantry" tag disappears from the list. */
export async function clearPantryItem(formData: FormData): Promise<void> {
  const name = normalizeName(String(formData.get("name") ?? ""));
  if (!name) return;
  await repo.removePantryItem(name);
  revalidatePath("/pantry");
  revalidatePath("/");
}

/** Set how many of a recipe are on the list (0 = off the list, kept saved).
 *  Called directly with typed args, so there's no form round-trip to drift. */
export async function setRecipeScaleTo(id: string, scale: number): Promise<void> {
  if (!id || !Number.isInteger(scale) || scale < 0) return;
  const wasOff = (((await repo.getRecipes()).find((r) => r.id === id)?.scale) ?? 0) === 0;
  await repo.setRecipeScale(id, scale);
  // Bringing a recipe onto the list should show its ingredients — including any
  // previously removed by hand (removal is permanent otherwise).
  if (wasOff && scale > 0) await unremoveRecipeIngredients(id);
  revalidatePath("/recipes");
  revalidatePath("/");
}

/** Clear the `removed` flag on a recipe's ingredients that were removed by hand. */
async function unremoveRecipeIngredients(recipeId: string): Promise<void> {
  const [recipeIngredients, overrides] = await Promise.all([
    repo.getRecipeIngredients(),
    repo.getOverrides(),
  ]);
  const removed = new Set(overrides.filter((o) => o.removed).map((o) => o.ingredientId));
  const toRestore = new Set(
    recipeIngredients
      .filter((ri) => ri.recipeId === recipeId && removed.has(ri.ingredientId))
      .map((ri) => ri.ingredientId),
  );
  for (const ingredientId of toRestore) await repo.setOverride(ingredientId, { removed: false });
}

/** Delete a saved recipe for good, along with its ingredient lines. */
export async function deleteRecipe(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.deleteRecipe(id);
  revalidatePath("/recipes");
  revalidatePath("/");
}

/** A snapshot of the current list: which recipes are on at what scale, plus the
 *  manual items (by value). Shared by clear/save/apply. */
async function currentListSnapshot() {
  const recipes = await repo.getRecipes();
  const recipeScales = Object.fromEntries(
    recipes.filter((r) => r.scale > 0).map((r) => [r.id, r.scale]),
  );
  const manualItems = (await repo.getManualItems()).map(({ name, quantity, unit, aisle }) => ({
    name,
    quantity,
    unit,
    aisle,
  }));
  return { recipeScales, manualItems };
}

/** Reset the list after a shop: recipes off (scale 0), manual items removed,
 *  checks cleared. Keeps the recipes (saved), the pantry and saved plans. */
export async function clearList(): Promise<void> {
  for (const r of await repo.getRecipes()) if (r.scale > 0) await repo.setRecipeScale(r.id, 0);
  for (const m of await repo.getManualItems()) await repo.removeManualItem(m.id);
  for (const o of await repo.getOverrides()) {
    if (o.checked || o.removed) await repo.setOverride(o.ingredientId, { checked: false, removed: false });
  }
  revalidatePath("/");
  revalidatePath("/recipes");
}

const MAX_PLANS = 10;

/** Save the current list as a new named plan (capped at 10). */
export async function saveListAsPlan(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  if ((await repo.getPlans()).length >= MAX_PLANS) return;
  await repo.savePlan({ id: randomUUID(), name, ...(await currentListSnapshot()) });
  revalidatePath("/plans");
}

/** Overwrite an existing plan with the current list, keeping its name. */
export async function updatePlan(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const existing = (await repo.getPlans()).find((p) => p.id === id);
  if (!existing) return;
  await repo.savePlan({ id, name: existing.name, ...(await currentListSnapshot()) });
  revalidatePath("/plans");
}

/** Replace the current list with a saved plan, then go to the list. */
export async function applyPlan(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const plan = (await repo.getPlans()).find((p) => p.id === id);
  if (!plan) return;
  for (const r of await repo.getRecipes()) {
    const scale = plan.recipeScales[r.id] ?? 0;
    if (r.scale !== scale) await repo.setRecipeScale(r.id, scale);
  }
  for (const m of await repo.getManualItems()) await repo.removeManualItem(m.id);
  for (const m of plan.manualItems) {
    await repo.addManualItem({ id: randomUUID(), ...m, checked: false });
  }
  // A freshly applied plan starts clean — no lingering checks or removals.
  for (const o of await repo.getOverrides()) {
    if (o.checked || o.removed) await repo.setOverride(o.ingredientId, { checked: false, removed: false });
  }
  revalidatePath("/");
  revalidatePath("/recipes");
  redirect("/");
}

/** Delete a saved plan. */
export async function deletePlan(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.deletePlan(id);
  revalidatePath("/plans");
}

/** Parse pasted recipe text and return the structured result for review (it is
 *  NOT saved yet). Returns an error state on failure, with the text retained. */
export async function addRecipeFromText(
  _prev: { error?: string; text?: string; parsed?: ParsedRecipe },
  formData: FormData,
): Promise<{ error?: string; text?: string; parsed?: ParsedRecipe }> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Paste a recipe first." };

  try {
    const existing = await repo.getIngredients();
    const catalog = existing.map((i) => ({ id: i.id, canonicalName: i.canonicalName }));
    const parsed = await parseRecipe(text, catalog);
    return { parsed, text };
  } catch (err) {
    if (err instanceof ParseError) {
      return { error: "Couldn't read that recipe. Check the formatting and try again.", text };
    }
    return { error: "Something went wrong parsing the recipe. Please try again.", text };
  }
}

interface ReviewedRecipe {
  title: string;
  servings: number;
  scale: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    // Carried through from the parse so aisle/family/pack stay correct; absent
    // (defaulted) for rows the user added by hand.
    category?: string;
    packSize?: number;
    packUnit?: string;
    packLabel?: string;
    matchedIngredientId?: string | null;
  }[];
}

const isUnit = (u: string): u is (typeof KNOWN_UNITS)[number] =>
  (KNOWN_UNITS as readonly string[]).includes(u);
const isCategory = (c: string): c is (typeof CATEGORIES)[number] =>
  (CATEGORIES as readonly string[]).includes(c);

/** Save a recipe the user has reviewed (and possibly edited) on the review
 *  screen. Reuses the deterministic resolver — no second LLM call. */
export async function saveReviewedRecipe(formData: FormData): Promise<void> {
  let review: ReviewedRecipe;
  try {
    review = JSON.parse(String(formData.get("payload") ?? "")) as ReviewedRecipe;
  } catch {
    return;
  }

  const ingredients = review.ingredients
    .map((i) => ({ ...i, name: i.name.trim(), unit: isUnit(i.unit) ? i.unit : "each" }))
    .filter((i) => i.name && Number.isFinite(i.quantity) && i.quantity > 0)
    .map((i) => ({
      rawText: `${i.quantity} ${i.unit} ${i.name}`,
      quantity: i.quantity,
      unit: i.unit,
      canonicalName: i.name.toLowerCase(),
      matchedIngredientId: i.matchedIngredientId ?? null,
      category: i.category && isCategory(i.category) ? i.category : ("other" as const),
      packSize: i.packSize ?? 1,
      packUnit: i.packUnit && isUnit(i.packUnit) ? i.packUnit : i.unit,
      packLabel: i.packLabel ?? i.name.toLowerCase(),
    }));
  if (ingredients.length === 0) return;

  const parsed: ParsedRecipe = {
    title: review.title.trim() || "Untitled recipe",
    servings: Number.isFinite(review.servings) && review.servings > 0 ? review.servings : 1,
    ingredients,
  };

  const existing = await repo.getIngredients();
  const catalog = existing.map((i) => ({ id: i.id, canonicalName: i.canonicalName }));
  const input = resolveParsedRecipe(parsed, catalog);
  await repo.saveRecipe(input);

  const scale = Math.round(review.scale);
  if (Number.isFinite(scale) && scale > 1) await repo.setRecipeScale(input.recipe.id, scale);

  revalidatePath("/");
  redirect("/");
}
