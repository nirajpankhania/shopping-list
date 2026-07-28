"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repo/instance";
import { normalizeName } from "@/lib/list/project";
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

/** Record something the user has at home, by name. A blank name or non-positive
 *  amount is ignored — use clearPantryItem to remove one. */
export async function savePantryItem(formData: FormData): Promise<void> {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit"));
  if (!name || !unit || !Number.isFinite(quantity) || quantity <= 0) return;
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

/** Set a recipe's whole-recipe multiplier (people or days). */
export async function setRecipeScale(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const scale = Number(formData.get("scale"));
  if (!id || !Number.isInteger(scale) || scale < 1) return;
  await repo.setRecipeScale(id, scale);
  revalidatePath("/recipes");
  revalidatePath("/");
}

/** Drop a recipe from the list or add it back. It stays saved either way, so
 *  re-adding it costs no re-parse. */
export async function toggleRecipeActive(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;
  await repo.setRecipeActive(id, !active);
  revalidatePath("/recipes");
  revalidatePath("/");
}

/** Delete a saved recipe for good, along with its ingredient lines. */
export async function deleteRecipe(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  if (!id) return;
  await repo.deleteRecipe(id);
  revalidatePath("/recipes");
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
