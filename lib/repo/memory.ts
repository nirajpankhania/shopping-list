import type {
  Repository,
  Recipe,
  RecipeIngredient,
  Ingredient,
  ListOverride,
  OverridePatch,
} from "./types";

// A few demo recipes that deliberately exercise the interesting cases:
// - chopped tomatoes appears in both recipes -> aggregation -> one tin
// - plain flour appears only as a spoon volume, but has a density -> bridges to grams
// - grated cheese appears as mass AND volume with no density -> refuse to guess
const SEED_RECIPES: Recipe[] = [
  { id: "rec_bolognese", title: "Bolognese", servingsOriginal: 4, servingsTarget: 4 },
  { id: "rec_soup", title: "Tomato soup", servingsOriginal: 4, servingsTarget: 4 },
];

const SEED_INGREDIENTS: Ingredient[] = [
  {
    id: "ing_tomatoes",
    canonicalName: "chopped tomatoes",
    unitFamily: "MASS",
    aisle: "Tins & Packets",
    packSize: 400,
    packUnit: "g",
    packLabel: "tin chopped tomatoes",
  },
  {
    id: "ing_onion",
    canonicalName: "onion",
    unitFamily: "COUNT",
    aisle: "Fruit & Veg",
    packSize: 1,
    packUnit: "each",
    packLabel: "onion",
  },
  {
    id: "ing_flour",
    canonicalName: "plain flour",
    unitFamily: "MASS",
    aisle: "Cooking & Baking",
    densityGPerMl: 0.53,
    packSize: 1000,
    packUnit: "g",
    packLabel: "bag plain flour",
  },
  {
    id: "ing_cheese",
    canonicalName: "grated cheese",
    unitFamily: "MASS",
    aisle: "Dairy & Chilled",
    packSize: 200,
    packUnit: "g",
    packLabel: "block grated cheese",
  },
];

const SEED_RECIPE_INGREDIENTS: RecipeIngredient[] = [
  { id: "ri_1", recipeId: "rec_bolognese", rawText: "200 g chopped tomatoes", quantity: 200, unit: "g", ingredientId: "ing_tomatoes" },
  { id: "ri_2", recipeId: "rec_bolognese", rawText: "1 onion", quantity: 1, unit: "each", ingredientId: "ing_onion" },
  { id: "ri_3", recipeId: "rec_bolognese", rawText: "2 tbsp plain flour", quantity: 2, unit: "tbsp", ingredientId: "ing_flour" },
  { id: "ri_4", recipeId: "rec_bolognese", rawText: "100 g grated cheese", quantity: 100, unit: "g", ingredientId: "ing_cheese" },
  { id: "ri_5", recipeId: "rec_soup", rawText: "140 g chopped tomatoes", quantity: 140, unit: "g", ingredientId: "ing_tomatoes" },
  { id: "ri_6", recipeId: "rec_soup", rawText: "2 onions", quantity: 2, unit: "each", ingredientId: "ing_onion" },
  { id: "ri_7", recipeId: "rec_soup", rawText: "3 tbsp grated cheese", quantity: 3, unit: "tbsp", ingredientId: "ing_cheese" },
];

/**
 * In-memory Repository seeded with a few demo recipes. Zero infrastructure —
 * the primary adapter for development and tests. The Postgres adapter will
 * replace it behind the same interface. Reads return copies so callers can't
 * mutate the store by accident.
 */
export class InMemoryRepository implements Repository {
  private readonly recipes: Recipe[] = [...SEED_RECIPES];
  private readonly recipeIngredients: RecipeIngredient[] = [...SEED_RECIPE_INGREDIENTS];
  private readonly ingredients: Ingredient[] = [...SEED_INGREDIENTS];
  private readonly overrides = new Map<string, ListOverride>();

  async getRecipes(): Promise<Recipe[]> {
    return [...this.recipes];
  }

  async getRecipeIngredients(): Promise<RecipeIngredient[]> {
    return [...this.recipeIngredients];
  }

  async getIngredients(): Promise<Ingredient[]> {
    return [...this.ingredients];
  }

  async getOverrides(): Promise<ListOverride[]> {
    return [...this.overrides.values()];
  }

  async setOverride(ingredientId: string, patch: OverridePatch): Promise<void> {
    const current = this.overrides.get(ingredientId) ?? {
      ingredientId,
      checked: false,
      alreadyHave: false,
    };
    this.overrides.set(ingredientId, { ...current, ...patch });
  }
}
