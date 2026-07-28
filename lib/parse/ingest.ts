import type { Repository } from "../repo/types";
import { parseRecipe } from "../llm/parse";
import { resolveParsedRecipe } from "./resolve";

/** Parse pasted recipe text and persist it. Returns the new recipe's id. */
export async function ingestRecipe(repo: Repository, text: string): Promise<string> {
  const existing = await repo.getIngredients();
  const catalog = existing.map((i) => ({ id: i.id, canonicalName: i.canonicalName }));

  const parsed = await parseRecipe(text, catalog);
  const input = resolveParsedRecipe(parsed, catalog);

  await repo.saveRecipe(input);
  return input.recipe.id;
}
