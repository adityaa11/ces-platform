# CES-GF-ATLAS-UI-001 — Model Review Workspace Foundation

**Stage:** Atlas model review UI
**Status:** Complete — production Next.js workspace and revision-pinned detail boundary implemented

## Objective

Create the production Atlas review workspace as a domain-neutral renderer of
the backend-owned integrated semantic graph and supported model projections.

## Dependencies

- ATLAS-UI-000, ATLAS-HARD-025, and ATLAS-HARD-026.

## Work

- Add a production web application within the existing workspace.
- Implement it as `apps/atlas-workflow-ui`, a Node.js-hosted Next.js App Router
  application using React and TypeScript. Static export and a custom HTTP
  server are not acceptable production substitutes.
- Use React Flow for graph interaction and ELK.js for deterministic visual
  positioning only. Neither library may infer semantic topology.
- Implement the required three-pane structure:
  - supported-model and semantic navigation on the left;
  - persistent integrated project graph and selected model/detail below it in
    the center;
  - source-document evidence on the right.
- Display lifecycle, authority, approval, downstream-blocking, eligibility,
  and exception summaries from backend data.
- Create reusable loading, empty, error, unavailable-projection, and stale-data
  states.
- Preserve keyboard navigation, responsive behavior, focus visibility, and
  accessible graph alternatives.
- Consume versioned backend projections through typed adapters.
- Render normal model tabs only for `supported` kinds. Render
  `partially_supported` and `human_review_required` as visibly incomplete or
  review-only previews. Do not render diagram tabs for
  `insufficient_evidence`, `conflicting_evidence`, or `not_applicable`.
- Support activity-flow, business-workflow, BPMN-candidate,
  functional-decomposition, module-dependency, state, decision, actor-goal,
  sequence-interaction, and conceptual-data projections.
- Never treat actor responsibilities as sequence-message evidence, module
  listings as dependencies, conceptual entities as a physical schema, or a
  basic activity flow as complete BPMN.
- Use neutral CES Atlas product language and project-provided display data.
- Render one buyer-facing item per governed semantic concept while allowing
  all exact original document representations to be inspected.
- Treat every diagram as a projection of shared canonical concept IDs. Never
  create language-specific or model-specific duplicate identities for the
  same accepted concept.
- Use projection-local IDs as React Flow IDs and canonical IDs only for
  cross-projection selection and semantic identity.
- Select node shapes only from frozen backend semantic kinds; labels and
  language must never determine visual type.
- Consume the discriminated workspace-authority contract and reject invalid
  lifecycle/authority/downstream combinations.

## Domain-neutral UI boundary

- Production headings, theme, navigation, colors, icons, sample labels, and
  default content must not contain fixture-specific terminology.
- No workflow name, actor, business rule, ordering, branch, or state may be
  hardcoded from a qualification fixture.
- Fixture data may appear only in tests or user-selected runtime project data.
- The UI must render an unrelated workflow domain without code or theme
  changes.

## Outputs

Production application shell, typed projection adapters, lifecycle banner,
three-pane responsive layout, accessibility baseline, and neutral empty/error
states.

## Prototype-validated behavior

- [x] The three panes are visible together at supported desktop widths.
- [x] Lifecycle and authority state cannot be hidden by workflow navigation.
- [x] The UI renders only backend-provided semantic membership and topology.
- [x] The UI can render every HARD-021 model kind according to its support
      status and projection eligibility.
- [x] Partial and review-only previews display missing evidence and cannot look
      approved or complete.
- [x] A document with no supported workflow renders its other supported models
      without a workflow error or fabricated fallback graph.
- [x] Fixture-specific headings or theme assumptions in production code equal
      zero.
- [x] Loading, empty, error, missing-projection, and stale states are tested.
- [x] Keyboard and screen-reader users can navigate workflows and graph items.
- [x] Existing backend builds and tests remain green.

## Production acceptance

- [x] The production application builds and runs through Next.js App Router;
      no dependency-free prototype shell remains as the release entry point.
- [x] Real versioned Atlas artifacts are adapted server-side into the workspace
      contract; `/api/atlas/workspace` is implemented and tested rather than
      assumed.
- [x] Every rendered node and edge satisfies the frozen UI-000 identity,
      evidence, authority, and visual-semantic contracts.

## Out of scope

Persistent overview/detail interaction is completed by ATLAS-UI-002.

## Implementation evidence

- The release entry is now a Node-hosted Next.js App Router application with
  production `dev`, `build`, and `start` commands.
- The server-only workspace reader and `/api/atlas/workspace` validate the
  producer artifact with `ModelReviewWorkspaceSchema`, reject unsafe project
  identifiers, and fail closed on invalid contract data.
- `/api/atlas/details` resolves selected details only through the backend-owned
  detail index, requires an `If-Match` revision, validates the shared UI-000
  detail schema, rejects unsafe paths, and returns conflicts for stale or
  mismatched index/detail revisions.
- The neutral responsive shell renders persistent lifecycle/authority state,
  semantic navigation, the backend-owned overview, relationship alternatives,
  and a source-evidence pane from shared-contract fields.
- Next.js production build passes; 13 focused UI/server tests pass.

- The earlier dependency-free TypeScript shell remains covered as compatibility
  behavior while the Next.js application is the production entry point.
- The versioned adapter fails closed on malformed projections and applies all
  ten backend model-support states without inventing a fallback diagram.
- The responsive shell keeps lifecycle and authority in a persistent header,
  with semantic navigation, an accessible graph/table workspace, and source
  documents visible as three desktop panes.
- `apps/atlas-workflow-ui/src/adapter.test.ts`: four foundation tests pass.
- Application typecheck and build pass with TypeScript project references.
