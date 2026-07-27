import type { OwnedItem } from "@/lib/list/project";
import { toggleAlreadyHave } from "@/app/actions";

export function AlreadyHaveSection({ items }: { items: OwnedItem[] }) {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Already have
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.ingredientId}>
            <form
              action={toggleAlreadyHave}
              className="flex items-center justify-between py-2"
            >
              <input type="hidden" name="ingredientId" value={item.ingredientId} />
              <input type="hidden" name="alreadyHave" value="true" />
              <span className="text-neutral-400 line-through">{item.name}</span>
              <button type="submit" className="px-3 text-sm text-neutral-600 underline">
                Put back
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
