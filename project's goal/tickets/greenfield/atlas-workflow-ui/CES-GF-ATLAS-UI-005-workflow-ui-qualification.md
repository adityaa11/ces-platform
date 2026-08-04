# CES-GF-ATLAS-UI-005 — Model Review UI Production Qualification

**Stage:** Atlas model review UI production gate
**Status:** In progress — enriched-detail automated gates pass; browser and human acceptance remain

## Objective

Prove that the production UI accurately renders the backend-owned integrated
semantic graph and supported proposed or approved model projections across
different domains and lifecycle states.

## Dependencies

- ATLAS-UI-000 through ATLAS-UI-004.
- Connected and qualified outputs from ATLAS-HARD-021 through ATLAS-HARD-026.
- Golden model profile and Safara workflow output from ATLAS-HARD-027.

## Work

- Run component, interaction, accessibility, responsive, and browser tests.
- Test linear, branching, joining, looping, parallel, incomplete, ambiguous,
  conflicting, multilingual, proposed, and approved workflows.
- Test documents supporting several model kinds and at least one document that
  supports no workflow but does support another model kind.
- Verify all eligible HARD-021 model views reuse canonical identities and
  synchronize selection.
- Verify partial, review-only, insufficient, conflicting, and not-applicable
  support statuses produce the required UI behavior.
- Verify the integrated summary and partitioned semantic layers remain bounded,
  progressively loadable, and revision-consistent.
- Verify that combination occurs through shared canonical IDs and governed
  bridge relationships, while focused models retain their own semantics.
- Verify the integrated overview does not become an unbounded union of every
  workflow step, rule, actor, state, message, and data entity.
- Verify the persistent overview and stacked detail interaction.
- Verify exact source-document, page, source-unit, text-span, and bounding-box
  navigation.
- Prove that pending and rejected semantics cannot appear authoritative.
- Prove authentication, project authorization, revision pinning, idempotency,
  stale-decision conflict handling, secure source delivery, safe bulk approval,
  and audit coverage.
- Run at least one qualification fixture and one structurally different domain.
- Verify that changing project data changes labels and content without
  production-code or theme changes.
- Verify projection-local IDs remain distinct from canonical identities and
  projection-only constructs never create fake canonical concepts.
- Verify every sampled governed node/edge resolves evidence, and every sampled
  source representation resolves its own trace and correct PDF highlight.
- Record overview node/edge count, initial payload bytes, layout duration,
  truncation state, ELK version/profile, and input/options hashes.
- Store screenshots, interaction traces, accessibility results, artifact
  versions, and reviewer acceptance.

## Acceptance criteria

- [x] Project overview remains visible while workflow detail opens below it.
- [x] Overview and detail minimize/restore behavior passes interaction tests.
- [x] All focused tabs render only backend-owned membership.
- [ ] Source traceability resolves correctly for every sampled UI item.
- [ ] Pending/rejected authority leakage equals zero.
- [x] Fixture-specific production headings, theme, or hardcoded semantics equal
      zero.
- [ ] Language-only duplicate workflow nodes, operations, rules, states, and
      relationships equal zero.
- [ ] Every sampled multilingual concept exposes all exact original document
      representations.
- [ ] Pending multilingual equivalence remains separate and visibly
      non-authoritative until accepted.
- [ ] At least two structurally different domains render without UI code
      changes.
- [ ] A non-workflow document renders supported model projections without a
      fabricated workflow.
- [ ] The workspace exposes every supported model kind.
- [ ] The integrated overview relates only elements joined by shared canonical
      identities or governed bridge relationships.
- [ ] Supported projections without governed bridges remain accessible as
      separate focused views and are not falsely connected.
- [ ] Every cross-model highlight resolves through the same canonical concept
      ID; language-only and projection-only duplicate identities equal zero.
- [ ] Model projections without an evidence-backed bridge remain available but
      are not falsely connected in the integrated overview.
- [x] React Flow renders only backend-supplied nodes and edges, and repeated
      ELK.js layout of identical input produces identical positions.
- [x] Label-keyword mutation cannot change node shape or semantic type.
- [ ] Cookie-authenticated mutation CSRF, unsafe URLs, and active source
      document payloads fail safely.
- [ ] Actor-only evidence never produces a sequence diagram, module lists never
      invent dependency edges, and activity flow never masquerades as complete
      BPMN.
- [ ] Conceptual-data views do not claim a physical database schema without
      explicit physical-schema evidence.
- [ ] Keyboard navigation and automated accessibility checks pass.
- [ ] Supported desktop and responsive layouts pass visual regression review.
- [ ] Cross-project access, forged reviewer identity, stale revision replay,
      duplicate command submission, unauthorized document access, and
      ineligible bulk approval tests fail safely.
- [ ] A human reviewer accepts the production model-review experience.

## Outputs and evidence

Qualification report, screenshots, browser traces, accessibility report,
cross-domain fixtures, artifact hashes, deployment version, and human
acceptance.

## Implementation evidence

- ELK layout is now isolated in a testable production adapter that consumes
  only backend node/edge order, direction, identities, and topology. Repeated
  layout is byte-for-byte position stable.
- A label mutation containing misleading actor/decision/state keywords cannot
  change layout or the backend-supplied semantic kind.
- A scoped production-source scan proves that Safara names, fixture IDs, and
  travel-specific labels do not appear in the Next.js application boundary.
- Persistent overview/detail and minimize/restore regressions remain green;
  the full Atlas UI qualification set passes 20/20 across adapters,
  interaction, approval, source, workspace/detail, evidence, and deterministic
  layout tests.
- The production Next.js build includes real workspace, detail, detail-tab,
  evidence, and decision Route Handlers. Focused slices resolve only through
  backend-declared artifact paths and revision-pinned detail indexes.
- Verification: `corepack pnpm vitest run apps/atlas-workflow-ui` and
  `corepack pnpm --filter @company/ces-atlas-workflow-ui build`.
- Browser screenshots, automated accessibility/visual regression, multi-domain
  runtime artifacts, and explicit human acceptance remain open and are not
  represented as complete by this automated gate.

## Out of scope

Workflow execution, BPMN authoring, and frontend-owned semantic inference.
