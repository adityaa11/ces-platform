# Backend Stack Setup V2 Reconciliation

- **State:** `planned`
- **Ticket prefix:** `BSS-V2`
- **Primary architecture:** [Atlas Core Architecture Checkpoint V3](../../atlas-core-architecture-checkpoint-v3.md)
- **Primary baseline:** [Atlas Backend Production Baseline V2](../../atlas-backend-production-baseline-v2.md)
- **Implementation context:** [BSS V2 implementation context](../../atlas-bss-v2-implementation-context.md)

## Purpose and compatibility

BSS V2 is an additive provider-execution reconciliation. It changes neither Atlas project truth nor the established semantic, review, persistence, replay, queue, and document-perception authority.

- Historical BSS checkpoints remain historical; this set does not rewrite their tickets or review evidence.
- IDSER-001 through IDSER-010 are not reopened. IDSER-011 remains Mistral-specific historical live-provider evidence.
- Gemini is the current development provider direction, not permanent architecture authority.
- Mistral remains an implemented but inactive/blocked provider route until separately requalified.

The completed substrate maps Atlas capabilities to explicitly qualified routes, then applies operational capacity, privacy, provenance, and cost controls before existing Atlas validation and persistence boundaries. It does not add customer pricing, subscription/billing, UI/review behavior, CES/chat product behavior, publication, gateway integration, a new queue, Redis/Kafka/Kubernetes, S3/R2, or tenancy administration.

## Delivery order

| Order | Ticket | Batch | Depends on | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [BSS-V2-001](BSS-V2-001-provider-capability-decoupling.md) | BSS-V2-BATCH-01 | accepted BSS-005/006/008/009 series | Are generic execution paths provider-neutral while retained Mistral behavior still conforms? |
| 2 | [BSS-V2-002](BSS-V2-002-qualified-route-registry.md) | BSS-V2-BATCH-02 | 001 | Does server-controlled qualified route resolution replace direct vendor construction? |
| 3 | [BSS-V2-003](BSS-V2-003-gemini-adapter-contracts.md) | BSS-V2-BATCH-03 | 002 | Does Gemini implement only the required neutral contracts under deterministic proof? |
| 4 | [BSS-V2-004](BSS-V2-004-gemini-live-qualification.md) | BSS-V2-BATCH-04 | 003 | Are explicitly identified Gemini routes live-qualified and only then activated for development? |
| 5 | [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md) | BSS-V2-BATCH-05 | 004 | Are real shared quota domains and capacity profiles represented without product authority? |
| 6 | [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md) | BSS-V2-BATCH-06 | 005 | Does admission protect interactive work while preserving pg-boss guarantees? |
| 7 | [BSS-V2-007](BSS-V2-007-execution-usage-provenance-ledger.md) | BSS-V2-BATCH-07 | 004 | Is secret-safe route usage/provenance persisted in Bridge-owned state? |
| 8 | [BSS-V2-008](BSS-V2-008-price-profiles-shadow-cogs.md) | BSS-V2-BATCH-08 | 007 | Are effective-dated prices and distinct actual/shadow costs calculated without billing? |
| 9 | [BSS-V2-009](BSS-V2-009-privacy-preflight.md) | BSS-V2-BATCH-09 | 006, 008 | Does privacy compatibility fail before any provider transmission? |
| 10 | [BSS-V2-010](BSS-V2-010-qualified-fallback-route-state.md) | BSS-V2-BATCH-10 | 009 | Is fallback restricted to compatible, qualified routes with recorded selection? |
| 11 | [BSS-V2-011](BSS-V2-011-integrated-reconciliation-checkpoint.md) | BSS-V2-BATCH-11 | 001–010 | Do frozen BSS V2 interfaces compose without reopening IDSER domain acceptance? |

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 --+
                         \-> 007 -> 008 --+-> 009 -> 010 -> 011
```

Dependencies are PASS gates: an `awaiting_review` predecessor is not permission to begin a dependent implementation.

## Review and security controls

Every ticket begins `planned`. GO completes all frozen Review Contract rows and their named validation before `awaiting_review`; CK returns one consolidated `PASS` or `CHANGES_REQUIRED`; CFC remediates only frozen CK clauses; HMN only authorizes an exact unresolved frozen clause. A predecessor defect found during composition returns to its owner and is not absorbed by BSS-V2-011.

Each ticket contains ticket-local Security Refactor Readiness based on the repository [engineering-security-refactor-readiness skill](../../../../.agents/skills/engineering-security-refactor-readiness/SKILL.md). These bindings are minimum review coverage, not a security-baseline claim. Future legal/residency, tenant-isolation, BYOK, retention, and incident policy remain intentionally unresolved unless a ticket explicitly owns an established policy.

## Docker and evidence convention

`docker compose up` remains the supported local stack path. When changed source/configuration is involved, rebuild/recreate only affected services, verify image/config, migrations, readiness, scoped pg-boss/DocumentStore state, and that no old process is serving traffic. Do not use `docker compose down --volumes` as routine repair.

Normal tests are deterministic or Compose-local and never consume provider credits. Only BSS-V2-004 owns opt-in live Gemini qualification; its evidence must use synthetic/public/non-confidential material and exclude credentials, authorization headers, source grants, raw PDFs/PRDs, prompts, and full provider bodies.

## Completion and handoff

BSS V2 ends when provider-neutral capability injection, qualified Gemini development routes, inactive Mistral preservation, capacity/admission, telemetry/cost, privacy preflight, qualified fallback, Compose compatibility, and restricted Bridge database authority are proven together. It then stops. A separately planned superseding live-provider IDSER acceptance set may subsequently consume the qualified routes for first-document, incremental-sequencing, and Ready-for-Review proof.
