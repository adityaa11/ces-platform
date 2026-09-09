# Review: GLF-003-02 / BATCH-19.2 - Exhaustive Safara fact extraction and source accounting

- Reviewed commit: `a011f3a0f12a043e110995c3c47c566dd6624a3e`
- Baseline: GLF-003; GLF-003-01; Safara Increment 01-03 PRDs; Atlas PRD extraction and verification contracts
- Result: `CHANGES_REQUESTED`
- Review round: 2

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:94` | GLF-003-02 acceptance: the reconciliation report must contain counts by PDF/page, candidate/non-fact destinations, duplicate links, unresolved questions, and canonical/projected record totals; counts must be outputs of the inventory rather than preselected targets. | Accepted | Derive the source-page total and unresolved-question total from the validated inventory/extraction result (and represent unresolved-question classifications explicitly where needed). Remove the literal `11` and `0`, then add regression coverage showing the report changes when those underlying counts change. |

## Decision

The remediation resolves the two prior Important findings: candidate assertions
now map one-to-one to inventory candidates with exact artifact/page/quote
provenance, materialized facts and projection records carry matching candidate
and inventory IDs, disallowed material-to-non-fact reclassification is rejected,
and the fixture suite passes 14/14 including all seven negative publication
mutations. `git diff --check` is clean, and the application test also passes
8/8.

The checkpoint still cannot pass because the generated reconciliation report
hard-codes `Source pages: 11` and `Unresolved questions: 0` instead of deriving
those counts from the inventory/extraction output, contrary to the final
GLF-003-02 acceptance criterion. Recompute those fields and re-run `ck`; do not
begin GLF-004.
