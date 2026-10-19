# CFC Checkpoint — IDSER-012-03-03-01

- **Ticket:** `IDSER-012-03-03-01` — Immutable plan/handoff persistence
- **Batch:** `IDSER-BATCH-12-03-03-01`
- **State:** `awaiting_review`
- **Remediation base:** `eb8d96dbbb79d493c94ee0a176e0a32b5c57d330`
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-03-01-eb8d96d-review.md`
- **Authorization:** first bounded CFC pass for that consolidated `CHANGES_REQUIRED` review; no HMN authorization is required or consumed.

## Authorized closure matrix

| Frozen clause | Status | Evidence and exact command | Frozen oracle |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-db/src/immutable-semantic-corpus-plan.ts` binds `execution.contract_version` to frozen `source.perceptionContractVersion`. The real-PostgreSQL test makes the completed execution `v2`, observes rejection and zero plan rows, then restores the matching version. `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS (3/3)**. | **Passed.** Mismatched completed execution cannot satisfy the acceptance query or insert a plan/handoff. |
| `CK-001.b` | `PROVEN` | `BssProvenanceSnapshotV1` requires source ID/version, enforcement policy ID/version, process profile ID/version, workload plan ID/version, and estimator ID/version. A focused canonicalization assertion rejects a missing estimator version. The same integration command — **PASS (3/3)**. | **Passed.** Persisted BSS provenance has a fixed, complete, versioned reference schema. |
| `CK-001.c` | `PROVEN` | The bounded provenance schema permits only documented reference/version fields. A focused canonicalization assertion rejects a representative `customerMemo` raw-payload field. The same integration command — **PASS (3/3)**. | **Passed.** Arbitrary payload fields cannot cross the immutable persistence boundary. |
| `CK-002.a` | `PROVEN` | Forward migration `0086_idser012_immutable_semantic_corpus_plan_cfc.sql` adds `BEFORE UPDATE OR DELETE` guards for plans/handoffs. The real PostgreSQL test connects as `atlas_app`, rejects plan update and handoff deletion, then proves cancellation plus a new successor replan remains valid. `node --env-file=.env packages/atlas-db/scripts/migrate.mjs` — **PASS**; focused test — **PASS (3/3)**. | **Passed.** Normal Atlas writes cannot mutate/delete plans or handoffs; append-only replan remains valid. |
| `CK-002.b` | `PROVEN` | The forward migration guards cancellation rows too. The real PostgreSQL test as `atlas_app` rejects cancellation update/delete after insertion. Focused test — **PASS (3/3)**. | **Passed.** Cancellation ancestry cannot be rewritten or removed through the normal role. |

## Commands and outcomes

```text
corepack pnpm --filter @atlas/db typecheck  PASS
node --env-file=.env packages/atlas-db/scripts/migrate.mjs  PASS (0086 applied)
node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts  PASS (3/3)
node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check  PASS
git diff --check  PASS
```

## Direct-regression check

The remediation retains the accepted bundle/document/source/cache/capability scope fence, parent-plus-all-handoffs transaction, replay/conflict behavior, cancellation/replan append-only flow, and zero GHR/BSS/SEM/semantic-truth/reconciliation effects. The focused real-PostgreSQL test continues to assert forbidden-effect counters. No approved `-03-02-03` reader/estimator boundary or downstream surface changed.

## Shadow-CK readiness

Every authorized frozen clause is `PROVEN` with its original closure oracle, named assertion, and required command outcome. Previously proven `RC-012030301-04` was preserved.

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint. It does not issue `PASS`; CK must verify only `CK-001.a` through `CK-001.c`, `CK-002.a` through `CK-002.b`, this remediation diff, and direct regressions.
