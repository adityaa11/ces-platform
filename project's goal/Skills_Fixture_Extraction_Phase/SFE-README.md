# Skills Fixture Extraction Phase Ticket Set

- **State:** in_progress
- **Purpose:** Build a user-driven Safara fixture cycle from project creation through initial extraction, publication, and a second workspace extraction.
- **Baseline approval:** On 12 September 2026, the user approved the current Full Product Context and UI/UX Prototype PRD as written for this bounded ticket set. The source documents remain unchanged; this approval does not authorize implementation.

## Baseline

- [SFE-000 skill-to-SFE integration reference map](SFE-000-skills-to-sfe-integration-map.md)
- [Atlas Full Product Context](../Atlas_Full_Product_Context.md)
- [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md)
- [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md)
- [Atlas UI/UX Review Protocol](../Atlas_UI_UX_Review_Protocol.md)
- [Fixture Data-Intent Contract](../atlas-ui/FIXTURE_DATA_INTENT_CONTRACT.md)
- [AUI-002 Fixture scenarios and UI contracts](../atlas-ui/AUI-002-fixture-scenarios-and-ui-contracts.md)
- [AUI-004 Project library, upload, and processing experience](../atlas-ui/AUI-004-project-library-upload-and-processing.md)
- [GLF-003-02 Safara fact accounting](../Git-Like_Fixture_Phase/GLF-003-02-exhaustive-safara-fact-accounting.md)
- [GLF-003-03 Workspace-creation fixture contract](../Git-Like_Fixture_Phase/GLF-003-03-workspace-creation-fixture-contract.md)
- [GLF-004-01 Project-route fixture recalibration](../Git-Like_Fixture_Phase/GLF-004-01-project-route-fixture-recalibration.md)
- [GLF-004-02 Project creation intake and pipeline handoff](../Git-Like_Fixture_Phase/GLF-004-02-project-creation-intake-and-pipeline-handoff.md)
- [GLF-005-01 Workspace selector golden-fixture integration](../Git-Like_Fixture_Phase/GLF-005-01-workspace-selector-golden-fixture-integration.md)
- [GLF-005-02 New workspace modal and fixture handoff](../Git-Like_Fixture_Phase/GLF-005-02-new-workspace-modal-and-fixture-handoff.md)
- [Atlas PRD extraction skill](../../.agents/skills/atlas-prd-extraction/SKILL.md)
- [Atlas fixture repository skill](../../.agents/skills/atlas-fixture-repository/SKILL.md)
- [Atlas fixture changes skill](../../.agents/skills/atlas-fixture-changes/SKILL.md)
- [Atlas fixture projections skill](../../.agents/skills/atlas-fixture-projections/SKILL.md)
- [Atlas fixture verification skill](../../.agents/skills/atlas-fixture-verification/SKILL.md)

The UI/UX PRD remains marked Draft and the product-context document has no global approval marker. The user's approval is scoped to this ticket set; it does not change either document's status or approve unrelated requirements.

## Agreed scenario

SFE-000 is the concrete adjustment map for the skill-to-UI handoffs across this scenario. Once reviewed, each SFE ticket applies only the SFE-M entries listed in its ticket header and the SFE-000 ticket lookup; the map is shared context, not a source of implementation changes to cherry-pick.

All project cards and workspaces are created through the existing UI components. The user manually submits the Create a project modal for each project. The labels “project 01” and “project 02” identify the first and second independent scenario submissions only; they are never runtime IDs, paths, fixture keys, or seeded implementation data. Every ticket resolves the actual project, workspace, file, and provenance identity from its preceding modal or workspace-modal record. SFE-001 creates the first scenario project in Extracting, SFE-002 extracts its stored file into that same workspace, SFE-003 wires that resulting fixture, and SFE-004 repeats the path for a distinct second scenario project.

| Ticket | Project and user action | Resulting fixture state |
|---|---|---|
| SFE-001 | Submit Create a project with a valid, unique ID and Foundation Enrollment PDF 01. | Project card is Extracting; an empty Master and generated Extracting Initial Draft workspace exist; PDF 01 is already stored under the Initial Draft workspace ID. No extraction has run. |
| SFE-002 | Process the preceding modal-created project's existing Initial Draft request and stored PDF. | Extraction finishes; the same workspace receives the extracted fixture; card badge becomes Ready to review; Master remains empty. |
| SFE-003 | Connect that new bundle to the existing project route and switcher. | The route opens the Initial Draft; the switcher shows exactly Master (empty) and Initial Draft (extraction). |
| SFE-004 | Submit a new project with a distinct valid ID and PDF 01, then repeat SFE-001 through SFE-003. | A separate extraction and workspace are produced; normalized output and source grounding match SFE-002. |
| SFE-005 | Treat project 02's Initial Draft as approved and publish it. | Project 02's card is Published; its Initial Draft fixture is promoted to Master. Project 01 remains unchanged. |
| SFE-006 | Use + New workspace in project 02's workspace switcher and submit PDF 02 with the selected base. | A separate workspace is created in Extracting state, with its own generated workspace ID and source directory. |
| SFE-007 | Extract and reconcile PDF 02 against the selected base workspace. | The new workspace reaches Ready for review with a reconciliation candidate; the published Master remains the accepted baseline. |

The expected PDFs are `Safara_Incremental_PRD_01_Foundation_Enrollment-1.pdf` and `Safara_Incremental_PRD_02_Payment_Documents_Readiness.pdf`. The user plans to empty `docs/PRD/` before the manual run, so the app must use the bytes actually selected in the browser rather than relying on either file remaining at its former repository path.

### Approved scenario adjustment

On 13 September 2026, the user explicitly approved accepting whatever valid, unique project ID is entered through the Create a project modal. This replaces the earlier fixed-ID examples for SFE-001 and SFE-004; the example IDs remain useful test data only.

## Workspace and source-file identity

- Project IDs are supplied through the modal and accepted when valid and unique; the two scenario projects must use distinct IDs and remain independent fixture projects.
- The auto-generated initial workspace is named `Initial Draft`. Each project also has a `Master` workspace, which starts empty and has no accepted published work.
- SFE-001 generates the Initial Draft workspace ID using the agreed form: the first three characters of the project ID, a hyphen, and a compact UUID-derived token using the approved lowercase base32 format (12 characters).
- Uploaded PRD files are stored by workspace immediately: `docs/PRD/<project-id>/<workspace-id>/<uploaded-filename.pdf>`. SFE-002 consumes the same workspace ID and stored file; it does not generate a replacement ID or move the source file.
- In project 02, PDF 01 is stored under its Initial Draft workspace and PDF 02 under the separate workspace created in SFE-006. No file is assigned to a project-only directory or the wrong workspace.
- SFE-005 promotes accepted project 02 Initial Draft fixtures into Master without deleting their source workspace or history. SFE-007's unapproved candidate does not change accepted Master truth.

## Delivery order

Each ticket has its own review batch because each checkpoint changes a data or interaction contract used by the next.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 0 | [SFE-000 / BATCH-25](SFE-000-skills-to-sfe-integration-map.md) | approved | Completed GLF skill and integration decisions | Does the map connect the five shared skill contracts to SFE without changing their authority or bypassing a gate? |
| 1 | [SFE-001 / BATCH-26](SFE-001-project-intake-and-initial-workspace.md) | approved | SFE-000 approved; GLF-004-02 approval; GLF-004-01; GLF-003-03; AUI-004 | Does the project modal create the Extracting card, workspace ID, empty Master, Initial Draft workspace, and workspace-scoped PDF path without extracting? |
| 2 | [SFE-002 / BATCH-27](SFE-002-initial-draft-extraction.md) | awaiting_review | SFE-000 approved; SFE-001; GLF-003-02 | Does processing use that exact workspace ID and file to extract PDF 01 and transition the project card to Ready to review? |
| 3 | [SFE-003 / BATCH-28](SFE-003-route-and-switcher-initial-draft-wiring.md) | planned | SFE-000 approved; SFE-002; GLF-004-01; GLF-005-01 | Do the existing project route and selector expose the empty Master and populated Initial Draft from the same generated fixture? |
| 4 | [SFE-004 / BATCH-29](SFE-004-repeat-initial-draft-cycle-for-project-two.md) | planned | SFE-000 approved; SFE-003; GLF-003-02 | Does creating project 02 through the same components independently reproduce the project 01 extraction output? |
| 5 | [SFE-005 / BATCH-30](SFE-005-publish-project-two-initial-draft.md) | planned | SFE-000 approved; SFE-004; fixture changes and repository contracts | Does publishing project 02's Initial Draft promote its accepted fixtures to Master and update the card to Published without changing project 01? |
| 6 | [SFE-006 / BATCH-31](SFE-006-new-workspace-intake-from-switcher.md) | planned | SFE-000 approved; SFE-005; GLF-003-03; GLF-005-02 | Does + New workspace create an Extracting workspace from the chosen base and store PDF 02 under its generated workspace ID? |
| 7 | [SFE-007 / BATCH-32](SFE-007-extract-and-reconcile-new-workspace-prd.md) | planned | SFE-000 approved; SFE-006; PRD extraction, changes, projection, and verification contracts | Does PDF 02 produce a Ready-to-review reconciliation candidate against the selected base while preserving Master truth? |

## Dependency gate

The completed GLF delivery record at `d45e869` marks GLF-004-02 and its other SFE prerequisites approved; the BATCH-20.2 checkpoint passed at `3c4c354` and its post-pass regression check passed at `39add96`. The historical GLF-004-02 ticket header remains `awaiting_review`, but the completed GLF delivery record is the phase-level status source for this SFE dependency. SFE-001 therefore remains planned only because SFE-000 must pass BATCH-25 and receive an explicit `go`; this new ticket set neither reopens nor bypasses the completed GLF gate.

## Review controls

- SFE-000 and SFE-001 are `approved`. SFE-002 is `awaiting_review` against the persisted modal-created fixture. SFE-003 through SFE-007 remain `planned`. This ticket set does not authorize a later implementation batch until its dependencies and review controls allow it.
- Implement only the currently authorized ticket or review batch. Do not start the next batch until the current batch has a PASS review and the user says `go`.
- UI batches require rendered browser validation for the connected component flow, supported responsive widths and themes, and keyboard/focus behavior.
- Fixture batches validate source provenance, stable project/workspace IDs, branch/workspace relationships, and proposal-versus-accepted-truth boundaries.
- `ck`, `cfc`, and `go` follow the environment's `atlas-review-workflow` skill.
