# CES-GF-DAPE-015 — Registry Governance, Versioning, and Impact

**Priority:** P3 — Governed policy evolution  
**Status:** Planned

## Goal

Approve, publish, compare, and assess immutable registry versions through an
auditable human-governed workflow.

## Work

- Add policy-change proposal, governance decision, publication, semantic-diff,
  migration, and impact-analysis contracts.
- Classify patch, minor, and major semantic changes.
- Publish new immutable versions; never mutate an existing version.
- Calculate affected projects, manifests, adapters, tasks, tests, evidence,
  mappings, and architecture decisions.
- Require explicit lock upgrades and revalidation.

## Acceptance criteria

- [ ] Agents cannot approve or publish their proposals.
- [ ] Publication is atomic, immutable, signed/hashed, and auditable.
- [ ] Semantic version classification has deterministic tests.
- [ ] Impact reports identify stale evidence and unsupported adapters.
- [ ] Projects remain on old versions until explicitly upgraded.

## Depends on

- `CES-GF-DAPE-014`

