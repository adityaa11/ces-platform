# CES-GF-POL-000 - Source Glossary Governance

**Status:** Accepted
**Depends on:** POL-001

## Outcome

Establish the permanent governance contract for deciding which external
sources CES Policies recognizes, the roles they may serve, whether and how
they may be machine processed, and how an accepted source-set change is
carried into downstream baselines without rewriting history.

## Scope

- Define governed source admission, classification, reclassification,
  removal, retirement, and revision-history decisions.
- Require an explicit source role and lifecycle state for every governed
  source.
- Distinguish machine-processable knowledge sources, evaluation sources, and
  reference or alignment targets.
- Govern usage-rights evidence and separate authorization for machine
  processing, structured extraction, and AI-assisted analysis.
- Require release identity, provenance, decision rationale, approval evidence,
  and any third-party-content or attribution conditions.
- Define revision records such as `POL-000-R01` as the mechanism for changing
  an accepted source strategy.
- Require each revision to declare its affected frozen contexts, accepted
  tickets, source records, update-detection behavior, and extraction gates.
- Preserve superseded source strategies and their provenance as historical
  records.
- Keep downstream work blocked until its governing revision and required
  reconciliations have received terminal review outcomes that permit it.

## Acceptance contract

### AC-01 - Governed decisions are complete

The contract governs source admission, classification, reclassification,
removal, retirement, and revision history without embedding a particular
source-set decision.

### AC-02 - Source roles are distinguishable

CES can unambiguously distinguish a source that contributes to the active
machine-processable corpus from an evaluation source and a reference or
alignment-only target.

### AC-03 - Processing authority is explicit

Machine processing, structured extraction, and AI-assisted analysis each have
an explicit evidence-backed authorization state. Missing or insufficient
evidence fails closed and cannot be inferred from source availability.

### AC-04 - Rights evidence is traceable

Every authorization decision cites authoritative evidence for the applicable
release, usage rights, third-party-content caveats, and attribution conditions.

### AC-05 - Revisions are governed records

A source-strategy change is proposed through a uniquely identified revision
record with its rationale, before/after state, evidence, downstream impact,
and review outcome. POL-000 itself remains generic.

### AC-06 - History is immutable

An accepted revision produces a new baseline lineage. It does not silently
rewrite the frozen context, prior source records, or earlier acceptance
evidence.

### AC-07 - Downstream impact is bounded

Each revision identifies the accepted artifacts it affects and the exact
reconciliation and unblock conditions. Unaffected artifacts are not redesigned
merely because the source strategy changed.

### AC-08 - Review vocabulary remains frozen

Ticket reviews terminate only as `ACCEPTED`, `NOT ACCEPTED`, or
`ACCEPTED WITH DEFERRED ITEMS`. Descriptive document-status labels do not
become additional terminal outcomes.

### AC-09 - Authority boundaries are preserved

Source mappings and alignment evidence do not establish equivalence,
compliance, or certification. A reference target is not an extraction source
unless separately authorized through governance.

### AC-10 - Current downstream gate is visible

POL-006 remains blocked until the applicable source-strategy revision is
accepted, a successor frozen context is published, and all required upstream
source contracts are reconciled.

## Required revision record

Every `POL-000-Rxx` revision must contain at least:

- revision identity and status;
- trigger and decision rationale;
- previous and proposed source classifications;
- exact source and release identities;
- processing-authorization states and authoritative evidence;
- third-party-content and attribution conditions;
- explicit non-equivalence and compliance boundaries where applicable;
- downstream impact and reconciliation requirements;
- baseline lineage and activation conditions;
- review findings, deferred-item ledger references, and terminal outcome.

An accepted revision authorizes only the stated governance change. It does not
perform downstream extraction or silently activate unreconciled records.

## Explicit non-goals

- Selecting, admitting, removing, or reclassifying a concrete source.
- Deciding the current ISO/NIST proposal; that belongs to POL-000-R01.
- Extracting or canonicalizing source vocabulary.
- Defining canonical Policies, Concerns, or Capability Needs.
- Selecting architecture, stack, or implementation mechanisms.
- Implementing source adapters, update detection, policy reasoning, or Atlas
  integration.
- Claiming standards equivalence, compliance, certification, or a complete
  organizational management system.

## Review focus

Round 1 is limited to the completeness and consistency of this reusable source
governance contract, its frozen CES boundaries, and its acceptance criteria.
It must not review the merits of the concrete POL-000-R01 source proposal.

Round 2 is closure-only under the frozen bounded review protocol.

## Acceptance evidence

- Commit `e0f6d98` introduced the generic source-governance contract and the
  explicit POL-006 governance gate.
- Review result: `ACCEPTED`.
