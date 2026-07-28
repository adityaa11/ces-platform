# CES-GF-ATLAS-HARD-008 — Safara Hardening Oracle

**Stage:** Atlas hardening qualification
**Status:** Planned

## Objective

Extend and reuse the human-reviewed DAPE-000 Safara oracle as the expected
dataset for the complete Atlas hardening lifecycle.

## Dependencies

- ATLAS-HARD-001 through ATLAS-HARD-007.
- Completed DAPE-000, DAPE-008, and DAPE-008R evidence.

## Work

- Reuse the contract-neutral oracle rather than generating expected output from
  current implementation behavior.
- Add explicit expected projections for source units, workflows, capabilities,
  all requirement categories, traceability, findings, and review eligibility.
- Cover ten workflow areas, ten primary rules, detailed validations,
  calculations, readiness, manifest behavior, roles, reports, and terminology.
- Record reviewer identity, oracle revision, approval, and semantic change
  history without embedding secrets or provider payloads.

## Outputs

Versioned Safara oracle tree and projection checklists for every hardening stage.

## Acceptance criteria

- [ ] The oracle remains human-reviewed and independent of implementation output.
- [ ] All ten primary rules and workflow areas are represented.
- [ ] All required extraction categories contain expected records or reviewed
      empty dispositions.
- [ ] Every expected semantic record resolves to source evidence.
- [ ] Oracle changes require an explicit review record.
- [ ] Real-provider evidence is redacted and linked without exposing PRD text.

## Tests and evidence

Schema validation, anchor resolution, concrete semantic-key/count assertions,
missing-category variants, unsupported additions, and unreviewed oracle changes.

## Out of scope

Automatically accepting oracle changes or treating provider output as truth.
