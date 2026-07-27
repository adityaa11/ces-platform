# CES-GF-DAPE-012 — Registry Composition and Policy Packs

**Priority:** P2 — Extensible registries  
**Status:** Planned

## Goal

Load immutable, pinned registry compositions and move existing policies into a
backward-compatible initial pack.

## Work

- Add registry-composition, registry-lock, and policy-pack schemas.
- Package current file-handling policies as `web-file-handling@1.0.0`.
- Pin versions, hashes, dependencies, precedence, and compatibility ranges.
- Reject mutable, duplicate, conflicting, missing, or unpinned content.
- Add explicit lock upgrades and deterministic composition ordering.

## Acceptance criteria

- [ ] Existing policy IDs and profile-picture output remain valid.
- [ ] Registry resolution is reproducible from the lock file.
- [ ] Projects never upgrade packs silently.
- [ ] Conflicts and incompatible dependencies fail closed.

## Depends on

- `CES-GF-DAPE-011`

