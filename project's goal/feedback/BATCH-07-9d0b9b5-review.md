# Review: BATCH-07 - CES Result and approval gates

- Reviewed commit: `9d0b9b5`
- Baseline: AUI-008 acceptance criteria; UI/UX Prototype PRD 5.3, 6, 9.1, 9.4; [AUI-007–AUI-010 reference-system analysis](../atlas-ui/AUI-007-010-reference-system-analysis.md); required visual-validation record in [atlas-ui README](../atlas-ui/README.md)
- Result: `CHANGES_REQUESTED`
- Review round: 2 (remediation review)

## Previous findings

- F-001 (coverage fixture states): **Resolved**. The owner-ready fixture now contains covered, needs-review, out-of-scope, and unresolved CES items, with lens-derived counts.
- F-003 (distinct approval actions): **Resolved**. Owner-only, confirmed Atlas and CES approval actions are present and approved fixtures expose approved states.
- F-004 (validation record): **Partially resolved**. The record exists and covers the principal states, but it documents only the Dark theme; the required whole-surface validation includes both Light and Dark.

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-002 | Important | `apps/atlas/components/CesResult.tsx:15`, `packages/atlas-fixtures/src/index.ts:20` | Reference-system CES card contract: policy ID, status, conclusion, policy rule, source PRDs, and destination link are visible and relationship-derived | Accepted | Render the fixture-owned `rule` and explicit source-PRD identity (and the CES conclusion/status fields required by the contract) in each card. The remediation adds `policyId`, `rule`, and `sourcePrdIds` to the type, but the card currently renders neither `rule` nor source-PRD identity; `coverage` is being used as a status without a distinct conclusion field. |
| F-005 | Important | `apps/atlas/components/CesResult.tsx:18` | AUI-008 and shared workspace contract: CES links retain project and lens context | Accepted | Preserve `prd` and `lens=isolate` on unresolved destinations as well as workflow/fact destinations. `destinationHref` returns `/demo?projectId=...&view=ces` for `unresolved`, so opening the CES-DEC-04 destination from a selected or isolated lens resets the shared lens. |
| F-006 | Important | `project's goal/atlas-ui/BATCH-07-visual-validation.md:13-16` | Required whole-surface visual validation: inspect both Light and Dark themes | Accepted | Re-run and record CES Result inspection in both Light and Dark themes, including the four coverage cards, selected/isolate lens, cross-links, and both approval dialogs. The current record lists Dark only. |

## Decision

F-001 and F-003 are resolved, and automated validation passes (`pnpm test` and `pnpm lint`). BATCH-07 remains `CHANGES_REQUESTED` because the CES card contract, unresolved-link lens preservation, and complete visual-validation evidence are still incomplete.
