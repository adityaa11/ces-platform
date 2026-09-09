# Review: BATCH-18 - Shared skill definitions and review contract

- Reviewed commit: `508366fd157d5fcf9f1dcca71d49f6fb9f98827d`
- Ticket: GLF-002
- Baseline: Architecture Checkpoint sections 1, 3, 7–9, 15, 18, 21–24; UI/UX Prototype PRD 9.1, 9.4
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Important | `packages/atlas-fixtures/tests/skill-contracts.test.mjs:31-50` | GLF-002 validation: parse and validate every skill manifest with representative valid/invalid data; GLF-002 acceptance: machine-readable contracts must enforce the declared skill boundaries | Accepted | Add representative negative cases for every input and output schema, including missing required request fields, wrong enum/type values, missing execution provenance/mode, missing extraction evidence, and malformed branch/HEAD/materialized-state fields. Assert both input and output validators reject those cases, rather than only deleting the root `skillId` from one generated output. |
| F-002 | Important | `.agents/skills/atlas-fixture-changes/atlas-skill.json:21-41`; `.agents/skills/atlas-fixture-projections/atlas-skill.json:37-45`; `.agents/skills/atlas-fixture-repository/atlas-skill.json:38-80`; `.agents/skills/atlas-fixture-verification/atlas-skill.json:20-35` | GLF-002 outcome and acceptance: define machine-readable input/output contracts and review each skill against its responsibility; review matrix checks for evidence, stale-base/ambiguity handling, branch isolation, dependencies, and deterministic read paths | Accepted | Encode the minimum required shape of each documented result, or add the deterministic contract layer that enforces it before acceptance. In particular, `changeProposal`, projection `surfaces`, repository materialized `state`, and verification `checks` currently accept empty/unstructured objects, so Ajv can accept results that violate the corresponding `SKILL.md` and review-matrix obligations. Add focused rejection tests for those missing required fields and relationships. |

## Decision

BATCH-18 remains `CHANGES_REQUESTED`. The nine-test fixture suite passes and the
five skills have clear provider-neutral instructions, candidate/advisory
dispositions, and authority-boundary prose. However, the required validation
does not exercise malformed requests or the substantive nested contract shape,
and the machine-readable schemas currently permit structurally empty results
for several skills. Resolve these findings in one remediation commit, return
the ticket to `awaiting_review`, and re-run `ck`; do not begin GLF-003 yet.
