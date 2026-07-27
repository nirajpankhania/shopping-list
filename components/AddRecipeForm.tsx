"use client";

import { useActionState } from "react";
import { addRecipeFromText } from "@/app/actions";

export function AddRecipeForm() {
  const [state, formAction, pending] = useActionState(addRecipeFromText, {});

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
        className="rounded bg-green-700 px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Parsing…" : "Add recipe"}
      </button>
    </form>
  );
}
