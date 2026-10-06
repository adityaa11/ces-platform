# BSS-V2-004-03-05: Deterministic extraction finalizer and provider-neutral worker composition

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-05`
- **Dependencies:** BSS-V2-004-03-01 through -04 CK `PASS`; BSS-V2-001/002/003 and BSS-V2-004-02 accepted boundaries; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§8–9.05, 10, 12–16
- **Current seam:** `apps/agents-bridge/src/semantic-worker.ts` currently sends serialized context with the skill prompt and validates the returned final extraction/reconciliation result directly. This child replaces only extraction execution/finalization; reconciliation remains unchanged.

## Outcome

Compose extraction through the prepared reasoning packet and neutral provider seam, then deterministically turn an untrusted provider proposal into the existing validated Semantic V1 result envelope and replay/staging/handoff behavior.

## Scope and forbidden work

Required extraction path:

```text
semantic extraction context
  -> production reasoning-packet builder
  -> StructuredReasoningProvider
  -> untrusted proposal
  -> provider proposal Zod parse
  -> exact source accounting
  -> deterministic finalizer
  -> canonical final Semantic V1 Zod parse
  -> unchanged result envelope/replay/staging/handoff
```

The finalizer generates `local_candidate_id`, copies trusted source wording, derives evidence refs and source-unit IDs from the local slot map, materializes source inventory page/locator fields and destination IDs, and fills envelope bookkeeping. It must not change semantic kind, rewrite meaning, invent payload/applicability/questions, silently repair invalid output, or drop incompatible meaning to pass validation.

`semantic-worker.ts` receives only `StructuredReasoningProvider` and never inspects `route.providerId`; concrete selection stays in composition root. Preserve cancellation, fencing, replay, staging and public v1 handoff. Do not modify reconciliation prompt/execution semantics, lifecycle release of the BSS-V2-004-02 stop, live qualification, or semantic schemas.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040305-01 | Untrusted proposals pass canonical proposal validation and exact slot/source accounting before finalization. | Invalid kind/meaning/reference/coverage/dangling/duplicate proposals fail closed. **PASS iff** no unchecked provider field becomes trusted output. | finalizer integrity tests |
| RC-BSSV2-0040305-02 | Finalizer supplies Atlas-owned IDs and evidence lineage without semantic repair or meaning mutation. | Field-origin assertions compare copied/derived values to proposal and trusted slot map; negative repair cases reject. **PASS iff** Atlas-derived fields have deterministic local provenance and provider meaning is preserved exactly. | Semantic V1 parser tests |
| RC-BSSV2-0040305-03 | Extraction composes through the neutral provider interface; generic worker does not inspect provider identity. | Type/import/static source-boundary tests plus injected deterministic provider tests. **PASS iff** provider swap needs composition-only change. | provider capability/worker tests |
| RC-BSSV2-0040305-04 | Envelope, replay, fencing, staging, cancellation and handoff remain compatible; reconciliation path is unchanged. | Focused retry/replay/cancel and extraction/reconciliation contract regressions. **PASS iff** extraction integration changes no accepted lifecycle invariant or reconciliation behavior. | BSS-V2-001/002; semantic replay tests |
| RC-BSSV2-0040305-05 | BSS-V2-004-02 remains stopped before semantic work pending live qualification. | D1 lifecycle negative check and bounded diff inspection. **PASS iff** no production D1 semantic activation is reachable. | BSS-V2-004-02 terminal regression |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-0040305-ATLAS-FINALIZATION` — canonical Atlas validation and deterministic code own trusted output; `BOUNDARY-BSSV2-0040305-REPLAY` — existing fenced staging/replay is preserved.
- **Trust boundary:** `TRUST-BSSV2-0040305-PROPOSAL-TO-RESULT` — provider proposal remains untrusted until schema, exact source accounting, finalization and final canonical parse succeed.
- **Sensitive assets:** `ASSET-BSSV2-0040305-SOURCE-EVIDENCE` and `ASSET-BSSV2-0040305-CANDIDATE-STATE` — source text/evidence and resulting semantic assertions.
- **Identity context:** `IDENTITY-BSSV2-0040305-EXECUTION-SLOT-MAP` — execution/scope, slot-to-source map, provider provenance and replay lease remain bound through result construction.
- **Extension seam:** `SEAM-BSSV2-0040305-DETERMINISTIC-FINALIZATION` — Atlas-derived identity/evidence and validation are independently inspectable from provider output.
- **Prohibited coupling:** `COUPLING-BSSV2-0040305-PROVIDER-REPAIR` — no route inspection, provider-specific worker path, semantic correction or policy reinterpretation.
- **Verification seam:** `VERIFY-BSSV2-0040305-ORIGIN-AND-REPLAY` — field-origin, negative repair, import-boundary, replay/fencing and unchanged reconciliation evidence.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040305-SEMANTIC-REVIEW` — downstream human review/acceptance policy remains outside extraction finalization.
- **Review bindings:** `REV-READY-BSSV2-0040305-01` verifies proposal-to-result trust transitions and field provenance; `REV-READY-BSSV2-0040305-02` verifies worker provider neutrality and replay/lifecycle boundaries.

## Validation and handoff

Run deterministic injected-provider extraction tests, source-accounting/finalizer negatives, worker/replay/cancellation tests, reconciliation regressions, and provider-ID static/import checks in Docker Compose. No external call is permitted. On PASS, mark `awaiting_review` and stop for CK. Hard stop: extraction is locally deterministic and injectable, while normal D1 still stops at BSS-V2-004-02.
