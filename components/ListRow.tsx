import type { ListLine } from "@/lib/list/project";
import { toggleChecked, toggleManualChecked, removeManualItem } from "@/app/actions";

export function ListRow({ line }: { line: ListLine }) {
  const toggle = line.source === "manual" ? toggleManualChecked : toggleChecked;

  return (
    <li className="flex items-stretch gap-2 border-b border-neutral-200">
      {/* The whole left area is the check-off tap target. */}
      <form action={toggle} className="flex-1">
        <input type="hidden" name="id" value={line.id} />
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

      {/* Hand-added lines can be removed outright; recipe lines can't (yet). */}
      {line.source === "manual" && (
        <form action={removeManualItem} className="flex items-center">
          <input type="hidden" name="id" value={line.id} />
          <button
            type="submit"
            aria-label={`Remove ${line.name}`}
            className="px-3 text-lg leading-none text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </form>
      )}
    </li>
  );
}
