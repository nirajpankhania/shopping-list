ALTER TABLE "list_overrides" ADD COLUMN "manual_quantity" double precision;--> statement-breakpoint
ALTER TABLE "list_overrides" ADD COLUMN "manual_unit" text;--> statement-breakpoint
ALTER TABLE "list_overrides" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;