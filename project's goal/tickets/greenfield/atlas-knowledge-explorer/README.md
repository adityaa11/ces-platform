# CES Atlas V2 Recursive Knowledge Explorer

**Status:** Semantic-depth implementation complete through ATLAS-V2-011F;
ATLAS-V2-011G live generic PDF qualification remains

## Proposed successor UI gate

[ATLAS-REDESIGN-000](../atlas-redesign/CES-GF-ATLAS-REDESIGN-000-manual-verification-workspace-redefinition.md)
is a proposed blocking `REVIEW_GATE` for the replacement Atlas manual
verification workspace. V2 semantic, evidence, revision, review, API, PDF, and
graph infrastructure may be assessed as reusable foundation, but this plan's
existing UI shell must not be extended while the redesign gate is under review.

The UI Gate context and prototype are proposed rails only. They do not amend
active Atlas authority until REDESIGN-000 receives an accepting terminal
outcome. The final renewed Atlas authority and POL-010 unblock condition will
be the REDESIGN-009 gate defined by the accepted redesign plan.

This is the active foundation sequence for the Atlas recursive Knowledge
Explorer. The proposed redesign gate above controls whether it is succeeded by
the renewed workspace sequence. Older Atlas, hardening, workflow-UI, and release tickets remain as
implementation history or reusable-foundation evidence; they do not authorize
legacy workflow-only artifacts, fixed detail tabs, or compatibility fallbacks.

## Product authority

- [`CES_ATLAS_AUTHORITY.md`](../../../CES_ATLAS_AUTHORITY.md)
- [`graphs context.md`](../../../graphs%20context.md)
- [`supporting graphs context.md`](../../../supporting%20graphs%20context.md)
- [`atlas_semantic_extraction_feedback_context.md`](../../../atlas_semantic_extraction_feedback_context.md)
- [`qualification-cases.json`](../../../../tests/fixtures/atlas-v2/qualification-cases.json)

If these sources conflict, the two context documents define product behavior;
the V2 qualification cases provide concrete, source-derived evidence.

## Delivery sequence

| Order | Ticket | Outcome |
|---:|---|---|
| 0 | [ATLAS-V2-000](CES-GF-ATLAS-V2-000-legacy-runtime-quarantine.md) | Quarantine and map every legacy runtime path |
| 1 | [ATLAS-V2-001](CES-GF-ATLAS-V2-001-recursive-knowledge-contract.md) | One renderer-neutral recursive contract |
| 2 | [ATLAS-V2-002](CES-GF-ATLAS-V2-002-semantic-fact-extraction.md) | Evidence-grounded semantic facts from any PRD |
| 3 | [ATLAS-V2-003](CES-GF-ATLAS-V2-003-graph-selection.md) | General graph-type selection |
| 4 | [ATLAS-V2-004](CES-GF-ATLAS-V2-004-knowledge-assembly.md) | Main Workflow and recursive supporting graphs |
| 5 | [ATLAS-V2-005](CES-GF-ATLAS-V2-005-artifact-cli-replacement.md) | Deterministic v2 artifacts and CLI runtime |
| 6 | [ATLAS-V2-006](CES-GF-ATLAS-V2-006-review-governance.md) | Review and approval on v2 identities |
| 7 | [ATLAS-V2-007](CES-GF-ATLAS-V2-007-knowledge-api.md) | Revision-pinned recursive API |
| 8 | [ATLAS-V2-008](CES-GF-ATLAS-V2-008-interactive-workspace.md) | Recursive interactive Next.js workspace |
| 9 | [ATLAS-V2-009](CES-GF-ATLAS-V2-009-legacy-removal-qualification.md) | Legacy removal and production qualification |
| 9A | [ATLAS-V2-009A](CES-GF-ATLAS-V2-009A-runtime-surface-removal.md) | Remove V1 UI and Bridge runtime surfaces |
| 9B | [ATLAS-V2-009B](CES-GF-ATLAS-V2-009B-cli-package-retirement.md) | Remove legacy CLI assembly and retired packages |
| 9C | [ATLAS-V2-009C](CES-GF-ATLAS-V2-009C-qualification-fixtures.md) | Golden and generic qualification fixtures |
| 9D | [ATLAS-V2-009D](CES-GF-ATLAS-V2-009D-end-to-end-qualification.md) | Full V2 pipeline qualification |
| 9E | [ATLAS-V2-009E](CES-GF-ATLAS-V2-009E-pdf-browser-qualification.md) | Text and scanned PDF browser qualification |
| 9F | [ATLAS-V2-009F](CES-GF-ATLAS-V2-009F-final-gates-ledger-closure.md) | Final gates and ledger closure |
| 10 | [ATLAS-V2-010](CES-GF-ATLAS-V2-010-live-pdf-extraction-correction.md) | Correct live PDF extraction and reject misleading incomplete output |
| 10A | [ATLAS-V2-010A](CES-GF-ATLAS-V2-010A-emergency-change-audit-diagnostics.md) | Audit emergency changes and persist safe diagnostics |
| 10B | [ATLAS-V2-010B](CES-GF-ATLAS-V2-010B-pdf-structural-reconstruction.md) | Reconstruct PDF headings, paragraphs, and section hierarchy |
| 10C | [ATLAS-V2-010C](CES-GF-ATLAS-V2-010C-bounded-exhaustive-extraction.md) | Extract every relevant bounded section |
| 10D | [ATLAS-V2-010D](CES-GF-ATLAS-V2-010D-semantic-merge-scope-resolution.md) | Merge facts and resolve module scopes and endpoints |
| 10E | [ATLAS-V2-010E](CES-GF-ATLAS-V2-010E-coverage-publication-gates.md) | Reject incomplete output before proposal publication |
| 10F | [ATLAS-V2-010F](CES-GF-ATLAS-V2-010F-live-provider-qualification.md) | Qualify the real provider and production UI |
| 11 | [ATLAS-V2-011](CES-GF-ATLAS-V2-011-semantic-decomposition.md) | Separate recursive semantic understanding from graph views |
| 11A | [ATLAS-V2-011A](CES-GF-ATLAS-V2-011A-semantic-decomposition-contract.md) | Contract source-grounded semantic concepts and relationships |
| 11B | [ATLAS-V2-011B](CES-GF-ATLAS-V2-011B-recursive-evidence-decomposition.md) | Decompose every module's relevant evidence to atomic concepts |
| 11C | [ATLAS-V2-011C](CES-GF-ATLAS-V2-011C-semantic-hierarchy-assembly.md) | Assemble navigable semantic hierarchy independently of graphs |
| 11D | [ATLAS-V2-011D](CES-GF-ATLAS-V2-011D-semantic-relationship-assembly.md) | Resolve evidenced concept relationships without invention |
| 11E | [ATLAS-V2-011E](CES-GF-ATLAS-V2-011E-graph-projection.md) | Project applicable graph views from the semantic model |
| 11F | [ATLAS-V2-011F](CES-GF-ATLAS-V2-011F-knowledge-api-workspace.md) | Expose and render recursive detail, representations, and evidence |
| 11G | [ATLAS-V2-011G](CES-GF-ATLAS-V2-011G-live-semantic-depth-qualification.md) | Qualify semantic depth on Safara and unrelated PDFs |

Tickets execute in order. A later ticket may add tests early, but it may not
introduce a temporary legacy contract or parallel production path.

ATLAS-V2-002 through V2-005 are downstream foundation evidence only. Their
synthetic tests do not satisfy live extraction acceptance; V2-010A through
V2-010F are the active authority for that correction.

ATLAS-V2-011 supersedes any interpretation of “recursive” that makes graph
types the semantic hierarchy. Graphs are projections from semantic knowledge.

## Clean-state rules

- One canonical semantic model and one recursive navigation model.
- Extraction and graph selection are domain-neutral; Safara is qualification,
  never production logic.
- Original document wording and evidence remain exact.
- Equivalent concepts are not duplicated by language.
- Graph semantics, hierarchy, and membership are backend-owned.
- The renderer is replaceable and never owns semantic truth.
- Reuse is allowed only for naturally graph-neutral infrastructure.
- No adapter may preserve workflow-only or fixed-tab behavior in v2.
- V1 removal is required for completion, not optional cleanup.
