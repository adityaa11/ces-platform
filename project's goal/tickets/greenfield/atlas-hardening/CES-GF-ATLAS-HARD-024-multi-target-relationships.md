# CES-GF-ATLAS-HARD-024 — Multi-Target Relationships

**Stage:** Canonical model and workflow projection refinement
**Status:** Implemented

## Objective

Allow one relationship meaning to apply to zero, one, or several valid targets
without selecting only the highest-ranked target or duplicating its source
record.

## Dependencies

- ATLAS-HARD-022 and ATLAS-HARD-023.

## Work

- Add deterministic multi-target proposals with three identity layers:
  `relationship_intent_id` for shared meaning,
  `target_candidate_id` for each proposed target association, and
  `approved_relationship_id` for each edge later materialized by
  ATLAS-HARD-026.
- Distinguish independent valid targets from competing alternatives.
- Carry target-level evidence, rationale, confidence, review status, and
  blockers.
- Preserve unresolved zero-target candidates.
- Produce target-level review subjects and blockers without materializing
  authoritative relationships; materialization belongs exclusively to
  ATLAS-HARD-026.

## Outputs

Relationship intents, target candidates, target-level evidence and blockers,
conflict findings, and review-subject contracts consumed by ATLAS-HARD-026.

## Acceptance criteria

- [x] Zero-, one-, and multi-target relationships are representable.
- [x] Several valid targets are not collapsed to one winner.
- [x] Competing alternatives remain visibly unresolved.
- [x] Each target is independently traceable and reviewable.
- [x] Accepting or rejecting one target does not change the intent identity or
      invalidate unrelated target decisions.
- [x] Intent, target candidate, and approved edge identities are distinct.
- [x] HARD-024 produces no authoritative approved relationship.
- [x] Canonical records are not duplicated per target.
- [x] Rejected targets cannot appear in approved projections.

## Tests and evidence

Shared validation, cross-workflow confidentiality, competing operations,
missing targets, partial approval, rejection, and deterministic ordering.

## Out of scope

Projection rendering is handled by ATLAS-HARD-025.

## Implementation evidence

Relationship candidates now separate stable `relationship_intent_id` from
independently governed `target_candidate_id` values. Each target carries its
own endpoint, evidence, rationale, confidence, blockers, and pending review
state; zero-target unresolved intents and multiple valid or competing targets
are schema-valid. The approved-edge identity contract is deterministic but no
approved relationship is materialized in HARD-024.

Verification:

- `corepack pnpm --filter @company/ces-proposed-project-model build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/proposed-project-model/src/index.test.ts packages/approved-project-model/src/hardened.test.ts apps/cli/src/atlas.test.ts`
- 14 focused tests passed.
