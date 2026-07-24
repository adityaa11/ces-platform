# CES-GF-ASR-002 — Assurance: Obligation and Verification Views

**Phase:** 5A — Assurance Visibility  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Render accurate developer and delivery views of obligations, adapter support,
evidence, and verification without changing their meaning.

## Work

- Produce deterministic JSON and Markdown policy and traceability reports.
- Show source reasons, requirement level, resolution state, and adapter support.
- Show required evidence, supplied evidence, and verification state.
- Distinguish automated verification from required human review.
- Provide concise developer and delivery summaries from the same records.
- Update views when Forge or verification artifacts change.

## Acceptance criteria

- [ ] Every displayed status is derived from an authoritative artifact.
- [ ] Unsupported, blocked, missing, partial, and failed states remain explicit.
- [ ] Developer and delivery views agree on underlying status.
- [ ] No view claims compliance or certification.
- [ ] Verification updates cannot erase historical evidence identity.

## Required evidence

- [ ] Golden reports for success, blocked, adapter-gap, and failed verification.
- [ ] Cross-view consistency tests.
- [ ] End-to-end update test after verification.

## Out of scope

- Enterprise dashboard.
- Standards mapping.
- Automated semantic review.
