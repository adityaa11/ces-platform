# SFE-007: Extract and reconcile the new workspace PRD

> **Runtime identity:** Resolve the target project and SFE-006 workspace from their fixture records. “Project 01” and “project 02” are scenario labels only and must never select runtime data.

- **State:** planned
- **Review batch:** BATCH-32
- **Depends on:** SFE-000 approved; SFE-006 approved; Atlas PRD extraction, fixture changes, projections, and verification contracts approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md) sections 5, 17–18, 22.1–22.8; [Atlas PRD extraction skill](../../.agents/skills/atlas-prd-extraction/SKILL.md); [Atlas fixture repository skill](../../.agents/skills/atlas-fixture-repository/SKILL.md); [Atlas fixture changes skill](../../.agents/skills/atlas-fixture-changes/SKILL.md); [Atlas fixture projections skill](../../.agents/skills/atlas-fixture-projections/SKILL.md); [Atlas fixture verification skill](../../.agents/skills/atlas-fixture-verification/SKILL.md)
- **SFE-000 map entries:** SFE-M0 source isolation; SFE-M1 full extraction/accounting; SFE-M2 extraction-results handoff; SFE-M3 atomic proposals kept unapproved; SFE-M4 accepted-base reads plus chatbot_context; SFE-M5 scenario-aware candidate/base and branch-isolation checks
- **Source authority:** Reconcile only the SFE-006 workspace artifact against its captured accepted base; see the [SFE workspace-source rule](SFE-README.md#sfe-workspace-source-rule).

## Outcome

Extract PDF 02 in the SFE-006 workspace, reconcile its candidate knowledge against that workspace's selected base, and make the completed extraction available for review without silently publishing it. Resolve the project and workspace IDs from SFE-006; “project 02” is a scenario label only.

## Scope

- Resolve PDF 02, project ID, new workspace ID, and the selected base workspace/HEAD from the SFE-006 request and file record.
- Run extraction only for PDF 02. Use the selected base's accepted materialized state for reconciliation; do not rescan PDF 01 or substitute Master if another valid base was explicitly selected.
- Apply the complete SFE-M1 extraction and accounting contract from SFE-002. Produce source-grounded candidate assertions that preserve every material fact and full workflow structure, including relationships, ordering, conditions, branches, dependencies, inputs, outputs, exceptions, and unresolved questions.
- Produce one changes-skill proposal per affected semantic key and collect those atomic proposals into the reconciliation candidate. Keep every proposal tied to the captured base revision and exact PDF/page/excerpt provenance; do not approve or publish them.
- Generate read projections from the selected base's accepted HEAD and resolved facts. Keep PDF 02 values in candidate-review data, and generate chatbot_context from accepted facts for future wiring without adding chatbot UI/UX.
- Transition the new workspace from Extracting to Ready for review and enable its route/switcher entry after verification passes.
- Keep project 02's accepted Master and Published card state intact. The PDF 02 candidate is not approved or published by this ticket.

## Out of scope

- Approval or publication of PDF 02.
- Replacing Master truth with candidate values or projecting unapproved assertions as current accepted facts.
- Changing project 01 or rerunning its extraction.

## Acceptance criteria

- The extraction request consumes only the PDF 02 bytes under `docs/PRD/<project-id>/<new-workspace-id>/` and records their exact content hash.
- Every candidate/reconciliation item identifies the selected base workspace and captured base HEAD and retains exact PDF 02 source excerpt/page provenance.
- The source-accounting inventory covers every material PDF 02 fact and workflow unit and links each to its detailed candidate assertion or a justified non-fact. The accounting layer does not replace, summarize, or flatten the extraction.
- Change proposals are atomic per semantic key and remain unapproved. Current accepted read values stay at the selected base; the workspace does not need to invent a distinct accepted answer to pass verification.
- The new workspace becomes Ready for review and openable only after extraction, reconciliation, and verification pass. Its switcher row and route resolve the same generated workspace ID.
- Project 02 Master remains the accepted published Foundation state. Unapproved PDF 02 candidate values do not appear as accepted Master facts or projections.
- The switcher retains Master, Initial Draft, and the new Ready-to-review workspace, with selected project/workspace state kept distinct from the PRD lens.
- Extraction or verification failure leaves the workspace in a visible needs-attention state and does not mark it Ready for review.

## Validation

- Run all declared skill contracts in order and validate their inputs/outputs, execution provenance, branch/workspace IDs, base HEAD, source accounting, rich workflow extraction, atomic proposal set, source grounding, and reconciliation relationships.
- Verify only PDF 02 is processed against the selected base and project 01/project 02 Master remain unchanged by the unapproved candidate.
- Exercise the route and selector through Master, Initial Draft, Extracting, and Ready-to-review workspace states, including reload and unavailable-state behavior.
- Run the generic skill verifier plus the deterministic SFE checks from SFE-M5, including the unapproved-candidate/base boundary. Where the scenario provides distinct accepted HEADs, prove branch isolation without requiring PDF 02 to create a different accepted current value.
- Run fixture integrity and route tests; inspect the complete browser flow at supported responsive widths and themes and record the visual/accessibility review evidence.
