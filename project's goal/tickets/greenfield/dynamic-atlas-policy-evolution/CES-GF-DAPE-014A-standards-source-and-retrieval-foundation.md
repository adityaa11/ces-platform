# CES-GF-DAPE-014A — Standards Source and Retrieval Foundation

**Stage:** P3 policy evolution
**Status:** Planned

## Objective

Provide controlled, reproducible standards sources and retrieval without
performing semantic policy analysis.

## Business and architectural reason

Agents must not fetch arbitrary URLs or treat unverifiable web content as
standards evidence.

## Dependencies

- DAPE-013 pinned registries and identities.

## Inputs

Approved organization/domain catalog or curated corpus, version metadata,
licensing/quotation constraints, refresh policy, and retrieval request.

## Outputs

Allowlisted catalog, controlled HTTPS retrieval or pinned corpus lookup,
immutable snapshots, hashes, citation IDs, version/retrieval metadata, cache
state, errors, and offline fixtures.

## Contract changes

Add standards-source, catalog, retrieval, snapshot, citation, licensing, cache,
and refresh schemas.

## Package ownership

`standards-source-schema`, `standards-source-catalog`, `standards-retriever`,
`standards-snapshot-store`, and `standards-research-fixtures`. The retriever
does not analyze policies. Deployment may use a dedicated source service or a
controlled Agents Bridge tool only through this contract.

## Deterministic responsibilities

Allowlist enforcement, URL construction, version/hash, immutable storage,
citation identity, cache/refresh rules, limits, redaction, and fixture replay.

## Agent responsibilities

None in raw retrieval authorization or snapshot identity.

## Failure statuses

`input_error`, `source_not_allowed`, `version_unavailable`,
`retrieval_error`, `snapshot_error`, `license_restricted`.

## Exit codes

Rejected source, unavailable version, network/retrieval, and snapshot errors
remain distinct.

## Backward-compatibility requirements

CI uses offline deterministic fixtures; no existing registry semantics change.

## Required fixtures

Allowlisted/blocked domains, pinned versions, redirects, changed content,
licensing limits, cache hit/expiry, refresh, timeout and offline replay.

## Unit tests

Catalog, allowlist, version parsing, hashes, citation IDs, cache and license
rules.

## Integration tests

An approved source is snapshotted and replayed offline byte-identically without
semantic policy analysis.

## Negative tests

Caller URL, redirect escape, mutable/unversioned source, missing hash,
over-quotation and agent-created allowlist entry fail.

## Completion evidence

Packages/contracts, catalog and snapshot fixtures, commands, retrieval/failure
artifacts, offline CI and ownership decision.

## Explicit non-goals

Policy comparison, recommendations, proposals, approval, or publication.

