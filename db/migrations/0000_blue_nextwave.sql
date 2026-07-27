CREATE TABLE "ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_name" text NOT NULL,
	"unit_family" text NOT NULL,
	"aisle" text NOT NULL,
	"density_g_per_ml" double precision,
	"pack_size" double precision NOT NULL,
	"pack_unit" text NOT NULL,
	"pack_label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_overrides" (
	"ingredient_id" text PRIMARY KEY NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"already_have" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"raw_text" text NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_url" text,
	"servings_original" integer NOT NULL,
	"servings_target" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "list_overrides" ADD CONSTRAINT "list_overrides_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;