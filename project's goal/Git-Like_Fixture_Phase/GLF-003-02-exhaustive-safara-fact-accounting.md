# GLF-003-02: Exhaustive Safara fact extraction and source accounting

- **State:** awaiting_review
- **Review batch:** BATCH-19.2
- **Depends on:** GLF-003-01 approved
- **Baseline:** GLF-003; GLF-003-01; Safara Increment 01-03 PRDs; Atlas PRD extraction and verification contracts

## Outcome

Prove, rather than assume, that the GLF-003 fixture contains every material
Safara project fact from the Increment 01-03 PRD sequence. The authoritative
source set is exactly the three incremental PDFs under `docs/PRD/Safara/`;
the consolidated Buyer PRD must not be discovered, cited, or used for coverage.

## Review question

For every material statement in all 11 authoritative PDF pages, can a reviewer
trace one exact destination: an atomic extracted candidate assertion, or a
deliberately non-fact classification with a precise reason?

## Scope

- Create an immutable, page-by-page source statement inventory before creating
  canonical assertions. Each inventory entry has a stable ID, source artifact,
  page, exact quote, statement class, and normalized interpretation.
- Define a material fact as an independently meaningful rule, responsibility,
  constraint, condition, workflow step, data requirement, output, commitment,
  acceptance criterion, or unresolved question.
- Require an atomic candidate assertion for every material fact. A candidate
  may cite supporting context, but cannot silently combine independently
  changing rules into one opaque payload.
- Permit a non-fact classification only for headings, repeated boilerplate,
  visual decoration, or duplicated wording. It must name the matching primary
  statement or give a concrete reason; it is not an escape hatch for a missed
  requirement.
- Build repository, change, projection, and verification outputs from the
  verified extraction result. Do not maintain a separate, manually incomplete
  fixture catalog as the publication authority.

## Acceptance criteria

- The inventory covers exactly Increment 01 (3 pages), Increment 02 (4 pages),
  and Increment 03 (4 pages), for 11 source pages total; no Buyer PRD artifact
  or evidence reference is present.
- Every inventory entry has one—and only one—destination: `candidate_assertion`
  or `non_fact` with a specific reason and any duplicate target.
- Every `candidate_assertion` destination resolves to exactly one candidate ID,
  whose exact quote and page match the inventory source.
- Every accepted assertion, current materialized fact, workflow node, Project
  Facts record, CES record, and chatbot record resolves back to candidate and
  source-inventory IDs.
- The fixture generator fails before publication when an inventory entry lacks
  a destination, a candidate lacks inventory provenance, a material statement
  is marked non-fact without a permitted reason, a source page is omitted, or
  the Buyer PRD appears.
- Regression tests deliberately remove one fact, corrupt one page citation,
  and introduce a Buyer artifact; each case must fail without replacing the
  last valid generated bundle.
- The final review includes a human-readable reconciliation report: counts by
  PDF/page, candidate/non-fact destinations, duplicate links, unresolved
  questions, and the resulting canonical/projected record counts. Counts are
  outputs of the inventory, never a preselected target such as 43 or 45.
- The reconciliation report states its audit boundary: it proves traceability
  and internal consistency of the authored inventory; a human reviewer remains
  responsible for confirming that the inventory contains every material source
  statement.

## Validation

Run the fixture suite, inspect the generated reconciliation report against all
11 source pages, and run the negative publication tests described above.

## Explicit non-goals

- No live provider or Agents Bridge integration.
- No acceptance of extracted candidates as truth without the existing
repository/change/approval boundary.
- No use of the consolidated Buyer PRD as a second source of authority.
