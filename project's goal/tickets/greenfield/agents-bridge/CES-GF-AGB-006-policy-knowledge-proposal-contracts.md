# CES-GF-AGB-006 - Policy Knowledge Proposal and Execution Evidence Contracts

**Status:** Proposed; implementation unauthorized
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-008-V01 publication; AGB-001 through AGB-003
**Blocks:** AGB-007, AGB-009, AGB-012, AGB-013

## Outcome

Define Policies-owned, provider-neutral contracts for bounded knowledge-agent
requests, proposed raw/canonical/Policy changes, deterministic validation, and
redacted execution evidence.

## Scope

- Versioned proposal envelopes for `EXTRACTION_GAP`,
  `CANONICALIZATION_GAP`, and `POLICY_GAP`.
- Governed input revision, predecessor, source, lineage, and gap identities.
- Execution evidence containing request/attempt, agent/version,
  provider/model, input-context hashes, proposal hash, and validation result.
- Explicit `proposed` lifecycle and absence of approval/publication authority.
- Content-addressed integrity without retaining prompts, documents, secrets, or
  provider responses in operational telemetry.

## Acceptance contract

- The contracts preserve Source Glossary, raw, canonical, and taxonomy layer
  distinctions and reject cross-layer authority claims.
- Agent output can never represent `ACCEPTED`, publish a successor, or grant
  final POL-008 authority.
- Evidence deterministically binds the governed inputs and exact proposal while
  remaining safe to retain.
- Provider/runtime identity is evidence, not semantic authority.
- Unknown fields, stale revisions, broken lineage, altered hashes, and missing
  predecessor identity fail closed.

## Explicit non-goals

- Implementing an agent, workflow orchestration, REVIEW_GATE automation, or
  final POL-008 approval.
- Moving Policy semantics into the generic bridge core.

## Review focus

Authority separation, provenance completeness, provider neutrality, evidence
privacy, deterministic integrity, and compatibility with accepted POL-006,
POL-007, POL-008, and Coverage V4 artifacts.
