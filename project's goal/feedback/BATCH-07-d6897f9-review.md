# Review: BATCH-07 - CES Result and approval gates

- Reviewed commit: `d6897f9`
- Baseline: AUI-008 acceptance criteria; UI/UX Prototype PRD 5.3, 6, 9.1, 9.4; [AUI-007–AUI-010 reference-system analysis](../atlas-ui/AUI-007-010-reference-system-analysis.md); required visual-validation record in [atlas-ui README](../atlas-ui/README.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `packages/atlas-fixtures/src/index.ts:83`, `apps/atlas/components/CesResult.tsx:15` | AUI-008 scope/validation: representative covered, needs review, out of scope, and unresolved states; exercise all coverage fixture states | Accepted | Provide fixture-owned CES records that exercise all four states in the normal review scenario (and retain the approved scenario as a distinct state), then verify the four derived summary counts and card labels update correctly under the shared PRD lens. The current scenario has one `needs-review` item only; `approved-result` rewrites that same item to `covered`, so the other required states cannot be exercised. |
| F-002 | Important | `packages/atlas-fixtures/src/index.ts:17,83`, `apps/atlas/components/CesResult.tsx:15` | Reference-system CES destination contract and fixture relationship rule: policy ID/status/conclusion/rule/source PRDs/destination must be relationship-derived and resolvable | Accepted | Extend the CES fixture contract so each displayed result has stable policy identity/status/conclusion/rule/source-PRD relationships and a typed destination. Render those fields and resolve links from fixture IDs, including workflow/fact/CES/source-accounting destinations; do not use the first evidence record or a hard-coded facts-only route as the complete provenance graph. |
| F-003 | Important | `apps/atlas/components/CesResult.tsx:15` | AUI-008: awaiting-approval and approved states for Atlas understanding and CES baseline; approval actions are distinct and reflected in the UI | Accepted | Give an authorized owner a distinct, confirmed Atlas-understanding approval action as well as the CES-baseline action, or explicitly wire the existing shared approval action into this surface. Both state transitions must be observable, while editor/viewer scenarios remain read-only and approved scenarios show the resulting states. |
| F-004 | Important | `project's goal/atlas-ui/` | Required visual-validation record: every UI ticket records rendered states before awaiting review | Accepted | Add `BATCH-07-visual-validation.md` using the ticket template, documenting rendered CES coverage/decision/approval states, lens-selected and isolated states, evidence/cross-links, owner/editor/viewer behavior, desktop and narrow layouts, and the consequential approval dialog. Automated build, tests, and lint do not replace this record. |

## Decision

Automated validation passed (`pnpm test` and `pnpm lint`), but the checkpoint does not yet satisfy the AUI-008 fixture and interaction contract. The four Important findings require one bounded remediation pass before re-review.
