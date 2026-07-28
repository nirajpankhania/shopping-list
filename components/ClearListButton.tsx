"use client";

import { clearList } from "@/app/actions";

export function ClearListButton() {
  return (
    <form
      action={clearList}
      onSubmit={(e) => {
        if (
          !confirm(
            "Clear the list? Recipes come off the list (still saved) and manual items are removed. Save it as a plan first if you want to reuse it.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="mt-8 border-t border-neutral-200 pt-4"
    >
      <button type="submit" className="text-sm text-neutral-500 underline">
        Clear list
      </button>
    </form>
  );
}
