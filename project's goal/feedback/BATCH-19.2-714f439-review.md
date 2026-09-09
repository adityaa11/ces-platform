# Review: GLF-003-02 / BATCH-19.2 - Exhaustive Safara fact extraction and source accounting

- Reviewed commit: `714f439eb3f3932d3f89e7b5d8ae68b57320d3be`
- Baseline: GLF-003; GLF-003-01; Safara Increment 01-03 PRDs; Atlas PRD extraction and verification contracts
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:69-75`; `packages/atlas-fixtures/tests/golden-fixture.test.mjs:22-45` | GLF-003-02 acceptance: every candidate assertion resolves to exactly one inventory entry; every accepted assertion, materialized fact, workflow node, Project Facts, CES, and chatbot record resolves back to matching candidate and source-inventory IDs; publication fails when candidate provenance is missing. | Accepted | Enforce complete bidirectional provenance before publication: every accepted assertion must map to one inventory candidate with matching artifact/page/quote; every materialized fact and each paired projection `assertionIds`/`inventoryIds` entry must match that assertion's candidate and inventory provenance. Also reject duplicate assertions for one inventory candidate. Add focused negative tests that corrupt or add these references and prove the previous generated bundle remains unchanged. |
| F-002 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:65-68`; `packages/atlas-fixtures/tests/golden-fixture.test.mjs:22-33` | GLF-003-02 scope and acceptance: a non-fact is permitted only for a heading, repeated boilerplate, visual decoration, or duplicated wording with a precise reason/duplicate target; a material statement may not use it as an escape hatch, and publication must fail when that rule is violated. | Accepted | Validate the classification against the inventory statement class and a permitted non-fact reason/duplicate target, so a material entry cannot be reclassified as `non_fact` merely by supplying arbitrary text. Add a negative publication test for that mutation and retain the reconciliation's classification counts. |

## Decision

The checkpoint correctly uses the three authoritative Increment PDFs, covers 11 pages, emits an inventory-backed reconciliation report, and the fixture suite passes. It cannot pass yet because its validation only proves that each declared candidate inventory entry has at least one matching assertion, while unproven extra assertions and mismatched materialized/projection provenance can still be published. It also accepts any non-empty non-fact reason, including one assigned to a material statement. Resolve these two accepted, in-scope findings in one remediation commit, then re-run `ck`; do not begin GLF-004.
