import type { AisleGroup } from "@/lib/list/project";
import { ListRow } from "./ListRow";

export function AisleSection({ group }: { group: AisleGroup }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {group.aisle}
      </h2>
      <ul>
        {group.lines.map((line) => (
          <ListRow key={line.id} line={line} />
        ))}
      </ul>
    </section>
  );
}
