# CES-GF-ATLAS-003 Local Intent Graph Evidence

**Validated:** 24 July 2026  
**Status:** Implemented locally; hosted validation pending

## Delivered package

Package: `@company/ces-atlas-intent-graph`

- Builds stable graph nodes for approved sources, Requirement Packages,
  Business Rules, unresolved non-blocking uncertainties, and resolved
  capabilities.
- Preserves Requirement Collection and Requirement Package logical identities
  and revision hashes.
- Accepts user-authored relationships only through the approved relationship
  vocabulary.
- Gives every generated and approved edge a reason and provenance identity.
- Emits canonical JSON plus deterministic Markdown and Mermaid views.
- Compiles approved Requirement Packages unchanged through the existing policy
  engine and traces resolved capabilities back to requirements.

## Validation behavior

Graph validation returns `AtlasGraphValidationError` with ordered structured
diagnostics. Positive and negative fixtures cover:

- duplicate relationship identities;
- dangling source or target nodes;
- cycles in directed dependency, implementation, refinement, and supersession
  relationships;
- a pair declared both conflicting and another relationship;
- valid approved relationships, source traces, rule traces, uncertainty traces,
  and capability traces.

Graph revision identity includes the approved Requirement Collection identity
and revision, normalized nodes, normalized edges, reasons, and provenance.

## Deterministic presentation

Nodes and edges are normalized by stable identity before hashing or rendering.
Equivalent inputs in different orders produce byte-identical canonical JSON and
Markdown. Mermaid aliases derive from normalized node order rather than source
order.

The presentation functions parse graph contracts into new values and never
write to the approved collection or packages. Tests snapshot approved artifacts
before graph generation and core handoff and verify that they remain unchanged.

## Existing-core handoff

The handoff validates every Requirement Collection revision pin, then passes
each approved `RequirementPackage` directly to the existing
`compilePolicyManifest` API with no graph fields or graph transformation.
Returned Policy Manifests provide the resolved capability trace used by the
graph.

The architecture matrix keeps this orchestration dependency one-way:
Atlas graph may call the deterministic core, while no core package depends on
Atlas graph.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     204 passed, 0 failed, 0 skipped
Test files: 29 passed
Build:     passed
```

## Remaining evidence

Hosted CI must pass on the committed ATLAS-003 implementation before the Atlas
MVP milestone is accepted and `CES-GF-ARCH-001` begins.
