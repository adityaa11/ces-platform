# CES-GF-DAPE-016 — Downstream Product Adaptation

**Priority:** P4 — Product views and operationalization  
**Status:** Planned

## Goal

Make Architect, Assurance, Forge, Verification, and graph views consume and
trace the same approved project model, policy manifest, and registry locks.

## Work

- Architect derives versioned characteristics without rewriting business rules.
- Assurance displays triggers, gaps, risks, evidence, versions, and verification
  status without claiming certification.
- Forge creates tasks and acceptance criteria from both business semantics and
  policy obligations.
- Verification traces tests and evidence to rules, policies, and model
  revisions and marks stale evidence after upgrades.
- Add source-coverage, policy-coverage, traceability, and impact graph views.
- Preserve existing adapters, compiler, bootstrap runner, and verification
  boundaries.

## Acceptance criteria

- [ ] Every product consumes the same approved-model revision.
- [ ] Forge receives business behavior as well as engineering policies.
- [ ] Verification reports trace to stable business-rule and policy IDs.
- [ ] Graph views never become canonical mutable truth.
- [ ] Existing Phase 1, Phase 2, profile-picture, and adapter regressions pass.

## Depends on

- `CES-GF-DAPE-015`

