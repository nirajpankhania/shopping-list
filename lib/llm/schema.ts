import { z } from "zod";

export const KNOWN_UNITS = ["mg", "g", "kg", "oz", "lb", "ml", "l", "tsp", "tbsp", "cup", "each"] as const;
export const CATEGORIES = [
  "produce", "bakery", "meat_fish", "dairy_chilled", "frozen",
  "tins_packets", "cooking_baking", "drinks", "household", "other",
] as const;

export const ParsedIngredientSchema = z.object({
  rawText: z.string(),
  quantity: z.number(),
  unit: z.enum(KNOWN_UNITS),
  note: z.string().optional(),
  canonicalName: z.string(),
  matchedIngredientId: z.string().nullable(),
  category: z.enum(CATEGORIES),
  packSize: z.number(),
  packUnit: z.enum(KNOWN_UNITS),
  packLabel: z.string(),
});

export const ParsedRecipeSchema = z.object({
  title: z.string(),
  servings: z.number(),
  ingredients: z.array(ParsedIngredientSchema),
});

export type ParsedRecipe = z.infer<typeof ParsedRecipeSchema>;
