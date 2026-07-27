# CES-GF-DAPE-006 — Coverage-Aware Human Review

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Let reviewers govern extracted meaning, terminology, omissions, exclusions,
conflicts, and corrections before publication.

## Work

- Show source units beside candidate records and coverage dispositions.
- Show uncovered, uncertain, conflicting, duplicated, and context-only units.
- Support approve, reject, correct, merge, split, defer, create-from-source,
  exclude-with-reason, and concept-confirmation decisions.
- Bind every decision to candidate, source, lexicon, and coverage revisions.
- Require answers for blocking clarifications.
- Keep review publication atomic and resumable.

## Acceptance criteria

- [ ] Reviewers can create a missing rule directly from a source span.
- [ ] Stale source, candidate, concept, or coverage revisions are rejected.
- [ ] Coverage cannot complete through silent exclusion.
- [ ] Agents cannot author the human approval identity.
- [ ] Review output is deterministic for equivalent ordered decisions.

## Depends on

- `CES-GF-DAPE-005`

