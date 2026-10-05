# SEM-ANM-SPIKE-004 CK review

- **Ticket:** `SEM-ANM-SPIKE-004` — PROMPT-003 live semantic qualification
- **Batch:** `SEM-ANM-SPIKE-BATCH-004`
- **Reviewed commit:** `8b69d5ad97a9db4893559517e1c4dff7412204ae` (`feat: run PROMPT-003 live semantic qualification`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-SPIKE-004-prompt003-live-semantic-qualification.md`
- **Ticket state:** `awaiting_review`
- **CK result:** `PASS`
- **Experiment terminal result:** `FAIL` as recorded by the committed runner using the frozen SPIKE-003 oracle.

## Review preconditions

The ticket is `awaiting_review`. Its report and implementation are committed at the reviewed HEAD. The reviewed SPIKE-004 implementation, frozen ticket, and report have no local changes; unrelated worktree changes do not make this checkpoint ambiguous. The reviewed commit is `HEAD` and matches the ticket's single bounded checkpoint.

## Review contract and evidence

| Rows | Ticket-authorized condition | Evidence inspected | Status |
| --- | --- | --- | --- |
| `RC-ANM4-001` | Consume the exact CK-approved PROMPT-003 artifacts and hashes. | Ticket, committed runner/test, GO report, and ignored run records identify approval `8b098ad` and the required artifact hashes; the runner checks these before both calls. | PROVEN |
| `RC-ANM4-002`, `004`, `005` | Preserve the single prompt variable, route, and exact payload. | Runner, comparison artifact, and both run records show the frozen route and payload identity and PROMPT-003 hash. | PROVEN |
| `RC-ANM4-003`, `006`, `008`, `009` | Use exact Zod, unchanged SPIKE-003 oracle, fence-only normalization, and exact source accounting. | SPIKE-004 re-exports the frozen schema/normalizer/oracle behavior; committed test covers local positives/negatives. Both records show permitted complete-fence removal, Zod `PASS`, and source accounting `PASS`. | PROVEN |
| `RC-ANM4-007`, `014` | Make exactly two independent calls without retry, fallback, correction, or semantic repair. | Runner loops over exactly two calls; two HTTP 200 records exist; no correction path is present. | PROVEN |
| `RC-ANM4-010` | Preserve S1 workflow meaning in both runs. | Both raw proposals retain the customer submitting an order; both oracle results are S1 `PASS`. | PROVEN |
| `RC-ANM4-011` | Preserve the combined S2 normative maximum-two-products-per-order meaning. | Both raw proposals contain one resolved `rule`, customer, buy, products, maximum 2, one-order scope, and restrictive permission language. Run 1 says “only allowed to buy a maximum of 2 products in one order”; Run 2 says “may only buy a maximum of 2 products in one order.” Neither splits the proposition. | PROVEN |
| `RC-ANM4-012` | Classify the S3 heading as non-fact. | Both raw proposals have no candidates and classify S3 as `non_fact`; both oracle results are S3 `PASS`. | PROVEN |
| `RC-ANM4-013` | Produce an unresolved S4 approval rule with possible modality, before-processing timing, and one question limited to the missing applicability condition. | Both raw proposals have one unresolved `rule`, “Approval may be required before processing,” and one question asking under what conditions approval is required. No trigger, threshold, approver, or implementation detail is introduced. | PROVEN |
| `RC-ANM4-015`, `017` | Preserve predecessor artifacts and stop before finalization or production routing. | Reviewed commit adds only the isolated SPIKE-004 implementation, ticket, and report. Inspected runner has no finalizer, reconciliation, persistence, BSS, or production-route path; historical SPIKE-003 files are unchanged in the commit. | PROVEN |
| `RC-ANM4-016` | Preserve safe, attributable evidence. | Ignored per-run records retain raw content, request identities, telemetry, and validations; committed report records redaction checks. No credential appears in the inspected report or evidence. | PROVEN |
| `RC-ANM4-018` | Record the bounded result and stop for CK. | Ticket and report are `awaiting_review`; exactly two calls are recorded and there is no follow-on qualification work in the reviewed commit. | PROVEN |

The committed report records all required PROMPT-003 and SPIKE-004 local gates as passing before provider use. This review inspected that checkpoint evidence and source; it did not rerun the gates or make provider calls.

## Findings

None. The checkpoint follows the frozen ticket, including its instruction to reuse the unchanged SPIKE-003 oracle and to classify one oracle failure as experiment `FAIL`. That terminal experiment result is not itself a CK rejection.

## Scope-change observation: frozen oracle false negatives

The preserved proposals meet the ticket's written S2 and S4 semantic conditions, but the unchanged oracle rejects those meanings because its phrase checks are narrower than the ticket's acceptance wording:

- `scripts/sem-anm-spike003/semantic-oracle.mts` accepts S2 modality text matching `hanya boleh`, `may only`, `only may`, or `permitted`. It does not accept “is only allowed to,” which appears in Run 1's normalized meaning, even though the complete sentence expresses the required restrictive permission and maximum.
- The same file's S4 question check accepts `when`, `under what condition`, or `under what circumstances`. It misses “Under what specific conditions” (Run 1) and “Under what conditions” (Run 2), although each asks for the missing applicability condition specified by the ticket.

Consequently, the committed evaluator labels Run 1 S2 and both S4 results `FAIL`; the ticket's text-level conditions for these proposals are present. The runner correctly reused the oracle and recorded its result without semantic repair. Changing the oracle or revising the experiment outcome is outside this frozen ticket, which explicitly requires the unchanged SPIKE-003 oracle. Planning may decide whether to amend the oracle contract and authorize a separately bounded reassessment; this observation creates no CFC finding and does not rewrite this checkpoint's terminal `FAIL`.

## Decision

`PASS`. The committed work satisfies the frozen implementation and evidence obligations. The provider qualification remains recorded as terminal `FAIL` under its required unchanged oracle; the semantic false-negative observation above is handed to planning as a ticket/oracle contract question.
