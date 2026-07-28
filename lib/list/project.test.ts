import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "../repo/memory";
import { projectList, inPantryItems, type AisleGroup } from "./project";
import type { Repository } from "../repo/types";

function lineFor(groups: AisleGroup[], ingredientId: string) {
  for (const group of groups) {
    const line = group.lines.find((l) => l.ingredientId === ingredientId);
    if (line) return line;
  }
  return undefined;
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
