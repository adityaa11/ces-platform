# CES-GF-ATLAS-HARD-018 — Atomic Claims and Claim-Level Coverage

**Stage:** Canonical model and workflow projection refinement
**Status:** Implemented

## Objective

Decompose canonical source units into source-grounded atomic claims so Atlas
measures completeness per normative obligation instead of marking a partially
represented source unit complete.

## Dependencies

- ATLAS-HARD-001, ATLAS-HARD-005 through ATLAS-HARD-007, and ATLAS-HARD-017.

## Work

- Persist deterministic atomic claims with exact spans and source-unit lineage.
- Map each claim to candidate and canonical record IDs.
- Require one disposition: `represented`, `duplicate`, `not_applicable`,
  `ambiguous`, `conflicting`, `unsupported`, `uncovered`, or
  `human_review_required`.
- Drive findings and bounded retry from unresolved claims.
- Keep decomposition domain-neutral, uncertainty-preserving, and revision-pinned.

## Outputs

`atomic-claims.json`, claim-level `source-coverage.json`, findings, and revision
metadata.

## Acceptance criteria

- [x] Every normative claim has exactly one valid disposition.
- [x] One represented claim cannot hide sibling uncovered claims.
- [x] Claim spans resolve to canonical source units.
- [x] Uncertain decomposition remains review-required.
- [x] Uncovered claims block HARD-015 qualification.
- [x] Replay is deterministic for pinned inputs and revisions.

## Tests and evidence

Compound lists, tables, multi-obligation prose, duplicates, ambiguous
boundaries, conflicts, retry closure, and deterministic replay.

## Out of scope

Canonical record identity is handled by ATLAS-HARD-019.

## Implementation evidence

`@company/ces-atlas-coverage` now provides revision-pinned atomic-claim
artifacts, deterministic exact-span decomposition, claim-level dispositions,
candidate/record mappings, findings, bounded retry scopes, and a qualification
gate. The canonical Atlas CLI emits `atomic-claims.json`,
`claim-coverage.json`, and `claim-retry-scope.json` when unresolved claims
exist, and retains claim evidence through review materialization.

Verification:

- `corepack pnpm --filter @company/ces-atlas-coverage build`
- `corepack pnpm --filter @company/ces-cli typecheck`
- `corepack pnpm vitest run packages/atlas-coverage/src/index.test.ts apps/cli/src/atlas.test.ts`
- Broad run: 330 tests passed; the two known Windows `bootstrap-runner`
  timeout tests exceeded five seconds and a worker later exhausted the Node
  heap. No Atlas assertion failed.
