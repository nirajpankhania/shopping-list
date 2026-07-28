"use client";

import { useState, useTransition } from "react";
import type { Recipe } from "@/lib/repo/types";
import { setRecipeScaleTo, toggleRecipeActive, deleteRecipe } from "@/app/actions";

const SCALES = [1, 2, 3, 4, 5, 6, 7, 8];

export function RecipeRow({ recipe }: { recipe: Recipe }) {
  // The select is controlled by local state so it always shows the chosen value;
  // the status line shows the *persisted* scale as the source of truth.
  const [scale, setScale] = useState(recipe.scale);
  const [, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 border-b border-neutral-200 py-3">
      <div className="min-w-0 flex-1">
        <span className={`block font-medium ${recipe.active ? "" : "text-neutral-400 line-through"}`}>
          {recipe.title}
        </span>
        <span className="text-xs text-neutral-500">
          {recipe.active ? `×${recipe.scale} on the list` : "saved, not on the list"}
        </span>
      </div>

      {/* Scale: applies immediately, no separate button. */}
      <select
        value={scale}
        aria-label={`Scale for ${recipe.title}`}
        onChange={(e) => {
          const next = Number(e.target.value);
          setScale(next);
          startTransition(() => setRecipeScaleTo(recipe.id, next));
        }}
        className="rounded border border-neutral-300 px-2 py-1"
      >
        {SCALES.map((s) => (
          <option key={s} value={s}>
            ×{s}
          </option>
        ))}
      </select>

      {/* Drop / add: keeps the recipe saved either way. */}
      <form action={toggleRecipeActive}>
        <input type="hidden" name="id" value={recipe.id} />
        <input type="hidden" name="active" value={String(recipe.active)} />
        <button type="submit" className="text-sm text-neutral-600 underline">
          {recipe.active ? "Drop" : "Add"}
        </button>
      </form>

      {/* Delete permanently. */}
      <form action={deleteRecipe}>
        <input type="hidden" name="id" value={recipe.id} />
        <button
          type="submit"
          aria-label={`Delete ${recipe.title}`}
          className="text-lg leading-none text-neutral-400 hover:text-red-600"
        >
          ✕
        </button>
      </form>
    </li>
  );
}
