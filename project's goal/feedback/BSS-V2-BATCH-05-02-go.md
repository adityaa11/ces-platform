# GO Checkpoint — BSS-V2-BATCH-05-02

- Ticket: `BSS-V2-005-02`, [provider-dependent process and bounded workload-envelope catalogue](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-02-process-workload-envelope-catalogue.md)
- Batch: `BSS-V2-BATCH-05-02`
- Review target: the commit containing this GO checkpoint (current `HEAD` at handoff).
- Dependency gate: BSS-V2-005-01 CK `PASS` at `e8fa864`; BSS-V2-001 capability boundary consumed through `atlasCapabilities` only.
- Scope: Bridge operational catalogue contracts and immutable Bridge-only persistence. No provider execution, reservation, batching, usage statistics, production weights, or consumer activation was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00502-01` | Process profiles express operational service class, fairness scope, allocation policy, and capability only; unknown process/capability fails closed and no customer entitlement is accepted. | `apps/agents-bridge/src/process-workload-catalogue.ts`; deterministic fixture `process policy is operational and unknown or entitlement-shaped input fails closed`. | PROVEN |
| `RC-BSSV2-00502-02` | Workload activation has explicit structural bounds plus estimator, quota-accounting, output-reservation, and safety identities; invalid/unbounded profiles fail. | `parseWorkloadEnvelopeProfile`; deterministic fixture `workloads require concrete bounds and versioned estimator, accounting, output, and safety policies`. | PROVEN |
| `RC-BSSV2-00502-03` | Request, token, day, and concurrency are independent validated dimensions; negative, unsafe, and missing dimensions fail. | `parseRequestResourceEnvelope`; deterministic fixture `resource envelopes preserve separate request, token, day, and concurrency dimensions`. | PROVEN |
| `RC-BSSV2-00502-04` | Weighted/billing fields cannot affect TPM without explicit quota-accounting authority. | Strict parser field allowlists reject weighted fields; catalogue accepts only supplied `quotaAccountingPolicyIds`; fixture `activation uses explicit quota accounting, immutable version references, and never billing weights`. | PROVEN |
| `RC-BSSV2-00502-05` | Process/workload identity plus version are immutable and historical references resolve. | `0028_bssv200502_process_workload_catalogue.sql`; Compose fixture inserts workload `v1`/`v2`, resolves process → `v1`, and rejects mutation. | PROVEN |

## Validation evidence

- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts` — PASS: 4 tests, 0 failures.
- `pnpm --filter @atlas/db typecheck` — PASS.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs` — PASS: `0028_bssv200502_process_workload_catalogue` is applied.
- `node --env-file=.env packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/process-workload-catalogue.integration.test.ts` — PASS: 1 test, 0 failures.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — PASS.
- `pnpm --filter @atlas/agents-bridge test` reached the existing, unrelated `Docling route requires its immutable service, runtime, adapter, and profile identity` failure after all new-catalogue tests passed. It reports a stale expected RUN-003 qualification identity and is outside this ticket’s bounded scope; no BSS-V2-005-02 behavior regressed before that assertion.

Internal readiness: READY_FOR_CK
