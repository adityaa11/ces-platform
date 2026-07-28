# Atlas Multi-Domain Qualification Plan

**Status:** Planned after Safara lifecycle qualification
**Claim boundary:** Safara passing does not satisfy this gate.

## Required domains

- retail ordering;
- financial approval;
- healthcare scheduling;
- warehouse operations;
- employee leave approval;
- subscription billing;
- customer-support escalation.

Each reviewed oracle must use the same production contracts without
domain-specific extraction code and must include different vocabulary, actors,
states, calculations, approval boundaries, and graph shapes.

## Minimum acceptance

- every domain preserves source-grounded unknown semantics;
- every domain reaches at least 90% normative recall before review and 100%
  reviewed coverage;
- zero unsupported or materially distorted approved records;
- all ambiguities and conflicts are surfaced;
- linear, branch/join, parallel, cyclic, optional, and actor-lane shapes are
  represented across the suite;
- taxonomy extensions require no unrelated extractor changes;
- identical accepted results and configuration produce deterministic artifacts;
- production packages import no qualification oracle;
- only approved models enable downstream execution.

General domain-coverage claims remain blocked until every reviewed domain oracle
and the aggregated cross-domain report pass.
