CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"recipe_scales" jsonb NOT NULL,
	"manual_items" jsonb NOT NULL
);
