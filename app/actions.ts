"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/repo/instance";
import { ingestRecipe } from "@/lib/parse/ingest";
import { ParseError } from "@/lib/llm/parse";

/** Toggle whether an item is checked off. The current value rides in the form. */
export async function toggleChecked(formData: FormData): Promise<void> {
  const ingredientId = String(formData.get("ingredientId"));
  const checked = formData.get("checked") === "true";
  await repo.setOverride(ingredientId, { checked: !checked });
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
