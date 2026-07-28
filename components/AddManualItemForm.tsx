"use client";

import { useRef } from "react";
import { addManualItem } from "@/app/actions";
import { AISLE_ORDER } from "@/lib/aisles/aisles";

// A small, general set — manual items can be anything, so offer one unit per
// family plus the common step-ups. The projection formats them like any line.
const UNITS = ["each", "g", "kg", "ml", "l"];

export function AddManualItemForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      // Call the server action, then clear the form for the next entry.
      action={async (formData) => {
        await addManualItem(formData);
        formRef.current?.reset();
      }}
      className="mt-8 border-t border-neutral-200 pt-4"
    >
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Add an item
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          required
          placeholder="e.g. bin bags"
          aria-label="Item name"
          className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1"
        />
        <input
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          defaultValue="1"
          aria-label="Quantity"
          className="w-16 rounded border border-neutral-300 px-2 py-1 text-right"
        />
        <select
          name="unit"
          defaultValue="each"
          aria-label="Unit"
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          name="aisle"
          defaultValue="Other"
          aria-label="Aisle"
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {AISLE_ORDER.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-green-700 px-3 py-1 text-sm font-medium text-white"
        >
          Add
        </button>
      </div>
    </form>
  );
}
