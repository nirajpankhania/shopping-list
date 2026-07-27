import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "./memory";

describe("InMemoryRepository", () => {
  it("returns the seeded recipes, ingredients, and recipe-ingredients", async () => {
    const repo = new InMemoryRepository();
    expect(await repo.getRecipes()).toHaveLength(3);
    expect(await repo.getIngredients()).toHaveLength(5);
    expect(await repo.getRecipeIngredients()).toHaveLength(8);
  });

  it("starts with no overrides", async () => {
    const repo = new InMemoryRepository();
    expect(await repo.getOverrides()).toEqual([]);
  });

  it("creates an override with defaults filled in", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    expect(await repo.getOverrides()).toEqual([
      { ingredientId: "ing_onion", checked: true, alreadyHave: false },
    ]);
  });

  it("merges successive patches for the same ingredient", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    await repo.setOverride("ing_onion", { alreadyHave: true });
    expect(await repo.getOverrides()).toEqual([
      { ingredientId: "ing_onion", checked: true, alreadyHave: true },
    ]);
  });
});
