# GLF-002: Skill definitions, responsibilities, and review contract

- **State:** awaiting_review
- **Review batch:** BATCH-18
- **Depends on:** GLF-001
- **Baseline:** Architecture Checkpoint sections 1, 3, 7–9, 15, 18, 21–24; UI/UX Prototype PRD 9.1, 9.4

## Outcome

Define each shared Atlas skill's purpose, responsibility, input/output contract,
authority boundary, and review checks before it generates golden fixture data.

## Scope

- Review extraction, repository, change-proposal, projection, and verification
  skills as one candidate-only system.
- Tighten machine-readable contracts, including branch/HEAD and revision-level
  execution provenance requirements.
- Define which checks are model advisory versus deterministic gates.
- Record the review matrix used to validate each skill against the checkpoint.

## Acceptance criteria

- Every skill has a defined purpose, responsibility, input, output, and
  non-authoritative boundary.
- Repository output contracts require stable branch IDs, `headRevisionId`, and
  branch/HEAD-keyed materialized state.
- Revision provenance requires skill ID/version and actual execution mode.
- The review matrix covers proposal-not-truth, evidence, ambiguity, approval,
  branch isolation, and deterministic read-path rules.

## Validation

- Parse and validate every skill manifest with representative valid/invalid data.
- Review each `SKILL.md` against its defined responsibility and authority boundary.
