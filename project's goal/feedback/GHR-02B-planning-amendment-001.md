# Planning amendment: GHR-02B

## Decision

- **Operator decision:** `AUTHORIZE_BOUNDED_PLANNING_AMENDMENT`
- **Operator decision ID:** `GHR-02B-PLANNING-AMENDMENT-001`
- **Invocation:** explicit user planning authorization on 2026-10-24.
- **Disposition:** append-only amendment to the active GHR-02B Review Contract.
- **Scope:** only the clone-only normal project-card/PDF validation portion of
  historical `CK-001.a`; no implementation, product, or downstream ownership
  change.

This amendment records the user's planning decision. It does not rewrite the
ticket, GO checkpoint, or historical CK review; it does not authorize CFC,
GO, Bridge consumption, receipt/lease state, semantic work, or a new database
write.

## Authority and historical record

1. Frozen ticket: [GHR-02B atomic NDV1 acceptance and pg-boss publication](../Backend_Phase/tickets/GHR_Phase/GHR-02B-atomic-ndv1-acceptance-and-pg-boss-publication.md).
2. GO checkpoint: [GHR-02B GO checkpoint](GHR-02B-go-checkpoint.md).
3. Historical CK result: [GHR-02B CK review](GHR-02B-dde68c56-review.md),
   `CHANGES_REQUIRED` for `CK-001.a`.
4. Reviewed implementation commit: `dde68c561b0c2e189f8543ad6d9adeed3644045b`.

The historical `CK-001.a` outcome remains visible and unchanged. RC-02 through
RC-05 remain proven and protected.

## Exact historical requirement being superseded

Only the following clone-exclusive portions of the frozen **Required real-source
validation environment** and `GHR-02B-RC-01` are superseded for effective
acceptance:

1. The requirement to run the fresh signed-in normal project-card creation
   using a `docs/example/` PDF in an isolated logical clone.
2. The requirement that the normal project-card/PDF route's commit proof and
   injected-failure rollback proof both be obtained through that clone's full
   Atlas/Docling runtime.

The user-authorized supersession reason is precise: the clone-only Atlas dev
server never opened its port. Reproducing the normal route there would require
more than PostgreSQL—specifically the full Atlas/Docling runtime—and is not a
feasible Codex qualification step in this environment.

## Effective replacement requirements

The following replaces only the superseded clone-exclusive evidence:

1. The positive fresh normal-path proof is a signed-in, normal project-card
   upload of a `docs/example/` PDF in the running canonical Compose project
   `atlas-canonical-perception`, performed under the user's explicit
   canonical-write authorization. The run must yield a fresh accepted
   project/workspace/bundle/document/execution and exactly one GHR-02A intent
   plus one pointer-only `GenericHandoffJob/v1` job, verified from PostgreSQL
   and pg-boss.
2. Atomic injected-failure rollback remains required, but the existing
   protected PostgreSQL clone integration is the effective proof for that
   transaction-only condition. It must show no committed accepted state,
   intent, or job after the controlled failure.

The replacement evidence is already recorded in the GO checkpoint: canonical
project `ghr-02b-canonical-20261024`, its fresh accepted lifecycle facts, one
immutable intent, one pointer-only job, and the protected-clone rollback test
pass. The canonical proof is authorized evidence, not a new runtime or
architecture requirement.

## Unaffected obligations

The amendment does not weaken or supersede any of the following:

- the same-transaction acceptance, intent, and pointer-job invariants;
- GHR-02A's sole issuer/policy/header/body authority;
- replay/restart singleton deduplication;
- pointer-only queue metadata and the no-consumer boundary;
- zero receiver/ACK/resolver/planner/BSS/SEM/provider/reconciliation/projection
  effects; or
- the protected clone's direct transaction rollback assertion.

All other ticket, security, boundary, validation, and direct-regression
obligations remain active.

## Workflow handoff

This is a planning amendment, not a CK PASS record. The next independent CK
action must append a replacement-contract freeze that maps historical
`CK-001.a` to a distinct replacement clause, preserves the historical finding,
and verifies only the replacement evidence plus the already active
non-superseded obligations. No CFC cycle is authorized by this amendment.

## Final planning decision

`GHR-02B-PLANNING-AMENDMENT-001` retires the impossible clone-only full
Atlas/Docling normal-path condition and supersedes it with the existing
user-authorized canonical signed-in project-card/PDF evidence, while retaining
the protected-clone transaction rollback proof and every unrelated GHR-02B
obligation.
