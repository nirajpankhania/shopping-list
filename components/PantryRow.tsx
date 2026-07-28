import type { PantryItem } from "@/lib/repo/types";
import { savePantryItem, clearPantryItem } from "@/app/actions";
import { PANTRY_UNITS } from "./unit-options";

export function PantryRow({ item }: { item: PantryItem }) {
  return (
    <li className="flex items-center gap-2 border-b border-neutral-200 py-3">
      <form action={savePantryItem} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="name" value={item.name} />
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        <input
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          defaultValue={item.quantity}
          aria-label={`Amount of ${item.name} you have`}
          className="w-20 rounded border border-neutral-300 px-2 py-1 text-right"
        />
        <select
          name="unit"
          defaultValue={item.unit}
          aria-label={`Unit for ${item.name}`}
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {PANTRY_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-green-700 px-3 py-1 text-sm font-medium text-white"
        >
          Save
        </button>
      </form>

      <form action={clearPantryItem}>
        <input type="hidden" name="name" value={item.name} />
        <button type="submit" className="px-2 text-sm text-neutral-500 underline">
          Remove
        </button>
      </form>
    </li>
  );
}
