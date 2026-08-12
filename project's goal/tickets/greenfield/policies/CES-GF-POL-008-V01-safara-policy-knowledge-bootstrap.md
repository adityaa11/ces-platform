# CES-GF-POL-008-V01 - Safara Policy Knowledge Bootstrap

**Status:** Implemented first coverage result; pending REVIEW_GATE review

**Review class:** REVIEW_GATE

**Depends on:** Accepted POL-016-V01-I01, implemented POL-016-V01-I02, and the
available POL-008 candidate taxonomy

## Outcome

Use the complete human-reconciled Safara golden facts as the first demand-side
probe of candidate CES Policy knowledge before POL-008 receives final human
semantic approval.

This is an early knowledge-bootstrap gate. It is not the later POL-016-V01
validation of the completed Policies subsystem.

## Scope

- Evaluate all 111 accepted manual Safara facts against the current governed
  raw vocabulary, approved canonical vocabulary, and candidate Policy taxonomy.
- Produce a deterministic fact-by-fact coverage matrix retaining manual fact
  identity and exact PDF provenance.
- Give every fact exactly one governed disposition:
  `AWARENESS_EMITTED`, `NO_SECURITY_AWARENESS_REQUIRED`,
  `OUTSIDE_SOFTWARE_SCOPE`, `DECISION_REQUIRED`, or
  `SOURCE_OR_POLICY_GAP`.
- For `SOURCE_OR_POLICY_GAP`, record one diagnostic route:
  `POLICY_GAP`, `CANONICALIZATION_GAP`, `EXTRACTION_GAP`, or `SOURCE_GAP`.
- Treat `BUSINESS_RULE_ONLY` and `NO_POLICY_REQUIRED`, when useful, as rationale
  beneath `NO_SECURITY_AWARENESS_REQUIRED`, not additional dispositions.
- Route authority changes through targeted governed successors rather than
  mutating accepted POL-006 or POL-007 artifacts.
- Re-run the pinned coverage evaluation after accepted successors are
  published.

## Acceptance contract

- All 111 facts are present exactly once in the coverage matrix.
- Candidate knowledge may explain a proposal but cannot be counted as approved
  authoritative coverage.
- Every non-emitting result includes reviewable rationale; silence is not a
  disposition.
- Every awareness result traces through candidate or approved Policy support,
  canonical/raw lineage, governed source release, and exact source locator.
- Every gap identifies the earliest incomplete governed knowledge layer.
- Accepted POL-006 and POL-007 artifacts change only through explicit successor
  tickets with preserved predecessor identity and provenance.
- The cycle is deterministic for the pinned inventory hash, knowledge
  revisions, candidate taxonomy revision, and evaluator version.
- The gate may conclude only when every fact is accounted for and no
  unexplained `SOURCE_OR_POLICY_GAP` remains.
- `DECISION_REQUIRED` remains an accounted-for result and is not eliminated by
  inventing missing business, legal, organizational, or architectural truth.
- Review follows the bounded review protocol and ends in `ACCEPTED`,
  `NOT ACCEPTED`, or `ACCEPTED WITH DEFERRED ITEMS`.

## Bounded iteration rule

One review round evaluates one pinned coverage result. A finding that requires
new shared CES authority creates a targeted successor REVIEW_GATE. After that
successor is accepted, a new explicitly versioned coverage result may be
generated. It does not silently rewrite the earlier result or extend one review
round indefinitely.

For the pinned Safara inventory, the bootstrap cycle ends when all facts have a
governed disposition and every knowledge gap is resolved by accepted successor
knowledge or an explicit governed deferred/out-of-scope decision. A later PRD
starts a separate cycle and does not reopen this historical result.

## Downstream gate

POL-008 must not receive final semantic approval as a sufficiently qualified
taxonomy until this REVIEW_GATE receives an accepting terminal result. POL-009
must not start until the resulting POL-008 taxonomy is accepted.

## Explicit non-goals

- Treating Safara facts as security authority.
- Creating Safara-specific Policies.
- Approving Atlas or producing production Context Bindings.
- Replacing later POL-016 cross-domain qualification or POL-016-V01 complete
  Atlas-backed validation.
- Architecture, stack, implementation, scoring, or UI decisions.

## First coverage-result evidence

- Evaluator package: `@company/ces-policy-safara-bootstrap`
- Evaluator version: `1.0.0`
- Manual inventory SHA-256:
  `b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2`
- Raw corpus: `ces-policies.raw-vocabulary.representative-v1-1`
- Approved canonical vocabulary revision: `1.1.0`
- Candidate taxonomy revision: `1.0.0`
- Candidate authority: `false`
- Proposed deterministic result SHA-256:
  `0fa60c21a449dd43f1c24dcf5a3fcd5a5037982333d627378aeb721dd953945e`

The first proposed result accounts for all 111 facts:

- 77 `AWARENESS_EMITTED`, all explicitly `candidate_only`;
- 24 `NO_SECURITY_AWARENESS_REQUIRED`;
- 5 `OUTSIDE_SOFTWARE_SCOPE`;
- 5 `SOURCE_OR_POLICY_GAP`: one `CANONICALIZATION_GAP` with existing raw
  support and four `EXTRACTION_GAP` proposals with closer governed-source
  candidates absent from the representative raw corpus.

The REVIEW_GATE decides whether each individual classification and support
mapping is semantically correct. These counts and gaps are proposed evidence,
not accepted shared CES knowledge. No POL-006, POL-007, or POL-008 artifact is
mutated by this result.

Round 2 remediation makes every disposition an explicit, mutually exclusive
fact-ID assignment whose union is the exact 111-fact input. There is no default
non-awareness outcome; an unclassified or unknown ID fails closed. Every
coverage entry now embeds its page, exact buyer wording, source hash, inventory
hash, extraction method, and manual provenance.

The prior thirteen `raw.asvs.v14-2-1` mappings were removed because that raw
concept is narrowly about URL/query-string and HTTP message placement. Nine
functional, reporting, format, or delivery facts now have explicit
`NO_SECURITY_AWARENESS_REQUIRED` dispositions. Four facts have individual
`EXTRACTION_GAP` proposals:

- `0024`, `0035`, and `0045` cite governed ASVS `V14.1.1` as a closer
  sensitive-data identification/classification candidate;
- `0027` cites governed ASVS `V14.2.6` as the closer minimum-data/UI-masking
  candidate.

These locators are source-level candidates for a later targeted POL-006
successor REVIEW_GATE; this evaluator does not add them to the accepted raw
corpus. Fact `0016` remains a `CANONICALIZATION_GAP` supported by already
extracted `raw.asvs.v2-3-1`.
