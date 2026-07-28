import type { Ingredient } from "@/lib/repo/types";
import { savePantryItem, clearPantryItem } from "@/app/actions";
import { UNIT_OPTIONS } from "./unit-options";

export function PantryRow({
  ingredient,
  current,
}: {
  ingredient: Ingredient;
  current?: { quantity: number; unit: string };
}) {
  const units = UNIT_OPTIONS[ingredient.unitFamily];

  return (
    <li className="flex items-center gap-2 border-b border-neutral-200 py-3">
      <form action={savePantryItem} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="ingredientId" value={ingredient.id} />
        <span className="min-w-0 flex-1 truncate">{ingredient.canonicalName}</span>
        <input
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          defaultValue={current?.quantity ?? ""}
          placeholder="0"
          aria-label={`Amount of ${ingredient.canonicalName} you have`}
          className="w-20 rounded border border-neutral-300 px-2 py-1 text-right"
        />
        <select
          name="unit"
          defaultValue={current?.unit ?? units[0]}
          aria-label={`Unit for ${ingredient.canonicalName}`}
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {units.map((u) => (
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

      {current && (
        <form action={clearPantryItem}>
          <input type="hidden" name="ingredientId" value={ingredient.id} />
          <button type="submit" className="px-2 text-sm text-neutral-500 underline">
            Remove
          </button>
        </form>
      )}
    </li>
  );
}
