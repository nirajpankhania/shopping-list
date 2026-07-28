import Link from "next/link";
import { projectList } from "@/lib/list/project";
import { repo } from "@/lib/repo/instance";
import { AisleSection } from "@/components/AisleSection";
import { AddManualItemForm } from "@/components/AddManualItemForm";

// Always render against the live state so check-off and pantry edits show immediately.
export const dynamic = "force-dynamic";

export default async function Page() {
  const groups = await projectList(repo);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping list</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-green-700">
          <Link href="/recipes" className="underline">
            Recipes
          </Link>
          <Link href="/pantry" className="underline">
            Pantry
          </Link>
          <Link href="/add" className="underline">
            Add
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-neutral-500">
          Nothing to buy — everything is checked off or in the pantry.
        </p>
      ) : (
        groups.map((group) => <AisleSection key={group.aisle} group={group} />)
      )}

      <AddManualItemForm />
    </main>
  );
}
