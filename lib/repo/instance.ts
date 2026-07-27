import { InMemoryRepository } from "./memory";

/**
 * A single shared repository for the running server. Stashed on globalThis so
 * it survives dev hot-reloads — otherwise every code edit would reset check-off
 * state. In-memory state lasts for the life of the process; the Postgres adapter
 * will make it durable behind the same Repository interface.
 */
const globalForRepo = globalThis as unknown as { repo?: InMemoryRepository };

export const repo = globalForRepo.repo ?? new InMemoryRepository();

if (process.env.NODE_ENV !== "production") {
  globalForRepo.repo = repo;
}
