# CES-GF-POL-016-V01-I02 - Manual Policy Demand Adapter

**Status:** Proposed

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
- Test that the available POL-008 candidate taxonomy can be used as coverage
  probe material without being represented as accepted or sufficient.
- Keep the manual adapter outside every production Policies entry point.

## Acceptance contract

- Validation fails closed for every malformed condition listed in scope.
- The adapter accepts only a human-review record that pins the exact inventory
  hash with an allowed accepting terminal outcome.
- Mapping is deterministic for the same source manifest, inventory, review
  record, adapter version, and Policy candidate revision.
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
