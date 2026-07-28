import { repo } from "@/lib/repo/instance";
import { saveListAsPlan, applyPlan, updatePlan, deletePlan } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = [...(await repo.getPlans())].sort((a, b) => a.name.localeCompare(b.name));
  const atLimit = plans.length >= 10;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Saved plans</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Save the current list as a plan, then apply it week to week. Up to 10.
      </p>

      {plans.length > 0 && (
        <ul className="mb-6">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-neutral-200 py-3">
              <div className="min-w-0 flex-1">
                <span className="block font-medium">{p.name}</span>
                <span className="text-xs text-neutral-500">
                  {Object.keys(p.recipeScales).length} recipes · {p.manualItems.length} items
                </span>
              </div>
              <form action={applyPlan}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="rounded bg-primary px-3 py-1 text-sm font-medium text-white"
                >
                  Apply
                </button>
              </form>
              <form action={updatePlan}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  title="Overwrite this plan with the current list"
                  className="text-sm text-neutral-600 underline"
                >
                  Update
                </button>
              </form>
              <form action={deletePlan}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${p.name}`}
                  className="text-lg leading-none text-neutral-400 hover:text-red-600"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        <p className="border-t border-neutral-200 pt-4 text-sm text-neutral-500">
          You've saved the maximum of 10 plans — delete one to add another.
        </p>
      ) : (
        <form
          action={saveListAsPlan}
          className="flex items-center gap-2 border-t border-neutral-200 pt-4"
        >
          <input
            name="name"
            required
            placeholder="Name this plan — e.g. Weekly shop"
            aria-label="Plan name"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Save current list
          </button>
        </form>
      )}
    </main>
  );
}
