# BSS-QAP-BATCH-01 R1 GO checkpoint

- **Ticket:** BSS-QAP-001 — R1 nullable deprecation migration and publisher preservation
- **Authority:** `BSS-QAP-001-r1-nullable-deprecation-migration.md`, the 2026-10-29 publisher blocker-resolution addendum, and the source audit §§1–8, 11–12
- **Implementation commit:** recorded with this checkpoint
- **Checkpoint state:** `awaiting_review`

## Bounded implementation

Added and registered only `0112_bssv2_quota_accounting_policy_deprecation`.
It drops `NOT NULL` from the two deprecated metadata columns and explicitly
redefines the two supported publishers.  Each definition removes only the
`quota_accounting_policy_id IS DISTINCT FROM` operand.  The shared-domain
definition includes the final `0093` and `0094` alias fixes.  No historical
migration, TypeScript writer contract, operational writer, release role/grant,
or `0113` inventory was changed.

## Pre-DDL target catalog and source preflight

Target recorded before applying `0112`: local disposable `atlas_dev`, user
`postgres`, with `atlas.schema_migrations` present through `0111`.

The pre-DDL `information_schema.columns` query returned both target columns
with `is_nullable = NO`.  The target had the two nonblank checks and the two
`NOT NULL` constraints; its non-internal target-table triggers were the
existing immutable-row triggers.  The procedural-body inventory (restricted
to non-system functions) returned exactly:

| Function | Owner | Security definer | Configuration |
| --- | --- | --- | --- |
| `bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb)` | `agents_bridge` | no | none |
| `bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb,jsonb,jsonb)` | `atlas` | yes | `search_path=pg_catalog, bridge` |

The `pg_views` inventory returned zero matches.  `pg_depend`, joined to the
exact target columns, identified only their declared checks and `NOT NULL`
constraints; procedural-body inspection supplied the two publisher references
that `pg_depend` does not expose.  The repository migration/function-source
inventory returned `0023`, `0028`, `0067`, `0076`, `0078`, `0091`, and this
new `0112`; the effective installed bodies are the `0067` and `0091` successors
identified above.  The addendum's completed deployment inventory found no
application, scheduled-worker, or operational invocation of the convergence
publisher.  No unplanned external writer or authority path was found.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| RC-QAP-001-01 | Register only `0112`; no executable path can apply `0113`. | Fresh disposable PostgreSQL replay applied through `0112`; `pnpm --filter @atlas/db migration:check` passed; repeat `pnpm --filter @atlas/db migrate` reported `already up to date`; runner inventory contains `0112` and repository search returned no `0113` registration. | PROVEN |
| RC-QAP-001-02 | Both columns become nullable; nonblank checks and historical values remain; new values may omit IDs. | `pnpm --filter @atlas/db test:qap-001-r1` passed, asserting `YES` nullability, both retained checks, legacy nonempty inserts, and ID-free capacity/workload inserts. The fresh replay used the same test after `0112`. | PROVEN |
| RC-QAP-001-03 | Both final publishers remove only the obsolete equality operand and retain their authority and behavior. | `test:qap-001-r1`, `test:authorized-desired-plan-convergence`, `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts`, and `weighted-capacity-publication.integration.test.ts` passed. The R1 test confirms signatures, owners, definer/search path, non-PUBLIC Bridge grants, retained advisory/effective-policy guards, ID-free publication on both paths, shared candidate activation fence, and negative guard rejections. The focused convergence/wakeup tests retain concurrency, activation, replay, fairness, durable wakeup, and reservation-history observations. | PROVEN |
| RC-QAP-001-04 | Empty replay retains the canonical Anoman seed and zero-authority invariant. | On a new temporary PostgreSQL instance, `pnpm --filter @atlas/db migrate` applied the full chain through `0112`, then `pnpm --filter @atlas/db test:bss-fresh-install-contract` passed. | PROVEN |
| RC-QAP-001-05 | Affected accounting behavior remains unchanged. | Passed focused regressions: `weighted-capacity-publication.integration.test.ts` (weighted/candidate rejection fences), `authorized-enforcement-policy-provenance.integration.test.ts` and `policy-aware-runtime-admission-fairness.integration.test.ts` (effective policy, unknown-RPD handling, fair admission), `provider-admitted-worker.integration.test.ts` (TPM reservation, reconciliation, replay, and restart projection), `capacity-planning-snapshot.integration.test.ts`, and `calculated-capacity-snapshot-v2.integration.test.ts`. | PROVEN |
| RC-QAP-001-06 | Recorded target preflight must show only the two named publisher bodies and declared constraints/triggers before DDL. | Pre-DDL target catalog/body inventory and repository source inventory recorded above. Both discovered executable bodies are explicitly replaced by `0112`; no view, unplanned trigger, external writer, or authority path was found. | PROVEN |

## Exact validation outcome

The following commands passed with the disposable target configuration:

```text
pnpm --filter @atlas/db migrate
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db test:bss-fresh-install-contract
pnpm --filter @atlas/db test:qap-001-r1
pnpm --filter @atlas/db test:authorized-desired-plan-convergence
pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts
pnpm --filter @atlas/db exec jiti tests/authorized-enforcement-policy-provenance.integration.test.ts
pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/db test:capacity-planning-snapshot
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
```

Internal readiness: READY_FOR_CK
