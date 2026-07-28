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

  it("creates an override for a checked ingredient", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    expect(await repo.getOverrides()).toEqual([
      { ingredientId: "ing_onion", checked: true },
    ]);
  });

  it("updates the override on a repeated setOverride", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    await repo.setOverride("ing_onion", { checked: false });
    expect(await repo.getOverrides()).toEqual([
      { ingredientId: "ing_onion", checked: false },
    ]);
  });

  it("saves a parsed recipe: new ingredient + recipe + recipe-ingredients", async () => {
    const repo = new InMemoryRepository();
    await repo.saveRecipe({
      recipe: { id: "rec_x", title: "X", servingsOriginal: 2, servingsTarget: 2 },
      newIngredients: [
        { id: "ing_basil", canonicalName: "fresh basil", unitFamily: "MASS", aisle: "Fruit & Veg", packSize: 30, packUnit: "g", packLabel: "pack basil", unverified: true },
      ],
      recipeIngredients: [
        { id: "rec_x_ri_0", recipeId: "rec_x", rawText: "30 g basil", quantity: 30, unit: "g", ingredientId: "ing_basil" },
      ],
    });
    expect((await repo.getRecipes()).some((r) => r.id === "rec_x")).toBe(true);
    expect((await repo.getIngredients()).some((i) => i.id === "ing_basil")).toBe(true);
    expect((await repo.getRecipeIngredients()).some((r) => r.id === "rec_x_ri_0")).toBe(true);
  });
});

describe("InMemoryRepository pantry", () => {
  it("starts empty", async () => {
    expect(await new InMemoryRepository().getPantry()).toEqual([]);
  });

  it("records a pantry item", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_flour", quantity: 500, unit: "g" });
    expect(await repo.getPantry()).toEqual([
      { ingredientId: "ing_flour", quantity: 500, unit: "g" },
    ]);
  });

  it("replaces the amount for an ingredient rather than duplicating it", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_flour", quantity: 500, unit: "g" });
    await repo.setPantryItem({ ingredientId: "ing_flour", quantity: 250, unit: "g" });
    expect(await repo.getPantry()).toEqual([
      { ingredientId: "ing_flour", quantity: 250, unit: "g" },
    ]);
  });

  it("removes a pantry item", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_flour", quantity: 500, unit: "g" });
    await repo.removePantryItem("ing_flour");
    expect(await repo.getPantry()).toEqual([]);
  });
});
