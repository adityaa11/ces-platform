# BSS-V2-BATCH-04.02 CK verification after CFC

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Batch:** BSS-V2-BATCH-04.02
- **Review type:** bounded verification of the single CFC remediation
- **Original CK artifact:** `BSS-V2-BATCH-04.02-9c31002-review.md`
- **CFC checkpoint:** `BSS-V2-004-02-cfc-progress.md`
- **Reviewed remediation commit:** `88925e0039b7284cee35aa61d65c3057cd1f2eef` — `fix(docling): prove D1 Compose failure matrix`
- **Result:** `CHANGES_REQUIRED`

## Verification scope and evidence

The ticket is `awaiting_review`, the CFC checkpoint records `awaiting_review`, and its reviewed target is the current `HEAD` commit `88925e0039b7284cee35aa61d65c3057cd1f2eef`. The checkout has unrelated uncommitted changes and untracked files; the target remains unambiguous because this review uses only the committed CFC diff, the named checkpoint and evidence, and direct-regression evidence relevant to the frozen clauses.

This verification covers only original clauses `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-003.a`, and `CK-004.a`, the remediation diff, and direct regressions introduced by that diff. No validation command was rerun. The CFC checkpoint reports passing Bridge typecheck, Bridge tests, and `git diff --check`; CK inspected the committed code, checkpoint, and available Compose matrix output.

## Frozen clause outcomes

| Clause | Outcome | Evidence against the frozen oracle |
| --- | --- | --- |
| CK-001.a | RESOLVED | The CFC checkpoint records the authenticated `/api/projects` IDSER-003 kickoff, D1 execution `3152fe64-8a77-4c6f-9a7f-52cc66564d24`, one member/execution/cache, and zero semantic executions. The committed `perception-compose-seed.mjs` uses the authenticated route and observes the lifecycle/result state; it does not rely on direct project-row creation for this `docling` path. This satisfies the frozen kickoff and one-result/no-semantic-continuation oracle. |
| CK-001.b | RESOLVED | The same checkpoint records the run identity and `phase=completed`, `elapsedMilliseconds=3841`, satisfying the frozen requirement to record an end-to-end latency for the actual D1 run. |
| CK-002.a | RESOLVED | The CFC checkpoint records the running container inspection and pinned image inspection commands and states both resolve to `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`, the expected qualified digest. The CFC diff does not alter the production Docling image identity or route configuration. |
| CK-003.a | RESOLVED | `.codex-tools/bss-v2-004-02-cfc-matrix-final-3.out` records all ten controlled Compose worker/HTTP fault cases and a successful recovery. Each fault has one execution/member, zero cache/semantic/staged results, and no remote-provider or subprocess fallback. Retryable transport failures exhaust the inherited `2/2` retries with lease generation `3`; deterministic malformed, incomplete, mapper, normalization, and processing failures terminate without retries. The recovery row completes with one cache and zero semantic/staged rows. The committed harness calls the authenticated project kickoff and crosses the Compose-private Docling HTTP adapter boundary. |
| CK-004.a | UNRESOLVED | **Expected state:** a recorded Compose Bridge worker process restart/replay followed by evidence of one logical execution/result/cache and the ticket-required scoped counts. **Actual state:** `BSS-V2-004-02-cfc-progress.md` says this is carried forward from a “user-confirmed” scenario, but supplies no scenario command/output locator, restart observation, execution/cache/fence counts, or replay result. The available `final-3.out` is the CK-003 fault matrix and contains no worker restart/replay scenario. The CFC diff does not add or run one. The frozen oracle is therefore not demonstrated. |

## Direct-regression check

The committed remediation is bounded to the CFC fault proxies, opt-in Compose overlay, seed-script kickoff evidence, the test-proxy config guard, and this CFC progress record. The opt-in overlay routes only through Compose-private fault proxies under the explicit test flag; retry settings inherit production defaults. No direct regression to the already-proven clauses was identified in the committed diff or the reported validation. This check does not reopen any other ticket row.

## Decision

`CHANGES_REQUIRED`. `CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-003.a` are resolved against their frozen oracles. `CK-004.a` remains unresolved because the expected real Compose Bridge worker restart/replay and scoped exactly-once counts are not evidenced in the CFC checkpoint or available run output. Return control to human/planning authority under the bounded CK/CFC rules; this verification does not authorize another CFC cycle.
