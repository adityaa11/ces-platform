# HMN Authorization: SEM-CUTOVER-005 successor composite accounting

- **Ticket:** `SEM-CUTOVER-005-SUCCESSOR-COMPOSITE-ACCOUNTING` — additive companion-contract extension
- **Batch:** `SEM-CUTOVER`
- **HMN authorization ID:** `HMN-SEM-CUTOVER-005-001`
- **Invocation:** explicit user `hmn` delegation; human decision `APPROVE — bounded successor composite-accounting contract planning only`.
- **Current workflow state:** the historical `SEM-CUTOVER-005` is independently closed by CK `PASS`; REL-03's isolated pure descriptor interface is independently closed by CK `PASS`. This successor is planning-complete but has no implementation checkpoint.

## Frozen ticket reference

- Historical closed ticket: `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-005-provisional-accounting-and-replay-handoff.md`
- Historical SEM-CUTOVER-005 CK: `project's goal/feedback/SEM-CUTOVER-005-0c3d4a6-verification.md` (`PASS`, reviewed remediation commit `0c3d4a6ae45f9a8115bb40b98397eb1738fc58e5`)
- Qualified prerequisite: `project's goal/feedback/BSS-V2-004-03-05-REL-03-f494f4c-verification.md` (`PASS`, remediation commit `f494f4c18508a19f608b98e27f6a076af49644d7`)
- Predecessor planning authority: `project's goal/feedback/BSS-V2-004-03-05-REL-03-hmn-008.md`
- Successor authority: the explicit human decision attached to this HMN invocation.

Current HEAD: `ad069bdc3aecc44a2f3adacf2452899f47ea3df2` on `codex/new-atlas-backend`.

Relevant GO commit: none for this successor.

Relevant CK artifact: none for this successor; it requires an independent first CK after a separately invoked implementation GO.

Relevant CFC commit: none.

Prior HMN authorization: none for this successor.

Worktree state: pre-existing tracked finalizer/worker/fixture edits and unrelated untracked planning material are preserved. This authorization changes only this feedback record; none of that material is successor implementation evidence.

## Diagnosis

Historical sidecar V1 correctly validates a complete canonical Semantic V1 inventory for every ready owned source. That invariant cannot truthfully represent an owned source whose complete provider proposal is essential-relationship-dependent: V1 has only `candidate` and `non_fact`, so a fabricated candidate, a false `non_fact`, or omission would be required. REL-03 now supplies independently qualified, pure deferred descriptors with exact provider candidate tuples, complete proposed meaning, source identity, and immutable relationship-revision dependencies.

The representability gap is therefore ticket-bound and repairable by an additive, versioned companion contract. It does not reopen the historical sidecar V1 behavior or either predecessor `PASS`.

## Ticket-authority trace

| Authority | Effect |
| --- | --- |
| Historical SEM-CUTOVER-005 objective, lifecycle semantics, RC-005-01/02/04/05, and composite-preparation boundary | Requires truthful, attributable source accounting, exact identity/hash binding, no false completeness, and no truth promotion; its historical V1 implementation remains closed. |
| REL-03 pure-interface CK `PASS` | Supplies only qualified deferred descriptors; it does not authorize canonical finalization, staging, provider work, persistence, or relationship acceptance. |
| Explicit human decision for this invocation | Approves the smallest successor companion definition below, including full deferred-source accounting and an independent CK gate. |

## Decision

`RETURN_TO_GO` for a separately invoked, bounded implementation of this successor contract. This is a planning authorization only: it neither performs that GO nor permits implementation in this invocation. It is not a CK `PASS`, CFC authorization, or authority to resume `SEM-CUTOVER-006`.

## Approved successor contract

### Compatibility and versioning

Keep `atlas.semantic.provisional-sidecar/v1`, `ProvisionalSemanticSidecar`, and `prepareProvisionalSemanticSidecar()` byte-for-byte behaviorally compatible for independent-only inputs. Do not alter its source-accounting meanings, hash body, staging semantics, exports, or historical artifacts.

Define a distinct, additive record named `atlas.semantic.provisional-composite-accounting/v1` in `provisional-semantic-sidecar.ts`. Its deterministic hash covers its complete body and must bind the exact scope, source SHA, profile/profile hash, request hash, canonical-result hash, canonical inventory identity, provider-tuple coverage ledger, qualified deferred descriptors, and pending-meaningful-visual accounting. It is a new companion outcome, not a silent V1 variant or a replacement for a canonical result.

The new preparation function must accept a narrow structural input contract rather than import from `apps/agents-bridge`: trusted scope/request/canonical-result data, the exact parsed provider candidate-tuple inventory, and REL-03-shaped deferred descriptor values. The structural shape must validate the entire REL-03 descriptor identity it consumes; it must not copy REL-03 tuple classification or relationship-authority logic. No shared cross-package type is approved. A public barrel export is permitted only if an implementation GO proves it is necessary for the approved consumer boundary; that narrow export is the only additional path eligible for change.

### Composite accounting rules

1. The provider-tuple inventory is the exact universe of supplied owned-source candidate tuples. Each tuple appears exactly once in the ledger as `independently_finalized`, `optional_relationship_but_independent`, or `essential_dependent_deferred`.
2. A canonical tuple must be represented by a legitimate canonical V1 candidate, never by a deferred descriptor. An optional-relationship tuple remains independently finalizable and cannot also appear deferred.
3. Each essential-dependent tuple must be represented by exactly one qualified REL-03 deferred descriptor, whose tuple, deferred ID, owned/context source, asset identity where applicable, scope, complete proposed meaning, and immutable revision dependency match the supplied trusted inputs.
4. Source coverage is evaluated only over the canonical outcome plus this companion outcome. An independent-only source retains the historical canonical/sidecar V1 result. A mixed source has its independent canonical tuples and its deferred tuples separately. A fully deferred source has a source-coverage row and deferred tuple rows but no fabricated canonical candidate or `non_fact`.
5. Pending meaningful visuals remain separately accounted for and cannot satisfy a canonical or deferred candidate tuple. A genuine source with evidence of no project meaning retains legitimate canonical `non_fact` only when it has no deferred tuple and no pending meaningful visual.
6. A canonical result with incomplete owned-source coverage is valid only as the explicitly bound partial member of this composite outcome. It must not be staged, acknowledged, or represented as complete extraction without the matching, hash-valid composite companion. This successor remains pure/fake-only: no durable staging or repository protocol is introduced.
7. Every identity mismatch, missing/duplicate/foreign tuple or descriptor, canonical/deferred double count, missing immutable revision, false `non_fact`, missing companion, incomplete coverage claim, incompatible version/hash, or attempted truth promotion rejects before provider, repository, staging, database, or publication effects.

### Required acceptance matrix

The later GO and independent CK must use this frozen matrix without adding a substitute completion path.

| Category | Required oracle |
| --- | --- |
| Positive | Independent-only zero-relationship source retains the historical V1 result and sidecar behavior. |
| Positive | Mixed source accounts independent canonical and essential-dependent deferred tuples exactly once. |
| Positive | Fully deferred source has companion source coverage and zero canonical candidates without `non_fact`. |
| Positive | Multiple owned sources may combine fully deferred and independently finalized source coverage. |
| Positive | Pending meaningful visuals remain accounted separately. |
| Positive | Genuine no-meaning source remains legitimate `non_fact` with no fabricated deferred meaning. |
| Positive | Repeated preparation yields identical composite hashes and exact source/asset/request/profile/revision/tuple coverage. |
| Negative | Missing, duplicate, foreign, or canonically double-counted deferred tuples reject. |
| Negative | Deferred descriptors lacking immutable revisions or carrying wrong source, asset, request, profile, revision, or scope identity reject. |
| Negative | False `non_fact`, false complete coverage, absent companion for partial canonical extraction, unauthorized contextual evidence, implicit truth promotion, and sidecar version/hash mismatch reject with zero effects. |

## Authorized scope

The separately invoked implementation GO may modify only:

- `packages/atlas-skills/src/provisional-semantic-sidecar.ts`
- `packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts`
- `packages/atlas-skills/src/index.ts` only for the proven-necessary narrow public export of the new contract; otherwise it remains untouched.

The implementation must consume REL-03 descriptors as structural values only. It must not alter REL-03's implementation, candidate classification, or relationship authority.

## Required validation

GO must record each matrix row as a Review Contract row; prove deterministic full composite coverage and fail-closed zero-effect negatives with focused tests and `@atlas/skills` typecheck; and confirm V1 regressions remain intact. It must commit only the authorized paths, mark the successor checkpoint `awaiting_review`, and request a new independent CK. CK must assess the successor contract only and preserve the historical SEM-CUTOVER-005 and REL-03 PASS records unchanged.

## Forbidden work

- Do not alter canonical Semantic V1 enums, historical sidecar V1 records/hashes, historical tickets/CK artifacts, REL-03 implementation, or qualified descriptor classification.
- Do not import `@atlas/skills` into `apps/agents-bridge`, or create a circular dependency in the opposite direction.
- Do not resume SEM-CUTOVER-006 or begin SEM-CUTOVER-007; do not change the worker, provider routing, source grants, finalizer, repository, database/migrations, durable staging, admission, Master, publication, or human-verification behavior.
- Do not use a shared interface/type outside the narrow structural contract. If this scope cannot preserve every stated accounting invariant, stop `SCHEMA_FIT_BLOCKED` and identify the exact external interface owner and authority needed.

## Handoff

Expected next command: explicit `GO SEM-CUTOVER-005-SUCCESSOR-COMPOSITE-ACCOUNTING`.

GO must cite `HMN-SEM-CUTOVER-005-001`, implement one bounded pure/fake contract checkpoint, and hand it to an independent CK. SEM-CUTOVER-006 remains blocked pending this successor's independent CK `PASS` and its own existing authority gates.
