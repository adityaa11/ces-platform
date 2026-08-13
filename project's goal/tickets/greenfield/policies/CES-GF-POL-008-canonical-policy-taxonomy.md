# CES-GF-POL-008 - Canonical Policy Taxonomy

**Status:** Ready for final REVIEW_GATE implementation
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-007-R02 canonical vocabulary revision 1.5.0;
accepted bounded POL-008-R01 and POL-008-R02 decision publications; accepted
POL-008-V01 Coverage V4 publication; accepted AGB-014
**Blocks:** POL-009

## Outcome

Derive and approve a small set of broad, enduring CES Policy obligations from
the canonical vocabulary.

## Scope

- Final comparison and human semantic approval of the exact candidate taxonomy
  revision `1.2.0` produced by the accepted bounded decisions.
- Technology-independence and WHAT-not-HOW tests for every candidate.
- Clear separation of policies from concerns, capability needs, tests, and
  business rules.
- Versioned rationale and supporting canonical-concept mappings.

## Acceptance contract

- Every policy passes the technology-independence test.
- Every policy is supported by approved canonical concepts.
- Concerns such as replay or lost update are not promoted automatically.
- No policy names a vendor, framework, data store, protocol, or implementation
  technique.
- Cross-source overlap is consolidated unless meanings materially differ.
- Final semantic approval is bounded to the exact six-Policy candidate taxonomy
  revision `1.2.0`, pinned to approved canonical vocabulary revision `1.5.0`.
- The candidate must contain exactly the four original Policies plus the
  accepted sequential-business-flow and sensitive-data-protection additions;
  no Policy identity, obligation, support mapping, or decision rationale may
  change during final approval.
- The final gate must bind the accepted POL-008-R01, POL-008-R02, POL-008-V01,
  and AGB-014 evidence and verify that no material Safara fact remains a source
  or Policy gap.
- Before an accepting terminal human outcome, implementation may create only a
  content-addressed final-approval candidate; taxonomy and Policy lifecycle
  remain `candidate`/`proposed`, POL-008 remains unapproved, and POL-009 remains
  blocked.
- Only a separately recorded accepting terminal outcome may authorize an
  immutable approved successor publication. That publication must preserve the
  reviewed candidate semantics exactly, use taxonomy revision `1.3.0` with
  predecessor revision `1.2.0`, mark all six Policies and the taxonomy approved,
  attach genuine human review provenance, and identify itself as final POL-008
  authority.
- `NOT ACCEPTED` publishes no successor. `ACCEPTED WITH DEFERRED ITEMS` may
  publish final authority only when every deferred item is explicitly
  non-blocking to the frozen POL-008 acceptance contract.

## Explicit non-goals

- Project-specific applicability or Atlas context binding.
- Freezing the full runtime schema, reasoning prompt, or implementation advice.
- Optimizing for a large number of policies.
- Reopening accepted bounded R01/R02 semantics, introducing Safara-specific
  Policy wording, granting project applicability, or starting POL-009 before
  final POL-008 acceptance is durably published.

## Implementation evidence

- `@company/ces-policy-taxonomy` defines a versioned, renderer-neutral
  six-Policy candidate taxonomy revision `1.2.0`, pinned to approved canonical
  vocabulary revision `1.5.0`.
- Four original obligations cover authorization, security-event traceability,
  trustworthy recovery, and transaction integrity. Accepted bounded successors
  add sequential-business-flow integrity and consolidated sensitive-data
  protection without altering predecessor meaning.
- Validation permits only approved canonical `obligation` concepts as Policy
  support; concerns and verification contexts cannot be promoted implicitly.
- Every candidate records WHAT-not-HOW evidence and rejects prohibited
  technology matches.
- Candidate approval fails closed without genuine human review evidence.
- Policy lineage exposes every contributing canonical mapping, raw concept,
  source release, and exact locator; consolidation does not discard sources.
- POL-008-R01 and POL-008-R02 accepted their bounded decisions without claiming
  final taxonomy authority. POL-008-V01 accepted the complete Safara Coverage
  V4 bootstrap with 111 accounted facts and no unresolved knowledge gaps.
- AGB-014 acceptance at `d19166f` proves the production registered-agent replay
  path and closes the procedural block on resuming this final gate.

## Required implementation and review artifacts

1. A deterministic final-approval candidate manifest that hashes the exact
   taxonomy `1.2.0`, all six Policies, canonical support, accepted bounded
   decision publications, Coverage V4 publication, and AGB-014 closure evidence.
2. Fail-closed validation rejecting stale revisions, changed Policy semantics,
   incomplete lineage, missing gate evidence, invented approval, or premature
   POL-009 authorization.
3. A REVIEW_GATE handoff that asks the human reviewer to approve or reject the
   exact six enduring obligations and their consolidation boundaries.
4. After—and only after—an accepting terminal outcome, an immutable final
   POL-008 publication and approved taxonomy successor carrying the exact review
   provenance.

The implementation commit for items 1-3 remains non-authoritative and requires
independent review. Item 4 belongs to a closure commit after that review; this
ticket cannot self-approve it.

## Final gate implementation candidate

- `packages/policy-taxonomy/src/final-approval.ts` now defines and exports the
  deterministic `CES_POLICY_FINAL_APPROVAL_CANDIDATE_V1` manifest and
  `CES_POLICY_FINAL_APPROVAL_REVIEW_HANDOFF_V1` payload.
- The manifest embeds the exact candidate taxonomy `1.2.0`, both accepted
  bounded decision publications, accepted Coverage V4 evidence, and accepted
  AGB-014 closure evidence under one verified content hash.
- Validation rejects any mutation to taxonomy semantics, decisions, evidence,
  lifecycle, downstream authority, or the content hash.
- The handoff exposes only the three frozen terminal outcomes and asks the
  reviewer to decide the six obligations, consolidation boundaries, and exact
  lineage/gate evidence. It cannot publish a successor and requires a separate
  closure commit.
- No approved `1.3.0` artifact exists in this implementation candidate;
  POL-008 remains unapproved and POL-009 remains blocked.

## Round 1 remediation

- `REQUIRED-01` fixed: Coverage V4 and AGB-014 now bind exact publication
  identities, terminal outcomes, reviewed commits, artifact/publication hashes,
  committed evidence paths, and SHA-256 hashes of the actual review artifacts.
  Resolution uses a closed accepted-evidence registry and fails for altered,
  missing, mismatched, or merely self-consistent invented evidence.
- The prerequisite review artifacts are committed with this remediation so the
  recorded paths and content hashes resolve durably from the repository.
- `REQUIRED-02` fixed: all three semantic review questions are exact schema
  literals. Changed wording fails even when a producer recomputes the handoff
  hash.
- Negative coverage exercises altered publication content, artifact hash,
  nonexistent evidence, reviewed commit, terminal outcome, invented metadata,
  and recomputed-question hashes.
- Taxonomy and Policy lifecycle remain candidate/proposed; no `1.3.0`
  publication exists, final POL-008 authority remains false, and POL-009 stays
  blocked.

## Round 2 evidence-resolution remediation

- The two prerequisite acceptances are now durable, schema-validated JSON
  artifacts under `packages/policy-taxonomy/governance/`, rather than inline
  publication metadata constructed by the candidate implementation.
- `final-approval-loader.ts` is the build-time filesystem boundary. It reads and
  validates both publication artifacts, resolves each committed review path,
  hashes the actual publication and evidence bytes, and only then creates the
  non-authoritative candidate and handoff.
- Runtime candidate and handoff schemas remain filesystem-independent and
  consume only evidence marked `resolved` by the loader.
- Temporary-fixture tests fail for absent or modified evidence, absent or
  changed publications, and internally consistent unregistered publication
  metadata. The repository test proves the real committed artifacts resolve.
- The earlier frozen-question correction remains intact. POL-008 authority is
  still false, taxonomy `1.3.0` is still unpublished, and POL-009 remains
  blocked.

## Round 3 loader-bypass remediation

- The raw `./final-approval` subpath is removed from the package export map.
  Its schemas and constructors are internal implementation details used only by
  the governed loader; callers cannot import a constructor that accepts an
  asserted `resolution_status`.
- The only public final-gate construction API is
  `loadFinalPolicyTaxonomyGate()`. Its prerequisite schema is also private, so
  public callers must pass through publication-lock and actual-byte resolution.
- An API-surface test constructs plausible fabricated `resolved` evidence and
  proves that neither a candidate nor handoff constructor is publicly exposed.
- POL-008 remains unapproved, taxonomy `1.3.0` remains unpublished, and POL-009
  remains blocked.
