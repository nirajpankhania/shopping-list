import Link from "next/link";
import { repo } from "@/lib/repo/instance";
import { PantryRow } from "@/components/PantryRow";
import { AddPantryItemForm } from "@/components/AddPantryItemForm";

// Always reflect the live pantry state so a saved amount shows immediately.
export const dynamic = "force-dynamic";

export default async function PantryPage() {
  const [ingredients, pantry] = await Promise.all([repo.getIngredients(), repo.getPantry()]);
  const added = [...pantry].sort((a, b) => a.name.localeCompare(b.name));
  // Suggestions for the autocomplete: the names your recipes actually use.
  const suggestions = [...new Set(ingredients.map((i) => i.canonicalName))].sort();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pantry</h1>
        <Link href="/" className="text-sm font-medium text-primary underline">
          Back to list
        </Link>
      </div>
      <p className="mb-4 text-sm text-neutral-500">
        Add what you already have — type anything (suggestions come from your
        recipes). The list tags a line "in pantry" when a name matches.
      </p>

      {added.length > 0 && (
        <ul className="mb-2">
          {added.map((item) => (
            <PantryRow key={item.name} item={item} />
          ))}
        </ul>
      )}
      <AddPantryItemForm suggestions={suggestions} />
    </main>
  );
}
