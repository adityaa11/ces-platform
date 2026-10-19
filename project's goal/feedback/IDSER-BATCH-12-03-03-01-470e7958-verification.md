# CK verification: IDSER-012-03-03-01 / IDSER-BATCH-12-03-03-01

- **Ticket:** `IDSER-012-03-03-01` — Immutable plan/handoff persistence.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-01-immutable-plan-handoff-persistence.md`.
- **Original CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-03-01-eb8d96d-review.md`.
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-03-01-cfc-checkpoint.md`.
- **Reviewed remediation commit:** `470e7958ce553bee68e44b60f757bc6e74f59b99` (`fix(idser): harden immutable plan persistence`).
- **Review kind:** post-CFC verification of the original frozen findings only.
- **Result:** `PASS`.

## Verification scope

The ticket is `awaiting_review`, and the committed CFC checkpoint consumes the first bounded CFC authorization for the original consolidated `CHANGES_REQUIRED` review. Verification was limited to frozen clauses `CK-001.a` through `CK-001.c`, `CK-002.a` through `CK-002.b`, the remediation diff from `eb8d96dbbb79d493c94ee0a176e0a32b5c57d330`, required evidence, and direct regressions in the authorized persistence behavior. Previously proven `RC-012030301-04` was preserved and not reopened.

## Frozen clause verification

| Clause | Outcome | Evidence against frozen oracle |
| --- | --- | --- |
| `CK-001.a` | `RESOLVED` | `packages/atlas-db/src/immutable-semantic-corpus-plan.ts` adds `execution.contract_version=$11` to the accepted-source query, bound to `source.perceptionContractVersion`. The real PostgreSQL integration test changes a completed execution to `v2`, observes rejection, and confirms zero plan rows before restoring `v1`. |
| `CK-001.b` | `RESOLVED` | `BssProvenanceSnapshotV1` and `validBssProvenance` require exactly the versioned source, enforcement, process/profile, workload/plan, and estimator identities. The focused canonicalization test rejects a missing estimator version. |
| `CK-001.c` | `RESOLVED` | The bounded provenance schema rejects an extra `customerMemo` raw-payload field under the focused canonicalization test; accepted persisted provenance is restricted to the documented reference/version fields. |
| `CK-002.a` | `RESOLVED` | Migration `packages/atlas-db/migrations/0086_idser012_immutable_semantic_corpus_plan_cfc.sql` installs `BEFORE UPDATE OR DELETE` guards on plans and handoffs. The real PostgreSQL test, using `atlas_app`, rejects plan update and handoff deletion, then proves cancellation and an append-only successor replan. |
| `CK-002.b` | `RESOLVED` | The same migration guards cancellation rows. The real PostgreSQL test, using `atlas_app`, rejects cancellation update and deletion and confirms the cancellation/replan ancestry remains valid. |

## Validation and direct-regression evidence

- `corepack pnpm --filter @atlas/db typecheck` — PASS.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs` — PASS; database already up to date with migration `0086_idser012_immutable_semantic_corpus_plan_cfc`.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — PASS.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS, 3/3 tests; real PostgreSQL transaction, concurrent replay, rollback, cancellation/replan, immutability, provenance rejection, contract-version rejection, and forbidden-effect counters exercised.
- `git diff --check eb8d96dbbb79d493c94ee0a176e0a32b5c57d330..470e7958ce553bee68e44b60f757bc6e74f59b99` — PASS.
- The remediation diff preserves the accepted scope fence, atomic parent-plus-all-handoffs transaction, replay/conflict behavior, cancellation/replan flow, and zero GHR/BSS/SEM/semantic-truth/reconciliation effects. No direct regression was identified, and no approved `-03-02-03` reader/estimator or downstream surface changed.

## Decision

All original frozen closure oracles are proven, and no direct remediation regression remains. `PASS`.
