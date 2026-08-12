# CES-GF-POL-016-V01-I02 - Manual Policy Demand Adapter

**Status:** Implemented; pending BATCHABLE review

**Review class:** BATCHABLE

**Depends on:** Accepted POL-016-V01-I01

## Outcome

Allow the approved manual Safara golden fixture to feed the first CES Policy
development coverage cycle through a validated, qualification-only
`PolicyDemandFact` adapter.

This is a preparatory bootstrap implementation executed before POL-009 and
reused later by formal POL-016-V01 validation. Its historical identifier does
not indicate mainline execution has reached POL-016.

## Scope

- Define a machine-readable schema for the approved manual fixture.
- Validate the source manifest, inventory, and human review record.
- Verify the pinned PDF hash and accepted inventory hash.
- Reject duplicate or malformed IDs, unknown categories, invalid pages, empty
  source statements, unsupported extraction methods, and Atlas-authority claims.
- Map each accepted manual record into a neutral `PolicyDemandFact` while
  preserving its stable manual ID, normalized statement, exact PDF quotation,
  page locator, category, and manual provenance.
- Keep the manual adapter outside every production Policies entry point.

## Acceptance contract

- Validation fails closed for every malformed condition listed in scope.
- The adapter accepts only a human-review record that pins the exact inventory
  hash with an allowed accepting terminal outcome.
- Mapping is deterministic for the same source manifest, inventory, review
  record, and adapter version.
- The output contains no fabricated Atlas project, revision, fact, evidence, or
  approval identity.
- Production Context Binding creation rejects manual demand-fact provenance.
- Final POL-016-V01 evidence still requires semantic reconciliation to an
  approved, revision-pinned Atlas fact set.
- Focused tests cover positive mapping and every fail-closed boundary.

## Promotion rule

This ticket implements accepted I01 authority. If implementation requires a
new `PolicyDemandFact` authority contract, changes an accepted Policies or Atlas
boundary, or introduces a new terminal disposition, stop and split or promote
that decision to a dedicated REVIEW_GATE before continuing.

## Explicit non-goals

- Approving or correcting Atlas extraction.
- Treating Safara project facts as security authority.
- Approving the POL-008 taxonomy or a successor Policy proposal.
- Producing production Context Bindings.
- Closing POL-016-V01 or freezing CES Policies v1.1.

## Implementation evidence

- `@company/ces-policy-manual-demand-adapter` defines strict schemas for the
  accepted source manifest, 111-fact inventory, human review record, and
  qualification-local demand facts.
- Loading verifies the exact accepted inventory SHA-256 and pinned Safara PDF
  SHA-256 before mapping any fact.
- Validation rejects duplicate IDs, unknown categories, invalid pages, empty
  source text, unsupported extraction methods, non-accepted review evidence,
  and Atlas-authority claims.
- Deterministic mapping preserves manual fact ID, normalized statement,
  category, page, exact quotation, extraction method, source hash, and
  inventory hash.
- Every output is tagged `manual_golden_fixture` and
  `production_context_binding_eligible: false`; the explicit production
  eligibility guard always rejects it.
- The package has no workspace dependencies and no production package imports
  it, so it does not preempt the later POL-010/POL-011 production contract.
