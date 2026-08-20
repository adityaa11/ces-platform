# Review: BATCH-02 - Fixture scenarios and UI contracts

- Reviewed commit: `1e1343b`
- Baseline: AUI-002; UI/UX Prototype PRD 9.1 and 9.3-9.4
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `packages/atlas-fixtures/src/index.ts`: `ProcessingStage` and `fixtureScenarios` | PRD 9.1 requires selectable uploading, extracting, modeling, ready, needs-attention, and failed processing states; AUI-002 requires every required state to be selectable through fixtures | Accepted | Add the `needs-attention` processing stage and expose selectable fixture scenarios covering each required lifecycle stage, including uploading and modeling, rather than only extracting and failed jobs. Add focused assertions that each required stage can be selected. |

## Decision

The contracts, role scenarios, approvals, source evidence, and relationship integrity are present, and `pnpm test` passes. The checkpoint cannot pass until the complete required processing lifecycle is represented as selectable fixtures, including the missing `needs-attention` state and explicit uploading/modeling scenarios.
