# CES-GF-ATLAS-UI-000 — Model Review Projection and BFF Contracts

**Stage:** Atlas model review UI contract freeze
**Status:** Planned

## Objective

Freeze semantic, projection, evidence, overview, authority, layout, and
Next.js backend-for-frontend contracts before rebuilding the production Atlas
Model Review UI.

## Dependencies

- ATLAS-HARD-019, ATLAS-HARD-020, ATLAS-HARD-023, ATLAS-HARD-025, and
  ATLAS-HARD-026.

## Work

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
- Use a discriminated authority contract permitting only review-in-progress /
  non-authoritative / blocked and approved / authoritative / allowed states.
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
model-detail/evidence DTOs, and decision commands/receipts.

## Acceptance criteria

- [ ] Projection-local and canonical identities are distinct and validated.
- [ ] Shared canonical IDs remain stable across applicable model views.
- [ ] Projection constructs cannot masquerade as authoritative concepts.
- [ ] Governed nodes and edges resolve exact evidence and governance metadata.
- [ ] Every source representation resolves its own exact trace.
- [ ] PDF highlights are renderer-independent under the frozen coordinates.
- [ ] Overview membership and limits are backend-owned and measurable.
- [ ] Label keywords cannot determine shape or semantic type.
- [ ] Identical ordered input plus pinned ELK metadata yields identical layout.
- [ ] Invalid authority combinations fail schema validation.
- [ ] BFF tests reject CSRF, cross-project, stale, duplicate, forged-reviewer,
      unsafe-URL, and active-document cases.
- [ ] UI-001 implementation cannot resume until these contracts are frozen and
      consumed by backend projection and UI packages.

## Out of scope

React implementation remains UI-001 through UI-004. Qualification remains
UI-005.
