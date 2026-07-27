# CES-GF-DAPE-008R — Real-Provider Safara Semantic Validation

**Stage:** Manual release validation
**Status:** Planned

## Objective

Measure real configured-agent semantic quality honestly against the Safara
oracle without making deterministic CI provider-dependent.

## Business and architectural reason

Fixtures prove contracts and orchestration, but cannot prove that a live model
extracts the business meaning that motivated DAPE.

## Dependencies

- DAPE-008 deterministic P0 gate.
- AGB-005 operational real-provider path.

## Inputs

Approved Safara release fixture, DAPE-000 oracle, pinned provider/model/prompt
versions, source/lexicon/schema revisions, and reviewer identity.

## Outputs

Redacted run evidence recording direct recall, post-retry recall, normative
coverage, unsupported/distorted counts, critic detection, human-created and
corrected records, final coverage, and version tuple.

## Contract changes

Add a versioned real-provider semantic-quality evidence schema; no production
business contract changes.

## Package ownership

Atlas quality/evidence fixtures; Agents Bridge retains transport and telemetry.

## Deterministic responsibilities

Compare run artifacts to oracle keys, calculate metrics, verify versions and
redaction, and preserve stage attribution.

## Agent responsibilities

Perform registered extraction/criticism/retry only; cannot change oracle,
metrics, review identity, or approval.

## Failure statuses

`provider_error`, `incomplete_coverage`, `unsupported_candidate`,
`quality_gate_failed`, `review_required`, `input_error`.

## Exit codes

Quality-gate failure is distinct from provider, input, and execution failure.

## Backward-compatibility requirements

Normal CI remains key-free/network-free; evidence contains no PRD text, prompt,
response, credential, or authorization header.

## Required fixtures

Oracle key mapping and redacted quality-report examples for strong extraction,
critic recovery, retry recovery, and heavy manual reconstruction.

## Unit tests

Metric calculations, attribution, version pinning, and redaction.

## Integration tests

Final approved normative coverage is 100%, unsupported/distorted approved
records are zero, and all ten primary rules are directly extracted or explicitly
identified as missing. The report shows every human correction.

## Negative tests

Final coverage hiding poor direct recall, missing stage attribution, version
drift, unredacted content, and fixture-provider evidence fail.

## Completion evidence

Exact opt-in command, provider/model/prompt versions, redacted report and
artifacts, reviewer record, and honest release decision.

## Explicit non-goals

Deterministic CI acceptance, automatic approval, or provider benchmarking.

