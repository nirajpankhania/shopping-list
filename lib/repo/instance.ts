import type { Repository } from "./types";
import { InMemoryRepository } from "./memory";
import { PostgresRepository } from "./postgres";

/**
 * Postgres when DATABASE_URL is set, otherwise the seeded in-memory adapter
 * (the demo fallback). Stashed on globalThis so it survives dev hot-reloads.
 */
function createRepo(): Repository {
  return process.env.DATABASE_URL ? new PostgresRepository() : new InMemoryRepository();
}

const globalForRepo = globalThis as unknown as { repo?: Repository };

export const repo = globalForRepo.repo ?? createRepo();

if (process.env.NODE_ENV !== "production") {
  globalForRepo.repo = repo;
}
