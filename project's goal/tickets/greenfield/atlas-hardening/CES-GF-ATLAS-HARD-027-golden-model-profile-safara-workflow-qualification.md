# CES-GF-ATLAS-HARD-027 — Recursive Knowledge Explorer Golden Qualification

## Status

Reopened — legacy workflow-only golden replaced by the recursive,
renderer-neutral knowledge-explorer golden. Production qualification remains
blocked until the v2 hierarchy and concern-graph pipeline are implemented.

## Priority

High

## Authoritative direction

The following documents define the target and override earlier workflow-only
examples:

- `project's goal/graphs context.md`
- `project's goal/supporting graphs context.md`
- `tests/fixtures/safara/golden-main-workflow.json`

The JSON fixture is a Safara qualification oracle, never a production template
or extraction shortcut.

## Objective

Qualify Atlas as a recursive knowledge explorer in which:

1. One Main Business Workflow is the permanent project map.
2. The Main Workflow contains business modules only.
3. Selecting a module reveals zero or more backend-owned child knowledge
   nodes below the still-visible Main Workflow.
4. Child nodes may be visualizations or non-graph knowledge content.
5. Navigation is recursive, cycle-free, lazy, and represented by a complete
   breadcrumb.
6. Each visualization represents one concern and uses only evidence-backed
   membership and topology.
7. Atlas selects graph semantics independently of rendering technology.

## Renderer policy

The golden requires an interactive graph experience but does not lock Atlas to
Mermaid, React Flow, ELK, or another renderer.

The backend owns:

- graph type;
- concern membership;
- nodes and relationships;
- evidence;
- ordering and completeness;
- renderer capability descriptor.

The renderer owns presentation and interaction only. It must never infer
children, semantic membership, or graph topology.

## Golden Main Workflow

The Main Workflow contains exactly these module concepts:

- Paket dan Jadwal Keberangkatan
- Data Jemaah
- Pendaftaran Jemaah
- Tagihan dan Pembayaran
- Dokumen Jemaah
- Status Perjalanan dan Kesiapan
- Manifest Keberangkatan
- Dashboard dan Laporan
- Riwayat Aktivitas

Business rules, decisions, states, validations, permissions, and detailed
operations do not belong in the Main Workflow. They belong to child knowledge
nodes under the applicable module or nested concern.

The golden Main Workflow relationships are frozen in
`tests/fixtures/safara/golden-main-workflow.json`. They preserve source module
labels and use English CES relationship descriptions.

## Golden recursive hierarchy

The fixture demonstrates, without production hardcoding:

```text
Main Workflow
├── Paket dan Jadwal Keberangkatan
│   ├── Workflow
│   ├── State Machine
│   └── Evidence
├── Data Jemaah
│   ├── Entity Lifecycle
│   └── Evidence
├── Pendaftaran Jemaah
│   ├── Workflow
│   └── Evidence
├── Tagihan dan Pembayaran
│   ├── Workflow
│   ├── Payment State Machine
│   ├── Billing State Machine
│   ├── Business Rules
│   ├── Validations
│   ├── Permissions
│   └── Evidence
├── Dokumen Jemaah
│   ├── Document Workflow
│   ├── Document State Machine
│   └── Evidence
├── Status Perjalanan dan Kesiapan
│   ├── Decision Tree
│   ├── Readiness State Machine
│   ├── Blocking Conditions
│   │   └── Visa Validation
│   │       └── Business Rules
│   └── Evidence
├── Manifest Keberangkatan
│   ├── Workflow
│   └── Evidence
├── Dashboard dan Laporan
│   ├── Dependency Graph
│   └── Evidence
└── Riwayat Aktivitas
    ├── Audit Flow
    └── Evidence
```

Only graph and content types supported by evidence may be emitted in a live
project. The fixture freezes the expected Safara result; production selection
must use domain-neutral concern detection and graph suitability scoring.

## Built-in graph selection baseline

The initial registry contains:

1. Business Workflow — at most once per project
2. Workflow
3. State Machine
4. Decision Tree
5. Entity Lifecycle
6. Dependency Graph
7. Audit Flow
8. Entity Relationship

These are registry entries, not frontend switches. Future graph types must be
addable without changing the recursive hierarchy contract.

Selection occurs per module and per distinct nested concern. Keywords may
locate candidate evidence but cannot qualify a graph by themselves.

Minimum qualification principles:

- Workflow requires genuine activities and an evidence-backed relationship.
- State Machine requires states and an evidence-backed transition.
- Decision Tree requires a condition and explicit outcomes.
- Entity Lifecycle requires one entity and linked lifecycle events.
- Dependency Graph requires evidence-backed information flow.
- Audit Flow requires an originating event and recorded audit destination.
- Entity Relationship requires explicit entity relationships; cardinality is
  never invented.

## Language and identity

- Preserve original document text exactly, regardless of language.
- Never rename business concepts in the buyer-facing graph.
- English is permitted for CES-generated relationship and governance labels.
- Accepted semantic equivalence produces one governed concept with all exact
  source representations retained.
- Pending equivalence remains separate and non-authoritative.
- Projection-local identity never replaces canonical semantic identity.

## Required production artifacts

The final implementation must emit versioned equivalents of:

```text
proposed-knowledge-index.json
proposed-knowledge-nodes/<knowledge-id>.json
approved-knowledge-index.json
approved-knowledge-nodes/<knowledge-id>.json
```

Each node artifact contains only the selected node, its immediate child
descriptors, optional structured visualization/content payload, evidence,
support assessment, and governance. The UI must not download the full recursive
tree to inspect one path.

## Acceptance criteria

- [x] The golden fixture is renderer-neutral.
- [x] The legacy readiness decision and Ready/Blocked states are removed from
      the Main Workflow and represented as supporting concern types.
- [x] The golden Main Workflow contains nine module nodes only.
- [x] The golden hierarchy demonstrates recursive navigation beyond one level.
- [x] The fixture forbids frontend child and topology inference.
- [x] The fixture requires one permanently visible Main Workflow.
- [x] The oracle validates parent-child consistency and cycle freedom.
- [ ] Production Atlas emits the v2 recursive knowledge contract.
- [ ] Production Atlas performs module-scoped concern detection.
- [ ] Production Atlas performs evidence-backed graph suitability scoring.
- [ ] Production Atlas produces genuine concern-specific topology.
- [ ] Proposed and approved hierarchies have contract parity.
- [ ] The production UI keeps the Main Workflow visible at every depth.
- [ ] The breadcrumb matches the backend-owned parent path.
- [ ] The detail workspace renders backend children recursively.
- [ ] Renderer choice can change without changing semantic output.
- [ ] Safara and a structurally different domain qualify without production
      constants or fixture-specific branches.
- [ ] Browser, accessibility, security, and human acceptance gates pass.

## Anti-drift rules

- Do not add a second workflow-only detail contract beside the recursive one.
- Do not preserve fixed Flow/Rules/States tabs as a parallel navigation model.
- Do not use the old project-wide layer-union projections as graph-specific
  output.
- Do not keep a permanent v1 fallback in the new UI.
- Do not count tests for the unused prototype UI as production qualification.
- Do not embed Safara labels, IDs, topology, or graph-type decisions in
  executable production code.
- Do not require Mermaid output for qualification.

## Qualification commands

```powershell
corepack pnpm vitest run tests/atlas-hard027.test.ts tests/atlas-hard027-qualification.test.ts
```

The production-output runner remains:

```powershell
node tests/qualification/atlas-hard027.mjs `
  --oracle tests/fixtures/safara/golden-main-workflow.json `
  --output <generated-knowledge-workspace.json> `
  --report <qualification-report.json>
```

The runner must fail current v1 output because it lacks the recursive knowledge
hierarchy. That failure is expected until the v2 implementation is complete.

## Out of scope

- Workflow execution
- BPMN authoring
- Frontend-owned semantic inference
- Locking Atlas to one visualization library
