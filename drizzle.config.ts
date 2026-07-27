import { config } from "dotenv";
config({ path: ".env.local" }); // scripts run outside Next, so load env explicitly

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
