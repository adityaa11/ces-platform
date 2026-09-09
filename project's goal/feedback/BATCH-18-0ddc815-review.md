# Review: BATCH-18 - Shared skill definitions and review contract

- Reviewed commit: `0ddc81504bac7c671bb2810ad7491ae5b0b9cb37`
- Ticket: GLF-002
- Baseline: Architecture Checkpoint sections 1, 3, 7–9, 15, 18, 21–24; UI/UX Prototype PRD 9.1, 9.4
- Result: `CHANGES_REQUESTED`
- Review round: 2 (remediation re-review)

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-002R | Important | `.agents/skills/atlas-fixture-changes/atlas-skill.json:38-47`; `.agents/skills/atlas-fixture-projections/atlas-skill.json:44-55`; `.agents/skills/atlas-fixture-verification/atlas-skill.json:35`; `packages/atlas-fixtures/tests/skill-contracts.test.mjs:61-100` | Carries forward BATCH-18 F-002: GLF-002 must define machine-readable contracts that match each skill responsibility and the review matrix’s evidence, dependency, ambiguity, and deterministic-read checks | Accepted | Complete the nested schemas and rejection tests. A `changeProposal` still does not require the documented before/proposed value, provenance, resolution, or evidence; projection `records` remain untyped and do not require fact/assertion or dependency references; verification checks require `detail` but no evidence field. Add the minimum fields required by the corresponding `SKILL.md` and matrix, then assert their absence is rejected. |

## Decision

BATCH-18 remains `CHANGES_REQUESTED`. The remediation resolves the prior
negative-test coverage gap and adds useful branch/HEAD, proposal, projection,
materialized-state, and check-field requirements. The focused fixture suite
passes 10/10 and the remediation diff is whitespace-clean. However, the
machine-readable schemas still accept results that omit obligations explicitly
stated in the shared skill instructions and review matrix, so GLF-002 cannot
yet be approved. No new product requirement was introduced; F-002 remains an
in-scope contract-completeness issue.
