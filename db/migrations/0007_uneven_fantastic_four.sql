ALTER TABLE "recipes" ADD COLUMN "scale" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "active" boolean DEFAULT true NOT NULL;