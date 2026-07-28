"use client";

import { useRef } from "react";
import { savePantryItem } from "@/app/actions";
import { PANTRY_UNITS } from "./unit-options";

/**
 * Free-text pantry entry. You can type anything; the datalist autocompletes from
 * your recipe ingredients so a matching name (which is what lets the list tag the
 * line "in pantry") is one tap away.
 */
export function AddPantryItemForm({ suggestions }: { suggestions: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await savePantryItem(formData);
        formRef.current?.reset();
      }}
      className="mt-6 flex flex-col gap-2"
    >
      <input
        name="name"
        required
        list="pantry-suggestions"
        placeholder="e.g. plain flour"
        aria-label="Ingredient name"
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <datalist id="pantry-suggestions">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="flex items-center gap-2">
        <input
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          placeholder="amount"
          aria-label="Amount you have"
          className="w-24 rounded border border-neutral-300 px-2 py-2 text-right"
        />
        <select
          name="unit"
          defaultValue="g"
          aria-label="Unit"
          className="rounded border border-neutral-300 px-2 py-2"
        >
          {PANTRY_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white"
        >
          Add to pantry
        </button>
      </div>
    </form>
  );
}
