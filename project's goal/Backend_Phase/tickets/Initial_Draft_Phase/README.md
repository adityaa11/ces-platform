# Atlas Initial Draft Semantic Extraction and Reconciliation Ticket Set

- **State:** `in_progress`; IDSER-001 is approved at `a64c62b`, IDSER-002 is
  approved at `5bf1bbb`, IDSER-003 is approved at `3dbd7dc`, IDSER-004 is
  approved at `9b36ee8`, IDSER-005 at `2707518`, IDSER-006 at `266f5a3`, and
  IDSER-007 at `c890410`, IDSER-008 at `ec1e973`, and IDSER-009-02 at
  `64f7072`.
- **Prefix:** `IDSER`; one bounded ticket per `IDSER-BATCH-XX` (IDSER-009 is
  an umbrella partition record; its four child batches are executable).
- **Primary baseline:** [Initial Draft implementation context](../../atlas-initial-draft-semantic-extraction-reconciliation-implementation-context.md), sections 1-45, AC-01 through AC-44.
- **Hard predecessor:** [PCC-006](../Project_Cards_Phase/PCC-006-project-card-creation-e2e-and-regression-checkpoint.md) `PASS`; the [PCC set](../Project_Cards_Phase/README.md) remains frozen.
- **Planning inspection:** branch `codex/new-atlas-backend`, HEAD `3bb1d24d7ceb11b875d5dde0a0b41568dd9f1b6c`, 2026-09-27. The context inspected `efc4f997fc883cb9d7b2e9617516aabda6a7686b`; the intervening commit changes documentation/workflow skills, not the inspected application code.

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

Documents remain immutable evidence; Mistral reasons through Agents Bridge;
pg-boss schedules; Atlas authorizes context, validates results, persists state,
indexes, and controls progress. All semantics remain incoming candidates and
reviewable relationship proposals. Master stays empty.

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
| 14 | [IDSER-010](IDSER-010-deterministic-compose-and-regression-checkpoint.md) / IDSER-BATCH-10 | IDSER-001 through IDSER-008; IDSER-009-01 through IDSER-009-04 | Deterministic Compose scenarios A-H and regression proof |
| 15 | [IDSER-011](IDSER-011-live-mistral-acceptance-checkpoint.md) / IDSER-BATCH-11 | IDSER-010 | Mandatory live Mistral scenario I with at least two PDFs |

Intermediate tickets are composable implementation checkpoints, not independent
production rollouts. Route/worker tests may inject explicit bounded test doubles
for not-yet-implemented handlers. Production wiring must fail closed for an
unavailable handler; it must never acknowledge, fabricate completion, consume
work through TestRuntime, or mark a bundle ready. Cross-ticket activation and
full pipeline proof are required by IDSER-008/010/011.

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

The primary owner implements the requirement. IDSER-010 verifies deterministic
coverage across owners; IDSER-011 additionally proves the actual provider path.

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
| AC-41 | IDSER-005, IDSER-011 |
| AC-42 | IDSER-011 |
| AC-43 | IDSER-011 |
| AC-44 | IDSER-011 |

Section 40 responsibility mapping: foundation -> 001; contracts/skills -> 002;
kickoff -> 003; internal authority -> 004 plus 006/007 acceptance handlers;
worker -> 005; extraction/index -> 006; reconciliation/advancement -> 007;
completion -> 008; card read/projection/presentation/integrated proof ->
009-01/02/03/04; Compose proof -> 010/011.

## Execution and review controls

Follow [Backend rules](../../README.md) and the current [GO](../../../../.agents/skills/go/SKILL.md),
[CK](../../../../.agents/skills/ck/SKILL.md), [CFC](../../../../.agents/skills/cfc/SKILL.md), and
[HMN](../../../../.agents/skills/hmn/SKILL.md) workflow when implementation is requested. Keep every ticket `planned` until
authorized. Record implementation commit and validation, then `awaiting_review`.
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

The mandatory final live checkpoint requires a real `MISTRAL_API_KEY` supplied
through the existing Compose secret/environment boundary. Deterministic tests
remain secret-free. Missing credentials or unavailable provider access yields
`BLOCKED`/`FAIL` as appropriate, never a skipped live test plus phase completion.
No secret, source prompt, or full semantic payload belongs in ordinary logs or
review evidence. Use synthetic/non-confidential PDFs.

## Completion

All fourteen executable checkpoints must pass. The final system must reach review-ready state
through both deterministic Compose tests and a real Mistral run, preserving
conflicts, evidence, stable IDs, replay safety and empty Master. A successful
planning pass, mocked run, or ready worker health check alone does not complete
the implementation phase.
