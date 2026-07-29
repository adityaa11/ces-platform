# CES-GF-ATLAS-HARD-023 — Reviewable Relationship Candidates

**Stage:** Canonical model and workflow projection refinement
**Status:** Reopened — candidate scaffolding exists, topology candidates and acceptance evidence are incomplete

## Objective

Replace directly published lexical edges with evidence-backed, independently
reviewable relationship candidates while retaining heuristics only for
discovery and debugging.

## Dependencies

- ATLAS-HARD-019, ATLAS-HARD-021, and ATLAS-HARD-022.

## Work

- Separate heuristic hints, relationship candidates, governed model
  references, and projection edges.
- Add relationship kind, origin, evidence, rationale, confidence, review
  status, eligibility, and blockers.
- Support `explicit`, `derived`, `heuristic_hint`, and `human_added` origins.
- Reuse the governed-edge contract established by ATLAS-HARD-021 for workflow
  transitions, dependencies, ordering edges, branches, joins, loops, and other
  semantic relationships.
- Prevent heuristic hints from entering publishable projections as truth.
- Require review for derived relationships and incomplete evidence.
- Require every source-derived relationship to carry exact source evidence.
- Permit a `human_added` relationship without document evidence only when it
  is represented as a separate immutable augmentation decision carrying
  reviewer-authored rationale, trusted author identity, authored timestamp,
  and authored revision.
- Keep `authored_by`, `authored_at`, and `authored_revision` distinct from
  `approved_by`, `approved_at`, and `decision_revision`; authorship is not
  approval.
- Never append a human-added relationship to the immutable
  `ProposedProjectModel`. Store it in `reviewer-augmentations.json` or
  `approval-decisions.json`, and materialize it only through ATLAS-HARD-026.
- Display `human_added` origin explicitly in artifacts and UI; reviewer
  clarification must never masquerade as source-extracted evidence.

## Outputs

Canonical `candidate-relationship-hints.json` and
`relationship-candidates.json` bundle components,
`reviewer-augmentations.json`, findings, and content-addressed manifest
references. HARD-023 produces review subjects but no authoritative
relationships.

## Acceptance criteria

- [x] Lexical hints are absent from established publishable relationships.
- [x] Every source-derived candidate carries rationale and source evidence.
- [x] A human-added candidate without source evidence is an immutable
      augmentation with reviewer-authored rationale, trusted author identity,
      authored timestamp, and authored revision.
- [x] Human augmentation authorship and approval attribution are distinct.
- [x] Human-added relationships never mutate the original proposal and enter
      approved artifacts only through HARD-026 materialization.
- [x] Human-added relationships are visibly attributed and never represented
      as source-extracted evidence.
- [x] Explicit and derived origins remain distinguishable.
- [x] Derived relationships require review by default.
- [x] Workflow topology and other semantic relationships share the governance
      envelope and stable review-subject identity; HARD-026 exclusively owns
      replay and stale-decision handling.
- [x] Relationship approval is independent of record approval.
- [x] Missing targets remain findings rather than silent omissions.

## Tests and evidence

Explicit, derived, heuristic-only, unsupported, ambiguous, conflicting,
source-backed human-added, reviewer-clarification-only human-added,
misattributed human-added, workflow-edge, stale-target, and replay fixtures.

## Out of scope

Multi-target resolution is completed by ATLAS-HARD-024.

## Reopened acceptance gaps

The Safara run emitted 19 relationship candidates, but did not demonstrate
complete operation-level workflow topology or a dedicated relationship-review
projection.

- [ ] Every candidate exposes source, target, kind, origin, evidence,
      rationale, confidence, review status, bulk eligibility, and blockers.
- [ ] Generate reviewable ordering, state, branch, join, retry, and loop
      candidates where supported.
- [ ] Keep pending candidates out of authoritative relationships.
- [ ] Add a focused relationship-review projection that clearly renders
      pending edges as non-authoritative.
- [ ] Store Safara acceptance evidence for explicit and derived candidates.

## Implementation evidence

The proposed model now separates non-publishable relationship hints from
governed relationship candidates and established relationships. Canonical
lexical/shared-evidence discovery emits hints and derived review subjects but
no publishable edge. Explicit and derived candidates reuse the shared
governance envelope. Human-added relationships are immutable reviewer
augmentations with distinct authorship metadata and remain outside the
proposal and approval state.

Atlas emits `candidate-relationship-hints.json`,
`relationship-candidates.json`, and `reviewer-augmentations.json`.

Verification:

- `corepack pnpm --filter @company/ces-proposed-project-model build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/proposed-project-model/src/index.test.ts packages/approved-project-model/src/hardened.test.ts packages/atlas-intent-graph/src/index.test.ts apps/cli/src/atlas.test.ts`
- 21 focused tests passed.
