# Atlas Hardened Live Pipeline Status

**Status:** Partially integrated; qualification remains blocked

## Live stages

`atlas run` now executes:

1. five bounded extraction focuses covering broad discovery, rules and
   permissions, calculations and states, reporting and audit, and acceptance
   and deliverables;
2. deterministic cross-pass identity normalization and exact semantic
   deduplication;
3. canonical line-level PDF source units;
4. source-to-candidate, record, workflow, and graph coverage;
5. blocking completeness findings for every uncovered normative source unit;
6. one finding-scoped retry over only uncovered document line ranges;
7. non-authoritative proposed model and pre-approval graph publication.

Category calls use concurrency two to respect bridge/provider admission limits.
Provider failure remains non-success and does not publish partial output.

## Safara observations

- The first four-pass live run produced 33 requirements and 22 rules, compared
  with 8 requirements and 15 rules from the previous single pass.
- Adding the acceptance/deliverable pass represented the final coarse
  acceptance block.
- Line-level source segmentation correctly invalidated the earlier page-level
  coverage result: the stored live candidate set leaves 115 of 376 normative
  line units uncovered. Those omissions are now blocking findings rather than
  silent success.
- The next tightened live attempt received Gemini HTTP 429; bounded
  concurrency was reduced from four to two afterward.

## Remaining boundary

The bridge still returns the legacy `candidate_requirements` and
`candidate_business_rules` provider schema. Consequently, canonical semantic
kinds such as calculation, terminology, acceptance scenario, reporting,
state-definition, and operational procedure may still be represented only
through a lossy compatibility projection.

Safara qualification and general-domain claims remain blocked until the bridge
emits the generic `AtlasCandidate` contract directly, category classifications
are lossless or explicitly review-required, and a redacted live run satisfies
the stored oracle and human review gates.
