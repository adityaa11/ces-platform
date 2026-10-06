# BSS-V2-BATCH-04.02 CK supplemental verification after HMN-authorized CFC

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Batch:** BSS-V2-BATCH-04.02
- **Review type:** bounded verification of the HMN-authorized CK-004.a evidence remediation
- **Original CK artifact:** `BSS-V2-BATCH-04.02-9c31002-review.md`
- **Prior verification:** `BSS-V2-BATCH-04.02-88925e0-verification.md`
- **HMN authorization:** `BSS-V2-004-02-hmn-001.md` (`HMN-BSS-V2-004-02-001`), authorizing only `CK-004.a`
- **CFC checkpoint:** `BSS-V2-004-02-cfc-progress.md`
- **Reviewed remediation commit:** `8a58d01a27985031b3961b3b1a002b83ed2144ad` — `test(docling): record D1 worker replay evidence`
- **Result:** `PASS`

## Verification scope and evidence

The newer HMN authorization follows the prior `CHANGES_REQUIRED` verification and explicitly authorizes one evidence-remediation cycle for `CK-004.a` only. The CFC checkpoint consumes `HMN-BSS-V2-004-02-001`, identifies its source CK artifact, and hands the bounded commit to CK. This verification covers only the frozen `CK-004.a` oracle, the committed evidence-remediation diff, the required evidence, and direct regressions introduced by that remediation. The previously resolved `CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-003.a` outcomes remain unchanged.

The checkpoint and stable evidence output are committed in `8a58d01`. `.codex-tools/bss-v2-004-02-cfc-restart-replay-final-2.out` records the exact scenario invocation result, D1 identity, before/after scoped state, queue and effect fence, staged-result counts, and actual worker container stop/recreation. `apps/agents-bridge/tests/docling-cfc-compose.mjs` implements the recorded controlled Compose scenario. CK inspected these artifacts and the commit diff; validation commands were not rerun. The checkpoint reports passing `node --check`, Bridge tests, Bridge typecheck, and `git diff --check`.

## Frozen clause outcome

| Clause | Outcome | Evidence against the frozen oracle |
| --- | --- | --- |
| CK-004.a | RESOLVED | The output records authenticated IDSER-003 D1 execution `43628712-f642-46fb-abe7-8f3c5ea436d2` and its idempotency key. Before restart, the same execution has one member/execution, no accepted cache or semantic execution, one staged result for that execution, a pending Bridge effect, and lease generation `1`. The actual worker container is observed running, then exited after SIGKILL; Compose recreates it as a distinct running container. After replay, the same execution is `completed`, with exactly one active cache and execution, zero semantic executions, queue/effect `completed`, lease generation `2`, and zero staged results. The output also retains the same effect execution ID across the replay. This proves the ticket-required real Compose worker restart/replay and exactly-once logical result/cache oracle. |

## Direct-regression check

The remediation commit changes only `apps/agents-bridge/tests/docling-cfc-compose.mjs`, the CFC checkpoint, and the committed scenario output. No production worker, retry/replay/fencing implementation, queue, result-acceptance path, Docling service configuration, or prior resolved-clause implementation changed. The harness drives the real worker, qualified private Docling route, and authenticated result handoff; the `atlas-fault` proxy controls only the result-delivery outage used to preserve replay staging. No direct remediation regression was identified.

## Decision

`PASS`. The sole clause selected by `HMN-BSS-V2-004-02-001`, `CK-004.a`, is resolved against the original frozen closure oracle, and no direct regression remains. Historical outcomes for `CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-003.a` remain as previously recorded; they were not reopened. This completes the single HMN-authorized evidence-remediation verification.
