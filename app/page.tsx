import Link from "next/link";
import { projectList, alreadyHaveItems } from "@/lib/list/project";
import { repo } from "@/lib/repo/instance";
import { AisleSection } from "@/components/AisleSection";
import { AlreadyHaveSection } from "@/components/AlreadyHaveSection";

// Always render against the live in-memory state so check-off shows immediately.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [groups, owned] = await Promise.all([
    projectList(repo),
    alreadyHaveItems(repo),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping list</h1>
        <Link href="/add" className="text-sm font-medium text-green-700 underline">
          Add a recipe
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="text-neutral-500">
          Nothing to buy — everything is checked off or already owned.
        </p>
      ) : (
        groups.map((group) => <AisleSection key={group.aisle} group={group} />)
      )}

      {owned.length > 0 && <AlreadyHaveSection items={owned} />}
    </main>
  );
}
