import { projectList } from "@/lib/list/project";
import { repo } from "@/lib/repo/instance";
import { AisleSection } from "@/components/AisleSection";
import { AddManualItemForm } from "@/components/AddManualItemForm";
import { ClearListButton } from "@/components/ClearListButton";

// Always render against the live state so check-off and pantry edits show immediately.
export const dynamic = "force-dynamic";

export default async function Page() {
  const groups = await projectList(repo);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping list</h1>

      {groups.length === 0 ? (
        <p className="text-neutral-500">
          Nothing to buy — everything is checked off or in the pantry.
        </p>
      ) : (
        // On wide screens the aisles flow into two columns to use the space.
        <div className="md:columns-2 md:gap-8">
          {groups.map((group) => (
            <AisleSection key={group.aisle} group={group} />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-md md:mx-0">
        <AddManualItemForm />
        <ClearListButton />
      </div>
    </main>
  );
}
