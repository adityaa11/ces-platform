# CES-GF-DAPE-004 — Bounded Atlas Agent Roles and Merge

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Register structure-classification, domain-discovery, and section-extraction
roles and deterministically merge their bounded outputs.

## Business and architectural reason

One super-agent cannot reliably discover a domain, extract every section,
certify coverage, and normalize strict output.

## Dependencies

- DAPE-003 semantic contracts.
- AGB-004 registered-agent runtime; AGB-005 only for deployed evidence.

## Inputs

Pinned source-unit, lexicon, semantic-schema, and prompt-contract revisions.

## Outputs

Classification candidates, concept proposals, per-section semantic candidates,
relationships, uncertainties, conflicts, and merge report.

## Contract changes

Versioned role input/output and merge contracts with budgets and revision tuple.

## Package ownership

Atlas role packages own prompts/schemas; Agents Bridge owns execution only;
deterministic merge remains outside providers.

## Deterministic responsibilities

Partitioning, bounded inputs, revision checks, ID normalization, canonical
merge/order, deduplication proposals, provenance validation, and conflicts.

## Agent responsibilities

Classify deterministic structure, propose concepts, and extract section
semantics. Agents cannot alter source, approve, or claim completeness.

## Failure statuses

`provider_error`, `execution_error`, `revision_mismatch`,
`unsupported_candidate`, `conflict`.

## Exit codes

Provider/execution errors remain distinct from semantic invalidity and review.

## Backward-compatibility requirements

Keep provider-neutral execution and current Atlas compatibility route while
introducing canonical new role endpoints.

## Required fixtures

Out-of-order completions, section overlap, conflicting concepts, retries,
provider replacement, and deterministic role providers.

## Unit tests

Role schemas, budgets, revision tuple, normalization, merge, and provenance.

## Integration tests

All Safara sections execute with one pinned revision tuple and merge
identically regardless of completion order.

## Negative tests

Agent-generated source IDs, revision mixing, cross-section silent mutation,
arbitrary prompts/models, and agent approval fail.

## Completion evidence

Registered agents, package/file list, fixtures, commands, role artifacts,
errors, rerun and bridge-compatibility evidence.

## Explicit non-goals

Coverage certification, human approval, standards research, or deployment gate.

