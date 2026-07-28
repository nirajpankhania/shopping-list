import Link from "next/link";
import { repo } from "@/lib/repo/instance";
import { PantryRow } from "@/components/PantryRow";
import { AddPantryItemForm } from "@/components/AddPantryItemForm";

// Always reflect the live pantry state so a saved amount shows immediately.
export const dynamic = "force-dynamic";

export default async function PantryPage() {
  const [ingredients, pantry] = await Promise.all([repo.getIngredients(), repo.getPantry()]);
  const haveById = new Map(pantry.map((p) => [p.ingredientId, p]));
  const byName = (a: { canonicalName: string }, b: { canonicalName: string }) =>
    a.canonicalName.localeCompare(b.canonicalName);

  // Only what the user has actually added is shown; everything else is offered
  // in the picker. The pantry starts empty — you configure it yourself.
  const added = ingredients.filter((i) => haveById.has(i.id)).sort(byName);
  const available = ingredients
    .filter((i) => !haveById.has(i.id))
    .sort(byName)
    .map((i) => ({ id: i.id, name: i.canonicalName, family: i.unitFamily }));

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pantry</h1>
        <Link href="/" className="text-sm font-medium text-green-700 underline">
          Back to list
        </Link>
      </div>
      <p className="mb-4 text-sm text-neutral-500">
        Add what you already have. The list subtracts it — anything you have enough
        of drops off.
      </p>

      {ingredients.length === 0 ? (
        <p className="text-neutral-500">No ingredients yet. Add a recipe first.</p>
      ) : (
        <>
          {added.length > 0 && (
            <ul className="mb-2">
              {added.map((ing) => (
                <PantryRow key={ing.id} ingredient={ing} current={haveById.get(ing.id)} />
              ))}
            </ul>
          )}
          <AddPantryItemForm choices={available} />
        </>
      )}
    </main>
  );
}
