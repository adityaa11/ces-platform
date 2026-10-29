# BSS-QAP-BATCH-02 GO checkpoint — BSS-QAP-002 R2

- **Ticket:** `BSS-QAP-002` — R2 ID-free writer contract cutover
- **Batch:** `BSS-QAP-BATCH-02`
- **Implementation commit:** `421800695d4dd4d3f179f06d1a1c976b6a0da209`
- **Predecessor:** BSS-QAP-001 CK `PASS`, commit `9a84ddae0ceff4fb2f99f206d9bad1e3f55dbe14`
- **Ticket state:** `awaiting_review`
- **Release closure:** blocked; no rollout was attempted and R3 is not authorized.

## Bounded implementation

The application contract no longer accepts, returns, resolves, or validates the
obsolete policy identifier. All effective repository SQL fixtures and the
`idser-012-04-07` qualification writer use ID-free column/value shapes. The
two publisher/convergence integration fixtures remain present and run through
their real SQL publisher and worker boundaries. No migration, runtime
accounting behavior, candidate/fingerprint contract, snapshot API, or R3
migration registration was changed.

## Remaining-reference inventory

The release-payload inventory command was:

```text
rg -n "quota_accounting_policy_id|quotaAccountingPolicyId|quotaAccountingPolicyIds|anoman-quota-tokens-v1" apps packages scripts --glob '!*.tsbuildinfo'
```

After excluding generated `*.tsbuildinfo`, the only results are the immutable
historical migrations `0023`, `0028`, `0067`, `0076`, `0078`, and `0091`, plus
the approved R1 migration `0112`. The canonical `0076` seed is unchanged.
There are no effective application, test-fixture, script-writer, or release
payload references.

The executable inventory contains no `0113` registration. Local R1 database
inspection found both columns `YES` nullable and `0` applied `0113` migration
records.

## Deployment-writer inventory

Repository evidence is deliberately not represented as rollout evidence.

| Writer class | Evidence status | Evidence / blocker |
| --- | --- | --- |
| Application releases | SOURCE VERIFIED ONLY | Bridge parser and repository writer fixtures are ID-free at this commit; deployed release revisions were not inspected. |
| Bridge workers | SOURCE VERIFIED ONLY | Worker-facing integration coverage is ID-free and durable-wakeup passed; deployed worker image/version is unverified. |
| Background jobs | SOURCE VERIFIED ONLY | Repository search found no effective obsolete-column writer; active job revisions are unverified. |
| Operational scripts | SOURCE VERIFIED ONLY | `scripts/idser-012-04-07/qualify-real-data.mts` is ID-free; deployed/copied script instances are unverified. |
| One-off administrative tools | SOURCE VERIFIED ONLY | Repository inventory is clean; no operational-tool estate inventory was supplied. |
| Migration executors | SOURCE VERIFIED ONLY | Local runner check passed and local catalog has no `0113` record; deployed executors were not inspected. |
| Out-of-repository integrations | UNKNOWN | No integration-owner inventory or observed rollout evidence was available. |

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| `RC-QAP-002-01` | Capacity catalogue removes the obsolete field while retaining parser boundaries. | ID-free valid capacity input succeeds; unsupported billing/weighted fields reject. | `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` — PASS (3 tests); `pnpm --filter @atlas/agents-bridge typecheck` — PASS. | `PROVEN` |
| `RC-QAP-002-02` | Process/workload catalogue removes identifier-set authority and resolver coupling while retaining structural, route, and dimensional validation. | Valid profiles retain independent dimensions and route/compatibility checks. | `pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts` — PASS (5); `... tests/registered-process-policy.test.ts` — PASS (5). | `PROVEN` |
| `RC-QAP-002-03` | Repository fixtures and operational writers have ID-free insert/serialization shapes. | No effective source reference outside immutable-history/R1 allowlist; publisher fixtures remain real. | Release-payload `rg` inventory above; `pnpm --filter @atlas/db test:authorized-desired-plan-convergence` — PASS; `pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts` — PASS. | `PROVEN` |
| `RC-QAP-002-04` | Every deployed writer is ID-free before R3 eligibility. | Deployed artifact inventory and monitored rollout evidence for every writer class. | Inventory above contains SOURCE VERIFIED ONLY and UNKNOWN entries. No deployment access/authorization was provided. | `BLOCKED_ENVIRONMENT` |
| `RC-QAP-002-05` | Accounting/runtime behavior remains unchanged on R1 nullable schema. | Publisher, admission/reservation/reconciliation, effective-policy/unknown-RPD, and snapshot tests pass without a substitute ID. | `test:qap-001-r1`, weighted publication, provider-work reservation window, process-capacity window usage, policy-aware admission fairness, provider-work admission, runtime capacity constraint, capacity planning snapshot, and calculated snapshot v2 — all PASS. | `PROVEN` |
| `RC-QAP-002-06` | R3 boundary stays closed. | `0113` absent/unexecuted; both columns remain nullable. | `pnpm --filter @atlas/db migration:check` — PASS; local catalog: both columns nullable; `0113` records `0`; executable inventory search empty. | `PROVEN` |

Internal readiness: READY_FOR_CK — implementation checkpoint only. Release closure remains blocked by `RC-QAP-002-04`; this is not a CK `PASS` and does not authorize rollout or R3.

## Validation summary

All commands used the workspace-configured local R1 PostgreSQL target; credentials are omitted.

```text
pnpm --filter @atlas/agents-bridge typecheck                                      PASS
pnpm --filter @atlas/db typecheck                                                 PASS
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts    PASS (3)
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts PASS (5)
pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts PASS (5)
pnpm --filter @atlas/db migration:check                                           PASS
pnpm --filter @atlas/db test:qap-001-r1                                           PASS (1)
pnpm --filter @atlas/db test:authorized-desired-plan-convergence                 PASS (1)
pnpm --filter @atlas/db exec jiti tests/weighted-capacity-publication.integration.test.ts PASS (1)
pnpm --filter @atlas/db test:provider-work-reservation-window                     PASS (1)
pnpm --filter @atlas/db exec jiti tests/process-capacity-window-usage.integration.test.ts PASS (1)
pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts PASS (1)
pnpm --filter @atlas/db test:capacity-planning-snapshot                           PASS (1)
pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts PASS (1)
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts PASS (2)
pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts PASS (1)
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts PASS (2)
git diff --check                                                                  PASS
```

## Exact unresolved release blockers

1. Artifact/version inventory proving no active application release, Bridge worker, background job, or migration executor can write either deprecated column.
2. Observed rollout evidence for every supported writer class, including the operational script estate.
3. An explicit owner inventory and rollout/retirement evidence for out-of-repository integrations.

No release closure, live rollout, physical-column removal, or R3 activity is authorized by this checkpoint. Hand off only this bounded implementation record to independent CK review.
