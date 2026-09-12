# SFE-000: SFE handoff adjustment map

- **State:** awaiting_review
- **Review batch:** BATCH-25
- **Depends on:** SFE phase scope approved; completed GLF skill and integration decisions for GLF-002, GLF-003, GLF-004, and GLF-005
- **Baseline:** [SFE phase scope](SFE-README.md); [GLF ticket set](../Git-Like_Fixture_Phase/README.md); [GLF-003-02 exhaustive source accounting](../Git-Like_Fixture_Phase/GLF-003-02-exhaustive-safara-fact-accounting.md); [GLF-003-03 workspace boundary](../Git-Like_Fixture_Phase/GLF-003-03-workspace-creation-fixture-contract.md); [GLF-003 repository and branch-isolation contract](../Git-Like_Fixture_Phase/GLF-003-golden-fixture-data-contract.md); the five skill contracts linked in the adjustment map

## Outcome

Provide a concrete index of the SFE-specific handoff adjustments inherited from GLF. Each SFE implementation ticket identifies which map entries it consumes. SFE-000 is shared planning context; it does not implement or package changes for cherry-picking.

## GLF intent and executor context

GLF designed five bounded, candidate-producing skills for source-grounded extraction, repository assembly, staged changes, branch-aware projections, and verification. The contracts expose structured inputs and outputs and allow both Codex and vendor-model agents to use them. GLF established those contracts and architectural boundaries before the product UI could connect them.

SFE connects the UI lifecycle to those contracts as a user-driven semi-pipeline. In SFE, skills_mode codex coordinates UI requests, workspace-bound source files, skill calls, fixture transitions, and read views. A future skills_mode agents_bridge executor may automate more of that orchestration while calling the same contracts. The executor value records execution provenance; it does not change a skill's output meaning or grant it authority to approve or publish.

## Concrete adjustment map

### SFE-M1 — Workspace-scoped extraction and complete source accounting

**Contract references:** [PRD extraction skill instructions](../../.agents/skills/atlas-prd-extraction/SKILL.md); [PRD extraction JSON contract](../../.agents/skills/atlas-prd-extraction/atlas-skill.json); [GLF-003-02](../Git-Like_Fixture_Phase/GLF-003-02-exhaustive-safara-fact-accounting.md).

The SFE fixture layer owns upload custody and source identity. It records the bytes actually selected in the UI, the workspace-scoped file record and path, and a verified content hash. When extraction runs, it reads those stored bytes, extracts page text, and passes the skill a workspace-scoped artifact ID with the source metadata needed to preserve page provenance. Filenames or repository paths alone are not artifact identity.

The extraction contract returns candidate assertions, unaccounted statements, and questions, but it does not require a complete statement-inventory-to-destination relation. **SFE-002 owns implementing this shared contract handoff and preserving rich extraction:** refine the provider-neutral extraction instructions and payload conventions as needed to retain complete workflows, then either add a stable inventory-to-candidate/non-fact link to the extraction output or add an explicit deterministic SFE accounting artifact and make the adapter pass and validate it. Every material source statement must resolve to exactly one atomic candidate assertion; permitted non-facts must carry a concrete reason and any duplicate target. An inventory unit is a material claim at independently meaningful granularity, not necessarily a sentence, bullet, or page; split a compound passage into multiple linked inventory units when it contains independently meaningful facts or workflow steps. Each inventory entry retains stable statement ID, artifact ID, page, exact quote, classification, normalized interpretation, and its candidate or non-fact destination. A missing, ambiguous, or dangling destination prevents the SFE workspace from becoming Ready for review. The inventory covers every source page and records explicit empty-page accounting where appropriate. Automated checks prove structural completeness and link integrity; source review still confirms that the inventory and candidate payload preserve every material meaning.

This accounting is a coverage index over the extraction, not a replacement for it or a limit on its detail. Keep all independently meaningful source facts and the complete workflow semantics. Preserve actors and responsibilities, triggers and preconditions, ordered steps, conditions and branches, inputs and outputs, dependencies, status transitions, exceptions, commitments, constraints, and unresolved questions in structured candidate payloads and relationships. A long workflow must not be flattened into a generic fact or omitted because it needs several linked candidates. The inventory must point into the rich extraction so a reviewer can check both completeness and meaning.

For [SFE-004](SFE-004-repeat-initial-draft-cycle-for-project-two.md), run PDF 01 independently for project 02. Keep project, source-artifact, candidate, and execution IDs distinct across the two runs. Compare normalized content and source grounding while ignoring only generated identity and execution metadata.

**Tickets that consume this entry:** SFE-001 captures the selected bytes, file record, path, and hash without extracting. SFE-002 owns the provider-neutral extraction-contract or deterministic-accounting implementation and performs the full stored-file, page-text, artifact-ID, source-accounting, and rich-workflow handoff. SFE-004 repeats the updated extraction flow independently and compares its normalized semantic output while proving all run identities are distinct. SFE-006 records PDF 02 custody and hash without extracting. SFE-007 reuses the same complete extraction/accounting contract for PDF 02.

### SFE-M2 — Explicit extraction-results handoff into repository assembly

**Contract references:** [Fixture repository skill instructions](../../.agents/skills/atlas-fixture-repository/SKILL.md); [Fixture repository JSON contract](../../.agents/skills/atlas-fixture-repository/atlas-skill.json); [GLF-003-03](../Git-Like_Fixture_Phase/GLF-003-03-workspace-creation-fixture-contract.md).

GLF-003 requires repository assembly to use extracted candidates together with accepted base context. The current repository input schema names projectId, sourceArtifacts, requestedScenario, and optional baseRepository, but has no explicit extraction-results field. **SFE-002 owns updating the provider-neutral repository skill instructions and JSON contract** to name and validate extractionResults for extraction-backed scenarios, together with the accepted base where applicable. Assembly must retain links to the source artifact, accounting inventory, and candidate assertions, and fail closed if it receives only source-file metadata. Keep non-extraction repository scenarios valid without inventing extraction results.

Keep project/workspace requests, uploaded file paths and hashes, processing jobs, and lifecycle status in the SFE fixture layer. GLF-003-03 deliberately keeps workspace creation transient and outside immutable accepted repository truth.

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

**Contract references:** [Fixture verification skill instructions](../../.agents/skills/atlas-fixture-verification/SKILL.md); [Fixture verification JSON contract](../../.agents/skills/atlas-fixture-verification/atlas-skill.json); [GLF-003 repository, provenance, and branch-isolation gates](../Git-Like_Fixture_Phase/GLF-003-golden-fixture-data-contract.md).

Use the skill verifier for repository and projection invariants. Add deterministic SFE checks for the scenario facts the verifier does not own: file hash and workspace-scoped path; propagation and uniqueness of project, workspace, artifact, candidate, and execution IDs; project isolation; base-HEAD identity; candidate-versus-Master separation; rich extraction coverage; and the SFE-004 normalized comparison. Apply GLF's distinct-answer branch-isolation proof when the fixture scenario supplies distinct accepted HEADs; do not require an unapproved candidate to create a distinct accepted answer.

Make checks scenario-aware. An unapproved draft must leave current accepted values at its base; it must not fail because it has no distinct accepted answer. Where the fixture scenario has isolated branches or workspaces, preserve GLF's branch-isolation proof by showing that a candidate or transition on one branch/project does not leak into another branch/project's accepted state. Verification reports findings and never repairs, approves, or publishes.

**Tickets that consume this entry:** SFE-001 through SFE-007, scoped to each ticket's lifecycle stage and listed checks.

## Ticket lookup

| SFE ticket | Map entries to apply |
|---|---|
| [SFE-001](SFE-001-project-intake-and-initial-workspace.md) | SFE-M1 upload capture only; SFE-M5 file record, path, hash, and generated-ID checks |
| [SFE-002](SFE-002-initial-draft-extraction.md) | SFE-M1 extraction/accounting plus complete facts and workflows; SFE-M2 shared repository-contract update and extraction-results handoff; SFE-M4 candidate review versus accepted reads; SFE-M5 lifecycle, rich-coverage, and candidate/Master checks |
| [SFE-003](SFE-003-route-and-switcher-initial-draft-wiring.md) | SFE-M4 route/switcher reads; SFE-M5 project/workspace isolation checks |
| [SFE-004](SFE-004-repeat-initial-draft-cycle-for-project-two.md) | SFE-M1 independent rich extraction and normalized comparison; SFE-M2 extraction-results handoff; SFE-M5 distinct IDs, project isolation, and comparison checks |
| [SFE-005](SFE-005-publish-project-two-initial-draft.md) | SFE-M3 deterministic project-02 acceptance; SFE-M4 projections from accepted Master HEAD; SFE-M5 publication, project isolation, and branch checks |
| [SFE-006](SFE-006-new-workspace-intake-from-switcher.md) | SFE-M1 upload capture only; SFE-M5 request/workspace ID, file path, hash, and base-HEAD checks |
| [SFE-007](SFE-007-extract-and-reconcile-new-workspace-prd.md) | SFE-M1 full rich extraction/accounting; SFE-M2 extraction-results handoff; SFE-M3 atomic proposals kept unapproved; SFE-M4 accepted-base reads plus chatbot_context; SFE-M5 scenario-aware candidate/base and branch-isolation checks |

## Boundaries

- The five skills remain candidate-producing or advisory within their contracts. SFE-002 owns the SFE-M1 accounting handoff and the SFE-M2 provider-neutral repository-contract update; later SFE tickets reuse and validate them in both codex and future agents_bridge execution modes.
- Extraction completeness must not be achieved by reducing the skill to a statement checklist. Candidates retain detailed facts, workflow structure, relationships, and source meaning; the accounting artifact only proves that each material statement has a destination.
- The map preserves the completed GLF authorization boundary. The GLF phase closeout at `d45e869` records GLF-004-02 as approved after its passing BATCH-20.2 reviews (`3c4c354` and `39add96`); SFE-001 cannot start implementation until SFE-000 is approved and receives its own explicit `go`.
- SFE-000 assigns adjustments to downstream tickets; it does not itself edit skill contracts, implement app behavior, generate a fixture, or change GLF approval state.
- No changes to the changes, projections, or verification schemas are required by this map. SFE calls the changes skill per semantic key, supplies accepted HEAD/facts to projections, and implements scenario-specific deterministic checks around the generic verifier. Any additional skill-contract change beyond SFE-M1/M2 needs a separately reviewed scope update.

## Acceptance criteria

- The five concrete adjustments identify the contract gap or boundary, the required SFE handling, and the consuming tickets.
- Every SFE-001 through SFE-007 ticket identifies its assigned map entries.
- SFE-002 is explicitly responsible for the bounded extraction and repository skill-contract updates or deterministic accounting handoff required by SFE-M1/M2; SFE-004 and SFE-007 reuse and validate them.
- Extraction accounting is exhaustive without flattening facts, workflows, or their relationships into lossy or incomplete candidate data; source review still checks semantic coverage.
- Extraction accounting, repository handoff, atomic proposal staging, accepted-HEAD projections, and two-layer scenario verification preserve the GLF source, provenance, branch, and acceptance boundaries.
- Codex-mode semi-pipeline behavior, future agents_bridge compatibility, SFE-005 automatic scenario completion, and chatbot UI/UX exclusion remain explicit.
- GLF-004-02 is satisfied through the completed GLF phase record; no SFE-001 implementation authorization is implied until BATCH-25 passes and receives an explicit `go`.

## Validation

- Check every ticket lookup assignment against its SFE-000 map-entry reference.
- Check local contract and ticket links, and verify that review batches remain unique and sequential.
- Review extraction, repository, changes, projections, and verification claims against their JSON contracts and GLF-003-02/03 decisions.

## Review question

Does this map tell each SFE ticket exactly which GLF-to-SFE handoff adjustments it must apply while preserving candidate authority, accepted HEAD semantics, and scenario-specific boundaries?
