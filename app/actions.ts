"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repo/instance";
import { ingestRecipe } from "@/lib/parse/ingest";
import { ParseError } from "@/lib/llm/parse";

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
  const aisle = String(formData.get("aisle"));
  if (!name || !unit || !aisle || !Number.isFinite(quantity) || quantity <= 0) return;
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
  if (!id || !unit || !Number.isFinite(quantity) || quantity <= 0) return;
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

/** Record how much of an ingredient the user already has. A non-positive or
 *  unparseable amount is ignored — use clearPantryItem to remove one. */
export async function savePantryItem(formData: FormData): Promise<void> {
  const ingredientId = String(formData.get("ingredientId"));
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit"));
  if (!ingredientId || !unit || !Number.isFinite(quantity) || quantity <= 0) return;
  await repo.setPantryItem({ ingredientId, quantity, unit });
  revalidatePath("/pantry");
  revalidatePath("/");
}

/** Forget a pantry amount, so the ingredient's full requirement returns. */
export async function clearPantryItem(formData: FormData): Promise<void> {
  const ingredientId = String(formData.get("ingredientId"));
  if (!ingredientId) return;
  await repo.removePantryItem(ingredientId);
  revalidatePath("/pantry");
  revalidatePath("/");
}

/** Parse pasted recipe text and add it to the list. Returns an error state on
 *  failure (with the text retained for retry); redirects to the list on success. */
export async function addRecipeFromText(
  _prev: { error?: string; text?: string },
  formData: FormData,
): Promise<{ error?: string; text?: string }> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Paste a recipe first." };

  try {
    await ingestRecipe(repo, text);
  } catch (err) {
    if (err instanceof ParseError) {
      return { error: "Couldn't read that recipe. Check the formatting and try again.", text };
    }
    return { error: "Something went wrong parsing the recipe. Please try again.", text };
  }

  // Only reached on success — redirect throws, so keep it outside the try/catch.
  revalidatePath("/");
  redirect("/");
}
