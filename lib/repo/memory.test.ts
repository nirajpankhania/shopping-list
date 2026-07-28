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
      { ingredientId: "ing_onion", checked: true, manualQuantity: null, manualUnit: null, removed: false },
    ]);
  });

  it("merges a manual quantity into an existing override, then clears it", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    await repo.setOverride("ing_onion", { manualQuantity: 3, manualUnit: "each" });
    expect(await repo.getOverrides()).toEqual([
      { ingredientId: "ing_onion", checked: true, manualQuantity: 3, manualUnit: "each", removed: false },
    ]);
    // null is an explicit clear, back to the derived amount.
    await repo.setOverride("ing_onion", { manualQuantity: null, manualUnit: null });
    expect((await repo.getOverrides())[0]).toMatchObject({ manualQuantity: null, manualUnit: null });
  });

  it("saves a parsed recipe: new ingredient + recipe + recipe-ingredients", async () => {
    const repo = new InMemoryRepository();
    await repo.saveRecipe({
      recipe: { id: "rec_x", title: "X", servingsOriginal: 2, servingsTarget: 2, scale: 1 },
      newIngredients: [
        { id: "ing_basil", canonicalName: "fresh basil", unitFamily: "MASS", aisle: "Fruit & Veg", packSize: 30, packUnit: "g", packLabel: "pack basil" },
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
    await repo.setPantryItem({ name: "flour", quantity: 500, unit: "g" });
    expect(await repo.getPantry()).toEqual([{ name: "flour", quantity: 500, unit: "g" }]);
  });

  it("replaces the amount for a name rather than duplicating it", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ name: "flour", quantity: 500, unit: "g" });
    await repo.setPantryItem({ name: "flour", quantity: 250, unit: "g" });
    expect(await repo.getPantry()).toEqual([{ name: "flour", quantity: 250, unit: "g" }]);
  });

  it("removes a pantry item", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ name: "flour", quantity: 500, unit: "g" });
    await repo.removePantryItem("flour");
    expect(await repo.getPantry()).toEqual([]);
  });
});

describe("InMemoryRepository manual items", () => {
  const binBags = {
    id: "man_1",
    name: "bin bags",
    quantity: 1,
    unit: "each",
    aisle: "Household",
    checked: false,
  };

  it("starts empty", async () => {
    expect(await new InMemoryRepository().getManualItems()).toEqual([]);
  });

  it("adds a manual item", async () => {
    const repo = new InMemoryRepository();
    await repo.addManualItem(binBags);
    expect(await repo.getManualItems()).toEqual([binBags]);
  });

  it("toggles the checked state of a manual item", async () => {
    const repo = new InMemoryRepository();
    await repo.addManualItem(binBags);
    await repo.setManualItemChecked("man_1", true);
    expect((await repo.getManualItems())[0].checked).toBe(true);
  });

  it("removes a manual item", async () => {
    const repo = new InMemoryRepository();
    await repo.addManualItem(binBags);
    await repo.removeManualItem("man_1");
    expect(await repo.getManualItems()).toEqual([]);
  });
});
