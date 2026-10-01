# IDSER-010-02: Multi-document semantic sequencing and bounded reconciliation

- **State:** `awaiting_review`; **Review batch:** `IDSER-BATCH-10-02`.
- **Predecessors:** IDSER-010-01 `PASS`.
- **Consumes:** the approved extraction/reconciliation storage and 010-01 deterministic boundary; it does not reopen them.
- **Execution environment:** the 010-01 Compose harness plus focused PostgreSQL selector/acceptance suites and actual pg-boss history.

## Authority and bounded outcome

Own the multi-document semantic/procedural proof surface: scenarios C, D and E, their deterministic provider fixtures, and focused authoritative tests for relationship, accounting, selection and completion rules. Prove D2 only sees the authorized bounded D1 neighborhood, D3 starts only after D2 reconciliation, relationship results remain incoming candidates, and the completed bundle reaches ready only after all required stages.

The scope includes all ten relationship types; full current-document candidate accounting (including non-fact-only documents); cross-scope semantic reference rejection; evidence/source-inventory validity; deterministic byte/count bounds; selected-neighborhood overflow metadata; stable selection; full reconciliation persistence; and no upload/page/order-derived truth priority. It verifies AC-17–24, 26, 29, and 33–35 at their smallest proof surfaces, while C/D/E prove the production-shaped composition.

## Explicit non-authority

No creation rollback, provider/result failure lifecycle, concurrent consumers, replay/lease recovery, broad browser/auth/CSP regression, negative downstream feature inventory, or live provider runs. Do not redesign selector policy, queue, worker, schema, or predecessor semantics; an incompatibility is `SCOPE_CHANGE`.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-02-01 | C persists `supports` and `duplicates`; D persists an unresolved `contradicts` relation with no winner or order priority. | Two Compose multi-PDF fixtures plus focused relationship vocabulary cases. **PASS iff** all ten types are representable, C/D rows resolve only to authorized candidates/evidence, and no candidate is accepted/resolved. |
| RC-010-02-02 | Selector includes only same-bundle completed prior state, accounts for every current candidate, rejects cross-scope references, and records stable count/byte/overflow behavior without truncating required input. | Focused reconciliation selector/acceptance integration. **PASS iff** stable repeated selection has the same IDs/metadata; boundary overflow fails or records required metadata as the approved contract requires; every current candidate is accounted. |
| RC-010-02-03 | E proves D2 is not scheduled before D1 reconciliation acceptance and D3 not before D2; stage acceptance and next enqueue are one transaction. | Three-document Compose fixture with persisted execution/job history and transaction-failure probe. **PASS iff** ordering and one-next-job facts hold, and a failed acceptance exposes neither partial result/count nor successor job. |
| RC-010-02-04 | Only a fully reconciled N/N bundle completes; complete validated results, relationships, evidence and source inventory remain addressable. | Existing focused extraction/reconciliation/completion suites plus final E assertions. **PASS iff** no OCR/extraction-only state increments processed count and final ready requires every persisted stage/integrity check. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-010-02` / `REV-010-02` is the trusted selector/acceptance boundary: scope identity, byte/count limits, selection metadata and evidence inventory must remain inspectable. Mandatory negatives are cross-bundle/reference denial, missing current accounting, invalid evidence/inventory, overflow without allowed metadata, and order-as-truth prohibition. Direct regression boundary: selector, reconciliation acceptance, extraction acceptance and queue transaction tests.

CFC stays in deterministic multi-document fixtures or the selector/acceptance seam. HMN may resolve one bounded selection metadata, reference-denial, ordering observation, or relationship fixture issue. It cannot authorize failure, concurrency, replay, browser, or provider changes.

## Hard stop and required handoff

Before `awaiting_review`, all four rows are `PROVEN` with exact Compose commands, scenario IDs and DB/queue observations. Multi-document semantic/sequencing authority is then complete; 010-03 owns failure models, 010-04 concurrency, and 010-05 replay. Record `Internal readiness: READY_FOR_CK`; CK makes one bounded selector/acceptance decision.
