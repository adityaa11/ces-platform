# CES Atlas Redesign Ticket-Set Review - Commit e47bc8b

## Review scope

- Repository: `adityaa11/ces-platform`
- Branch: `worker1`
- Reviewed commit: `e47bc8b5aa027073c11ea11b5bd9fadcdd250f93`
- Commit message: `docs(atlas): define redesign delivery tickets`
- Authority-publication parent: `9faf762bae324d7aaa67b88528b50a25508e70f5`
- Review pass: Round 1 - blocker discovery
- Governing process: `project's goal/feedback/README.md`
- Governing authority: accepted ATLAS-REDESIGN-000 and its pinned UI Gate
  context/prototype
- Reviewed ticket set: ATLAS-REDESIGN-001 through ATLAS-REDESIGN-010

## Repository-state verification

Commit `9faf762` correctly performs the accepted REDESIGN-000 authority
publication:

- REDESIGN-000 status is `Accepted`.
- Round 2 closure and terminal outcome `ACCEPTED` are recorded.
- The pinned UI Manual Gate Context and renewed prototype are active product
  rails.
- The accepted REDESIGN plan is active authority.
- POL-010 remains deferred until REDESIGN-009 receives an accepting terminal
  outcome.

Commit `e47bc8b` creates:

- REDESIGN-001 through REDESIGN-010;
- the active Atlas redesign delivery-plan README; and
- links from the greenfield and Atlas V2 plans to the detailed delivery
  sequence.

The ticket sequence preserves the accepted product direction, but the detailed
tickets need one bounded remediation pass before implementation starts.

## Round 1 findings

### ATLAS-REDESIGN-R1-BLOCKER-01

**Classification:** BLOCKER

**Exact ticket section:** REDESIGN-002, `Outcome`, `Required contract`, and
`Acceptance`

**Concrete problem:**

Source accounting begins with material statements that were already found, but
it does not define a governed boundary proving that all source content was
inspected.

A material statement omitted during extraction would never enter the inventory.
The disposition totals could still reconcile even though source knowledge
silently disappeared.

**Evidence or conflicting authority:**

The accepted UI Manual Gate requires:

```text
No material source statement silently disappears.
```

REDESIGN-002 currently requires an equation equivalent to:

```text
Statements found = all disposition categories
```

That equation proves disposition completeness only after extraction. It does
not prove source coverage or material-statement discovery completeness.

**Smallest necessary correction:**

Extend REDESIGN-002 with:

- stable source-unit inventory;
- deterministic processed/unprocessed state;
- governed material/non-material decision;
- mandatory reason and evidence for non-material classification;
- extraction-failure disposition for source units that could not be evaluated;
- reconciliation from source units to statements; and
- reconciliation from statements to dispositions.

**Acceptance test affected:**

- Every material statement has exactly one current disposition.
- Totals reconcile for every document revision.
- Nothing material silently disappears.

### ATLAS-REDESIGN-R1-BLOCKER-02

**Classification:** BLOCKER

**Exact ticket section:** REDESIGN-010, `Depends on`, `Outcome`, `Acceptance`,
and `Manual verification`

**Concrete problem:**

The minimum acceptance boundary is internally contradictory.

REDESIGN-010 may begin after POL-010, but POL-010 only supplies the accepted
Atlas fact-input boundary. It does not produce policy applicability, binding,
rationale, or a policy conclusion.

However, REDESIGN-010 manual verification requires the owner to open an actual
CES result and trace it to an approved Atlas trigger.

The ticket simultaneously allows later POL capabilities to remain unavailable
and requires a result that cannot exist with POL-010 alone.

**Evidence or conflicting authority:**

The accepted UI mapping assigns:

- POL-010: consumed Atlas project, revision, facts, and provenance;
- POL-011: policy bindings and applicability;
- POL-012 and beyond: result states, reasoning, provenance, baselines, and
  publication.

**Smallest necessary correction:**

Define the exact first deliverable:

- With POL-010 only, show consumed Atlas authority, revision, facts, provenance,
  and honest result unavailability.
- Move actual conclusion tracing to a named successor slice activated by the
  first accepted POL contract that supplies a policy result; or
- Require that minimum POL dependency before REDESIGN-010 can receive terminal
  acceptance.

Do not fabricate a result merely to satisfy the manual test.

**Acceptance test affected:**

- Buyer-readable conclusions are traceable to governed policy rules.
- The owner can open and trace a CES result.
- Unimplemented POL capabilities remain honestly unavailable.

### ATLAS-REDESIGN-R1-BLOCKER-03

**Classification:** BLOCKER

**Exact ticket section:** REDESIGN-001, status and
`Review evidence and stopping condition`

**Concrete problem:**

REDESIGN-001 says `Ready for implementation` before its Round 1 readiness
review has closed.

The ticket is a `REVIEW_GATE`, introduces canonical accumulated-project
authority, and has no recorded candidate revision, Round 1 findings, or
readiness outcome.

**Evidence or conflicting authority:**

The accepted bounded protocol requires authority-producing work to remain
non-operational until its review gate is accepted. This review found unresolved
blockers in the downstream contract set.

**Smallest necessary correction:**

Change REDESIGN-001 to a review-pending state and record:

- candidate ticket-definition commit `e47bc8b`;
- these Round 1 findings;
- remediation commit;
- Round 2 closure; and
- readiness result.

This does not undo REDESIGN-000 acceptance. It only prevents implementation
from starting before the detailed ticket set closes readiness review.

**Acceptance test affected:**

Authority sequencing and prevention of unreviewed contract implementation.

### ATLAS-REDESIGN-R1-IMPORTANT-01

**Classification:** IMPORTANT

**Exact ticket section:** REDESIGN-000, `Required bounded vertical-slice plan`,
and each new ticket's `Review evidence and stopping condition`

**Concrete problem:**

The accepted parent gate requires every slice to include:

- semantic contract;
- API or projection contract;
- production UI behavior;
- Safara evidence;
- structurally different evidence where required;
- automated tests and production build evidence;
- manual verification;
- commit provenance; and
- terminal outcome.

The detailed tickets preserve most of these requirements, but not consistently.
For example:

- REDESIGN-002 does not explicitly require production UI and build evidence.
- REDESIGN-003 does not explicitly name automated and production-build gates.
- REDESIGN-005 does not explicitly require automated tests and build evidence.
- REDESIGN-007 does not name Safara and structurally different qualification.
- REDESIGN-008 does not explicitly require Safara and non-Safara evidence.

**Smallest necessary correction:**

Add one inherited evidence contract to the redesign README and have every ticket
explicitly adopt it, with ticket-specific additions where necessary.

A BATCHABLE ticket may consume an accepted semantic contract instead of
creating a new one, but it must still identify the contract it implements.

**Acceptance test affected:**

Objective per-slice qualification and consistent terminal review evidence.

### ATLAS-REDESIGN-R1-IMPORTANT-02

**Classification:** IMPORTANT

**Exact ticket section:** REDESIGN-001, `Required contract`, and REDESIGN-005,
`Required contract`

**Concrete problem:**

REDESIGN-001 introduces contribution roles:

```text
establishment, clarification, expansion, change, contradiction, supersession
```

REDESIGN-005 separately introduces change classifications:

```text
established, clarified, expanded, changed, contradicted, unresolved, superseded
```

The relationship between these two vocabularies is not defined.
Implementations could create two competing enums with different lifecycle
behavior.

**Smallest necessary correction:**

State explicitly whether:

- REDESIGN-005 reuses the REDESIGN-001 contribution role;
- REDESIGN-005 derives a separate change classification from one or more
  contribution records; or
- one canonical vocabulary governs both.

If they remain separate, define the mapping, ownership, and cases where one
contribution produces multiple change entries.

**Acceptance test affected:**

Deterministic Changes Done entries and consistent contribution history.

## Confirmed correct and frozen

The following parts do not require correction:

- REDESIGN-000 acceptance publication in `9faf762`.
- UI context and prototype authority activation.
- The ten-ticket dependency order.
- REDESIGN-009 as the final Atlas authority and POL-010 unblock gate.
- REDESIGN-010 remaining downstream of POL-010.
- The absence of circular Atlas/POL dependency.
- Existing UI replacement rather than extension.
- Backend ownership of semantics, accounting, topology, review eligibility, and
  policy applicability.
- Honest CES unavailable states before the necessary POL capabilities exist.
- Safara remaining qualification evidence rather than production hardcoding.
- The BATCHABLE stop-and-promote rule in REDESIGN-004 and REDESIGN-008.

These decisions must not be reopened during remediation unless a correction
produces a direct contradiction.

## Round 1 outcome

```text
NOT ACCEPTED
```

This outcome applies to implementation readiness of the detailed REDESIGN-001
through REDESIGN-010 ticket set. It does not reopen or reject the already
accepted REDESIGN-000 product direction.

## Permitted remediation scope

Remediation is limited to:

1. Make REDESIGN-002 source coverage prove discovery completeness, not only
   post-extraction disposition completeness.
2. Make REDESIGN-010's minimum POL-dependent acceptance boundary executable.
3. Correct REDESIGN-001 readiness status and record review provenance.
4. Apply the accepted per-slice evidence contract consistently.
5. Define the contribution-role/change-classification relationship.

Round 2 must verify only these corrections and regressions directly caused by
them. It must not repeat broad product discovery, redesign the accepted
sequence, or introduce unrelated preferences.
