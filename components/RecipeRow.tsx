"use client";

import { useState, useTransition } from "react";
import type { Recipe } from "@/lib/repo/types";
import { setRecipeScaleTo, deleteRecipe } from "@/app/actions";

const AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

export function RecipeRow({ recipe }: { recipe: Recipe }) {
  // Local scale is the source of truth for the row (immediate, and correct under
  // rapid Add/Drop); it's mirrored to the server on each change.
  const [scale, setScale] = useState(recipe.scale);
  const [amount, setAmount] = useState(1);
  const [, startTransition] = useTransition();

  const adjust = (delta: number) => {
    const next = Math.max(0, scale + delta);
    setScale(next);
    startTransition(() => setRecipeScaleTo(recipe.id, next));
  };

  const onList = scale > 0;

  return (
    <li className="flex items-center gap-2 border-b border-neutral-200 py-3">
      <div className="min-w-0 flex-1">
        <span className={`block font-medium ${onList ? "" : "text-neutral-400 line-through"}`}>
          {recipe.title}
        </span>
        <span className="text-xs text-neutral-500">
          {onList ? `×${scale} on the list` : "saved, not on the list"}
        </span>
      </div>

      {/* Pick an amount, then add it to or drop it from the list. */}
      <select
        value={amount}
        aria-label={`Amount for ${recipe.title}`}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="rounded border border-neutral-300 px-2 py-1"
      >
        {AMOUNTS.map((a) => (
          <option key={a} value={a}>
            ×{a}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => adjust(amount)}
        className="text-sm text-neutral-600 underline"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => adjust(-amount)}
        disabled={!onList}
        className="text-sm text-neutral-600 underline disabled:text-neutral-300 disabled:no-underline"
      >
        Drop
      </button>

      {/* Delete the saved recipe permanently. */}
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
