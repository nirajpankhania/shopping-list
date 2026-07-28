import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "../repo/memory";
import { projectList, alreadyHaveItems, type AisleGroup } from "./project";
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

  it("drops an ingredient marked already-have", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_tomatoes", { alreadyHave: true });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_tomatoes")).toBeUndefined();
  });

  it("marks a checked ingredient", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_onion")?.checked).toBe(true);
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
      getPantry: async () => [],
      setPantryItem: async () => {},
      removePantryItem: async () => {},
      saveRecipe: async () => {},
    };
    expect(lineFor(await projectList(repo), "ing_basil")?.amount).toBe("30 g + 30 ml");
  });
});

describe("alreadyHaveItems", () => {
  it("lists ingredients marked already-have that appear in recipes", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { alreadyHave: true });
    expect(await alreadyHaveItems(repo)).toEqual([
      { ingredientId: "ing_onion", name: "onion" },
    ]);
  });

  it("returns empty when nothing is marked already-have", async () => {
    expect(await alreadyHaveItems(new InMemoryRepository())).toEqual([]);
  });
});
