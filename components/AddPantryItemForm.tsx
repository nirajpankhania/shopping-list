"use client";

import { useState } from "react";
import { savePantryItem } from "@/app/actions";
import { UNIT_OPTIONS } from "./unit-options";
import type { UnitFamily } from "@/lib/units";

export type PantryChoice = { id: string; name: string; family: UnitFamily };

export function AddPantryItemForm({ choices }: { choices: PantryChoice[] }) {
  if (choices.length === 0) {
    return (
      <p className="mt-6 text-sm text-neutral-500">
        Every ingredient your recipes use is already in your pantry.
      </p>
    );
  }
  // Key by the available set so a successful add (which shrinks the list)
  // remounts the form fresh — clearing inputs and resetting the selection.
  return <Form key={choices.map((c) => c.id).join("|")} choices={choices} />;
}

function Form({ choices }: { choices: PantryChoice[] }) {
  const [family, setFamily] = useState<UnitFamily>(choices[0].family);
  const units = UNIT_OPTIONS[family];

  return (
    <form action={savePantryItem} className="mt-6 flex flex-col gap-2">
      <select
        name="ingredientId"
        defaultValue={choices[0].id}
        aria-label="Ingredient"
        onChange={(e) => {
          const choice = choices.find((c) => c.id === e.target.value);
          if (choice) setFamily(choice.family);
        }}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      >
        {choices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
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
        {/* Remount on family change so the unit resets into the new family. */}
        <select
          key={family}
          name="unit"
          defaultValue={units[0]}
          aria-label="Unit"
          className="rounded border border-neutral-300 px-2 py-2"
        >
          {units.map((u) => (
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
