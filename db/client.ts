import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Lazily build a Drizzle client bound to Neon. Called only when DATABASE_URL is
 * set (i.e. when the Postgres adapter is selected), so importing this module
 * never opens a connection on its own.
 */
export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

export type Db = ReturnType<typeof createDb>;
