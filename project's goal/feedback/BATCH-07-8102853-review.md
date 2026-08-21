# Review: BATCH-07 - CES Result and approval gates

- Reviewed commit: `8102853`
- Baseline: AUI-008 acceptance criteria and validation; UI/UX Prototype PRD 5.3, 6, 9.1, 9.4; [AUI-007–AUI-010 reference-system analysis](../atlas-ui/AUI-007-010-reference-system-analysis.md); required visual-validation record and whole-surface rule in [atlas-ui README](../atlas-ui/README.md)
- Result: `CHANGES_REQUESTED`
- Review round: 3 (remediation review)

## Previous findings

- F-002 (CES policy contract): **Resolved**. CES fixtures now include conclusion and cards render policy ID, conclusion, rule, source PRD revisions, and destination data.
- F-005 (unresolved-link lens context): **Resolved**. The shared `link` helper retains `projectId`, `prd`, and isolate mode for unresolved destinations.

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-006 | Important | `project's goal/atlas-ui/BATCH-07-visual-validation.md:13-15` | Required whole-surface visual validation: changed states must be inspected in both Light and Dark themes | Accepted | Record the selected/isolate lens states and role/approved fixture states in both Light and Dark themes, not only the all-PRD CES Result row. The current record still lists Dark alone for those rows, so the evidence does not cover the full connected surface required by the repository baseline. |
| F-007 | Important | `apps/atlas/components/CesResult.tsx:11` (`LensControl`) | Shared PRD lens popover must retain the established accessible open/close interaction across the connected workspace | Accepted | Restore an explicit labelled close control (or equivalent Escape/outside-dismiss behavior) and the popover heading/structure. This remediation removed the prior `Close PRD lens` button and header; the open popover now has no dedicated dismissal affordance or Escape handling, creating a regression in the shared lens control while reviewing CES. |

## Decision

The CES data contract and unresolved-link context are now corrected, and automated validation passes (`pnpm test` and `pnpm lint`). BATCH-07 remains `CHANGES_REQUESTED` for the incomplete Light/Dark validation coverage and the introduced PRD lens popover regression.
