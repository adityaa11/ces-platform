# CES-GF-ATLAS-HARD-012 — Immutable Approval Decisions

**Stage:** Atlas hardening approval
**Status:** Planned

## Objective

Record human approve, reject, correct, and ambiguity decisions without mutating
the extraction proposal or allowing Atlas to approve its own output.

## Dependencies

- ATLAS-HARD-009 through ATLAS-HARD-011.
- Completed DAPE-006 review foundation.

## Work

- Define immutable decision records bound to proposal revision/hash, record ID,
  prior record revision, action, reviewer identity, timestamp, note, and
  corrected content when applicable.
- Support approval, rejection, correction request, corrected approval, and
  ambiguity/conflict dispositions.
- Validate bulk operations against backend eligibility at decision time.
- Define supersession and replay rules without deleting decision history.
- Reject agent identities and stale or conflicting decision submissions.

## Outputs

`approval-decisions.json`, decision schema, validation diagnostics, and
deterministic replay order.

## Acceptance criteria

- [ ] The proposal remains byte-identical after decisions.
- [ ] Every decision is revision-bound and attributable to a human reviewer.
- [ ] Corrected wording preserves original proposal content and reviewer note.
- [ ] Agent self-approval and client-forced bulk approval are rejected.
- [ ] Conflicting or stale decisions fail explicitly.
- [ ] Decision history is replayable and append-only.

## Tests and evidence

All decision kinds, correction history, stale revision, duplicate/conflicting
decision, agent identity, invalid bulk selection, replay, and tamper fixtures.

## Out of scope

Authentication UI and authoritative model materialization.
