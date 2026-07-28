"use client";

import { useActionState } from "react";
import { addRecipeFromText } from "@/app/actions";
import { RecipeReview } from "./RecipeReview";

export function AddRecipeForm() {
  const [state, formAction, pending] = useActionState(addRecipeFromText, {});

  // Once parsed, review + edit before it's saved.
  if (state.parsed) return <RecipeReview parsed={state.parsed} />;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="text"
        rows={12}
        defaultValue={state.text ?? ""}
        placeholder="Paste a recipe — its title, how many it serves, and the ingredient list."
        className="w-full rounded border border-neutral-300 p-3 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Parsing…" : "Review recipe"}
      </button>
    </form>
  );
}
