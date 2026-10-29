# BSS-QAP-BATCH-01 CK review — BSS-QAP-001 R1

- **Ticket:** `BSS-QAP-001` — R1 nullable deprecation migration and publisher preservation
- **Batch:** `BSS-QAP-BATCH-01`
- **Ticket state at review:** `awaiting_review`
- **Reviewed commit:** `9a84ddae0ceff4fb2f99f206d9bad1e3f55dbe14`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/BSS_Cutover_reorganize/BSS-QAP-001-r1-nullable-deprecation-migration.md`
- **Source references:** Removal Mechanism Audit §§1–8 and 11–12; `BSS_QAP_001_PUBLISHER_BLOCKER_RESOLUTION_ADDENDUM.md`
- **Review type:** first CK review
- **Result:** `PASS`

## Active-ticket resolution

The explicit ticket, batch, state, and committed review target resolve without ambiguity. The branch is dirty with unrelated user changes, but the ticket-owned committed diff is unambiguous: the target is commit `9a84ddae`, whose QAP changes are limited to migration `0112`, its runner/test registration, the focused R1 test, and the associated ticket/GO records. No unrelated worktree change was used as review evidence or modified.

## Review Contract assessment

| Row | Ticket authority and required proof | Evidence reviewed / validation | Status |
| --- | --- | --- | --- |
| `RC-QAP-001-01` | Register only `0112` after `0111`; no executable path contains `0113`. | `packages/atlas-db/scripts/migrate.mjs:83`; committed migration inventory; `pnpm --filter @atlas/db migration:check`; repository executable-inventory search found no `0113`; repeat migration execution reported already current. | `PROVEN` |
| `RC-QAP-001-02` | Both deprecated columns accept `NULL`; nonblank checks and historical values remain valid. | `0112` DDL at lines 6–9; focused R1 integration test passed against the configured PostgreSQL target, asserting `YES` nullability, both checks, legacy nonempty inserts, and ID-free inserts. | `PROVEN` |
| `RC-QAP-001-03` | Both supported publishers remove only the obsolete equality operand while preserving authority attributes, aliases, guards, fencing, activation/wakeup, replay, concurrency, fairness, and reservation-history behavior. | `0112` canonical replacements at lines 11 and 134; focused catalog/ID-free publisher test; authorized convergence; durable wakeup; weighted publication; enforcement-policy; fairness; provider-worker; and calculated-snapshot integrations passed serially. Catalog assertions confirmed signatures, owners, security model, search path, grants, removed operand, advisory lock, and effective-policy guard. | `PROVEN` |
| `RC-QAP-001-04` | Fresh replay preserves the exact Anoman seed and zero-authority invariant. | `pnpm --filter @atlas/db test:bss-fresh-install-contract` passed against the configured PostgreSQL target; GO checkpoint records the disposable empty replay through `0112`. | `PROVEN` |
| `RC-QAP-001-05` | Billing/weighted rejection, unknown RPD, TPM reservation/reconciliation, effective policy, and snapshot behavior remain unchanged. | Weighted publication, authorized enforcement policy, policy-aware fairness, provider-admitted worker, capacity-planning snapshot, and calculated-capacity snapshot integrations passed on serial validation. | `PROVEN` |
| `RC-QAP-001-06` | Pre-DDL target inventory must cover `pg_depend`, `pg_views`, `pg_proc`, `pg_trigger`, `information_schema.columns`, installed bodies, and repository sources; only the two named publishers and declared constraints/triggers may remain in scope. | The GO checkpoint records the pre-DDL `atlas_dev`/`postgres` catalog and procedural-body inventory, the two installed publisher bodies, repository source inventory, and no unplanned external writer or authority path. Both bodies are explicitly replaced by `0112`; post-DDL focused catalog assertions passed. | `PROVEN` |

## Frozen Finding Closure Matrix

This is a first review and no ticket-bound implementation-repairable deficiency was identified. Therefore there are no `CK-###` findings or closure clauses to authorize. The binary closure state is the Review Contract table above: every applicable row is `PROVEN`, required validation used the named PostgreSQL/worker harnesses, and no direct in-scope regression remains.

| Finding | Clause | Ticket authority | Unsatisfied evidence | Observable closure condition | Binary oracle | Status |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | N/A | None | N/A | No frozen repair oracle is applicable because the first review found no deficiency. | N/A |

## Validation and evidence

Executed with the workspace-configured disposable PostgreSQL target (credentials omitted):

```text
pnpm --filter @atlas/db test:qap-001-r1                         PASS (1 test)
pnpm --filter @atlas/db migration:check                         PASS
pnpm --filter @atlas/db test:bss-fresh-install-contract          PASS (1 test)
pnpm --filter @atlas/db test:authorized-desired-plan-convergence PASS (1 test)
pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts PASS (1 test, serial rerun)
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts PASS (1 test)
pnpm --filter @atlas/db exec jiti tests/authorized-enforcement-policy-provenance.integration.test.ts PASS (1 test)
pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts PASS (1 test)
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts PASS (2 tests, isolated rerun)
pnpm --filter @atlas/db test:capacity-planning-snapshot                         PASS (1 test)
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts PASS (2 tests, serial rerun)
pnpm --filter @atlas/db typecheck                                  PASS
pnpm --filter @atlas/agents-bridge typecheck                       PASS
git diff --check b6eaf9a9..9a84ddae                              PASS
```

The first parallel attempt of the worker-heavy checks showed shared pg-boss timing interference; the durable-wakeup, calculated-snapshot, and provider-worker checks were rerun serially/isolated and passed. The transient parallel outcomes are not treated as QAP findings.

The committed focused R1 test also passed its catalog assertions for both columns, retained nonblank checks, publisher owners/security/grants, absence of the obsolete predicate, convergence advisory lock, shared effective-policy guard, ID-free publication, shared-domain activation fence, and negative guard behavior.

## Scope-change observations

None. No ticket change, new provider/runtime/deployment target, architecture decision, policy decision, or predecessor reopening is required. `0113` remains future R3 work and was not registered or reviewed as part of this checkpoint.

## Decision

`PASS`. Commit `9a84ddae` satisfies all six frozen ticket Review Contract rows and the explicit R1 review obligations. Hand off the committed nullable schema and evidence to `BSS-QAP-002`; no TypeScript or writer change belongs to this checkpoint.
