import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { RepositoryTransaction, TransactionRunner } from "@atlas/core";

export function createDatabase(url: string) {
  const client = postgres(url, { max: 1 });
  // Auth-adjacent infrastructure operations occasionally need one explicit
  // PostgreSQL transaction spanning a durable Atlas coordination transition.
  // Keep the raw client private to the server-side package boundary; callers
  // still use Better Auth for identities, credentials, and sessions.
  return { db: drizzle(client), sql: client, close: () => client.end() };
}

/** Adapts a PostgreSQL transaction without exposing Drizzle to Atlas Core. */
export function createTransactionRunner(url: string): TransactionRunner {
  const client = postgres(url, { max: 1 });
  return {
    async transaction<T>(work: (transaction: RepositoryTransaction) => Promise<T>): Promise<T> {
      return (await client.begin(async (sql) => {
        let finished = false;
        const transaction = {
          commit: async () => { finished = true; },
          rollback: async () => { throw new Error("Transaction rolled back by Atlas Core"); },
        };
        const result = await work(transaction);
        if (!finished) throw new Error("Atlas Core transaction must be explicitly committed");
        await sql`SELECT 1`;
        return result;
      })) as T;
    },
  };
}
