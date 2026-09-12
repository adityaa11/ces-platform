# SFE-002: Extract into the existing Initial Draft workspace

- **State:** planned
- **Review batch:** BATCH-27
- **Depends on:** SFE-000 approved; SFE-001 approved; GLF-003-02 approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas Full Product Context](../Atlas_Full_Product_Context.md) source-grounding and incremental-PRD principles; [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md) sections 5, 17, 22.1–22.8; [GLF-003-02](../Git-Like_Fixture_Phase/GLF-003-02-exhaustive-safara-fact-accounting.md); [GLF-003-03](../Git-Like_Fixture_Phase/GLF-003-03-workspace-creation-fixture-contract.md); [Atlas PRD extraction skill](../../.agents/skills/atlas-prd-extraction/SKILL.md); [Atlas PRD extraction JSON contract](../../.agents/skills/atlas-prd-extraction/atlas-skill.json); [Atlas fixture repository skill](../../.agents/skills/atlas-fixture-repository/SKILL.md); [Atlas fixture repository JSON contract](../../.agents/skills/atlas-fixture-repository/atlas-skill.json); [Atlas fixture verification skill](../../.agents/skills/atlas-fixture-verification/SKILL.md)
- **SFE-000 map entries:** SFE-M1 full extraction/accounting; SFE-M2 extraction-results handoff; SFE-M4 candidate review versus accepted reads; SFE-M5 lifecycle and candidate/Master checks

## Outcome

Process project 01's PDF 01 into the Initial Draft workspace and ID created by SFE-001, bind the extraction fixture to that existing identity, and transition the project card from Extracting to Ready to review.

## Scope

- Implement the SFE-M1 extraction handoff: update the provider-neutral extraction skill contract to expose stable source-statement accounting links, or produce the deterministic SFE accounting artifact specified by SFE-000 and validate it before Ready to review.
- Implement the SFE-M2 repository handoff: update the provider-neutral repository skill contract to accept and require explicit extraction results for extraction-backed scenarios. The repository candidate must be built from those results and the applicable accepted base, not source-file metadata alone.
- Refine the provider-neutral PRD-extraction instructions and payload conventions as needed so the skill extracts complete facts and workflows as structured, related candidate assertions. Keep the accounting inventory as a coverage index over that rich extraction. Preserve actors, responsibilities, triggers, ordered steps, conditions, branches, inputs, outputs, dependencies, state transitions, exceptions, and unresolved questions. Keep related candidates linked so the complete workflow can be reconstructed; do not flatten it into a generic summary or inventory-only result.

- Resolve the processing request, existing Initial Draft workspace ID, and uploaded PDF by the project ID from SFE-001's project card and fixture record.
- Run the PRD extraction workflow on the exact PDF bytes already stored under `docs/PRD/<project-id>/<initial-draft-workspace-id>/`; do not generate a replacement workspace ID or copy the file to another workspace path.
- Associate candidate output, execution provenance, and page-grounded source references with the existing Initial Draft workspace ID.
- Keep the project's canonical `Master` workspace empty, with no published work. Initial Draft holds the new extraction candidate and remains unapproved.
- When processing finishes, update the project card's status badge to Ready to review. At this checkpoint the review action may still show unavailable until SFE-003 wires the new bundle to the existing route UI.

## Out of scope

- Generating or replacing project/workspace IDs and moving uploaded PDFs; SFE-001 owns those operations.
- Route/switcher integration; SFE-003 owns opening and selecting the generated workspaces.
- Approving the Initial Draft or publishing it to Master; SFE-005 owns that scenario for project 02.
- Extracting PDF 02 or changing accepted project truth.

## Acceptance criteria

- Every material claim at independently meaningful granularity is accounted for by exactly one atomic candidate assertion or a permitted non-fact with a concrete reason and duplicate target where applicable; compound passages are split into linked inventory units when they contain distinct facts or workflow steps. The inventory retains stable statement/artifact IDs, page, exact quote, classification, normalized interpretation, and destination; missing or dangling links block Ready to review.
- Candidate output preserves complete source meaning and workflow structure in its detailed, structured payloads and relationships. Accounting coverage does not reduce candidate detail, omit a workflow, or cap the number of assertions.
- The extraction invocation uses the workspace-scoped artifact ID linked to the stored file record and verified hash. The repository input contains an explicit, validated extraction-results handoff and the correct accepted base where applicable; source metadata without extracted candidates is rejected.
- The updated extraction and repository contracts remain provider-neutral and usable in both codex and agents_bridge modes.

- The workspace ID already created by SFE-001 is used consistently by the workspace record, extraction job, candidate fixture, PRD record, and provenance; SFE-002 does not mint another ID.
- The file remains at `docs/PRD/<project-id>/<workspace-id>/<uploaded-filename.pdf>` and its hash matches the bytes submitted through the project modal.
- The extraction fixture contains candidate assertions and ambiguities with exact source document, excerpt, and page grounding. It is explicitly a proposal, not accepted truth.
- The project card transitions from Extracting to Ready to review only after the extraction fixture and workspace relationships validate.
- The project's Master workspace exists and is empty. The Initial Draft workspace has the generated name and ID, contains the extraction fixture, and is not represented as published.
- If the skill pipeline or structural/provenance checks fail, processing ends in a visible needs-attention state and does not advertise Ready to review.

## Validation

- Validate the updated extraction and repository JSON contracts and instructions, then run them with project 01's uploaded bytes in codex mode; verify the same declared contracts remain valid for agents_bridge mode.
- Review the source page by page to confirm every material fact and workflow is represented; test exact quotes/pages, workflow-step and relationship preservation, unresolved questions, empty-page accounting, and negative cases for missing/dangling inventory destinations and repository assembly without extraction results.
- Run the fixture-verification skill and the deterministic SFE checks specified by SFE-000.

- Run the extraction and fixture-verification skills for project 01's uploaded bytes and validate their declared inputs and outputs.
- Verify ID propagation across records, unchanged source path/hash, exact page provenance, and Extracting-to-Ready-to-review transition.
- Verify Master remains empty, Initial Draft contains the candidate, and no approval/revision or published projection was created.
- Test duplicate/collision handling and an extraction/provenance failure without corrupting the prior valid fixture.
