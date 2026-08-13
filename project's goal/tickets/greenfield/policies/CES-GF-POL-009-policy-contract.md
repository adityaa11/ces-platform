# CES-GF-POL-009 - Policy Contract

**Status:** Ready for REVIEW_GATE implementation
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-008 final taxonomy revision 1.3.0 and accepted
POL-008-V01 Coverage V4 publication (satisfied)

## Outcome

Define versioned, renderer-neutral contracts for approved policies, concerns,
capability needs, and resolution semantics.

## Scope

- A versioned, renderer-neutral Policy contract referencing only the six
  Policies in approved taxonomy revision `1.3.0` and its final POL-008
  publication identity/hash.
- Separate versioned Concern and Capability-Need records with stable IDs,
  definitions, lifecycle, provenance, and technology-independent wording.
- Explicit many-to-many Policy-to-Concern and Concern-to-Capability
  relationships. A Concern never becomes a Policy merely because it is linked.
- Applicability as an independent dimension from the exact frozen resolution
  states `DEFINED`, `AWARENESS_REQUIRED`, and `DECISION_REQUIRED`.
- State-specific evidence: existing-information references for `DEFINED`, the
  enduring outcome that must be accounted for by `AWARENESS_REQUIRED`, and the
  missing decision class plus affected scope for `DECISION_REQUIRED`.
- Immutable baseline-release identity, revision, predecessor, and content hash.

## Acceptance contract

- Unknown and incompatible relationships fail schema validation.
- Every Policy reference resolves to the exact approved taxonomy `1.3.0`; stale,
  candidate, unknown, or altered Policies fail closed.
- Concern and Capability-Need identities are unique, reusable, and cannot carry
  architecture, stack, vendor, framework, or project-specific facts.
- Every relationship resolves both endpoints, preserves its semantic kind, and
  includes a non-empty rationale. Duplicate or dangling relationships fail.
- A policy remains meaningful without architecture or stack fields.
- Applicability and resolution are separate required fields: neither may be
  inferred from, substituted for, or serialized as the other.
- `DEFINED` requires referenced existing information and cannot claim that CES
  selected a new answer.
- `AWARENESS_REQUIRED` requires a bounded outcome that the eventual solution
  must account for, without prescribing implementation.
- `DECISION_REQUIRED` identifies the missing decision class and affected scope;
  it carries no selected answer and is downstream-blocking until external
  authority supplies the missing decision.
- The contract accepts only the three frozen resolution-state names; runtime
  workflow states such as `resolved`, `blocked`, or `conflict` are not aliases.
- Baseline releases are content-addressed and preserve exact registry and
  approved-taxonomy provenance. Mutation without a new revision fails.
- Deterministic validation covers positive records and negative fixtures for
  unknown IDs, wrong revisions, invalid lifecycle, duplicate links, conflated
  applicability/resolution, incomplete state evidence, invented answers, and
  prohibited implementation or project terminology.

## Explicit non-goals

- Selecting policies for a project or binding Atlas facts.
- Defining implementation patterns, severity scores, prompts, or UI.
- Creating a database-specific schema.
- Defining concrete Safara applicability, choosing architecture, mapping to a
  stack, or reusing legacy Policy Engine `resolved`/`blocked` states as the CES
  Policies semantic contract.
- Calling Agents Bridge or granting an agent authority. POL-009 defines the
  deterministic domain contract later consumed by POL-011 through POL-013;
  Agents Bridge remains execution infrastructure only.

## Required implementation artifacts

1. Strict schemas and types for Policy references, Concerns, Capability Needs,
   typed relationships, applicability, the three resolution variants, and an
   immutable baseline release envelope.
2. A representative reusable registry grounded only in approved CES knowledge;
   it must not claim project applicability or invent implementation guidance.
3. Deterministic validators binding the registry to final POL-008 publication
   and rejecting every negative class in the acceptance contract.
4. Focused tests proving Policy/Concern/Capability separation, resolution-state
   semantics, provenance integrity, project independence, and content-addressed
   immutability.

The implementation remains non-authoritative until this POL-009 REVIEW_GATE
receives an accepting terminal outcome. It cannot modify approved taxonomy
`1.3.0`, start POL-010, or grant downstream project applicability.

## Implementation candidate

- `@company/ces-policy-contract` defines strict renderer-neutral schemas for
  exact approved Policy references, reusable Concerns and Capability Needs,
  typed relationships, independent applicability, and the three frozen
  resolution variants.
- The representative candidate registry contains all six approved Policies,
  one canonical object-authorization concern, and one technology-independent
  authorization capability need. It contains no project applicability or
  implementation mechanism.
- Deterministic validation compares Policy records and publication hash against
  `CES_POLICY_APPROVED_TAXONOMY_V1_3`, rejects dangling/duplicate relationships,
  prohibited terminology, stale authority, and content mutation.
- Resolution validation requires state-specific evidence, rejects legacy
  workflow-state aliases and invented answers, and keeps applicability a
  separate field.
- The registry remains lifecycle `candidate`; this implementation does not
  accept POL-009 or authorize POL-010 and must return through REVIEW_GATE.
