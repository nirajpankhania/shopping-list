CREATE TABLE "pantry" (
	"ingredient_id" text PRIMARY KEY NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pantry" ADD CONSTRAINT "pantry_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;