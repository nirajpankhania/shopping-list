DROP TABLE "pantry";
--> statement-breakpoint
CREATE TABLE "pantry" (
	"name" text PRIMARY KEY NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL
);
