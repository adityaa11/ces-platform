# SFE-000: SFE handoff adjustment map

- **State:** approved
- **Review batch:** BATCH-25
- **Depends on:** SFE phase scope approved; [GLF-001](../Git-Like_Fixture_Phase/GLF-001-shared-skill-contracts-and-execution-mode.md) and [GLF-002](../Git-Like_Fixture_Phase/GLF-002-skill-definitions-and-review-contract.md) approved
- **Baseline:** [SFE phase scope](SFE-README.md); [GLF-001 shared skill contracts and execution mode](../Git-Like_Fixture_Phase/GLF-001-shared-skill-contracts-and-execution-mode.md); [GLF-002 skill definitions and review contract](../Git-Like_Fixture_Phase/GLF-002-skill-definitions-and-review-contract.md); [Atlas Git-Like Knowledge Architecture Checkpoint](../ATLAS_GIT_LIKE_KNOWLEDGE_ARCHITECTURE_CHECKPOINT.md); the six skill contracts linked in the adjustment map

## Outcome

Provide a concrete index of the SFE-specific handoff adjustments for the shared skills. Each SFE implementation ticket identifies which map entries it consumes. SFE-000 is shared planning context; it does not implement or package changes for cherry-picking.

## Shared-skill intent and executor context

GLF-001/002 establish the shared bounded skills for
source-grounded extraction, repository assembly, staged changes, branch-aware
projections, and verification. SFE consumes those contracts and their
execution/review boundaries only; it creates the scenario-owned inputs and
candidate outputs that later SFE tickets validate.

SFE connects the UI lifecycle to those contracts as a user-driven semi-pipeline. In SFE, skills_mode codex coordinates UI requests, workspace-bound source files, skill calls, fixture transitions, and read views. A future skills_mode agents_bridge executor may automate more of that orchestration while calling the same contracts. The executor value records execution provenance; it does not change a skill's output meaning or grant it authority to approve or publish.

### SFE-M0 — Workspace-scoped source authority

Every SFE operation resolves source bytes only from its preceding SFE project or
workspace record under `docs/PRD/<project-id>/<workspace-id>/`. Filename
similarity does not establish source authority. Any input that cannot be
resolved from that record is a deterministic failure: the workspace remains
non-reviewable and moves to needs attention. This boundary applies to
implementation, fixture generation, validation, UI adapters, and both execution
modes.

## Concrete adjustment map

### SFE-M1 — Workspace-scoped extraction and complete source accounting

**Contract references:** [PRD extraction skill instructions](../../.agents/skills/atlas-prd-extraction/SKILL.md); [PRD extraction JSON contract](../../.agents/skills/atlas-prd-extraction/atlas-skill.json).

The SFE fixture layer owns upload custody and source identity. It records the bytes actually selected in the UI, the workspace-scoped file record and path, and a verified content hash. When extraction runs, it reads those stored bytes, extracts page text, and passes the skill a workspace-scoped artifact ID with the source metadata needed to preserve page provenance. Filenames or repository paths alone are not artifact identity.

The extraction contract returns candidate assertions, unaccounted statements, and questions, but it does not require a complete statement-inventory-to-destination relation. **SFE-002 owns implementing this shared contract handoff and preserving rich extraction:** refine the provider-neutral extraction instructions and payload conventions as needed to retain complete workflows, then either add a stable inventory-to-candidate/non-fact link to the extraction output or add an explicit deterministic SFE accounting artifact and make the adapter pass and validate it. Every material source statement must resolve to exactly one atomic candidate assertion; permitted non-facts must carry a concrete reason and any duplicate target. An inventory unit is a material claim at independently meaningful granularity, not necessarily a sentence, bullet, or page; split a compound passage into multiple linked inventory units when it contains independently meaningful facts or workflow steps. Each inventory entry retains stable statement ID, artifact ID, page, exact quote, classification, normalized interpretation, and its candidate or non-fact destination. A missing, ambiguous, or dangling destination prevents the SFE workspace from becoming Ready for review. The inventory covers every source page and records explicit empty-page accounting where appropriate. Automated checks prove structural completeness and link integrity; source review still confirms that the inventory and candidate payload preserve every material meaning.

This accounting is a coverage index over the extraction, not a replacement for it or a limit on its detail. Keep all independently meaningful source facts and the complete workflow semantics. Preserve actors and responsibilities, triggers and preconditions, ordered steps, conditions and branches, inputs and outputs, dependencies, status transitions, exceptions, commitments, constraints, and unresolved questions in structured candidate payloads and relationships. A long workflow must not be flattened into a generic fact or omitted because it needs several linked candidates. The inventory must point into the rich extraction so a reviewer can check both completeness and meaning.

For [SFE-004](SFE-004-repeat-initial-draft-cycle-for-project-two.md), run PDF 01 independently for project 02. Keep project, source-artifact, candidate, and execution IDs distinct across the two runs. Compare normalized content and source grounding while ignoring only generated identity and execution metadata.

**Tickets that consume this entry:** SFE-001 captures the selected bytes, file record, path, and hash without extracting. SFE-002 owns the provider-neutral extraction-contract or deterministic-accounting implementation and performs the full stored-file, page-text, artifact-ID, source-accounting, and rich-workflow handoff. SFE-004 repeats the updated extraction flow independently and compares its normalized semantic output while proving all run identities are distinct. SFE-006 records PDF 02 custody and hash without extracting. SFE-007 reuses the same complete extraction/accounting contract for PDF 02.

### SFE-M2 — Explicit extraction-results handoff into repository assembly

**Contract references:** [Fixture repository skill instructions](../../.agents/skills/atlas-fixture-repository/SKILL.md); [Fixture repository JSON contract](../../.agents/skills/atlas-fixture-repository/atlas-skill.json).

Repository assembly uses extracted candidates together with accepted base context. The current repository input schema names projectId, sourceArtifacts, requestedScenario, and optional baseRepository, but has no explicit extraction-results field. **SFE-002 owns updating the provider-neutral repository skill instructions and JSON contract** to name and validate extractionResults for extraction-backed scenarios, together with the accepted base where applicable. Assembly must retain links to the source artifact, accounting inventory, and candidate assertions, and fail closed if it receives only source-file metadata. Keep non-extraction repository scenarios valid without inventing extraction results.

Keep project/workspace requests, uploaded file paths and hashes, processing jobs, and lifecycle status in the SFE fixture layer. Workspace creation remains transient and outside immutable accepted repository truth.

**Tickets that consume this entry:** SFE-002 updates the shared repository contract and proves PDF 01 cannot be assembled from source metadata alone. SFE-004 and SFE-007 use the same explicit extraction-results handoff for their independent and incremental runs.

### SFE-M3 — Atomic change proposals and scenario-owned acceptance

**Contract references:** [Fixture changes skill instructions](../../.agents/skills/atlas-fixture-changes/SKILL.md); [Fixture changes JSON contract](../../.agents/skills/atlas-fixture-changes/atlas-skill.json); [Fixture repository skill](../../.agents/skills/atlas-fixture-repository/SKILL.md).

The changes contract returns one nullable ChangeProposal per call. For PDF 02, SFE-007 calls the changes skill once per affected semantic key, then collects the returned proposals as the workspace's reconciliation candidate. Preserve each proposal's own ID, target semantic key, before/proposed values, base revision, source provenance, and status. Do not collapse unrelated keys into one proposal or promote proposals as a side effect of collection.

SFE-005 records the scenario's already-completed approval/publication step as a deterministic SFE fixture transition. That transition creates a revision from project 02's accepted Initial Draft state and advances only project 02 Master, then updates the project 02 card and Master projections. Approval authority belongs to this scenario transition, not to the changes skill. SFE-007 proposals stay unapproved and do not advance Master.

**Tickets that consume this entry:** SFE-005 and SFE-007.

### SFE-M4 — Projections from accepted HEAD, candidate through review data

**Contract references:** [Fixture projections skill instructions](../../.agents/skills/atlas-fixture-projections/SKILL.md); [Fixture projections JSON contract](../../.agents/skills/atlas-fixture-projections/atlas-skill.json).

Generate current Workflow, Facts, CES, and chatbot_context projections from the relevant accepted branch HEAD and its resolved facts. After SFE-005, project 02's published views use the new accepted Master HEAD.

For SFE-007, use the selected base workspace's accepted HEAD, which is Master in the target scenario. Keep proposed PDF 02 values in the reconciliation candidate and review data; do not expose them as current accepted Facts or as current values in other read projections. An unapproved candidate leaves current values at the base. Still generate chatbot_context data from accepted facts for future chatbot wiring, but do not design or add chatbot UI/UX in SFE.

Route and switcher consumers resolve the projection and candidate-review data from fixture-owned project, workspace, branch, and HEAD identities rather than display labels.

**Tickets that consume this entry:** SFE-002, SFE-003, SFE-005, and SFE-007.

### SFE-M5 — Skill verification plus deterministic SFE scenario checks

**Contract references:** [Fixture verification skill instructions](../../.agents/skills/atlas-fixture-verification/SKILL.md); [Fixture verification JSON contract](../../.agents/skills/atlas-fixture-verification/atlas-skill.json).

Use the skill verifier for repository and projection invariants. Add deterministic SFE checks for the scenario facts the verifier does not own: file hash and workspace-scoped path; propagation and uniqueness of project, workspace, artifact, candidate, and execution IDs; project isolation; base-HEAD identity; candidate-versus-Master separation; rich extraction coverage; and the SFE-004 normalized comparison. When the scenario supplies distinct accepted HEADs, prove branch isolation without requiring an unapproved candidate to create a distinct accepted answer.

Make checks scenario-aware. An unapproved draft must leave current accepted values at its base; it must not fail because it has no distinct accepted answer. Where the fixture scenario has isolated branches or workspaces, show that a candidate or transition on one branch/project does not leak into another branch/project's accepted state. Verification reports findings and never repairs, approves, or publishes.

**Tickets that consume this entry:** SFE-001 through SFE-007, scoped to each ticket's lifecycle stage and listed checks.

### SFE-M6 — Workspace review projections for unapproved knowledge

**Contract references:** [Workspace review projections skill instructions](../../.agents/skills/atlas-workspace-review-projections/SKILL.md); [workspace review projections JSON contract](../../.agents/skills/atlas-workspace-review-projections/atlas-skill.json).

The accepted-HEAD projection skill remains the authority for Master reads. A
non-Master workspace instead needs a candidate-only review model that can be
shown without promoting its candidates or making the UI interpret raw
extraction. `atlas-workspace-review-projections` takes only the selected
workspace's complete extraction result, source accounting, and explicit base
context. It returns shared semantic groups and source-language annotations for
Main Workflow, Project Facts, and CES Result, with candidate and source
references retained internally for provenance and validation.

The review-projection skill is generic: it must not depend on a project ID,
workspace label, legacy fixture, translation table, or source-quote pattern.
The UI consumes its annotations as supplied; it must never expose candidate
IDs, semantic keys, raw payloads, or inferred display copy. Unsupported
grouping, wording, links, or CES basis remains `needs_resolution` rather than
becoming invented UI content.

**Tickets that consume this entry:** SFE-002-01 implements and validates the
contract. SFE-003-01 consumes a validated result in the three established read
routes. SFE-004 and SFE-007 reuse it for later non-Master review workspaces.

## Ticket lookup

| SFE ticket | Map entries to apply |
|---|---|
| [SFE-001](SFE-001-project-intake-and-initial-workspace.md) | SFE-M0 source isolation; SFE-M1 upload capture only; SFE-M5 file record, path, hash, and generated-ID checks |
| [SFE-002](SFE-002-initial-draft-extraction.md) | SFE-M0 source isolation; SFE-M1 extraction/accounting plus complete facts and workflows; SFE-M2 shared repository-contract update and extraction-results handoff; SFE-M4 candidate review versus accepted reads; SFE-M5 lifecycle, rich-coverage, and candidate/Master checks |
| [SFE-002-01](SFE-002-01-workspace-review-projections.md) | SFE-M0 selected-workspace authority; SFE-M1 complete extraction input; SFE-M4 separation from accepted projections; SFE-M5 review-model validation; SFE-M6 generic candidate-only review projection |
| [SFE-003](SFE-003-route-and-switcher-initial-draft-wiring.md) | SFE-M0 source isolation; SFE-M4 route/switcher reads; SFE-M5 project/workspace isolation checks |
| [SFE-003-01](SFE-003-01-semantic-initial-draft-workflow-projection.md) | SFE-M0 selected-workspace authority; SFE-M4 route/switcher accepted-read boundary; SFE-M5 route and isolation checks; SFE-M6 validated review-model consumption |
| [SFE-004](SFE-004-repeat-initial-draft-cycle-for-project-two.md) | SFE-M0 source isolation; SFE-M1 independent rich extraction and normalized comparison; SFE-M2 extraction-results handoff; SFE-M5 distinct IDs, project isolation, and comparison checks |
| [SFE-005](SFE-005-publish-project-two-initial-draft.md) | SFE-M0 source isolation; SFE-M3 deterministic project-02 acceptance; SFE-M4 projections from accepted Master HEAD; SFE-M5 publication, project isolation, and branch checks |
| [SFE-006](SFE-006-new-workspace-intake-from-switcher.md) | SFE-M0 source isolation; SFE-M1 upload capture only; SFE-M5 request/workspace ID, file path, hash, and base-HEAD checks |
| [SFE-007](SFE-007-extract-and-reconcile-new-workspace-prd.md) | SFE-M0 source isolation; SFE-M1 full rich extraction/accounting; SFE-M2 extraction-results handoff; SFE-M3 atomic proposals kept unapproved; SFE-M4 accepted-base reads plus chatbot_context; SFE-M5 scenario-aware candidate/base and branch-isolation checks |

## Boundaries

- The shared skills remain candidate-producing or advisory within their contracts. SFE-002 owns the SFE-M1 accounting handoff and the SFE-M2 provider-neutral repository-contract update; SFE-002-01 owns the generic non-Master review-projection contract; later SFE tickets reuse and validate them in both codex and future agents_bridge execution modes.
- Extraction completeness must not be achieved by reducing the skill to a statement checklist. Candidates retain detailed facts, workflow structure, relationships, and source meaning; the accounting artifact only proves that each material statement has a destination.
- SFE-000 assigns adjustments to downstream tickets; it does not itself edit skill contracts, implement app behavior, generate a fixture, or change another ticket's approval state.
- The accepted-HEAD changes, projections, and verification schemas remain unchanged. SFE-002-01 introduces the separate non-Master review-projection contract. SFE calls the changes skill per semantic key, supplies accepted HEAD/facts to accepted projections, and implements scenario-specific deterministic checks around the generic verifier. Any additional skill-contract change beyond SFE-M1/M2/M6 needs a separately reviewed scope update.

## Acceptance criteria

- The six concrete adjustments identify the contract gap or boundary, the required SFE handling, and the consuming tickets.
- Every SFE-001 through SFE-007 and their approved follow-up tickets identifies its assigned map entries.
- SFE-002 is explicitly responsible for the bounded extraction and repository skill-contract updates or deterministic accounting handoff required by SFE-M1/M2; SFE-004 and SFE-007 reuse and validate them.
- Extraction accounting is exhaustive without flattening facts, workflows, or their relationships into lossy or incomplete candidate data; source review still checks semantic coverage.
- Extraction accounting, repository handoff, atomic proposal staging, accepted-HEAD projections, and two-layer scenario verification preserve source, provenance, branch, and acceptance boundaries.
- Codex-mode semi-pipeline behavior, future agents_bridge compatibility, SFE-005 automatic scenario completion, and chatbot UI/UX exclusion remain explicit.
- No SFE-001 implementation authorization is implied until BATCH-25 passes and receives an explicit `go`.

## Validation

- Check every ticket lookup assignment against its SFE-000 map-entry reference.
- Check local contract and ticket links, and verify that review batches remain unique and sequential.
- Review extraction, repository, accepted projections, workspace review projections, changes, and verification claims against their JSON contracts and SFE-M0 through SFE-M6.

## Review question

Does this map tell each SFE ticket exactly which shared-skill handoff adjustments it must apply while preserving candidate authority, accepted HEAD semantics, and scenario-specific boundaries?
