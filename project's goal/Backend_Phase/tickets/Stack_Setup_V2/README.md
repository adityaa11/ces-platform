# Backend Stack Setup V2 Reconciliation

- **State:** `planned`
- **Ticket prefix:** `BSS-V2`
- **Primary architecture:** [Atlas Core Architecture Checkpoint V3](../../atlas-core-architecture-checkpoint-v3.md)
- **Primary baseline:** [Atlas Backend Production Baseline V2](../../atlas-backend-production-baseline-v2.md)
- **Implementation context:** [BSS V2 implementation context](../../atlas-bss-v2-implementation-context.md)
- **Semantic extraction context:** [Semantic V1 Zod + Anoman productionization](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md)

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
| 12 | [BSS-V2-004-03-06](BSS-V2-004-03-06-live-anoman-extraction-qualification.md) | BSS-V2-BATCH-04.03-06 | 03-01 through 03-05 CK PASS; explicit opt-in GO and local gates | Qualify production extraction with a frozen, secret-safe Anoman run plan. |
| 13 | [BSS-V2-004-03-07](BSS-V2-004-03-07-d1-docling-semantic-continuation.md) | BSS-V2-BATCH-04.03-07 | 03-06 CK PASS with qualification PASS; 004-02 CK PASS; explicit GO | Release the D1 semantic stop; prove extraction acceptance and stop before reconciliation. |
| 14 | BSS-V2-004-04 (planning placeholder) | later | separate from extraction; not frozen here | Semantic reconciliation live qualification remains independent from extraction. |
| 15 | [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md) | BSS-V2-BATCH-05 | 004-03 parent scope; follow-on contract not regenerated here | Are real external-provider quota domains and capacity profiles represented without product authority? |
| 16 | [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md) | BSS-V2-BATCH-06 | 005 | Does admission protect interactive work and keep local processor controls distinct? |
| 17 | [BSS-V2-007](BSS-V2-007-execution-usage-provenance-ledger.md) | BSS-V2-BATCH-07 | 004-03 parent scope; follow-on contract not regenerated here | Is external-provider usage/provenance persisted without inventing Docling economics? |
| 18 | [BSS-V2-008](BSS-V2-008-price-profiles-shadow-cogs.md) | BSS-V2-BATCH-08 | 007 | Are external-provider prices and distinct actual/shadow costs calculated without billing? |
| 19 | [BSS-V2-009](BSS-V2-009-privacy-preflight.md) | BSS-V2-BATCH-09 | 006, 008 | Does privacy compatibility fail before external-provider transmission? |
| 20 | [BSS-V2-010](BSS-V2-010-qualified-fallback-route-state.md) | BSS-V2-BATCH-10 | 009 | Is fallback restricted to compatible, qualified routes with recorded selection? |
| 21 | [BSS-V2-011](BSS-V2-011-integrated-reconciliation-checkpoint.md) | BSS-V2-BATCH-11 | 001–003, 004-02, 004-03, 004-04, 005–010 | Do frozen BSS V2 interfaces compose without reopening IDSER domain acceptance? |

```text
001 -> 002 -> 004-01 -> 004-02 -> STOP
       \-> 003 (approved Gemini reasoning adapter; not a perception dependency)

004-02 -> 004-03-01 -> 004-03-02 -> 004-03-03 --+
                                004-03-04 ------+-> 004-03-05 -> 004-03-06
                                                                         |
                                                                         v
                                              004-02 + 004-03-06 PASS -> 004-03-07 -> STOP BEFORE RECONCILIATION

004-04 (semantic reconciliation) remains a separately qualified later scope.

004-03 -> 005 -> 006 --+
004-03 -> 007 -> 008 --+-> 009 -> 010 -> 011
004-04 ----------------+
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

The immediate executable milestone remains BSS-V2-004-02: Atlas accepts the IDSER D1 `NormalizedDocument v1`, then **STOP**. The productionization context freezes BSS-V2-004-03-01 through -07 as planned children, each requiring its own dependency PASS and explicit GO. The first five build and deterministically compose provider-neutral extraction; -06 is the only live qualification; -07 releases the D1 stop only after qualification and CK PASS, then **STOP BEFORE RECONCILIATION**. The historical Gemini mega-ticket remains superseded evidence. BSS-V2-004-04, BSS-V2-005 and later operational contracts remain separate and are not regenerated/frozen by this set. The broader BSS V2 phase later requires separately qualified external semantic routes plus capacity/admission, telemetry/cost, privacy, fallback, Compose and restricted-role controls; no ticket here grants full live IDSER acceptance.
