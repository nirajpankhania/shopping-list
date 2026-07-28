import { pgTable, text, integer, doublePrecision, boolean } from "drizzle-orm/pg-core";
import type { UnitFamily } from "../lib/units";

export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  servingsOriginal: integer("servings_original").notNull(),
  servingsTarget: integer("servings_target").notNull(),
});

export const ingredients = pgTable("ingredients", {
  id: text("id").primaryKey(),
  canonicalName: text("canonical_name").notNull(),
  // Stored as text; typed as the domain union on the boundary.
  unitFamily: text("unit_family").$type<UnitFamily>().notNull(),
  aisle: text("aisle").notNull(),
  densityGPerMl: doublePrecision("density_g_per_ml"),
  packSize: doublePrecision("pack_size").notNull(),
  packUnit: text("pack_unit").notNull(),
  packLabel: text("pack_label").notNull(),
  unverified: boolean("unverified").notNull().default(false),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id),
  rawText: text("raw_text").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull(),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id),
  note: text("note"),
});

export const listOverrides = pgTable("list_overrides", {
  ingredientId: text("ingredient_id")
    .primaryKey()
    .references(() => ingredients.id),
  checked: boolean("checked").notNull().default(false),
  // A user-set amount replacing the recipe requirement (null = use derived).
  manualQuantity: doublePrecision("manual_quantity"),
  manualUnit: text("manual_unit"),
  removed: boolean("removed").notNull().default(false),
});

// What the user already has at home, entered by name (not tied to a recipe).
// One row per normalised name; the list tags a matching recipe line "in pantry".
export const pantry = pgTable("pantry", {
  name: text("name").primaryKey(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull(),
});

// List entries the user added by hand — not from any recipe. They carry their
// own aisle and checked state and sit alongside recipe-derived lines.
export const manualItems = pgTable("manual_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull(),
  aisle: text("aisle").notNull(),
  checked: boolean("checked").notNull().default(false),
});
