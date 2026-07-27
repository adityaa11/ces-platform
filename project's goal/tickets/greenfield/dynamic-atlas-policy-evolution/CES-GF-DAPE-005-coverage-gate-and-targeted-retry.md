# CES-GF-DAPE-005 — Coverage Gate, Critic, and Targeted Retry

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Prevent Atlas from reporting success while normative source units remain
unaccounted for.

## Work

- Add deterministic coverage dispositions: covered, context-only, duplicate,
  uncertain, conflicting, excluded-with-reason, and uncovered.
- Require semantic-record mappings or reviewed exclusions for normative units.
- Register an independent coverage-critic agent.
- Detect omissions, combined rules, distortions, false context classification,
  and duplicates.
- Retry only uncovered units with bounded neighboring context and attempts.
- Publish coverage map, critic report, retry history, and blocking status.

## Acceptance criteria

- [ ] A normative uncovered unit produces `incomplete_coverage`.
- [ ] An agent cannot mark its own extraction complete.
- [ ] Context-only and excluded dispositions require reason and provenance.
- [ ] Targeted retry is bounded, deterministic outside retried units, and
      fails to human review when exhausted.
- [ ] The prior four-rule Safara output cannot pass the gate.

## Depends on

- `CES-GF-DAPE-004`

