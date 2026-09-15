import { pgSchema } from "drizzle-orm/pg-core";

/** Schema ownership is established here; application tables are deferred. */
export const authSchema = pgSchema("auth");
export const atlasSchema = pgSchema("atlas");
export const bridgeSchema = pgSchema("bridge");
