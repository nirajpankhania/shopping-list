import type { RemovedItem } from "@/lib/list/project";
import { restoreRecipeLine } from "@/app/actions";

/**
 * Recipe lines the user removed by hand, shown below the list so an accidental
 * removal can be put back.
 */
export function RemovedSection({ items }: { items: RemovedItem[] }) {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Removed
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.ingredientId}>
            <form
              action={restoreRecipeLine}
              className="flex items-center justify-between py-2"
            >
              <input type="hidden" name="id" value={item.ingredientId} />
              <span className="text-neutral-400 line-through">{item.name}</span>
              <button type="submit" className="px-3 text-sm text-neutral-600 underline">
                Restore
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
