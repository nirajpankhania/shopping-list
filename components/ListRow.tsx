import type { ListLine } from "@/lib/list/project";
import { toggleChecked, toggleAlreadyHave } from "@/app/actions";

export function ListRow({ line }: { line: ListLine }) {
  return (
    <li className="flex items-stretch gap-2 border-b border-neutral-200">
      {/* The whole left area is the check-off tap target. */}
      <form action={toggleChecked} className="flex-1">
        <input type="hidden" name="ingredientId" value={line.ingredientId} />
        <input type="hidden" name="checked" value={String(line.checked)} />
        <button type="submit" className="flex w-full items-center gap-3 py-4 text-left">
          <span
            aria-hidden
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-sm ${
              line.checked
                ? "border-green-600 bg-green-600 text-white"
                : "border-neutral-400"
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

      {/* Secondary action: mark the staple as already owned. */}
      <form action={toggleAlreadyHave} className="flex items-center">
        <input type="hidden" name="ingredientId" value={line.ingredientId} />
        <input type="hidden" name="alreadyHave" value="false" />
        <button type="submit" className="px-3 text-sm text-neutral-500 underline">
          Got it
        </button>
      </form>
    </li>
  );
}
