import type { InPantryItem } from "@/lib/list/project";

/**
 * Ingredients the pantry fully covers, shown below the active list with their
 * need/have numbers so "in pantry" is never a black box.
 */
export function InPantrySection({ items }: { items: InPantryItem[] }) {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        In pantry
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.ingredientId}
            className="flex items-center justify-between py-1 text-sm"
          >
            <span className="text-neutral-400 line-through">{item.name}</span>
            <span className="text-neutral-500">
              have {item.have} · need {item.need}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
