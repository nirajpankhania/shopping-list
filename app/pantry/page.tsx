import Link from "next/link";
import { repo } from "@/lib/repo/instance";
import { PantryRow } from "@/components/PantryRow";

// Always reflect the live pantry state so a saved amount shows immediately.
export const dynamic = "force-dynamic";

export default async function PantryPage() {
  const [ingredients, pantry] = await Promise.all([repo.getIngredients(), repo.getPantry()]);
  const haveById = new Map(pantry.map((p) => [p.ingredientId, p]));
  const rows = [...ingredients].sort((a, b) =>
    a.canonicalName.localeCompare(b.canonicalName),
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pantry</h1>
        <Link href="/" className="text-sm font-medium text-green-700 underline">
          Back to list
        </Link>
      </div>
      <p className="mb-4 text-sm text-neutral-500">
        Record what you already have. The list subtracts it — anything you have
        enough of drops off.
      </p>

      {rows.length === 0 ? (
        <p className="text-neutral-500">No ingredients yet. Add a recipe first.</p>
      ) : (
        <ul>
          {rows.map((ing) => (
            <PantryRow key={ing.id} ingredient={ing} current={haveById.get(ing.id)} />
          ))}
        </ul>
      )}
    </main>
  );
}
