import Link from "next/link";
import { repo } from "@/lib/repo/instance";
import { RecipeRow } from "@/components/RecipeRow";

// Always reflect the live recipe state so a scale/drop shows immediately.
export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = [...(await repo.getRecipes())].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Recipes</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Scale a recipe for more people or days, drop it from the list (it stays
        saved — no re-import), or delete it.
      </p>

      {recipes.length === 0 ? (
        <p className="text-neutral-500">
          No recipes yet.{" "}
          <Link href="/add" className="underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <ul>
          {recipes.map((r) => (
            <RecipeRow key={r.id} recipe={r} />
          ))}
        </ul>
      )}
    </main>
  );
}
