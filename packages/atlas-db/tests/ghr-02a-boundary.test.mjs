import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("GHR-02A issuer remains an inert persistence seam", async () => {
  const source = await readFile(new URL("../src/generic-handoff-issuer.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../migrations/0103_ghr02a_immutable_issuance.sql", import.meta.url), "utf8");
  for (const prohibited of ["pg-boss", "enqueue", "worker", "receipt", "resolveBackground", "PostgresPerceptionAuthority", "parseSemanticBatchPlanInputV1"]) assert.equal(source.includes(prohibited), false, `issuer must not couple to ${prohibited}`);
  assert.match(source, /canonicalSemanticBatchPlanInputV1/, "issuer uses the existing canonical serializer without importing a semantic parser");
  assert.match(migration, /read_generic_handoff_dispatch_v1/, "migration provides the narrow known-handoff read function");
  for (const prohibited of ["generic_handoff_delivery", "pgboss"]) assert.equal(migration.includes(prohibited), false, `issuance migration must not create ${prohibited}`);
});
