# CFC checkpoint — BSS-V2-014-06

- **Ticket:** [BSS-V2-014-06 parent release/activation closure](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md)
- **Source CK:** [BSS-V2-014-06 CK review at `73ee3014`](BSS-V2-014-06-73ee3014-review.md)
- **Authorized clauses:** `CK-001.a`, `CK-001.b` only.
- **Scope:** existing authenticated v2 reader, canonical candidate/allocation fingerprint fencing, its real PostgreSQL fixture, and direct reader/consumer regressions. No release authority, positive activation, scheduler, queue, provider, or downstream behavior changed.
- **State:** `awaiting_review`

## Frozen Finding Closure Matrix

| Clause | Status | Evidence location | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `0107_bssv201406_candidate_allocation_fingerprint_fencing.sql` recomputes the candidate/profile and allocation JSON digests before a qualified v2 response; `calculated-capacity-snapshot-v2.integration.test.ts` mutates each persisted digest through the existing HTTP reader. The shared `assertNonQualified` assertion proves a typed v2 stop with no `allocation` or `sizing`; `assertConsumerStops` proves the v2 consumer yields a typed stop/replan and the effect counters stay unchanged. | `node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts` — **PASS**, 2/2; `node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-capacity-planning-snapshot-v2.test.ts` — **PASS**, 7/7. | **Passed:** persisted candidate or allocation fingerprint mismatch is typed non-qualified, has no numeric fallback, stops the consumer, and has zero effects. |
| `CK-001.b` | `PROVEN` | `calculated-capacity-snapshot-v2.integration.test.ts` compares the selected active response's desired-profile version, candidate activation revision, active activation revision, allocation version/fingerprint, route-authority revision, and canonical fingerprint directly with the persisted active tuple. It also proves the newer candidate's profile and candidate revision are absent. | `node --env-file=.env apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts` — **PASS**, 2/2. | **Passed:** pointer-first active identity equals the persisted active tuple and the newer candidate remains excluded; existing stale-pointer negatives stay green. |

## Direct regressions

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/agents-bridge typecheck` | **PASS** |
| `pnpm --filter @atlas/agents-bridge test:ghr-01b` | **PASS**, 3/3 |
| `pnpm --filter @atlas/agents-bridge test:ghr-03a` | **PASS**, 4/4 |
| `node --env-file=.env --test packages/atlas-db/tests/permissions.test.mjs` | **PASS**, 1/1 |
| `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` | **PASS** |
| `git diff --check` | **PASS** |

## Handoff

This is one bounded remediation pass for the two frozen clauses. The forward-only
reader migration preserves the existing activation fence and adds no positive
activation path. It does not issue `PASS`; CK must verify only `CK-001.a`,
`CK-001.b`, this remediation diff, the cited evidence, and direct regressions.

Internal readiness: READY_FOR_CK
