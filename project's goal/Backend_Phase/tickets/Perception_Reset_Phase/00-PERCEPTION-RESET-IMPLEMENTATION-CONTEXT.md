# Atlas — Canonical Multimodal Perception Reset Implementation Context (v1.2 — preserve Docling downloads; replace old perception regression baseline)

**Date:** 2026-10-12  
**Program:** `PERC-RESET`  
**Location in user's workspace:** `C:\Workspace\atlas\ces-platform`  
**Product boundary:** initial project creation through `perceived`, **perception only**.  
**Meaning of “production”:** canonical local working data, enabled paths and Docker processes representing Atlas's intended architecture, **not** cloud deployment or additional validation strictness.  
**Target profile (must be effective in ordinary manual runs):** `atlas-digital-pdf-run-003-capture-v1`.

> **PERC-RESET-001 amendment (2026-10-12):** The image-retention condition in
> this context is superseded for PERC-RESET-001 only by
> `HMN-PERC-RESET-001-002` and the amended ticket. The pinned local Docling
> Serve image is an optional reuse optimization, not a protected-resource or
> pass requirement. Actual downloaded model files remain protected if present;
> the inspected PERC-RESET-001 cache volumes were empty, and model readiness
> must be established later by PERC-RESET-004. This amendment authorizes no
> later ticket, runtime boot, model download, or semantic work.

## 1. Why this program exists

Atlas's current Docker configuration and ticket history contain multiple isolated qualification stacks and a transitional image-disabled Docling route. The multimodal-capable Docling RUN-003 capture/mapping and derived image storage path have already received relevant CK approvals, but the checked-in normal Compose configuration previously still used `atlas-digital-pdf-no-ocr-v1` and restricted RUN-003 to qualification-only operation. Continuing downstream development from that normal environment risks making the old implementation a permanent prerequisite.

This program performs a **destructive clean start**, promotes RUN-003 as the **only normal perception route**, proves project creation and real accepted PDF evidence, and freezes a clean upstream acceptance contract. It deliberately does not add semantic extraction or deeper model reasoning.

## 2. Known code/review baseline versus local reality

A remote `codex/new-atlas-backend` source inspection at `b7bee3d5341350eae39264a21fd1df315528f052` established the following preflight findings. **These are not guaranteed to be the user's current local HEAD**; Codex must re-inspect its actual working tree before applying changes.

- `docker-compose.yml` normal route: `docling-digital-pdf` using `atlas-digital-pdf-no-ocr-v1`, `docling-digital-pdf` cache/terminal identity; both Bridge service and worker use this route.
- `apps/agents-bridge/src/route-registry.ts`: RUN-003 capture activation rejected when `qualificationOnly` is false.
- `apps/agents-bridge/src/document-perception-worker.ts`: RUN-003 currently rejects an empty `transientVisualDescriptors` collection despite valid digital PDFs that have no pictures.
- `packages/atlas-db/src/perception-authority.ts`: RUN-003 acceptance requires `assets.length > 0`, although zero-image documents legitimately have none; its verified manifest/integrity checks must remain for any actual asset.
- `apps/agents-bridge/src/providers/docling.ts`: RUN-003 sets image capture (`include_images=true`, embedded image export), table structure enabled, `do_ocr=false`; it **does not** perform diagram understanding, chart interpretation or picture description.
- Project creation currently writes empty Master (`workspace.kind='master'`, `state='empty'`) and draft Initial Draft (`kind='initial_draft'`, `state='draft'`), immutable PDF document members, and `staged-fair-local-v1` perception admission.
- Perception acceptance under staged policy already stops bundle members at `perceived` without creating semantic jobs. Non-staged historical code may still include earlier continuation behavior; it must not dispatch in the canonical path.
- CK-approved `IDSER-012-01-03-01` qualified RUN-003 capture/mapping; `IDSER-012-01-03-02` approved durable Atlas-owned derived-asset handoff, replay, resolver and local visual-evidence acceptance. Reuse the accepted implementations; **do not reopen their full scope**.
- The separate REL-03 candidate and `8a2dd24` baseline are **not** part of this program. Do not modify/reset their branch or uncommitted candidate.

**Source areas to inspect:** `docker-compose.yml`, all existing Compose overrides, `Dockerfile`, `apps/atlas/project-creation-boundary.ts`, `packages/atlas-core/src/project-creation.ts`, `packages/atlas-db/src/project-repository.ts`, `apps/agents-bridge/src/{worker-main,config,route-registry,document-perception-worker,perception-result-replay}.ts`, `apps/agents-bridge/src/providers/docling.ts`, `packages/atlas-db/src/perception-authority.ts`, `packages/atlas-contracts/src/perception.ts`, `packages/document-store`, relevant migrations, and existing perception qualification evidence.

## 3. User's one-time destructive Docker authorization — explicit Docling exception

**This v1.1 exception supersedes any earlier blanket all-volume/all-image deletion instruction.** The user authorizes a reset of the selected local Docker engine's obsolete containers, images, volumes, custom networks and build cache **except the downloaded Docling model cache and, where useful, its pinned Docling Serve image**. Protect the actual cache data, not merely a container name. Old tickets/CK files do not confer protection on other historical Docker resources.

**Docling preservation is nonnegotiable:** inspect the actual Docling Serve container(s), image identity/digest, mounts, and the contents of the model cache before removal. In the checked-in normal Compose, Docling uses `docling-models:/root/.cache` on the `docling-serve` service; its physical volume name is Compose-project dependent. Do not assume the volume is literally called `docling-models`. Capture the actual mount Source, Destination, volume Name, and inspect/verify the downloaded model files. If multiple relevant model/cache volumes are identified, preserve all until duplicates have been verified and consolidated in the canonical environment.

The **old Docling Serve container may be removed** after confirming the downloaded models reside durably in a protected Docker volume (or verified protected host bind mount); preserve its **exact pinned local image** if present, to avoid an unnecessary image pull. Container identity is not the cache's long-term owner. If the models instead exist only in the old container writable layer, or safe preservation cannot be confirmed, **DO NOT DELETE THAT CONTAINER OR ITS IMAGE**; report `BLOCKED` with the actual mounts/paths, and require a safe model-cache migration before proceeding. Do not claim a completed clean reset while model data are at risk.

Other Docker-resident test/project databases, original-source copies, derived assets, caches, workers and historical Compose runtime state are authorized for deletion/recreation. This does **not** authorize touching Windows-host source PDFs, Git/dirty branches, `.env`, historical CK evidence, or any host bind-mount targets. An unexpected unrelated critical workload or unidentified Docker context must still be reported as `BLOCKED`; do not silently delete it.

**Reset procedure:** inventory Docker context/daemon, Compose projects, containers, images, volumes, networks, all actual mounts and bind targets. Identify/record protected Docling model-cache volume(s) and pinned image ID(s) **by real identifiers**. Stop/remove the remaining containers, then remove all **unprotected** volumes, images, custom networks and build cache, with separate PowerShell-safe enumerations and exit-code evidence. Protect cache volume(s) from *every* prune/down step (`down -v` or volume prune may delete unprotected targets); do not use blanket `docker system prune --volumes` or `docker volume prune` where protected data could be affected. Never remove an active/protected Docling image or volume indirectly through a Compose teardown. Built-in Docker networks remain.

**Post-001 oracle:** zero obsolete/non-Docling containers, zero obsolete/unprotected images, zero obsolete/unprotected volumes. Exactly the verified protected Docling cache volume(s) and pinned image(s), if present, are permitted to remain. Ideally zero containers; if the model cache is not safely externalized, retain the old Docling container and STOP as `BLOCKED` before destructive cleanup. This exception replaces the prior `zero containers/images/volumes` blanket oracle.

**Canonical reattachment:** `PERC-RESET-004` must mount the **same verified model-cache contents** into the canonical `docling-serve:/root/.cache`, through an explicit effective Compose volume identity or a verified migration into one canonical cache volume. Compose-project names change volume names by default: silently allocating a fresh `atlas-canonical-perception_docling-models` while orphaning the protected original **does not meet the goal**. Compare cache files/identity before and after reuse/migration, and do not re-download the model just because the stack was reset. If an image pull/build is required for code services, that's permitted; the downloaded Docling *model weights* must remain intact.

The result must be one new canonical Compose project, not an old qualification project. A preserved cache volume is a reused durable resource **of the new canonical Docling service**, not an extra running legacy stack. Other historical images/containers/volumes should be gone.

## 4. Frozen source corpus and projects

**Windows source directory:** `C:\Workspace\atlas\ces-platform\docs\example`.

### Project A — real professional single PDF

- File: `Safara_Buyer_Business_PRD_Professional.pdf`.
- Expected testing focus: actual text + table structures + figures/images/diagrams, with source-grounded output and durable derived assets where the qualified Docling capture emits them.
- Do **not** invent exact table, figure, or asset counts. Inspect the PDF, hash it, and compare its observed source features with accepted Docling mapping. Inability to demonstrate a requested feature is an explicit `EVIDENCE_GAP`, not a fabricated pass.
- Through real authenticated create-project request, verify exactly one new project, one **empty Master workspace**, one **Initial Draft workspace**, one immutable PDF source document, and one staged perception member.

### Project B — three PDFs in one project

In declared order:

1. `Safara_PRD_01_Foundation.pdf`
2. `Safara_PRD_02_Finance_Documents.pdf`
3. `Safara_PRD_03_Readiness_Manifest_Reporting.pdf`

- Exactly one project with **empty Master** and **Initial Draft** workspace, three immutable PDF documents, expected ordered bundle members, and bounded/fair perception admission.
- Each document must use **the exact same RUN-003 route/profile**, including when it has no visual regions. Do not downgrade to image-disabled profile on absent media.
- Each eligible member reaches durable `perceived`; observe the third moving through admission without manually creating semantic work.

### Corpus guard

Confirm all four files exist locally (names/extensions/casing), `application/pdf`, header `%PDF-`, size within current per-file 20 MiB / total per-request 40 MiB bounds, and calculate SHA-256 before using them. Do **not** write, mutate, move, or delete originals. The actual PDFs are not included in this ZIP. `Safara_Buyer_Business_PRD_Professional` and `Safara_PRD_01_Foundation` are base names; use `.pdf` after checking the host.

## 5. One authoritative perception pipeline

```text
Authenticated Atlas project creation
 -> Project with Master(empty) + Initial Draft(draft)
 -> Original PDF document(s) in Atlas DocumentStore
 -> Bundle membership + staged-fair-local-v1 admission
 -> pg-boss perception queue and Atlas exact-source grant
 -> Bridge worker ONLY qualified Docling RUN-003
 -> Docling Serve local CPU PDF-to-JSON, accurate table structure, embedded image capture, no OCR
 -> validated text blocks, tables, visual regions + in-process visual descriptors
 -> Atlas-authorized image handoff for each actual captured visual region
 -> durable derived assets, verified manifest, bounded replay
 -> NormalizedDocument V1 accepted and cached under RUN-003 identity
 -> document member perceived; perception execution completed
 -> STOP: zero semantic executions/jobs/provider calls
```

**One route for all PDF classes:** image-capable does not mean image-required. A zero-visual PDF is still processed through RUN-003; `visualRegions=[]` and `derivedAssets=[]` are valid when the source contains no captured visual regions. An image-bearing PDF cannot skip, forge, cross-bind, or silently discard captured regions to pass.

**Precision:** local perception preserves structural content and actual visual evidence; it does not assert that diagram semantics, chart content or image business meaning have been understood. Scanned-only/OCR-requiring files remain outside the no-OCR qualified scope. The old Docling image-disabled path may remain in Git/test history but cannot be an enabled normal runtime dispatch/fallback.

## 6. Runtime identity and state consistency

The following must match the single effective RUN-003 profile in the actual `docker compose config` output and running processes:

- One enabled `atlas.document.perceive` qualified route (no alternate provider fallback).
- Bridge service and worker `AGENTS_BRIDGE_QUALIFIED_ROUTES`.
- Worker `DOCLING_OPTION_PROFILE=atlas-digital-pdf-run-003-capture-v1`.
- Atlas `ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY` equals the chosen RUN-003 capability identity (currently `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`, verify actual current source).
- Qualified Docling Serve/adapter/runtime versions/digests and image options remain pinned to previously reviewed behavior unless evidence-backed change is necessary.
- New normalized cache identity is distinct from the old `docling-digital-pdf` image-disabled result.
- `AGENTS_BRIDGE_QUALIFICATION_ONLY` must not be enabled; normal RUN-003 activation requires an exact qualified-profile gate, not a broad allow-any change.
- Canonical profile should remain a local working stack (e.g., `development`). Do **not** force Bridge `live` if it requires semantic/chat capabilities outside this scope.
- No semantic route enabled, semantic extraction queue activity, future admission/reservations, reconciliation, acceptance or publication.

Use the **normal `docker-compose.yml`** as canonical configuration. A fixed `COMPOSE_PROJECT_NAME` or explicit `-p` name may be used, consistently for all manual commands. Prefer `atlas-canonical-perception` as project name, but inspect existing config/project conventions and record the effective name. Qualification overrides are **not** canonical.

## 7. Modifications permitted

Only the minimal RUN-003 normal-route enablement, capability/terminal/cache consistency, zero-visual correctness, and perception-only evidence harness/documentation. Modify source, Compose and related tests in their owning areas. No project creation redesign unless a demonstrated perception-boundary regression requires a separately authorized correction.

**Hard exclusions:** no REL-03/REL-04 changes; no semantic extractor, prompt, provider response schema, semantic job release, BSS-V2-005/006 admission, Master publish, extraction review, facts, CES, chatbot, new OCR/VLM model, GPU, cloud hosting, Kubernetes, or added enterprise compliance gates. Preserve existing grants, scoped asset reads, hashes, cancellation, bounds and replay behavior. Never modify historical reviewed CK evidence to get a pass.

## 8. Evidence and scoped regression acceptance

Qualification should follow a small-to-large sequence after reset:

| ID | Required observed result |
|---|---|
| P-01 | Effective route and actual worker RUN-003; `qualificationOnly=false`; exactly one normal perception route |
| P-02 | Authenticated Project A creation; Master empty / Initial Draft draft; one original PDF member |
| P-03 | Project A accepted RUN-003 text/table/visual evidence; verified derived image bytes+manifest; member `perceived` |
| P-04 | Project B created with three ordered source docs; each goes through RUN-003, including valid zero-image cases; all `perceived` |
| P-05 | Exact source hashes, page/table/visual identities, cache identity and document count agree across source, normalized cache, and DB |
| P-06 | Negative invalid/foreign/missing/mismatched asset does not become accepted, replay and restart cannot create duplicate logical effects |
| P-07 | Neither project creates semantic execution/job/provider call or advances Master; no old-route dispatch/fallback |
| P-08 | No old Docker qualification stack/process/volume/image contaminates or co-runs the canonical environment; preserved Docling model cache/image are explicit permitted exceptions and are adopted by the canonical service; repeatable launch commands |

Use real authenticated routes and database/manifest observations; focused fake/unit tests may support boundary safety but cannot substitute for the two real project runs. Assertions must use observed filenames and hashes. Do not invent expected figure/diagram counts or claim picture understanding. Zero model calls are required; perception Docling calls are local and expected.

**Acceptance target:** an upstream **perception** runtime baseline that developers can use manually. Not semantic quality, not exact human interpretation, not cloud deployment. Do not add arbitrary 3-run loops or broaden to full old semantic integration suites.

## 8A. Upstream baseline supersession and downstream regression rule (binding)

**Purpose of the reset:** Beyond replacing Docker data and runtime routing, PERC-RESET establishes RUN-003 as the **new current perception regression baseline**. This is the critical downstream handoff. A downstream ticket must not inherit an obligation to preserve or requalify the superseded image-disabled Docling route, pre-RUN-003 perception cache identity, qualification-only activation, or old perception dispatch. Those are **retired implementation behaviors**, not contractual requirements of the new perception output.

**After PERC-RESET-008 independent CK PASS, every subsequent ticket that consumes perception must:**

1. Treat `CANONICAL-PERCEPTION-BASELINE-v1.md` and the exact reviewed RUN-003 normal-route commit/Compose profile as **the authoritative upstream perception predecessor**. Do not compare new work to an older Docling `atlas-digital-pdf-no-ocr-v1` result or historical profile bytes as a mandatory backward-compatibility regression gate.
2. Build and run perception-dependent regression tests against the accepted `NormalizedDocument V1` produced by **RUN-003**, including text-only/zero-image, table-containing, and captured-visual cases, with source-bound derived assets where present.
3. Retain regression tests for **still-live shared guarantees** (project/workspace creation, ownership, source grants, source hashes/locators, document ordering, staging/admission, image integrity, idempotency/replay/fencing, `perceived` termination, and zero premature semantic activity at this boundary). These tests can be reused or adapted, but their fixture route/expected output must target the new canonical profile; their existence does not require keeping the old implementation active.
4. Treat historical old-route fixtures, CK evidence and old route/code history as **archival evidence**, not active predecessor acceptance gates. Do not delete them just to change the baseline; do not reactivate the old route to satisfy a historical test.
5. If an already frozen downstream ticket explicitly mandates old-route byte parity, legacy profile reproduction, old perception default, or legacy perception integration-suite pass, record the **exact ticket/RC/clause** in a downstream-gate conflict ledger and request **a narrowly scoped HMN amendment before executing that conflicting downstream ticket**. This perception-only program does **not** silently amend or waive an existing frozen downstream review contract and does not implement semantic features.
6. Distinguish **perception path backward compatibility**, which is intentionally retired, from **stable output/interface compatibility** (`NormalizedDocument V1` and its applicable evidence/lifecycle guarantees), which remains required. A shared security or lifecycle regression can still block new work even if the first test revealing it was written before RUN-003.

**Binary handoff oracle:** The final perception baseline must explicitly state `SUPERSEDED_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-no-ocr-v1`, `CURRENT_PERCEPTION_REGRESSION_BASELINE=atlas-digital-pdf-run-003-capture-v1`, and `OLD_PERCEPTION_BACKWARD_COMPATIBILITY_REQUIRED=false` for successor acceptance **after its CK PASS**, together with a precise list of preserved live shared invariants and any known conflicting frozen downstream RCs. This is a regression-baseline replacement, **not a proposal to relax current validation**.

## 9. Execution plan, bounded tickets, approvals

- Run `PERC-RESET-001` first: inventory, explicitly authorized Docker-engine reset **except the downloaded Docling model cache and pinned image**; restore no historical stacks.
- Run `PERC-RESET-002`/`003`: promote normal RUN-003 and repair zero-visual cardinality with focused checks.
- Run `PERC-RESET-004`: build/start a **single** clean canonical Compose project **reusing the preserved model cache**; effective-route proof.
- Run `PERC-RESET-005`/`006`: create and qualify Project A with the professional PDF through the authenticated UI/API.
- Run `PERC-RESET-007`: create and qualify Project B with all three PDFs.
- Run `PERC-RESET-008`: restart/replay and complete handoff, leaving the sole canonical stack available for manual use.

Each ticket is independently bounded; do not automatically GO successor. Keep independent CK for code-changing gates, but use a single coherent final acceptance ledger rather than recreating 8 isolated Docker projects. A test failure must include exact command, observed state, owner and impact; no unbounded retry. A pre-existing unrelated semantic regression does not make this perception program expand scope.

**Required result:** one reproducible local Atlas stack, clean new Docker-backed state, two user-defined Safara projects, all four source PDFs processed via RUN-003 (when qualified supported), persistent results at `perceived`, a still-empty Master, zero semantic work, and a concise upstream contract pointing only to this path.

## 10. Terminal result and versioned baseline

Write `CANONICAL-PERCEPTION-BASELINE-v1.md` in the current perception implementation-context/evidence area (or explicitly reviewed nearby path). Include effective Compose name, version/SHA, exact profile and qualification ref, supported inputs/limitations, four PDF SHA-256 values, DB states/evidence, scoped regression results, cleaned Docker inventory, protected Docling cache/image identities and verified reuse, manual launch/restart instructions, the explicit baseline supersession/downstream regression rule from §8A, exact conflicting frozen downstream clauses if found, and unresolved matters. Never persist tokens, raw media bytes or private documents in evidence.

Allowed final statuses: `READY_FOR_CK`, `CHANGES_REQUIRED`, or `BLOCKED` with **specific** owner/cause/evidence. Independent CK, not Codex, grants PASS. Final deliverable must not imply that REL-03 or semantic production is active.
