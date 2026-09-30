# IDSER-009-02: Deterministic production card projection

- **State:** `awaiting_review`; **Review batch:** `IDSER-BATCH-09-02`.
- **Depends on:** IDSER-009-01 `PASS`.
- **Execution environment:** Existing deterministic app mapper/read-model tests.

## Authority and outcome

Own deterministic, browser-safe translation of the accepted 009-01 lifecycle read into `ProjectCardViewModel`. The dominant area is `apps/atlas/lib/home-projects.ts`, `apps/atlas/components/project-card-view-model.ts`, and `home-project-read-service.ts` only as needed to serialize the approved model. It replaces the current `hasDownstreamExtractionState` rejection with validated lifecycle projection.

GO maps only persisted facts: valid waiting -> `waiting-for-extraction`; valid active queued/running -> `extracting`; persisted terminal technical/integrity failure -> `needs-attention` with bounded safe reason; and persisted completion authority plus every completed member -> `ready-for-review`. For valid N > 0, emit `X of N PRDs processed` and `floor(100 * X / N)`; 100 requires X=N but ready also requires the completion authority. OCR/extraction-only completion does not increment X. Semantic ambiguity/contradiction is not technical failure and does not suppress valid ready state. Every model has zero published facts and Master `No published work`. Intact legacy PCC records project to waiting without inventing a bundle/start; malformed new records fail closed. The unavailable action remains truthful. Refresh reads persisted state only.

## Explicit non-authority

This ticket neither changes the PostgreSQL lifecycle implementation accepted by 009-01 nor creates CSS/JSX, presentation semantics, responsive screenshots or a browser matrix. It does not create a review/workspace route, Share, `/demo` fallback, fixture authority, timer, local-storage or queue-derived progress.

## Review contract and proof

| Row | Required behavior | Smallest authoritative proof |
|---|---|---|
| RC-009-02-01 | Each valid persisted lifecycle state maps to its exact card state; ready is impossible without 009-01 completion authority. | Deterministic mapper fixtures. |
| RC-009-02-02 | X/N labels and floor percentage are exact for zero, partial and N; only true completed members count. | Table-driven mapper tests, including OCR/extraction-only cases. |
| RC-009-02-03 | Technical failure maps to bounded user copy; semantic uncertainty stays distinct; no private/internal failure data reaches the model. | Mapper allow-list/redaction assertions. |
| RC-009-02-04 | Legacy waiting is explicit; malformed state fails closed; empty Master/zero facts/action unavailability remain invariant. | Deterministic negative mapping tests. |
| RC-009-02-05 | Signed internal read transports only approved model; refresh cannot synthesize lifecycle truth. | Focused read-service/model boundary tests. |

## Security, CK and repair boundary

**Security readiness: applicable.** Inherited scope is `SEAM-IDSER-009-01`'s persistence/mapping separation, `SEAM-IDSER-009-02`, and the mapping portion of `COUPLING-IDSER-009-01`. CK decides whether persisted truth becomes one deterministic browser-safe model, not whether React looks correct. CFC repairs remain in the mapper/read-service tests. HMN could only resolve a narrow mapping invariant or redaction oracle.

## Hard stop

GO may hand this ticket to CK only after all mapping rows have deterministic proof and `Internal readiness: READY_FOR_CK`. The approved model is the sole input to 009-03; no JSX/CSS, visual work, browser matrix or integrated checkpoint begins.

## GO checkpoint

- **Implementation checkpoint:** `project's goal/feedback/IDSER-BATCH-09-02-go-checkpoint.md`
- **Implementation commit:** this GO handoff commit; CK remains the sole authority to issue `PASS`.
