import { AddRecipeForm } from "@/components/AddRecipeForm";

export default function AddPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Add a recipe</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Paste the text and we&apos;ll turn it into shopping-list items.
      </p>
      <AddRecipeForm />
    </main>
  );
}
