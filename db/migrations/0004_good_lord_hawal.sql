CREATE TABLE "manual_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"aisle" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL
);
