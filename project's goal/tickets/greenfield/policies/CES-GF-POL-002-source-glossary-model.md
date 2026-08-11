# CES-GF-POL-002 - Source Glossary Model

**Status:** Proposed
**Depends on:** POL-001 and FND-002

## Outcome

Define a technology-neutral contract for source families, immutable releases,
and their governance lifecycle.

## Scope

- Stable identities for source family and source release.
- Edition/version, publication and retrieval provenance, lifecycle state,
  last-checked time, and supersession relationships.
- Validation of uniqueness, immutability, and release-to-family membership.
- A model that supports update checking without mutating published releases.

## Acceptance contract

- Multiple releases can belong to one stable source family.
- Published releases are immutable and independently addressable.
- A newer release does not alter an existing CES baseline reference.
- Invalid identities, duplicate releases, and broken supersession links fail.
- Contract tests use generic fixtures and do not assume a database or vendor.

## Explicit non-goals

- Seeding the four sources or fetching external documents.
- Update scheduling, vocabulary extraction, policy taxonomy, mappings, or UI.
- Selecting a persistence technology.
