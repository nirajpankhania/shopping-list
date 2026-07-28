"use client";

import { useState } from "react";
import { saveReviewedRecipe } from "@/app/actions";
import { UNITS } from "@/lib/units";
import type { ParsedRecipe } from "@/lib/llm/schema";

// Unit options for the review, taken from the engine's known units (no zod in
// the client bundle). ParsedRecipe is a type-only import, so it doesn't pull the
// schema module in either.
const UNIT_OPTIONS = Object.keys(UNITS);
const SCALES = [1, 2, 3, 4, 5, 6, 7, 8];

type Row = {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  packSize?: number;
  packUnit?: string;
  packLabel?: string;
  matchedIngredientId?: string | null;
};

export function RecipeReview({ parsed }: { parsed: ParsedRecipe }) {
  const [title, setTitle] = useState(parsed.title);
  const [scale, setScale] = useState(1);
  const [rows, setRows] = useState<Row[]>(
    parsed.ingredients.map((i) => ({
      name: i.canonicalName,
      quantity: i.quantity,
      unit: i.unit,
      category: i.category,
      packSize: i.packSize,
      packUnit: i.packUnit,
      packLabel: i.packLabel,
      matchedIngredientId: i.matchedIngredientId,
    })),
  );

  const update = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, k) => (k === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) => setRows((rs) => rs.filter((_, k) => k !== idx));
  const addRow = () => setRows((rs) => [...rs, { name: "", quantity: 1, unit: "each" }]);

  // Everything is submitted as one JSON field, so the visible inputs need no names.
  const payload = JSON.stringify({ title, servings: parsed.servings, scale, ingredients: rows });

  return (
    <form action={saveReviewedRecipe} className="flex flex-col gap-4">
      <input type="hidden" name="payload" value={payload} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Recipe
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Recipe title"
          className="w-full rounded border border-neutral-300 px-3 py-2 font-medium"
        />
        <p className="text-xs text-neutral-500">
          Serves {parsed.servings} · check the amounts and fill any gaps before saving.
        </p>
      </div>

      <ul className="flex flex-col">
        {rows.map((row, idx) => (
          <li key={idx} className="flex items-center gap-2 border-b border-neutral-200 py-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={row.quantity}
              onChange={(e) => update(idx, { quantity: Number(e.target.value) })}
              aria-label="Quantity"
              className="w-16 rounded border border-neutral-300 px-2 py-1 text-right"
            />
            <select
              value={row.unit}
              onChange={(e) => update(idx, { unit: e.target.value })}
              aria-label="Unit"
              className="rounded border border-neutral-300 px-2 py-1"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              value={row.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              placeholder="ingredient"
              aria-label="Ingredient"
              className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1"
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              aria-label={`Remove ${row.name || "ingredient"}`}
              className="text-lg leading-none text-neutral-400 hover:text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={addRow} className="self-start text-sm text-primary underline">
        + Add ingredient
      </button>

      <div className="flex items-center gap-2">
        <label htmlFor="review-scale" className="text-sm text-neutral-600">
          Scale
        </label>
        <select
          id="review-scale"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {SCALES.map((s) => (
            <option key={s} value={s}>
              ×{s}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">for more people or days</span>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="rounded bg-primary px-4 py-3 font-medium text-white">
          Add to list &amp; save
        </button>
        {/* Full reload resets the paste form's action state. */}
        <a href="/add" className="text-sm text-neutral-600 underline">
          Start over
        </a>
      </div>
    </form>
  );
}
