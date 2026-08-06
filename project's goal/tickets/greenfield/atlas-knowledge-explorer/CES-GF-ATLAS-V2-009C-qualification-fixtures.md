# CES-GF-ATLAS-V2-009C - Qualification Fixtures

**Status:** Implemented
**Depends on:** ATLAS-V2-009B

## Outcome

Create source-derived fixtures that objectively describe the expected recursive
knowledge output without embedding their labels in production code.

## Scope

- Replace the golden oracle using `graphs context.md` and `supporting graphs context.md`.
- Include exact original-document wording and standardized English relationships.
- Add one non-Safara workflow-oriented document.
- Add one non-Safara document whose appropriate structure is not a workflow.
- Include expected graph selection, hierarchy, evidence, and diagnostics.

## Acceptance

- The golden fixture contains Main Workflow modules with supporting graphs below them.
- The two generic fixtures select structurally different graph models.
- No production compiler imports or copies fixture labels or topology.

## Implementation Evidence

- `tests/fixtures/atlas-v2/qualification-cases.json` defines a golden recursive
  case, a generic warehouse workflow, and a non-workflow library structure.
- Every fact quote and term is checked against its source document; labels retain
  source wording while relationships use standardized English identifiers.
- `tests/atlas-v2-qualification-fixtures.test.ts` proves expected graph selection,
  structurally different generic cases, and fixture isolation from production code.
- `corepack pnpm exec vitest run tests/atlas-v2-qualification-fixtures.test.ts`
  passes all five checks.
