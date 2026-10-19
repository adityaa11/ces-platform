# CFC remediation: IDSER-012-04-07 / IDSER-BATCH-12-04-07

- **Source CK artifact:** `IDSER-BATCH-12-04-07-73a4d632-review.md`
- **Reviewed commit:** `73a4d63264b319c3ee6de180a6aa420accb3a84f`
- **Remediation base:** `ae9fc87786db809db17b8b7cfb02c9165da04aec`
- **Authorized finding:** `CK-001.a` only (first CFC remediation pass; no HMN authorization is required or consumed)
- **State:** `awaiting_review`

## Closure matrix

| Frozen clause | Status | Closure evidence |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `scripts/idser-012-04-07/qualify-real-data.mts` now requires a separate `CANONICAL_DATABASE_URL`, snapshots the exact selected canonical source/lifecycle and every named effect counter before and after qualification, and fails on any delta. The isolated counter snapshot now includes GHR/queue jobs, BSS admission/attempt/reservation/dispatch/transport claim, semantic and perception delivery, semantic execution/result/candidate/evidence/deferred-acceptance, reconciliation/relationships, knowledge index, and the applicable Master/CES surfaces. The runner also rolls back temporary reconstruction user/session/membership rows, so only the authorized isolated plan/handoff rows persist. The frozen oracle passed in the direct qualification run below. |

## Direct qualification evidence

The following command was executed with local, redacted connections to the
separate qualification copy and the protected canonical PostgreSQL instance;
it does not print credentials, corpus bytes, prompts, or dumps:

```text
DATABASE_URL=<idser-012-04-07-qualification-copy>
AGENTS_BRIDGE_DATABASE_URL=<idser-012-04-07-qualification-copy>
CANONICAL_DATABASE_URL=<atlas-canonical-perception read-only connection>
IDSER_0120407_SOURCE_SHA256=2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df
node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs scripts/idser-012-04-07/qualify-real-data.mts
```

It exited `0`. Its redacted structured observation recorded the verified
canonical source as `completed` / `perceived` / `processing`, with completion
fingerprint `a1701b0a66592d4d8c8638177f3cd612bfb564add29354de20de149d83a1392e`.
The isolated run produced 23 valid batches from 258 eligible text/table units,
with five explicitly non-ready visual units. The persisted plan hash was
`521a29ffd8fe5c2e76f6df73cd59ab61a231475941343ca15d0df7ea6fd7fdeb` and the
reference-only body hash was
`72a3ce8cef8d1385a892355aa25e035b0044988626b80105f56819d8a2ce8ee8`.

The complete before/after assertions passed. Final isolated and canonical
counters were respectively: 4 and 4 GHR/queue jobs; 0 and 0 BSS admissions,
attempts, reservations, dispatches, and transport claims; 0 and 0 semantic
and perception deliveries; 0 and 0 semantic executions, results, candidates,
evidence, deferred acceptances, reconciliations, reconciliation relationships,
and knowledge-index rows for the source; and unchanged Master/CES counts of
2/0. Canonical source identity and lifecycle compared byte-for-byte equal to
the pre-run snapshot. Only the isolated immutable plan and its 23 handoffs
were permitted to change.

## Validation

| Command / evidence | Outcome |
| --- | --- |
| Direct qualification command above | PASS; both the isolated and canonical pre/post assertions passed. |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/db typecheck` | PASS |
| `git diff --check -- scripts/idser-012-04-07/qualify-real-data.mts` | PASS |

## Direct-regression boundary

Only the existing IDSER-012-04-07 qualification runner and this checkpoint
changed. The remediation adds evidence and assertion coverage for the frozen
isolation/no-effect boundary; it does not invoke a provider, dispatch GHR,
admit or transport BSS work, accept semantic output, reconcile, mutate Master
or CES, alter canonical storage, reopen predecessor work, or change the
qualification's planning/reconstruction behavior.

## Internal readiness

`Internal readiness: READY_FOR_CK`

`CK-001.a` is the complete authorized closure matrix. This checkpoint does not
issue `PASS`; CK must verify the frozen oracle, this bounded remediation diff,
and direct regressions.
