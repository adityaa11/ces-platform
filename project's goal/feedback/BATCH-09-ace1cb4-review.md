# Review: BATCH-09 - Integration and handoff validation

- Reviewed commit: `ace1cb4`
- Baseline: AUI-010 acceptance criteria and validation; UI/UX Prototype PRD 1, 9, 10; [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md); [AUI-007–AUI-010 reference-system analysis](../atlas-ui/AUI-007-010-reference-system-analysis.md)
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `project's goal/atlas-ui/BATCH-09-integration-validation.md:8-24` | AUI-010 validation: complete the end-to-end walkthrough using representative fixture scenarios, lens modes, cross-links, source accounting, and screen sizes | Accepted | Record the actual end-to-end walkthrough at representative desktop, tablet, and mobile sizes, including the connected workspace destinations, PRD highlight/isolate modes, source-accounting modal, cross-destination returns, processing/role/approval scenarios, and the profile/session states already established by BATCH-08. The current record names journeys and fixture states but provides no screen-size or responsive walkthrough evidence. |
| F-002 | Important | `packages/atlas-fixtures/tests/contracts.test.mjs:35-50` | AUI-010 acceptance and fixture contract: every rendered count, source statement, and cross-link must derive from a resolvable relationship | Accepted | Extend the integration contract assertions to cover every CES item: `destination`, `sourcePrdIds`, `linkedFactIds`, and every evidence `documentId`; also validate destination target IDs for all CES destinations. The current exhaustive destination loop covers `changes` and `sourceAccounting` only, while the CES UI renders its own destination and fact/source-PRD graph. |

## Decision

The application build, tests, and lint pass (`pnpm test` and `pnpm lint`), and the fixture boundary is clearly documented. BATCH-09 remains `CHANGES_REQUESTED` until the handoff record includes screen-size walkthrough evidence and the CES relationship graph is covered by the contract validation.
