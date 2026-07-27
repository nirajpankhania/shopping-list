"use server";

import { revalidatePath } from "next/cache";
import { repo } from "@/lib/repo/instance";

/** Toggle whether an item is checked off. The current value rides in the form. */
export async function toggleChecked(formData: FormData): Promise<void> {
  const ingredientId = String(formData.get("ingredientId"));
  const checked = formData.get("checked") === "true";
  await repo.setOverride(ingredientId, { checked: !checked });
  revalidatePath("/");
}

/** Toggle whether the user already has an item. Owned items drop off the list. */
export async function toggleAlreadyHave(formData: FormData): Promise<void> {
  const ingredientId = String(formData.get("ingredientId"));
  const alreadyHave = formData.get("alreadyHave") === "true";
  await repo.setOverride(ingredientId, { alreadyHave: !alreadyHave });
  revalidatePath("/");
}
