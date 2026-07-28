"use client";

import type { Recipe } from "@/lib/repo/types";
import { setRecipeScale, toggleRecipeActive, deleteRecipe } from "@/app/actions";

const SCALES = [1, 2, 3, 4, 5, 6, 7, 8];

export function RecipeRow({ recipe }: { recipe: Recipe }) {
  return (
    <li className="flex items-center gap-3 border-b border-neutral-200 py-3">
      <div className="min-w-0 flex-1">
        <span className={`block font-medium ${recipe.active ? "" : "text-neutral-400 line-through"}`}>
          {recipe.title}
        </span>
        <span className="text-xs text-neutral-500">
          {recipe.active ? "on the list" : "saved, not on the list"}
        </span>
      </div>

      {/* Scale: changing it submits immediately (no separate button). */}
      <form action={setRecipeScale}>
        <input type="hidden" name="id" value={recipe.id} />
        <select
          name="scale"
          defaultValue={recipe.scale}
          aria-label={`Scale for ${recipe.title}`}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {SCALES.map((s) => (
            <option key={s} value={s}>
              ×{s}
            </option>
          ))}
        </select>
      </form>

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
