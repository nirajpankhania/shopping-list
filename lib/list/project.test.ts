import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "../repo/memory";
import { projectList, inPantryItems, removedItems, type AisleGroup } from "./project";
import type { Repository } from "../repo/types";

function lineFor(groups: AisleGroup[], id: string) {
  for (const group of groups) {
    const line = group.lines.find((l) => l.id === id);
    if (line) return line;
  }
  return undefined;
}

function groupFor(groups: AisleGroup[], aisle: string) {
  return groups.find((g) => g.aisle === aisle);
}

describe("projectList", () => {
  it("orders aisle groups by UK walk order", async () => {
    const groups = await projectList(new InMemoryRepository());
    expect(groups.map((g) => g.aisle)).toEqual([
      "Fruit & Veg",
      "Dairy & Chilled",
      "Tins & Packets",
      "Cooking & Baking",
    ]);
  });

  it("marks lines from curated ingredients as verified", async () => {
    const groups = await projectList(new InMemoryRepository());
    expect(lineFor(groups, "ing_tomatoes")?.unverified).toBe(false);
  });

  it("aggregates one ingredient across recipes into a single requirement", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 200 g + 140 g = 340 g
    expect(lineFor(groups, "ing_tomatoes")?.amount).toBe("340 g");
  });

  it("resolves a cup of flour to grams via density (flour is sold by weight)", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 1 cup (236.588 ml) at 0.53 g/ml -> 125.39 g
    expect(lineFor(groups, "ing_flour")?.amount).toBe("125.39 g");
  });

  it("keeps a cup of milk as millilitres (milk is sold by volume)", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 1 cup (236.588 ml) -> stays volume
    expect(lineFor(groups, "ing_milk")?.amount).toBe("236.59 ml");
  });

  it("aggregates cheese cleanly in grams (never measured by volume)", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 100 g + 50 g = 150 g
    expect(lineFor(groups, "ing_cheese")?.amount).toBe("150 g");
  });

  it("marks a checked ingredient", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_onion")?.checked).toBe(true);
  });

  it("tags recipe-derived lines with source 'recipe'", async () => {
    const groups = await projectList(new InMemoryRepository());
    expect(lineFor(groups, "ing_tomatoes")?.source).toBe("recipe");
  });

  it("places a manual item in its chosen aisle, formatted, tagged 'manual'", async () => {
    const repo = new InMemoryRepository();
    await repo.addManualItem({
      id: "man_oil",
      name: "olive oil",
      quantity: 500,
      unit: "ml",
      aisle: "Cooking & Baking",
      checked: false,
    });
    const groups = await projectList(repo);
    const line = lineFor(groups, "man_oil");
    expect(line).toMatchObject({
      id: "man_oil",
      name: "olive oil",
      aisle: "Cooking & Baking",
      amount: "500 ml",
      source: "manual",
      checked: false,
    });
    // and it sits inside the Cooking & Baking group, in walk order
    expect(groupFor(groups, "Cooking & Baking")?.lines.some((l) => l.id === "man_oil")).toBe(true);
  });

  it("reflects a manual item's checked state", async () => {
    const repo = new InMemoryRepository();
    await repo.addManualItem({
      id: "man_bags",
      name: "bin bags",
      quantity: 1,
      unit: "each",
      aisle: "Household",
      checked: true,
    });
    const groups = await projectList(repo);
    expect(lineFor(groups, "man_bags")?.checked).toBe(true);
  });

  it("carries the ingredient's unit family on the line", async () => {
    const groups = await projectList(new InMemoryRepository());
    expect(lineFor(groups, "ing_tomatoes")?.family).toBe("MASS");
  });

  it("shows a manual quantity instead of the derived need, ignoring the pantry", async () => {
    const repo = new InMemoryRepository();
    // Pantry alone would leave a 140 g shortfall; the manual amount overrides it.
    await repo.setPantryItem({ ingredientId: "ing_tomatoes", quantity: 200, unit: "g" });
    await repo.setOverride("ing_tomatoes", { manualQuantity: 500, manualUnit: "g" });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_tomatoes")?.amount).toBe("500 g");
  });

  it("drops a removed recipe line", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_tomatoes", { removed: true });
    expect(lineFor(await projectList(repo), "ing_tomatoes")).toBeUndefined();
  });

  it("subtracts a partial pantry amount and shows the shortfall", async () => {
    const repo = new InMemoryRepository();
    // Need 340 g; already have 0.1 kg -> still need 240 g (unit converted).
    await repo.setPantryItem({ ingredientId: "ing_tomatoes", quantity: 0.1, unit: "kg" });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_tomatoes")?.amount).toBe("240 g");
  });

  it("drops an ingredient the pantry fully covers", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_tomatoes", quantity: 500, unit: "g" });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_tomatoes")).toBeUndefined();
  });

  it("converts a pantry amount across families via density before subtracting", async () => {
    const repo = new InMemoryRepository();
    // Flour need 125.39 g; 100 ml of flour at 0.53 g/ml = 53 g -> shortfall 72.39 g.
    await repo.setPantryItem({ ingredientId: "ing_flour", quantity: 100, unit: "ml" });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_flour")?.amount).toBe("72.39 g");
  });

  it("refuses to guess mass + volume when no density is available", async () => {
    // A no-density ingredient (fresh herbs) given by weight in one recipe and by
    // volume in another. Without a density we won't fabricate a conversion — we
    // surface both. This is the safety net; ingredients that need it get a density.
    const repo: Repository = {
      getRecipes: async () => [],
      getRecipeIngredients: async () => [
        { id: "a", recipeId: "r", rawText: "30 g fresh basil", quantity: 30, unit: "g", ingredientId: "ing_basil" },
        { id: "b", recipeId: "r", rawText: "2 tbsp fresh basil", quantity: 2, unit: "tbsp", ingredientId: "ing_basil" },
      ],
      getIngredients: async () => [
        {
          id: "ing_basil",
          canonicalName: "fresh basil",
          unitFamily: "MASS",
          aisle: "Fruit & Veg",
          packSize: 30,
          packUnit: "g",
          packLabel: "pack fresh basil",
          unverified: false,
        },
      ],
      getOverrides: async () => [],
      setOverride: async () => {},
      // Even with basil "in the pantry", an un-mergeable requirement must never
      // be silently marked covered — we can't compare 100 g against "30 g + 30 ml".
      getPantry: async () => [{ ingredientId: "ing_basil", quantity: 100, unit: "g" }],
      setPantryItem: async () => {},
      removePantryItem: async () => {},
      getManualItems: async () => [],
      addManualItem: async () => {},
      setManualItemChecked: async () => {},
      removeManualItem: async () => {},
      saveRecipe: async () => {},
    };
    expect(lineFor(await projectList(repo), "ing_basil")?.amount).toBe("30 g + 30 ml");
    expect(await inPantryItems(repo)).toEqual([]);
  });
});

describe("inPantryItems", () => {
  it("lists ingredients the pantry fully covers, with need and have amounts", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_tomatoes", quantity: 500, unit: "g" });
    expect(await inPantryItems(repo)).toEqual([
      { ingredientId: "ing_tomatoes", name: "chopped tomatoes", need: "340 g", have: "500 g" },
    ]);
  });

  it("excludes partially-covered ingredients (they stay on the active list)", async () => {
    const repo = new InMemoryRepository();
    await repo.setPantryItem({ ingredientId: "ing_tomatoes", quantity: 200, unit: "g" });
    expect(await inPantryItems(repo)).toEqual([]);
  });

  it("is empty when the pantry is empty", async () => {
    expect(await inPantryItems(new InMemoryRepository())).toEqual([]);
  });
});

describe("removedItems", () => {
  it("lists removed recipe ingredients so they can be restored", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { removed: true });
    expect(await removedItems(repo)).toEqual([{ ingredientId: "ing_onion", name: "onion" }]);
  });

  it("is empty when nothing is removed", async () => {
    expect(await removedItems(new InMemoryRepository())).toEqual([]);
  });
});
