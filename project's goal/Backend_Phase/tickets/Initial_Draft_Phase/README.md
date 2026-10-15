# Atlas Initial Draft Semantic Extraction and Reconciliation Ticket Set

- **State:** `in_progress`; IDSER-001 is approved at `a64c62b`, IDSER-002 is
  approved at `5bf1bbb`, IDSER-003 is approved at `3dbd7dc`, IDSER-004 is
  approved at `9b36ee8`, IDSER-005 at `2707518`, IDSER-006 at `266f5a3`, and
  IDSER-007 at `c890410`, IDSER-008 at `ec1e973`, IDSER-009-02 at `64f7072`,
  IDSER-009-03 at `2a6a8f0`, and IDSER-009-04 at `286eaee`.
- **Prefix:** `IDSER`; one bounded executable ticket per review batch.
  IDSER-009, IDSER-010, IDSER-011, IDSER-012, IDSER-012-01, IDSER-012-01-03 and IDSER-012-02 are umbrella partition records, not executable GO
  targets; their child batches carry implementation and proof authority.
- **Primary baseline:** [Initial Draft implementation context](../../atlas-initial-draft-semantic-extraction-reconciliation-implementation-context.md), sections 1-45, AC-01 through AC-44.
- **Staged pipeline planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), which supersedes the earlier staged-worker context where they conflict.
- **RUN-003 context:** [Canonical evidence-preservation implementation context](../../IDSER-012-01-03-docling-evidence-preservation-implementation-context.md) controls `-01-03-01` and `-01-03-02`. `-03-01` does not authorize image-enabled production activation.
- **Hard predecessor:** [PCC-006](../Project_Cards_Phase/PCC-006-project-card-creation-e2e-and-regression-checkpoint.md) `PASS`; the [PCC set](../Project_Cards_Phase/README.md) remains frozen.
- **Planning inspection:** branch `codex/new-atlas-backend`, HEAD `1e2fb34db561f8b27d4a284ad2db2dba4b8ff183`, 2026-10-01. IDSER-011 was repartitioned against BSS-008/009, actual worker/provider/Atlas seams, the approved IDSER-010 series and current Compose harnesses.

## Current normal perception predecessor (2026-10-15)

For future staged-policy work, **PERC-RESET-008 has independent CK PASS** and its [RUN-003 Canonical Perception Baseline](../../../feedback/CANONICAL-PERCEPTION-BASELINE-v1.md) is the sole normal local digital-PDF perception/normalized-evidence regression predecessor. See the [perception winner ledger](../../../feedback/IDSER-PERCEPTION-WINNER-AUTHORITY-MAP-20261015.md). Local perception is `docling-run-003-capture` / `atlas-digital-pdf-run-003-capture-v1`, private Docling CPU (no OCR), verified derived assets for captured visuals, valid zero-visual results, staged fair local admission, and durable `perceived` with **zero unsolicited semantic jobs**. Approved `IDSER-012-01` children remain frozen accepted implementation proofs. Old image-disabled Docling, qualification-only or Mistral OCR perception is not a selectable normal fallback or a future regression gate.

The legacy D1→reconciliation→D2 sequence and old `IDSER-011` Mistral OCR acceptance entries below are **historical** for current staged perception. `IDSER-011-01..04` are now `superseded-unimplemented` (the whole original Mistral-first batches are retired); their future perception clauses are superseded, while legitimate external-provider/semantic/reconciliation quality, privacy, scope and integrity obligations await separate alignment under the [semantic winner ledger](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md). The current scoped edit does not silently PASS or execute those four tickets and does not alter approved historical tests. This is **not** an OCR/scanned-PDF or visual-meaning qualification.

## Audited future implementation status (2026-10-15)

The [terminal disposition register](../../../feedback/IDSER-PERCEPTION-TICKET-DISPOSITION-20261015.md) resolves the previous misleading `planned` statuses. `IDSER-011-01..04`: **superseded-unimplemented, never CK PASS, do not GO**. `IDSER-011` umbrella: **superseded-non-executable**. `IDSER-012-01` and `IDSER-012-01-03`: **coverage-complete-non-executable** with four already approved perception children and PERC-RESET-008 CK PASS; no new implementation or parent CK is inferred. `IDSER-012` and `IDSER-012-02`: **planned-semantic-remainder**; their four `IDSER-012-02-01..04` leaves remain genuinely `planned` (not ready for GO until semantic authority reconciliation). Historical approved IDSER-001..010 work is unchanged. The original Section 40/AC-41..44 Mistral and Ready-for-Review responsibility rows further below remain *archival ownership history*, not live successor proof; future full-reconciliation coverage remains explicitly unassigned.

## Effective semantic-extraction successor (October 15, 2026)

For all **future staged** IDSER semantic work, the sole extraction authority is SEM-CUTOVER-007A: eight-stage stepwise v0.3.1 and the exact `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0` combined `semantic_proposal + relationship_proposals` profile, qualified REL-03 / SEM-006 / SEM-005 and fenced composite replay. See the [SEM winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md), [IDSER successor authority map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md) and [completed contract realignment ledger](../../../feedback/IDSER-SEMANTIC-TICKET-REALIGNMENT-20261015.md). Historical `prompt-003/v1`, `buildSemanticSourcePacket()`, legacy packet-byte parity and BSS-V2-004-03-05 consolidated CK PASS are **not** live predecessor conditions. Retired IDSER-011 cannot be a GO gate.

The only genuine future IDSER executable children are `IDSER-012-02-01..04`, **all still planned and independently unapproved**. They own deterministic stepwise batching, BSS-V2-005 process/plan activation, BSS-V2-006 reservation-backed neutral attempts, and Atlas-owned document aggregation. A separately qualified BSS-V2-004-03-06 development-only live semantic meaning gate must have BOTH experiment CK PASS and semantic result PASS before -02-03. M01–M13 independent meaning oracles are not inferred from infrastructure CK PASS.

**Blocking OPEN-A:** SEM-007A accepted `partial_accepted` may enqueue reconciliation when canonical candidates materialize; earlier IDSER demanded unconditional `semantic_ready`/zero reconciliation. `qualified_deferred` has no Semantic V1 result or reconciliation, and is **not** semantic_ready. IDSER-012-02-04 GO requires an explicit bounded Atlas/SEM staged lifecycle/acceptance decision, with full/partial/deferred/legacy integration tests; no planning cleanup has authorized new behavior. Earlier text below describing exactly one always-full result or unconditional `semantic_ready` is historic, not an operative successor contract.

## Outcome and authority

Extend production project creation into one durable, ordered extraction bundle.
Process each PRD through the existing perception pipeline, structured semantic
extraction, Atlas validation/persistence, and incremental reconciliation before
starting the next document. Complete at `Validated Reviewable State` and a
truthful `Ready for review` project card. Different bundles may run concurrently.

```text
PCC intake -> all DocumentStore writes -> one Atlas transaction + first job
 -> D1 perception -> extraction -> validation/candidates/evidence/index
 -> reconciliation -> validation/relationships -> D1 completed
 -> D2 ... DN -> completion validation -> Ready for review -> STOP
```

That sequence remains historical authority for its reviewed implementation. For explicitly versioned future staged-policy bundles, PERC-RESET-008/approved IDSER-012-01 stop at `perceived`; SEM-CUTOVER-007A owns the sole qualified stepwise extraction algorithm and IDSER-012-02 orchestrates provider-admitted batches. Document acceptance is **canonical / partial_accepted / qualified_deferred** according to explicit authorized Atlas semantics, not unconditional `semantic_ready`. The zero-reconciliation staged policy remains a named open gate for -02-04; historical bundles are not silently adopted.

Documents remain immutable evidence; the qualified provider-neutral SEM-007A stepwise engine (not a mandatory Mistral perception/semantic route) executes admitted semantic work through Agents Bridge; pg-boss schedules; Atlas authorizes context, validates results, persists state/index and controls lifecycle. Deferred meanings stay deferred rather than becoming candidates. Master stays empty.

No review projections, Main Workflow/Project Facts/CES population, review
decisions, resolved knowledge, publication, revisions, HEAD movement, Pull from,
ordinary-workspace creation flow, PRD Lens UI, chatbot, Addendum, embeddings,
new storage adapter, queue framework, worker, or service is included.

## Sources and skill use

| Source ID | Authority / evidence |
|---|---|
| SRC-IDSER-01 | [Implementation context](../../atlas-initial-draft-semantic-extraction-reconciliation-implementation-context.md): exact phase boundary, contracts, sequencing, tests and acceptance |
| SRC-IDSER-02 | [Core architecture](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md): document, semantic, reviewable/resolved and authority separation |
| SRC-IDSER-03 | [Production baseline](../../atlas-backend-production-baseline-mistral-synced.md): sections 18-19 and 23-26; provider-neutral skills, bounded retrieval and Atlas authority |
| SRC-IDSER-04 | [PCC README](../Project_Cards_Phase/README.md) and PCC-001 through PCC-006, including PCC-005's validation record: frozen project/auth/intake/card seams |
| SRC-IDSER-05 | [BSS-005](../Stack_Setup/BSS-005-agents-bridge-service-foundation.md), [BSS-006 and atomic-idempotency amendment](../Stack_Setup/BSS-006-pg-boss-background-runtime.md), [BSS-007](../Stack_Setup/BSS-007-document-store-foundation.md), [BSS-008](../Stack_Setup/BSS-008-mistral-provider-adapter.md), [BSS-009](../Stack_Setup/BSS-009-document-perception-pipeline.md), [BSS-009-01](../Stack_Setup/BSS-009-01-atlas-perception-authority.md), [BSS-009-02](../Stack_Setup/BSS-009-02-bridge-perception-integration.md): inherited infrastructure and authority |
| SRC-IDSER-06 | [Backend phase rules](../../README.md): Compose evidence, fixture isolation and GO/CK/CFC delivery |
| SRC-IDSER-07 | Current code seams listed below, inspected at the planning HEAD |
| SRC-IDSER-08 | [Atlas workspace review projections skill](../../../../.agents/skills/atlas-workspace-review-projections/SKILL.md) and its [contract](../../../../.agents/skills/atlas-workspace-review-projections/atlas-skill.json): downstream source/evidence fidelity, shared candidate identity and review-only boundaries |
| SRC-IDSER-09 | [Security readiness skill](../../../../.agents/skills/engineering-security-refactor-readiness/SKILL.md) and [frontend awareness](../../../../.agents/skills/frontend-awareness/SKILL.md): ticket-specific seams and review bindings |

The requested workspace review skill was consulted. Its runtime input requires
a selected workspace, extracted candidates and exact artifact/page evidence;
this Markdown planning context is not that input. This set applies its relevant
source-grounding and candidate-only invariants without fabricating workspace
IDs, extraction evidence, semantic groups, or a skill-schema review result.
Its prototype output schema is not a production dependency. In particular,
SRC-IDSER-01 sections 13 and 30 defer the production projection skill.

## Delivery order

Each dependency must have a `PASS` checkpoint before dependent implementation
begins. GO authorization applies to the selected bounded batch. These planning
documents do not authorize starting implementation automatically.

| Order | Ticket / review batch | Required predecessors | Review focus |
|---:|---|---|---|
| 1 | [IDSER-001](IDSER-001-domain-and-persistence-foundation.md) / IDSER-BATCH-01 | PCC-006 and frozen BSS dependencies | Additive scoped storage, workspace compatibility and role separation |
| 2 | [IDSER-002](IDSER-002-semantic-contracts-and-production-skills.md) / IDSER-BATCH-02 | IDSER-001 | Versioned model-neutral extraction/reconciliation contracts and explicit bounds |
| 3 | [IDSER-003](IDSER-003-transactional-project-bundle-kickoff.md) / IDSER-BATCH-03 | IDSER-001, IDSER-002 | Project graph, bundle, first perception operation and job commit together |
| 4 | [IDSER-004](IDSER-004-semantic-context-and-result-authority.md) / IDSER-BATCH-04 | IDSER-002, IDSER-003 | Authenticated execution-bound context/result/failure handoff |
| 5 | [IDSER-005](IDSER-005-production-semantic-worker-and-replay.md) / IDSER-BATCH-05 | IDSER-001, IDSER-002, IDSER-004 | Real structured dispatcher, Bridge replay and fenced logical effects |
| 6 | [IDSER-006](IDSER-006-extraction-validation-and-index-materialization.md) / IDSER-BATCH-06 | IDSER-004, IDSER-005 | Full extraction validation, stable candidates, evidence and index |
| 7 | [IDSER-007](IDSER-007-bounded-reconciliation-and-procedural-advancement.md) / IDSER-BATCH-07 | IDSER-003, IDSER-004, IDSER-005, IDSER-006 | Bounded incoming neighborhood, relationships and atomic next-document scheduling |
| 8 | [IDSER-008](IDSER-008-bundle-completion-and-failure-lifecycle.md) / IDSER-BATCH-08 | IDSER-003 through IDSER-007 | Completion gate, technical failure lifecycle and durable recovery |
| 9 | [IDSER-009](IDSER-009-production-project-card-lifecycle.md) / umbrella | IDSER-008; frozen PCC UI | Non-executable ownership and traceability record for the card-lifecycle partition |
| 10 | [IDSER-009-01](IDSER-009-01-authorized-persisted-lifecycle-read.md) / IDSER-BATCH-09-01 | IDSER-008 | Membership-scoped persisted lifecycle read and read-boundary integrity |
| 11 | [IDSER-009-02](IDSER-009-02-deterministic-production-card-projection.md) / IDSER-BATCH-09-02 | IDSER-009-01 | Deterministic browser-safe lifecycle/card projection |
| 12 | [IDSER-009-03](IDSER-009-03-production-project-card-presentation.md) / IDSER-BATCH-09-03 | IDSER-009-02 | Accessible faithful rendering of the approved card model |
| 13 | [IDSER-009-04](IDSER-009-04-integrated-project-card-regression-checkpoint.md) / IDSER-BATCH-09-04 | IDSER-009-03 | Authenticated browser/frontend/regression checkpoint |
| 14 | [IDSER-010](IDSER-010-deterministic-compose-and-regression-checkpoint.md) / umbrella | IDSER-001 through IDSER-008; complete IDSER-009 series | Non-executable lossless ownership record for deterministic partition |
| 15 | [IDSER-010-01](IDSER-010-01-deterministic-production-single-document-foundation.md) / IDSER-BATCH-10-01 | approved IDSER-001–009 series | Production-shaped controlled-provider harness; scenarios A/B |
| 16 | [IDSER-010-02](IDSER-010-02-multi-document-semantic-sequencing.md) / IDSER-BATCH-10-02 | IDSER-010-01 | Scenarios C/D/E; bounded selection, relationship/accounting and sequential advancement |
| 17 | [IDSER-010-03](IDSER-010-03-failure-authority-partition.md) / umbrella | IDSER-010-02 | Non-executable failure-family partition record |
| 18 | [IDSER-010-03-01](IDSER-010-03-01-creation-kickoff-rollback.md) / IDSER-BATCH-10-03-01 | IDSER-010-02 | Creation/DocumentStore/initial-enqueue atomic rollback |
| 19 | [IDSER-010-03-02](IDSER-010-03-02-semantic-failure-containment.md) / IDSER-BATCH-10-03-02 | IDSER-010-03-01 | Scenario G semantic rejection, no false progress/successor |
| 20 | [IDSER-010-04](IDSER-010-04-concurrent-bundle-identity-isolation.md) / IDSER-BATCH-10-04 | IDSER-010-03-02 | Scenario F concurrent identity, context/result and consumer isolation |
| 21 | [IDSER-010-05](IDSER-010-05-staged-result-replay-restart.md) / IDSER-BATCH-10-05 | IDSER-010-04 | Scenario H staged replay, restart and lease/fingerprint fencing |
| 22 | [IDSER-010-06](IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md) / IDSER-BATCH-10-06 | IDSER-010-01, -02, -03-01, -03-02, -04 and -05 | Final deterministic A-H, AC ledger, regression and negative-authority composition |
| 23 | [IDSER-011](IDSER-011-live-mistral-acceptance-checkpoint.md) / umbrella | all executable IDSER-010 children through IDSER-010-06 | **SUPERSEDED — no GO**; Non-executable lossless live-provider ownership record (historical only) |
| 24 | [IDSER-011-01](IDSER-011-01-live-runtime-credential-qualification.md) / IDSER-BATCH-11-01 | all executable IDSER-010 children through IDSER-010-06 | **SUPERSEDED — no GO**; Real runtime/credential qualification with secret-safe Compose evidence (historical only) |
| 25 | [IDSER-011-02](IDSER-011-02-live-first-document-production-path.md) / IDSER-BATCH-11-02 | IDSER-011-01 | **SUPERSEDED — no GO**; D1 real OCR, semantic path, authenticated acceptance and persistence (historical only) |
| 26 | [IDSER-011-03](IDSER-011-03-live-incremental-sequencing-context.md) / IDSER-BATCH-11-03 | IDSER-011-02 | **SUPERSEDED — no GO**; D2 real sequencing and Atlas-authorized bounded prior context (historical only) |
| 27 | [IDSER-011-04](IDSER-011-04-integrated-live-acceptance-checkpoint.md) / IDSER-BATCH-11-04 | IDSER-011-01, IDSER-011-02, IDSER-011-03 | **SUPERSEDED — no GO**; Final Scenario I, lifecycle/card, AC-41–44 and negative-authority composition (historical only) |
| 28 | [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md) / umbrella | frozen historical IDSER behavior plus accepted BSS/Docling boundaries | **SEMANTIC REMAINDER PLANNED**; Non-executable staged perception/provider-admitted semantic lifecycle amendment |
| 29 | [IDSER-012-01](IDSER-012-01-fair-bounded-local-docling-perception.md) / umbrella | IDSER-012 | **COVERAGE COMPLETE**; Non-executable local-perception partition (non-executable; children CK approved) |
| 30 | [IDSER-012-01-01](IDSER-012-01-01-staged-fair-local-perception-admission-and-cutover.md) / IDSER-BATCH-12-01-01 | approved BSS-006, BSS-009/01/02, BSS-V2-004-01/02, IDSER-003/008/010-04/05 | Staged cutover, durable bundle fairness, JIT grants, and a race-safe two-permit Atlas gate |
| 31 | [IDSER-012-01-02](IDSER-012-01-02-two-worker-docling-perception-composition.md) / IDSER-BATCH-12-01-02 | IDSER-012-01-01 CK PASS | Effective 2/2/2 local profile, accepted NormalizedDocument v1, and durable `perceived` stop |
| 35 | [IDSER-012-01-03](IDSER-012-01-03-docling-evidence-preservation-and-semantic-handoff.md) / umbrella | IDSER-012-01-02 CK PASS | **COVERAGE COMPLETE**; Non-executable RUN-003 preservation partition (non-executable; children CK approved) |
| 36 | [IDSER-012-01-03-01](IDSER-012-01-03-01-qualified-docling-capture-and-deterministic-evidence-mapping.md) / IDSER-BATCH-12-01-03-01 | IDSER-012-01-02 CK PASS | Qualified mapping and bounded transient figure descriptors; no early activation |
| 37 | [IDSER-012-01-03-02](IDSER-012-01-03-02-atlas-derived-asset-handoff-replay-and-authorized-resolution.md) / IDSER-BATCH-12-01-03-02 | IDSER-012-01-03-01 CK PASS | Durable image handoff, replay, retrieval, no recursion and safe activation |
| 35 | [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md) / umbrella | approved RUN-003 IDSER-012-01/PERC-RESET; qualified SEM-007A; BSS-V2-005/006; separate live meaning gate | **SEMANTIC REMAINDER PLANNED**; no GO on umbrella, canonical/deferred outcomes require exact authority |
| 36 | [IDSER-012-02-01](IDSER-012-02-01-deterministic-semantic-batch-planning.md) / IDSER-BATCH-12-02-01 | qualified SEM-007A shared stepwise engine; approved IDSER-012-01-03-02; BSS-V2-005 resource envelope interfaces; bounded cross-batch REL design | **PLANNED / GO BLOCKED**; deterministic shared stepwise requests, ownership/deferred plan and RequestResourceEnvelope; zero call |
| 37 | [IDSER-012-02-02](IDSER-012-02-02-semantic-provider-profile-activation.md) / IDSER-BATCH-12-02-02 | IDSER-012-02-01 CK PASS; BSS-V2-005-04/006-04 CK PASS | **PLANNED**; activate exact v0.4.0 profile and real active DesiredAdmissionProfile; zero provider work |
| 38 | [BSS-V2-004-03-06](../Stack_Setup_V2/BSS-V2-004-03-06-live-anoman-extraction-qualification.md) / BSS-V2-BATCH-04.03-06 | IDSER-012-02-01/02 CK PASS; SEM-007A; BSS-V2-005/006 CK PASS; explicit development-only budget/privacy GO | **PLANNED**; qualify exact shared stepwise profile and M01–M13 meaning independently; NO legacy 03-05 CK gate |
| 39 | [IDSER-012-02-03](IDSER-012-02-03-provider-admitted-semantic-batch-execution.md) / IDSER-BATCH-12-02-03 | IDSER-012-02-01/02 CK PASS; BSS-V2-004-03-06 CK PASS AND semantic PASS | **PLANNED**; each BSS-reserved attempt uses sole SEM-007A; non-truth staged fragments |
| 40 | [IDSER-012-02-04](IDSER-012-02-04-semantic-document-aggregation-ready-stop.md) / IDSER-BATCH-12-02-04 | IDSER-012-02-03 CK PASS; explicit Atlas/SEM staged reconciliation/acceptance decision OPEN-A | **PLANNED / GO BLOCKED**; truthful canonical / partial_accepted / qualified_deferred coverage; no invented semantic_ready/zero-job guarantee |

`IDSER-012-01-03-01` is a mapping qualification checkpoint, not an active figure-preservation route. Activate normal image-enabled staging only after `-03-02` passes durable storage, replay, admission and authorization qualification. Semantic planning must not conflate an available figure pointer with provider understanding.

Intermediate tickets are composable implementation checkpoints, not independent
production rollouts. Route/worker tests may inject explicit bounded test doubles
for not-yet-implemented handlers. Production wiring must fail closed for an
unavailable handler; it must never acknowledge, fabricate completion, consume
work through TestRuntime, or mark a bundle ready. The historical full-pipeline evidence was scoped by IDSER-008/010/011. For future staged work, retired IDSER-011 is not an executable gate: accepted PERC-RESET-008 and explicitly authorized semantic/reconciliation successors own the applicable proofs.

## IDSER-012 future staged dependency graph (prospective)

```text
PERC-RESET-008 CK PASS + IDSER-012-01 approved -> perceived
                         |
SEM-CUTOVER-007A sole stepwise engine / qualified deferred acceptance
                         |
BSS-V2-005-04 active plan + BSS-V2-006-04 real durable reservation
                         |
                         v
           IDSER-012-02-01 (stepwise owned/context/deferred planner) CK PASS
                         |
                         v
           IDSER-012-02-02 (actual semantic DesiredAdmissionProfile) CK PASS
                         |
                         v
           BSS-V2-004-03-06 (separate CK PASS + semantic meaning PASS)
                         |
                         v
           IDSER-012-02-03 (one reserved attempt per call; shared SEM engine) CK PASS
                         |
                         v
           IDSER-012-02-04 (exact document accepted canonical/deferred coverage)
                         |
                         v
           BLOCKED until OPEN-A: approved staged lifecycle/reconciliation policy
```

This graph is future planning, not evidence that a predecessor has passed or that any semantic provider is production approved. Legacy BSS-V2-004-03-05 CK and retired IDSER-011 are excluded. An accepted partial canonical result is not a complete ordinary reconciliation; a fully qualified-deferred member is not semantic_ready.


## Inspected implementation and planning decisions

| ID | Observed seam | Required treatment / owner |
|---|---|---|
| PLAN-IDSER-01 | `project-repository.ts` and `perception-authority.ts` each open their own postgres.js transaction; `queue.ts` accepts a Drizzle transaction | IDSER-003 adds a bounded shared transaction adapter/unit of work for existing persistence and pg-boss. Nested independent commits or post-commit enqueue do not qualify. |
| PLAN-IDSER-02 | Workspace schema has no display-name field and has global `(project_id, kind)` uniqueness plus only `empty`/`draft` states | IDSER-001 adds non-authoritative display metadata and system-kind partial uniqueness, preserves existing IDs, and admits bootstrap `ready_for_review`; no revision fields or ordinary-workspace creation flow. |
| PLAN-IDSER-03 | `worker-main.ts` injects TestRuntime; generic execution events have no structured-result sink | IDSER-002/004/005 add typed semantic contracts and result delivery while retaining the existing generic queue and worker. Interactive chat remains a separate inherited capability. |
| PLAN-IDSER-04 | Perception delivery persists a hash/capability cache but has no bundle continuation; cache entries can be reused/updated by source hash | IDSER-004/006 bind the exact normalized representation/locator set to the semantic execution and couple perception acceptance with extraction enqueue. Do not use another execution's cache identity merely because bytes match. |
| PLAN-IDSER-05 | `home-projects.ts` filters out any project with downstream perception state; card types only admit waiting/zero percent | IDSER-009-01 supplies validated persisted lifecycle read; 009-02 replaces the phase-specific guard with deterministic projection and retains explicit legacy PCC no-bundle waiting. Do not automatically backfill old projects with guessed upload order. |
| PLAN-IDSER-06 | Existing perception source grants expire after five minutes and delivery checks expiry; generic failures otherwise stay in Bridge operational state | IDSER-003/008 must test delayed delivery and durably surface failures. Reuse supported BSS-009 behavior; do not extend source authority or redesign grants silently. An actual frozen-contract incompatibility is SCOPE_CHANGE with evidence. |

All above are implementation seams with owners, not permission to reopen frozen
architecture. New projects receive the new atomic bundle flow. Historical PCC
projects retain their records; automatic migration/re-extraction is outside the
specified newly-created-project requirement.

## Bounded v1 context decisions

SRC-IDSER-01 section 22 requires concrete bounds but supplies no values. The
following are this ticket set's explicit engineering defaults, not source claims:

| Boundary | v1 maximum |
|---|---:|
| Serialized semantic job / context request | 16 KiB |
| Serialized extraction context, including its complete NormalizedDocument | 1 MiB |
| Current-document candidates per extraction / reconciliation | 500 |
| Prior incoming candidates selected for one reconciliation | 500 |
| Total candidates in one reconciliation context | 1,000 |
| Serialized reconciliation context including evidence and identities | 1 MiB |
| Serialized semantic result-delivery envelope including provenance | 2 MiB |
| General semantic list/retrieval page | 100 records |

Measure UTF-8 JSON bytes, not character count. Enforce limits on both sides of
handoff and before provider invocation. Provider configuration may impose a
stricter bound; include prompt/schema overhead in its request check. No oversized
normalized source, current candidate set, evidence, or source inventory may be
silently truncated. Exceeding a mandatory full-input/output bound is a typed
technical failure. Retrieval selects a deterministic bounded prior neighborhood
with stable tie-breaks and records selection bounds/overflow metadata; it does
not claim exhaustive reconciliation or choose truth. IDSER-002/007 freeze exact
schemas and the selection policy against these defaults, with boundary tests.

## Acceptance traceability

The primary owner implements the historical requirement. IDSER-010 supplied reviewed deterministic coverage; the original IDSER-011 live-provider/final AC-41–44 ownership table is now **archival only** because those children were superseded-unimplemented, NOT CK PASS. New live semantic qualification belongs to BSS-V2-004-03-06 with the sole SEM-CUTOVER-007A engine; future full-reconciliation/Ready-for-Review ownership remains unassigned. Do not silently treat this historic ledger as successor proof.

| Context AC | Primary owner(s) |
|---|---|
| AC-01 | IDSER-003, IDSER-009-01/02/03/04, IDSER-010 |
| AC-02 | IDSER-003 |
| AC-03 | IDSER-001, IDSER-003, IDSER-004 |
| AC-04 | IDSER-001 |
| AC-05 | IDSER-003 |
| AC-06 | IDSER-003, IDSER-006 |
| AC-07 | IDSER-005 |
| AC-08 | IDSER-002, IDSER-005 |
| AC-09 | IDSER-005 |
| AC-10 | IDSER-002 |
| AC-11 | IDSER-002, IDSER-004 |
| AC-12 | IDSER-004 |
| AC-13 | IDSER-002, IDSER-006 |
| AC-14 | IDSER-006 |
| AC-15 | IDSER-001, IDSER-006 |
| AC-16 | IDSER-001 |
| AC-17 | IDSER-006, IDSER-007 |
| AC-18 | IDSER-007 |
| AC-19 | IDSER-002, IDSER-007 |
| AC-20 | IDSER-002, IDSER-007 |
| AC-21 | IDSER-007 |
| AC-22 | IDSER-001, IDSER-007 |
| AC-23 | IDSER-007, IDSER-008 |
| AC-24 | IDSER-003, IDSER-006, IDSER-007 |
| AC-25 | IDSER-004, IDSER-005, IDSER-006, IDSER-007 |
| AC-26 | IDSER-007, IDSER-009-01/02/04 |
| AC-27 | IDSER-008, IDSER-009-01/02/04 |
| AC-28 | IDSER-004, IDSER-005, IDSER-008 |
| AC-29 | IDSER-008 |
| AC-30 | IDSER-009-01/02/03/04 |
| AC-31 | IDSER-008, IDSER-010 |
| AC-32 | IDSER-008, IDSER-010 |
| AC-33 | IDSER-001, IDSER-006, IDSER-007 |
| AC-34 | IDSER-006, IDSER-007 |
| AC-35 | IDSER-006, IDSER-007 |
| AC-36 | IDSER-001, IDSER-004, IDSER-010 |
| AC-37 | IDSER-003, IDSER-010 |
| AC-38 | IDSER-003, IDSER-005, IDSER-010 |
| AC-39 | IDSER-009-04, IDSER-010 |
| AC-40 | IDSER-010 |
| AC-41 | IDSER-005, IDSER-011-01; final IDSER-011-04 |
| AC-42 | IDSER-011-03; final IDSER-011-04 |
| AC-43 | IDSER-011-04 |
| AC-44 | IDSER-011-01; final IDSER-011-04 |

Section 40 responsibility mapping: foundation -> 001; contracts/skills -> 002;
kickoff -> 003; internal authority -> 004 plus 006/007 acceptance handlers;
worker -> 005; extraction/index -> 006; reconciliation/advancement -> 007;
completion -> 008; card read/projection/presentation/integrated proof ->
009-01/02/03/04; deterministic Compose proof -> 010; live qualification ->
011-01; D1 live path -> 011-02; incremental live context -> 011-03; final live
composition -> 011-04.

## Execution and review controls

Follow [Backend rules](../../README.md) and the current [GO](../../../../.agents/skills/go/SKILL.md),
[CK](../../../../.agents/skills/ck/SKILL.md), [CFC](../../../../.agents/skills/cfc/SKILL.md), and
[HMN](../../../../.agents/skills/hmn/SKILL.md) workflow when implementation is requested. Keep eligible future executable tickets `planned` until authorized; do not GO an expressly `superseded-unimplemented` child or a coverage-complete/non-executable umbrella. Record implementation commit and validation, then `awaiting_review`.
Use one consolidated CK feedback file and the bounded remediation workflow; a further remediation after a stalled verification needs an explicit user `hmn` delegation.
This authoring pass does not claim CK approval.

Docker Compose is authoritative for runnable checks. Start PostgreSQL with
`docker compose up -d postgres`; verify health with `docker compose ps`. Use
`docker compose up -d --build` for the full stack. Run checks in the Compose
`atlas` service, for example:

```sh
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:permissions
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/contracts test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test
```

Tickets adding suites must register real package scripts and record exact
commands. Do not cite nonexistent script names as executed evidence. Record
HEAD, service health, migration outcome, commands, test counts, skips and
limitations. Host edits are permitted; host runnable checks are diagnostic only.

The original IDSER-011 Mistral live checkpoint (which required `MISTRAL_API_KEY`) is **superseded as an executable dependency**, not a current required live gate. Future live semantic quality/provider access must be separately qualified by its actual successor, with bounded credentials, privacy and spend; deterministic tests remain secret-free. An unavailable required qualified provider must be reported honestly as `BLOCKED`/`FAIL`, never a mock or skipped check plus phase completion.
No secret, source prompt, or full semantic payload belongs in ordinary logs or
review evidence. Use synthetic/non-confidential PDFs.

## Completion

Historical approved IDSER-001..010 CK evidence is unchanged. Original IDSER-011 was never CK PASS and is now superseded-unimplemented, so its Mistral live path is not an executable prerequisite. The four IDSER-012-01 perception children are approved and PERC-RESET-008 independently qualified the canonical RUN-003 baseline. The remaining four IDSER-012-02 semantic children still require their own re-aligned GO/CK, BSS-V2-005/006 integration and separate semantic live qualification; neither semantic_ready nor reconciliation behavior may be assumed resolved until its conflicting deferred-acceptance contract is explicitly reconciled. A planning pass, mocked run or healthy worker alone does not complete that future implementation.
