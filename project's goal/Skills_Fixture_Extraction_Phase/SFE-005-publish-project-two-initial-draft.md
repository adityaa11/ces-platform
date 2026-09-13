# SFE-005: Publish project 02's Initial Draft to Master

- **State:** planned
- **Review batch:** BATCH-30
- **Depends on:** SFE-000 approved; SFE-004 approved; Atlas fixture repository, changes, and verification contracts approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md) sections 17, 18, 22.3–22.8; [Atlas fixture repository skill](../../.agents/skills/atlas-fixture-repository/SKILL.md); [Atlas fixture changes skill](../../.agents/skills/atlas-fixture-changes/SKILL.md); [Atlas fixture verification skill](../../.agents/skills/atlas-fixture-verification/SKILL.md)
- **SFE-000 map entries:** SFE-M0 source isolation; SFE-M3 deterministic project-02 acceptance; SFE-M4 projections from accepted Master HEAD; SFE-M5 publication, project isolation, and branch checks
- **Source authority:** Publish only the accepted SFE-004 Initial Draft candidate and provenance; see the [SFE workspace-source rule](SFE-README.md#sfe-workspace-source-rule).
- **Runtime identity:** “Project 02” means the distinct project record returned by SFE-004's modal submission; resolve all IDs, paths, and records from that result.

## Outcome

Treat the distinct second scenario project's SFE-004 Initial Draft as approved and publish it to Master as a completed scenario step. Resolve its identity from SFE-004; “project 02” is a scenario label only. The card then shows Published, and the accepted fixture state from Initial Draft is represented in Master with complete provenance.

## Scope

- Apply the scenario's completed approval/publication transition to project 02 only; do not require a user approval click for this ticket.
- Promote every accepted fixture element from project 02's Initial Draft into its Master through the repository/change contracts, preserving source, candidate, assertion, and revision provenance.
- Preserve the Initial Draft workspace and its history after publication. Master becomes the current published workspace containing the accepted state.
- Update project 02's card badge and published metrics from the fixture state. Leave project 01's card and workspace unchanged.

## Out of scope

- Publishing project 01.
- Creating the PDF 02 workspace or auto-approving PDF 02; SFE-006 and SFE-007 own that work, and PDF 02 remains a review candidate.
- Editing source PDFs or bypassing skill contracts with a hand-authored Master projection.

## Acceptance criteria

- Project 02 Master contains the accepted Foundation assertions from its own Initial Draft and has a new published revision with parent/base and execution provenance.
- Every promoted fixture relationship resolves in Master; no Initial Draft extraction/source history is lost or reassigned to project 01.
- The project 02 card badge changes to Published and its Master summary describes published work. Project 01 remains Ready to review with no Master.
- Publishing is idempotence-checked: the same completed transition cannot create duplicate assertions or duplicate Master revisions.
- All projections of accepted Foundation truth are generated from the published Master HEAD. No PDF 02 candidate exists yet and no second-increment fact is attributed to Master.

## Validation

- Run repository, changes, projection, and verification skill contracts for project 02's publication candidate.
- Check the Initial Draft-to-Master revision lineage, promotion accounting, source/candidate provenance, current Master HEAD, and derived project-card status.
- Verify project 01 remains isolated and project 02's Initial Draft remains available as historical context in the workspace selector.
