# IDSER-009-03-01: Semantic uncertainty project-card contract

- **State:** `awaiting_review` (GO checkpoint pending CK).
- **Depends on:** IDSER-009-03 `PASS`.
- **Unblocks:** IDSER-009-03-02 in sequence; then IDSER-009-04 may resume only after both corrective tickets reach CK `PASS`.
- **Execution environment:** Focused Compose PostgreSQL/read-model integration plus deterministic mapper, transport-shape, and component tests.
- **Corrects:** Production prerequisite for frozen IDSER-009-04 `CK-001.a`; final integrated closure remains IDSER-009-04.

## Authority question

How does already-authoritative persisted semantic uncertainty safely reach the production Project Card without becoming technical failure or leaking semantic internals?

This is one additive vertical contract across the existing authorized read, deterministic model, browser-safe transport, and production card. It is not a new persistence concept or a set of separate read, mapper, or presentation tickets.

## Accepted authority and exact signal

Consume only existing accepted Atlas semantic persistence:

- `atlas.semantic_candidate.needs_resolution = true`; or
- `atlas.reconciliation_relationship.requires_resolution = true`.

For the one membership-authorized project's current extraction bundle, derive `hasSemanticUncertainty` as `true` if at least one such row joins through the same persisted project/workspace/bundle scope; otherwise derive `false`. For an intact legacy project without a bundle, derive `false`. Do not infer uncertainty from provider output, execution status, technical failure, free text, queue state, or client state. Do not select, count, serialize, or expose the underlying candidates, relationships, result payloads, evidence, or identifiers.

The exact additive browser-safe representation is a required boolean `hasSemanticUncertainty` on `ProjectCardViewModel`, included in the authenticated internal home-read model. The exact visible, non-color-only indication when `true` is the text **Semantic uncertainty**. Omit the indication when `false`.

This indication is orthogonal to the four existing primary card states. It must not change progress, state mapping, or ready authority. In particular, `ready-for-review` plus `hasSemanticUncertainty: true` is valid, and semantic uncertainty never causes `needs-attention`. It may be shown alongside any primary state; technical failure authority remains exclusively the existing persisted failure lifecycle.

## Required implementation boundary

Extend the existing membership-first authorized project read and its validated bundle joins only enough to derive the bounded boolean. Extend the existing deterministic mapper, exact-key internal transport parser, and approved production card presentation with that boolean and text. Keep the semantic read server-side and scoped to the already-authorized project and its current bundle. Keep the model browser-safe and deterministic.

No new table, column, migration, semantic lifecycle, client query, client reconstruction, route, workspace action, or accepted-truth behavior is authorized. Do not modify the approved IDSER-009-01/02/03 tickets, their review evidence, or their prior PASS records; this ticket supplies additive correction authority after 009-03.

## Invariants and prohibited data

- `semantic uncertainty != technical failure`.
- `ready-for-review + semantic uncertainty = valid`.
- Semantic uncertainty never causes `needs-attention` and never suppresses a valid `ready-for-review` state.
- Existing waiting/extracting/needs-attention/ready-for-review lifecycle authority and progress remain unchanged.
- No provider response, prompt, candidate, ambiguity/conflict object, result JSON, evidence content, source locator, SQL, storage key, internal execution ID, capability, credential, private reconciliation state, or internal failure detail crosses into the browser model or markup.

## Security readiness

- **Status:** `applicable`.
- **Inherited boundaries:** IDSER-009 `SEAM-IDSER-009-01` (authorized persistence-to-mapper-to-presentation separation) and `COUPLING-IDSER-009-01` (no UI database/semantic authority or client reconstruction); approved IDSER-008 `SEAM-IDSER-008-02` (semantic uncertainty is distinct from authenticated bounded technical failure).
- **Trust boundary:** authenticated membership-scoped Atlas read -> bounded boolean mapper -> exact-key internal home transport -> production card text.
- **Protected asset/authority:** private semantic/reconciliation records and the distinction between reviewable semantic uncertainty and technical lifecycle failure.
- **Extension seam:** preserve the existing server-derived user identity, project/bundle scope, validated model, and presentation-only component boundary for later policy attachment.
- **Prohibited coupling:** no browser/database semantic access; no raw records or semantic authority in React; no local failure inference; no new semantic storage.
- **Minimal security proof:** same-project candidate and relationship flags derive `true`; flags in another project/bundle derive no signal; raw record values/keys never occur in the model, serialized payload, or rendered text; the authorized ready-plus-uncertainty model remains ready.
- **Deferred:** execution-start authentication/lifecycle activation (009-03-02), failure/read isolation already owned by approved 009-01/02, full browser authorization and visual matrix (009-04), semantic pipeline behavior (IDSER-010), and unrelated security baseline work.

## Review contract

Every row is limited to the semantic-uncertainty vertical contract. Passing these rows supplies a prerequisite; it does not close frozen IDSER-009-04 CK findings.

| Row | Ticket authority and exact required behavior | Smallest authoritative proof | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|
| RC-009-03-01-01 | This ticket, Accepted authority: derive one boolean only from same-current-bundle `needs_resolution` or `requires_resolution` persisted facts under the existing member-scoped project read; legacy/no matching flag is false. | Compose PostgreSQL repository/read integration with one candidate flag, one relationship flag, false controls, a foreign-bundle control, and the authorized owner boundary. | **PASS** iff both accepted flags independently produce true only for their scoped project/bundle, false controls and legacy produce false, and unrelated scope contributes no signal. | Existing project read and scope joins for this bounded boolean; no schema authority. |
| RC-009-03-01-02 | This ticket, Accepted lifecycle contract: `hasSemanticUncertainty` is a required boolean; it does not alter any of the four lifecycle states or X/N progress, including ready plus true. | Deterministic mapper table with each primary state, ready plus true, technical failure plus true, and false controls. | **PASS** iff the boolean is exact, every primary state/progress remains unchanged, and semantic uncertainty never maps a non-failure to `needs-attention` or removes valid ready. | Additive card-model projection only; existing lifecycle and completion rules stay owned by approved contracts. |
| RC-009-03-01-03 | This ticket, `COUPLING-IDSER-009-01`: transport only the required boolean and reject malformed/extra semantic detail; never serialize the source rows or sensitive values. | Exact-key parser/read-service boundary assertions and serialized payload allow-list/negative inspection. | **PASS** iff valid boolean payloads parse, malformed types/extra fields fail closed, and seeded private semantic values/identifiers do not occur in transport or model output. | Existing authenticated internal home-read transport; no new route or browser authority. |
| RC-009-03-01-04 | This ticket, presentation-only extension after IDSER-009-03: render the exact non-color-only text `Semantic uncertainty` iff true while preserving primary status, accessibility, and unavailable action. | Focused component/render assertions for true and false, including ready plus true and technical failure plus true. | **PASS** iff true renders the exact text with accessible text semantics, false omits it, primary status/action are unchanged, and color is not the sole indication. | Project card component and semantic rendering only; no responsive/theme/shell screenshot matrix. |

## CFC repair and hard stop

Normal CK findings are repairable within this one vertical contract using the same persisted facts and focused harness. Do not resolve a finding by adding new semantic persistence, changing IDSER-008 lifecycle semantics, or assigning final browser regression evidence here.

If GO inspection finds these accepted persisted facts cannot truthfully supply the bounded signal, stop before implementation and record `HUMAN_DECISION_REQUIRED` with the exact missing authority. Do not create schema, migration, or another ticket. CK review is limited to the four rows above; final integrated authenticated `/home` evidence remains IDSER-009-04 `CK-001.a`.

## Explicit non-authority

This ticket does not own lifecycle activation, technical failure mapping, semantic pipeline execution or repair, data migration, a review/workspace capability, Master/facts changes, fixture/demo behavior, responsive/theme/shell screenshots, the IDSER-009-04 browser matrix, or closure of `CK-001.a` itself. `CK-001.b` remains entirely IDSER-009-04.

## Required handoff

Before CK handoff, GO records each review row as `PROVEN` with its named evidence and records `Internal readiness: READY_FOR_CK`. CK `PASS` proves only this production prerequisite. The unchanged IDSER-009-04 retains final integrated closure authority.
