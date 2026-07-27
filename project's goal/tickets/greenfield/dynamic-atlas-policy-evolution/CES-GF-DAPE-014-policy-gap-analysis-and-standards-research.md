# CES-GF-DAPE-014 — Policy Gap Analysis and Controlled Standards Research

**Stage:** P3 policy evolution
**Status:** Planned

## Objective

Inspect existing policy semantics and use controlled authoritative research to
propose the smallest justified change.

## Business and architectural reason

A normal LLM prompt is neither reproducible standards research nor sufficient
evidence for policy evolution; the default must not be “create a policy.”

## Dependencies

- DAPE-013 pinned packs and extensible identities.

## Inputs

Approved semantics/gaps, existing definitions, triggers, parameters, evidence,
verification guidance, and an approved source catalog or corpus.

## Outputs

Coverage analysis and research record supporting reuse, trigger addition,
parameter/evidence clarification, compatible/breaking revision, merge, new
policy, implementation/architecture/verification only, clarification, or not
applicable.

## Contract changes

Add policy-coverage, standards-research, immutable reference snapshot/citation,
and policy-change proposal schemas.

## Package ownership

New analyzer, standards-research contracts/agent and proposal schema; registry
governance remains separate.

## Deterministic responsibilities

Existing-policy inventory, allowlist/corpus validation, snapshot version/hash,
citation metadata, outcome validation, fixture replay and proposal diff input.

## Agent responsibilities

Compare semantics, retrieve only through controlled tooling, synthesize
version-qualified evidence, and propose; never approve, publish, weaken/delete,
or claim certification.

## Failure statuses

`policy_gap`, `capability_gap`, `research_required`, `research_source_rejected`,
`unsupported_proposal`, `review_required`.

## Exit codes

Research/tool errors, rejected sources, gaps and invalid proposals are distinct.

## Backward-compatibility requirements

Normal CI is offline and deterministic; existing policies remain authoritative.

## Required fixtures

Allowlisted HTTPS snapshots and/or curated corpus, pinned citations, partial
existing policy, trigger gap, evidence gap, merge/new/none outcomes, licensing
and quotation limits.

## Unit tests

Catalog/allowlist, snapshot hashes, version/citation validation, semantic
inspection outcomes and fixture replay.

## Integration tests

Safara finalized-manifest gap inspects existing policies before producing a
reviewable, evidence-bounded recommendation.

## Negative tests

Arbitrary URL, unversioned citation, unsupported quote, fabricated source,
automatic weakening/publication and default-new-policy behavior fail.

## Completion evidence

Tool/corpus configuration, schemas/packages, research fixtures and snapshots,
commands, failures, offline CI and proposal examples.

## Explicit non-goals

Proposal approval, registry publication, certification, or project upgrade.

