# CES-GF-POL-008-R02 - Data-Protection Policy Decisions

**Status:** Accepted bounded decision published

**Review class:** REVIEW_GATE

**Depends on:** Approved POL-007-R02 canonical vocabulary revision 1.5.0,
accepted bounded POL-008-R01 decision publication, candidate taxonomy revision
1.1.0, and review-closed POL-008-V01 coverage v3 implementation `e011008`
(POL-008-V01 remains `NOT ACCEPTED`)

## Outcome

Evaluate whether approved canonical obligations
`ces.sensitive-data-classification` and
`ces.sensitive-data-disclosure-minimization` warrant reusable CES Policies,
and publish explicit add, merge, or reject decisions through an immutable
candidate Policy-taxonomy successor.

## Gap evidence

- Coverage v3 result:
  `b78d1be0fa6dcb9cfcfb2b50f0056e1c5e99f07aff011a0d0a71b889d349f98e`.
- Facts `0024`, `0035`, and `0045` route to `POLICY_GAP` with approved
  canonical support `ces.sensitive-data-classification`.
- Fact `0027` routes to `POLICY_GAP` with approved canonical support
  `ces.sensitive-data-disclosure-minimization`.
- Exact raw lineage:
  `raw.asvs.v14-1-1` / `v5.0.0-V14.1.1` and
  `raw.asvs.v14-2-6` / `v5.0.0-V14.2.6` in `owasp.asvs.5-0-0`.
- Earliest incomplete layer: POL-008 Policy taxonomy.

Safara qualifies the need for evaluation but does not dictate Policy count,
wording, structure, or universal applicability.

## Scope

- Compare both approved obligations with every Policy in candidate taxonomy
  revision `1.1.0` and with one another.
- Decide independently and explicitly whether each obligation is added as a
  Policy, merged as support into an existing or combined Policy, or rejected
  from Policy promotion.
- Do not assume either one Policy per canonical concept or one combined Policy
  merely because both meanings concern sensitive data.
- Preserve the distinction between identifying/classifying sensitive data and
  minimizing/masking its disclosure unless a reviewed Policy formulation
  honestly retains both outcomes.
- If adding or merging, retain complete Policy-to-canonical-to-raw ASVS
  lineage for every supporting obligation.
- Require broad, enduring, technology-independent WHAT-not-HOW wording and
  evidence for every new or revised Policy.
- Publish a distinct candidate taxonomy revision with exact predecessor
  revision `1.1.0` and approved canonical vocabulary revision `1.5.0`.
- Preserve every predecessor Policy, approval field, bounded decision
  publication, and lineage unless this ticket explicitly records a governed
  successor decision.

## Acceptance contract

- Each decision cites its approved canonical identity and exact ASVS raw
  identity, release, and locator.
- Add, merge, and reject outcomes require explicit semantic-comparison
  rationale; demand count cannot determine Policy structure.
- Classification meaning remains bounded to identifying sensitive data and
  assigning protection levels that account for applicable requirements.
- Disclosure-minimization meaning remains bounded to returning only necessary
  sensitive data and conditionally masking complete UI values.
- No Policy is broadened into generic privacy compliance, authorization,
  retention, encryption, consent, or implementation prescriptions.
- Policy wording contains no Safara, pilgrim, NIK, passport, payment, health
  document, package, manifest, framework, storage, UI component, or other
  project/implementation terminology.
- Candidate taxonomy and Policies remain non-authoritative during bootstrap;
  this ticket cannot self-approve final POL-008.
- Every support mapping resolves to an approved canonical obligation and its
  accepted raw v1.2 lineage.
- Reject decisions remain explicit and cannot silently erase or mark a gap as
  covered.
- Same-revision mutation, wrong predecessor/canonical revision, unsupported
  support, lost lineage, altered predecessor authority, invented approval, or
  project-specific meaning fail validation.

## Review boundary

Review decides only the Policy-taxonomy treatment of the two approved
data-protection obligations. It does not finally accept POL-008, close
POL-008-V01, approve applicability, or authorize POL-009.

## Explicit non-goals

- Changing approved canonical meanings or raw ASVS extraction.
- Automatically creating two Policies or automatically combining them.
- Defining data inventories, classification schemes, masking mechanics,
  access rules, retention schedules, encryption, UI design, or compliance
  claims.
- Creating Atlas Context Bindings, architecture, stack, or implementation
  decisions.
- Reopening accepted sequential-flow Policy semantics.

## Implementation evidence

- Candidate taxonomy successor: revision `1.2.0`, with exact predecessor
  revision `1.1.0` and approved canonical vocabulary revision `1.5.0`.
- Proposed consolidated addition: `policy.sensitive-data-protection`.
- Independent decisions record `add` for
  `ces.sensitive-data-classification` and `merge` of
  `ces.sensitive-data-disclosure-minimization` support into the same new
  Policy; neither canonical identity nor lineage is collapsed.
- The combined obligation explicitly retains protection-level classification,
  minimum necessary disclosure, and conditional concealment of complete
  values while avoiding mechanical one-concept-per-Policy promotion.
- The new Policy and both decisions remain candidate/proposed without human
  review evidence; final POL-008 authority remains unapproved.
- All five predecessor Policies and their approval fields remain unchanged.
- Focused validation rejects wrong revisions, unsupported support, lost
  predecessor authority, altered meaning, invented approval, and
  project-specific terminology.

## Round 1 remediation

- `REQUIRED-01` fixed with 12 durable semantic-comparison records.
- Each of the two approved obligations is compared independently against all
  five predecessor Policies, recording overlap, decision consequence, and
  rationale.
- The obligations are compared with one another in both directions: their
  meanings remain distinct, while their bounded shared protection domain
  supports coexistence as separate clauses and support mappings in one Policy.
- Comparison evidence is semantic and source-bounded; it does not use Safara
  demand count as the decision basis.
- Missing, duplicate, or altered comparison evidence fails closed.
- Taxonomy revision `1.2.0`, predecessor `1.1.0`, canonical revision `1.5.0`,
  Policy wording, add/merge decisions, lifecycle, and lineage remain unchanged.

## Acceptance publication

- Closure-only Round 2 terminal outcome: `ACCEPTED` for commit
  `10aed9f2d629ec096580ace6d86309ab29ff3926`, following reviewed
  implementation commit `270e59af09d2fce82e7346f90c9700742c19b741`.
- Review evidence: `CES-GF-POL-008-R02-H01`, stored at
  `project's goal/feedback/CES_POLICIES_REVIEW_10aed9f.md`.
- Accepted publication:
  `ces-policy-taxonomy.data-protection-decision.accepted-v1`.
- The publication preserves the exact candidate taxonomy revision `1.2.0`,
  both proposed decisions, and all 12 semantic comparisons. Taxonomy and
  Policy lifecycle remain candidate; this is not final POL-008 approval.
