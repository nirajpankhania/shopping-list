import { describe, it, expect } from "vitest";
import { resolveParsedRecipe } from "./resolve";
import type { ParsedRecipe } from "../llm/schema";

const parsed: ParsedRecipe = {
  title: "Test bake",
  servings: 2,
  ingredients: [
    {
      rawText: "200 g chopped tomatoes",
      quantity: 200,
      unit: "g",
      canonicalName: "chopped tomatoes",
      matchedIngredientId: "ing_tomatoes", // exists in the catalog
      category: "tins_packets",
      packSize: 400,
      packUnit: "g",
      packLabel: "tin chopped tomatoes",
    },
    {
      rawText: "1 cup plain flour",
      quantity: 1,
      unit: "cup",
      canonicalName: "plain flour",
      matchedIngredientId: null, // a miss -> new ingredient
      category: "cooking_baking",
      packSize: 1000,
      packUnit: "g",
      packLabel: "bag plain flour",
    },
  ],
};

describe("resolveParsedRecipe", () => {
  const result = resolveParsedRecipe(parsed, [
    { id: "ing_tomatoes", canonicalName: "chopped tomatoes" },
  ]);

  it("links a matched ingredient to its existing id and creates no new ingredient for it", () => {
    const ri = result.recipeIngredients.find((r) => r.rawText.includes("tomatoes"))!;
    expect(ri.ingredientId).toBe("ing_tomatoes");
    expect(result.newIngredients.some((i) => i.id === "ing_tomatoes")).toBe(false);
  });

  it("creates a new ingredient for a miss", () => {
    const flour = result.newIngredients.find((i) => i.canonicalName === "plain flour")!;
    expect(flour.aisle).toBe("Cooking & Baking"); // from category
    expect(flour.unitFamily).toBe("MASS"); // derived from packUnit "g"
    expect(flour.densityGPerMl).toBe(0.53); // curated
    expect(flour.packLabel).toBe("bag plain flour"); // LLM pack
  });

  it("produces a recipe carrying the parsed title and servings", () => {
    expect(result.recipe.title).toBe("Test bake");
    expect(result.recipe.servingsOriginal).toBe(2);
    expect(result.recipe.servingsTarget).toBe(2);
  });

  it("rejects a catalog match to an unrelated ingredient (guards silent conversion)", () => {
    // The LLM maps "milk" onto the flour ingredient — a gross mismatch. With no
    // shared word, the match is refused and milk resolves to its own id instead
    // of inheriting flour's density and being converted to grams.
    const bad: ParsedRecipe = {
      title: "Milk bread",
      servings: 2,
      ingredients: [
        {
          rawText: "150 ml milk",
          quantity: 150,
          unit: "ml",
          canonicalName: "milk",
          matchedIngredientId: "ing_flour",
          category: "dairy_chilled",
          packSize: 1000,
          packUnit: "ml",
          packLabel: "carton milk",
        },
      ],
    };
    const out = resolveParsedRecipe(bad, [{ id: "ing_flour", canonicalName: "plain flour" }]);
    expect(out.recipeIngredients[0].ingredientId).toBe("ing_milk");
    expect(out.recipeIngredients[0].ingredientId).not.toBe("ing_flour");
  });
});
