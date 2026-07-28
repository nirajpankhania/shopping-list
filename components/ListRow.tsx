import type { ListLine } from "@/lib/list/project";
import {
  toggleChecked,
  toggleManualChecked,
  removeManualItem,
  removeRecipeLine,
  editQuantity,
  resetQuantity,
} from "@/app/actions";
import { UNIT_OPTIONS } from "./unit-options";

export function ListRow({ line }: { line: ListLine }) {
  const isManual = line.source === "manual";
  const toggle = isManual ? toggleManualChecked : toggleChecked;
  const remove = isManual ? removeManualItem : removeRecipeLine;

  return (
    <li className="border-b border-neutral-200">
      <div className="flex items-stretch gap-2">
        {/* The whole left area is the check-off tap target. */}
        <form action={toggle} className="flex-1">
          <input type="hidden" name="id" value={line.id} />
          <input type="hidden" name="checked" value={String(line.checked)} />
          <button type="submit" className="flex w-full items-center gap-3 py-4 text-left">
            <span
              aria-hidden
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-sm ${
                line.checked ? "border-green-600 bg-green-600 text-white" : "border-neutral-400"
              }`}
            >
              {line.checked ? "✓" : ""}
            </span>
            <span className="min-w-0">
              <span
                className={`block font-medium ${line.checked ? "text-neutral-400 line-through" : ""}`}
              >
                {line.name}
              </span>
              <span className="block text-sm text-neutral-500">
                {line.amount}
                {line.edited && (
                  <span
                    className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600"
                    title="You set this amount"
                  >
                    edited
                  </span>
                )}
                {line.unverified && (
                  <span
                    className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800"
                    title="Aisle was guessed by the parser — worth checking"
                  >
                    guessed
                  </span>
                )}
              </span>
            </span>
          </button>
        </form>

        {/* Remove: hand-added lines delete outright; recipe lines go to the
            Removed section, where they can be restored. */}
        <form action={remove} className="flex items-center">
          <input type="hidden" name="id" value={line.id} />
          <button
            type="submit"
            aria-label={`Remove ${line.name}`}
            className="px-3 text-lg leading-none text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </form>
      </div>

      {/* Edit a recipe line's amount — an explicit quantity to buy, which
          overrides the recipe requirement and the pantry. */}
      {line.source === "recipe" && (
        <details className="px-9 pb-3">
          <summary className="cursor-pointer text-xs text-neutral-500">Edit amount</summary>
          <form action={editQuantity} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="id" value={line.id} />
            <input
              name="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              placeholder="amount"
              aria-label={`New amount for ${line.name}`}
              className="w-20 rounded border border-neutral-300 px-2 py-1 text-right"
            />
            <select
              name="unit"
              defaultValue={UNIT_OPTIONS[line.family][0]}
              aria-label={`Unit for ${line.name}`}
              className="rounded border border-neutral-300 px-2 py-1"
            >
              {UNIT_OPTIONS[line.family].map((u) => (
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
          {line.edited && (
            <form action={resetQuantity} className="mt-2">
              <input type="hidden" name="id" value={line.id} />
              <button type="submit" className="text-xs text-neutral-500 underline">
                Reset to recipe amount
              </button>
            </form>
          )}
        </details>
      )}
    </li>
  );
}
