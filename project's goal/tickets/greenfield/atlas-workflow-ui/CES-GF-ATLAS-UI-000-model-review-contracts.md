# CES-GF-ATLAS-UI-000 — Model Review Projection and BFF Contracts

**Stage:** Atlas model review UI contract freeze
**Status:** In progress — shared schemas implemented; producer and consumer adoption remains HARD-025/HARD-026

## Objective

Freeze semantic, projection, evidence, overview, authority, layout, and
Next.js backend-for-frontend contracts before rebuilding the production Atlas
Model Review UI.

## Dependencies

- ATLAS-HARD-019 through ATLAS-HARD-026.

## Work

- Create `packages/atlas-model-review-contracts` as the single owner of every
  model-review wire-format Zod schema and TypeScript type.
- Require HARD-025 producers, Next.js BFF DTOs, React Flow adapters, approved
  workspace refresh, and qualification fixtures to consume that package
  rather than redefining local wire contracts.
- Version contract name, contract version, producer version, projection
  schema, evidence schema, and command schema independently where required.
- Reject missing versions and unsupported newer versions. Older versions may
  load only through an explicit, version-pinned, automatically tested adapter.
- Give every rendered node and edge projection-local IDs. Use canonical IDs
  only for real shared semantic concepts and governed relationships; React
  Flow IDs must not double as canonical identities.
- Model gateways, start/end events, activations, swimlanes, layout groups, and
  similar view-only elements as non-authoritative `projection_construct`
  identities with explicit derivation references, never fake concepts.
- Attach exact evidence IDs, origin, rationale, and review status to every
  governed projected node and edge.
- Give every exact source representation its own trace through document,
  source unit, atomic claim, canonical record, and optional workflow/operation.
- Freeze PDF locations as one-based pages with normalized-page coordinates,
  top-left origin, page rotation, and explicit page/crop dimensions when
  needed.
- Publish backend-owned `overview_eligible`, priority, role, inclusion reason,
  and default visibility plus counts, truncation, layers, hashes, schemas, and
  revision-pinned pagination.
- Define configurable initial node, edge, payload-byte, and layout-duration
  budgets. The frontend must not calculate semantic importance.
- Map shapes and badges only from backend semantic kinds, never label words.
- Pin ELK.js version, schema, input ordering, algorithm, direction, spacing,
  layout profile, input hash, and options hash. ELK produces coordinates only.
- Use a discriminated authority contract: review-in-progress is
  non-authoritative and blocked; approved is authoritative and may be allowed
  or explicitly blocked by qualification, release policy, implementation
  capability, or another governed non-semantic blocker. Every blocked state
  carries blocker codes.
- Define Next.js Route Handlers as authenticated BFF adapters. They may validate,
  authorize, enforce CSRF/revision/idempotency, and call authoritative Atlas
  services, but may not infer semantics, calculate eligibility, mutate the
  proposal, or implement another materialization path.
- Treat documents and extracted markup as untrusted. Require strict CSP,
  sandboxing, media allowlists, sanitization, and restricted command/evidence/
  redirect URLs.
- Keep PostgreSQL and S3-compatible storage under authoritative Atlas backend
  ownership, never as a separate UI source of truth.

## Outputs

Versioned Zod schemas and TypeScript types for projection nodes/edges,
overview index/summary, representation traces, PDF locations, authority,
model-detail/evidence DTOs, decision commands/receipts, compatibility metadata,
and explicitly supported migration adapters.

## Acceptance criteria

- [x] Projection-local and canonical identities are distinct and validated.
- [ ] Shared canonical IDs remain stable across applicable model views.
- [x] Projection constructs cannot masquerade as authoritative concepts.
- [x] Governed nodes and edges require exact evidence and governance metadata.
- [x] Every source representation resolves its own exact trace.
- [x] PDF locations use the frozen renderer-independent coordinate contract.
- [x] Overview membership and limits have backend-owned schema fields.
- [x] Visual kind is an explicit semantic field, independent of label text.
- [ ] Identical ordered input plus pinned ELK metadata yields identical layout.
- [x] Invalid authority combinations fail schema validation.
- [ ] One shared package owns every model-review wire schema and is consumed by
      HARD-025, the Next.js BFF, React Flow adapters, approved refresh, and
      qualification fixtures.
- [x] Every workspace payload declares contract name/version and producer version;
      missing or unsupported versions fail closed.
- [x] Older contract versions require explicit registered adapter versions.
- [x] Approved-but-blocked workspaces carry explicit downstream blocker codes.
- [x] Detail indexes and payloads distinguish semantic role, internal graph,
      connected project relationships, focused slices, lifecycle authority,
      partial/empty availability, and established versus missing ordering.
- [x] A detail payload cannot publish flow edges while declaring ordering
      unestablished, and explicitly empty detail cannot contain graph items.
- [ ] BFF tests reject CSRF, cross-project, stale, duplicate, forged-reviewer,
      unsafe-URL, and active-document cases.
- [ ] UI-001 implementation cannot resume until these contracts are frozen and
      consumed by backend projection and UI packages.

## Out of scope

React implementation remains UI-001 through UI-004. Qualification remains
UI-005.

## Implementation evidence

- Added `@company/ces-atlas-model-review-contracts` as a workspace package.
- Versioned strict Zod schemas cover identity, governed edges, projection
  constructs, overview budgets, deterministic layout metadata, representation
  traces, PDF coordinates, authority, commands, and receipts.
- Compatibility classification fails closed for missing and unsupported
  versions and recognizes only explicitly registered migration versions.
- Five focused contract and negative-security tests pass; package build passes.
- Additive `atlas.model-review.detail-index` and
  `atlas.model-review.detail` contracts now cover enriched lower-panel data
  without changing the frozen workspace overview wire format. Six focused
  contract tests pass.
- HARD-025 and HARD-026 adoption remain intentionally unchecked and are the
  next commits in the delivery sequence.
