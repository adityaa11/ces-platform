# Backend Stack Setup V2 Reconciliation

- **State:** `planned`
- **Ticket prefix:** `BSS-V2`
- **Primary architecture:** [Atlas Core Architecture Checkpoint V3](../../atlas-core-architecture-checkpoint-v3.md)
- **Primary baseline:** [Atlas Backend Production Baseline V2](../../atlas-backend-production-baseline-v2.md)
- **Implementation context:** [BSS V2 implementation context](../../atlas-bss-v2-implementation-context.md)
- **Semantic extraction context:** [Semantic V1 Zod + Anoman productionization](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md)
- **Provider admission planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md)

## Purpose and compatibility

BSS V2 is an additive provider-execution reconciliation. It changes neither Atlas project truth nor the established semantic, review, persistence, replay, queue, and document-perception authority.

- Historical BSS checkpoints remain historical; this set does not rewrite their tickets or review evidence.
- IDSER-001 through IDSER-010 are not reopened. IDSER-011 remains Mistral-specific historical live-provider evidence.
- Gemini remains an implemented reasoning-adapter candidate, not permanent architecture authority or the primary perception route.
- Mistral remains an implemented but inactive/blocked provider route until separately requalified.

The completed substrate maps Atlas capabilities to explicitly qualified routes, then applies operational capacity, privacy, provenance, and cost controls before existing Atlas validation and persistence boundaries. It does not add customer pricing, subscription/billing, UI/review behavior, CES/chat product behavior, publication, gateway integration, a new queue, Redis/Kafka/Kubernetes, S3/R2, or tenancy administration.

## Delivery order

| Order | Ticket | Batch | Depends on | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [BSS-V2-001](BSS-V2-001-provider-capability-decoupling.md) | BSS-V2-BATCH-01 | accepted BSS-005/006/008/009 series | Are generic execution paths provider-neutral while retained Mistral behavior still conforms? |
| 2 | [BSS-V2-002](BSS-V2-002-qualified-route-registry.md) | BSS-V2-BATCH-02 | 001 | Does server-controlled qualified route resolution replace direct vendor construction? |
| 3 | [BSS-V2-003](BSS-V2-003-gemini-adapter-contracts.md) | BSS-V2-BATCH-03 | 002 | Does Gemini implement only the required neutral contracts under deterministic proof? |
| 4 | [BSS-V2-004](BSS-V2-004-gemini-live-qualification.md) | historical | superseded | Historical combined Gemini/PDF/semantic qualification; not executable. |
| 5 | [BSS-V2-004-01](BSS-V2-004-01-local-docling-perception-executor.md) | BSS-V2-BATCH-04.01 | 001–002, DOCSPIKE-001 evidence; 003 is retained adapter history only | Does a pinned, persistent, Compose-private Docling Serve CPU route produce deterministic parser-valid `NormalizedDocument v1` within the <=20s warm-route gate? |
| 6 | [BSS-V2-004-02](BSS-V2-004-02-idser-d1-docling-lifecycle.md) | BSS-V2-BATCH-04.02 | 004-01, approved IDSER-003/BSS-009 series | Does the real D1 lifecycle send exact authorized bytes through the qualified resident Docling service, accept one valid `NormalizedDocument v1`, and then stop? |
| 7 | [BSS-V2-004-03-01](BSS-V2-004-03-01-canonical-semantic-v1-zod-authority.md) | BSS-V2-BATCH-04.03-01 | 004-02 CK PASS; explicit GO | Make canonical production Semantic V1 Zod the sole semantic/result authority with parity. |
| 8 | [BSS-V2-004-03-02](BSS-V2-004-03-02-provider-proposal-zod-prompt-compiler.md) | BSS-V2-BATCH-04.03-02 | 03-01 CK PASS; PROMPT-003 CK PASS; explicit GO | Build provider-neutral proposal schema and deterministic PROMPT-003-equivalent compiler. |
| 9 | [BSS-V2-004-03-03](BSS-V2-004-03-03-normalized-document-source-units.md) | BSS-V2-BATCH-04.03-03 | 03-01/02 CK PASS; explicit GO | Build deterministic bounded source units and a provider-neutral packet from `NormalizedDocument v1`. |
| 10 | [BSS-V2-004-03-04](BSS-V2-004-03-04-anoman-reasoning-adapter.md) | BSS-V2-BATCH-04.03-04 | 001 CK PASS; 002 route contract; 003 retained Gemini; explicit GO | Add a distinct Anoman adapter under the neutral reasoning capability; no live call. |
| 11 | [BSS-V2-004-03-05](BSS-V2-004-03-05-deterministic-extraction-finalizer.md) | BSS-V2-BATCH-04.03-05 | 03-01 through 03-04 CK PASS; explicit GO | Compose deterministic extraction through the neutral worker while preserving the D1 stop. |
| 12 | [BSS-V2-004-03-06](BSS-V2-004-03-06-live-anoman-extraction-qualification.md) | BSS-V2-BATCH-04.03-06 | 03-01 through 03-05, BSS-V2-006-04, IDSER-012-02-01/-02 CK PASS; explicit opt-in GO | Live-qualify exact batch-aware semantic request profile through BSS-V2-006 with one explicit attempt per reservation. |
| 13 | [BSS-V2-004-03-07](BSS-V2-004-03-07-d1-docling-semantic-continuation.md) | historical | superseded before implementation by IDSER-012-02 | Retained unimplemented planning history; must not bypass BSS-V2-006. |
| 14 | BSS-V2-004-04 (planning placeholder) | later | separate from extraction; not frozen here | Semantic reconciliation live qualification remains independent from extraction. |
| 15 | [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md) | umbrella | accepted BSS-005/006 and BSS-V2-001/002 | Non-executable provider-capacity planning partition. |
| 16 | [BSS-V2-005-01](BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md) | BSS-V2-BATCH-05-01 | BSS-V2-001/002 CK PASS; BSS-003 boundaries | Secret-free shared quota domains and versioned capacity profiles. |
| 17 | [BSS-V2-005-02](BSS-V2-005-02-process-workload-envelope-catalogue.md) | BSS-V2-BATCH-05-02 | 005-01 CK PASS | Provider-dependent process and bounded workload-envelope contracts. |
| 18 | [BSS-V2-005-03](BSS-V2-005-03-deterministic-multi-resource-capacity-planner.md) | BSS-V2-BATCH-05-03 | 005-01/02 CK PASS | Deterministic multi-resource planning with hard interactive reserve. |
| 19 | [BSS-V2-005-04](BSS-V2-005-04-desired-admission-profile-publication.md) | BSS-V2-BATCH-05-04 | 005-03 CK PASS; BSS-003 boundaries | Immutable DesiredAdmissionProfile publication and atomic cutover. |
| 20 | [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md) | umbrella | all 005 children CK PASS; BSS-006; BSS-V2-001/002 | Non-executable durable runtime-admission partition. |
| 21 | [BSS-V2-006-01](BSS-V2-006-01-provider-work-reservation-window-foundation.md) | BSS-V2-BATCH-06-01 | 005-04 CK PASS; BSS-006/BSS-003 | Durable waiting work, reservation, quota-window, and wakeup foundation. |
| 22 | [BSS-V2-006-02](BSS-V2-006-02-fair-admission-interactive-protection-atomic-dispatch.md) | BSS-V2-BATCH-06-02 | 006-01 CK PASS | Fair multi-resource admission, hard interactive protection, and atomic dispatch. |
| 23 | [BSS-V2-006-03](BSS-V2-006-03-provider-usage-runtime-clamp-plan-convergence.md) | BSS-V2-BATCH-06-03 | 006-02 CK PASS; normalized adapter metadata | Usage reconciliation, runtime pressure clamp, and plan convergence. |
| 24 | [BSS-V2-006-04](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md) | BSS-V2-BATCH-06-04 | 006-01 through -03 CK PASS | Integrated deterministic proof of the reusable admission authority. |
| 25 | [BSS-V2-007](BSS-V2-007-execution-usage-provenance-ledger.md) | BSS-V2-BATCH-07 | 004-03 parent scope; later dependency realignment as needed | Is external-provider usage/provenance persisted without inventing Docling economics? |
| 26 | [BSS-V2-008](BSS-V2-008-price-profiles-shadow-cogs.md) | BSS-V2-BATCH-08 | 007 | Are external-provider prices and distinct actual/shadow costs calculated without billing? |
| 27 | [BSS-V2-009](BSS-V2-009-privacy-preflight.md) | BSS-V2-BATCH-09 | 006, 008 | Does privacy compatibility fail before external-provider transmission? |
| 28 | [BSS-V2-010](BSS-V2-010-qualified-fallback-route-state.md) | BSS-V2-BATCH-10 | 009 | Is fallback restricted to compatible, qualified routes with recorded selection? |
| 29 | [BSS-V2-011](BSS-V2-011-integrated-reconciliation-checkpoint.md) | BSS-V2-BATCH-11 | 001–003, 004-02, 004-03, 004-04, 005–010 | Do frozen BSS V2 interfaces compose without reopening IDSER domain acceptance? |

```text
001 -> 002 -> 004-01 -> 004-02 -> STOP
       \-> 003 (approved Gemini reasoning adapter; not a perception dependency)

004-02 -> 004-03-01 -> 004-03-02 -> 004-03-03
004-03-04 -> 004-03-05 -----------------------------------------------+
                                                                          |
005-01 -> 005-02 -> 005-03 -> 005-04                                    |
                                  |                                       |
                                  v                                       |
006-01 -> 006-02 -> 006-03 -> 006-04 -----------------------------------+
                                                                          |
IDSER-012-01-02 -> perceived --------------------------------------------+
                                                                          |
                                                                          v
                                                               IDSER-012-02-01
                                                                          |
                                                                          v
                                                               IDSER-012-02-02
                                                                          |
                                                                          v
                                                               004-03-06 live PASS
                                                                          |
                                                                          v
                                                               IDSER-012-02-03
                                                                          |
                                                                          v
                                                               IDSER-012-02-04
                                                                          |
                                                                          v
                                                                    semantic_ready
                                                                          |
                                                                         STOP

004-03-07 is superseded-before-implementation; it is not executable.
004-04 reconciliation qualification remains a separately gated later scope.

006-04 -------------------------+
004-03 / later 004-04 ----------+-> 007 -> 008 -> 009 -> 010 -> 011
```
Dependencies are PASS gates: an `awaiting_review` predecessor is not permission to begin a dependent implementation.

## Docling local Docker execution model

BSS-V2-004-01 and BSS-V2-004-02 use Docling as a **resident local conversion service**, not a one-shot Python process.

The required topology is:

```text
pg-boss / Atlas lifecycle
        |
        v
Agents Bridge worker
        |
        | exact BSS-009-authorized PDF bytes
        v
Compose-private docling-serve
        |
        | persistent Python runtime
        | model artifacts local before work
        | converter/model cache kept warm
        | standard PDF pipeline
        | OCR disabled for the current digital-PDF class
        | explicit CPU resource profile
        v
DoclingDocument JSON
        |
        v
deterministic Atlas mapper
        |
        v
normalizePerceptionResult(...)
        |
        v
NormalizedDocument v1
```

The base Atlas Compose profile must not expose Docling as a public host service. Bridge reaches it by Docker-network service identity. Docling receives no DocumentStore, database, pg-boss, project/workspace, semantic, review, or publication credentials.

The current qualification profile is CPU-first and must use a CPU-only pinned Docling/Docling-Serve runtime rather than carrying unusable CUDA dependencies. GPU/CUDA is a separate future route qualification, not an automatic fallback.

Docling route readiness is stronger than container liveness:

```text
/health
  +
/ready model-loading readiness
  +
pinned runtime identity
  +
required artifacts local
  +
exact Atlas no-OCR PDF option profile warm
  =
Atlas perception route ready
```

Normal D1 work must not pay model download or per-document Python/pipeline initialization cost.

The warm production-shaped latency requirement is:

```text
authorized bytes at Bridge
    -> private Docling request
    -> conversion
    -> response
    -> mapping
    -> Atlas normalization/parser
    <= 20 seconds wall clock
```

Cold service boot/model warm-up is measured separately and may be excluded from per-document latency only because the route remains not-ready until it completes.

Atlas continues to own queue/retry/replay/fencing through pg-boss. Do not enable Docling RQ/Redis or another durable queue for the current D1 path.

## Review and security controls

Every ticket begins `planned`. GO completes all frozen Review Contract rows and their named validation before `awaiting_review`; CK returns one consolidated `PASS` or `CHANGES_REQUIRED`; CFC remediates only frozen CK clauses; HMN only authorizes an exact unresolved frozen clause. A predecessor defect found during composition returns to its owner and is not absorbed by BSS-V2-011.

Each ticket contains ticket-local Security Refactor Readiness based on the repository [engineering-security-refactor-readiness skill](../../../../.agents/skills/engineering-security-refactor-readiness/SKILL.md). These bindings are minimum review coverage, not a security-baseline claim. Future legal/residency, tenant-isolation, BYOK, retention, and incident policy remain intentionally unresolved unless a ticket explicitly owns an established policy.

## Docker and evidence convention

`docker compose up` remains the supported local stack path. The Docling route is a dedicated long-lived Compose service with pinned runtime identity, local model artifacts, explicit CPU device/thread/concurrency settings, health/readiness checks, and no public host port in the base profile. When changed source/configuration is involved, rebuild/recreate only affected services, verify image/config/version/model readiness, warm the exact Atlas digital-PDF option profile, verify scoped pg-boss/DocumentStore state, and ensure no stale Bridge/Docling process is serving traffic. Do not use `docker compose down --volumes` as routine repair.

Normal tests are deterministic or Compose-local. The local Docling tickets use repository-approved non-confidential digital PDFs through the same persistent private service route used by the production-shaped profile, keep raw source artifacts out of versioned evidence, and record cold-start/warm-up separately from warm per-document latency. Later external semantic qualification must be opt-in and secret-safe: exclude credentials, authorization headers, source grants, raw PDFs/PRDs, prompts, and full provider bodies.

## Completion and handoff

The accepted Docling milestone remains BSS-V2-004-02: Atlas accepts `NormalizedDocument v1`, then stops. BSS-V2-004-03-01 through -05 build the provider-neutral semantic route. BSS-V2-005/006 establish planning/runtime admission; IDSER-012-02-01/-02 freeze the concrete batch-aware semantic request/profile; only then does BSS-V2-004-03-06 live-qualify the exact request shape through BSS-V2-006. The former -07 direct continuation is superseded before implementation.

BSS-V2-005 now ends at an immutable active DesiredAdmissionProfile and performs no runtime admission. BSS-V2-006 then proves the reusable durable provider-admission authority without implementing a product consumer. IDSER-012-02 is the first production consumer after local `perceived` and semantic qualification gates pass; it stops at durable `semantic_ready` before reconciliation. BSS-V2-007 and later operational tickets may consume the new seams but are not expanded by this planning context. No generated ticket grants full IDSER, reconciliation, CES, chat, review, publication, billing, privacy, or fallback acceptance.
