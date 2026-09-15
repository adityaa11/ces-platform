# Backend Stack Setup Ticket Set

- **State:** `in_progress`
- **Primary baseline:** [Atlas Backend Production Baseline](../../atlas-backend-production-baseline.md)
- **Architecture guardrails:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2.md)

## Purpose

Establish the production-shaped backend workspace and infrastructure boundaries described by the Backend Phase baseline. These tickets set up the runtime, persistence, identity, reasoning-service, queue, and document-storage foundations. They do not implement Atlas's full knowledge lifecycle.

The existing `apps/atlas` UI and its fixture-driven prototype remain in place while backend services are introduced. `@atlas/fixtures` remains test and golden-scenario material; it is not a production source of truth.

## Validation boundary

- BSS acceptance is limited to stack setup and the service, database, queue, storage, or provider boundary named by the individual ticket.
- The `@atlas/fixtures` test suite, golden-bundle generation and reconciliation, PRD/PDF fixture catalog checks, and fixture-driven UI scenario checks are explicitly excluded from BSS acceptance criteria and blockers. They belong to the AUI, GLF, or SFE ticket sets.
- References to workspace tests in BSS tickets mean tests for the BSS-owned packages and directly affected integration targets. They do not require the Atlas golden-fixture suite.
- Build or smoke checks for `apps/atlas` may be used when a ticket needs to verify stack compatibility; they do not expand the ticket to fixture-suite validation or UI changes.

## Delivery order

Each ticket is its own review batch because each establishes a distinct boundary and acceptance decision. Tickets remain planned until authorized; each implementation commit is recorded when its batch reaches review.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [BSS-001](BSS-001-runtime-and-workspace-foundation.md) / BSS-BATCH-01 | `approved` | — | Is the workspace reproducible on the selected Node and TypeScript toolchain while preserving the existing prototype? |
| 2 | [BSS-002](BSS-002-local-postgresql-compose.md) / BSS-BATCH-02 | `approved` | BSS-001 | Can developers start a durable local PostgreSQL instance through the documented Compose workflow? |
| 3 | [BSS-003](BSS-003-postgresql-drizzle-boundaries.md) / BSS-BATCH-03 | `in_progress` | BSS-001, BSS-002 | Are PostgreSQL migrations, schema ownership, and repository boundaries established without prematurely fixing the domain schema? |
| 4 | [BSS-004](BSS-004-better-auth-persistence.md) / BSS-BATCH-04 | `planned` | BSS-003 | Does Better Auth persist identity and sessions in its own PostgreSQL schema without taking ownership of Atlas authorization? |
| 5 | [BSS-005](BSS-005-agents-bridge-service-foundation.md) / BSS-BATCH-05 | `planned` | BSS-001, BSS-003 | Can Agents Bridge serve a provider-neutral interactive API and SSE while remaining separate from Atlas truth? |
| 6 | [BSS-006](BSS-006-pg-boss-background-runtime.md) / BSS-BATCH-06 | `planned` | BSS-003, BSS-005 | Can the background runtime process PostgreSQL-backed jobs with retries while remaining unable to mutate trusted Atlas state? |
| 7 | [BSS-007](BSS-007-document-store-foundation.md) / BSS-BATCH-07 | `planned` | BSS-001 | Can immutable source bytes be stored and retrieved through a storage-neutral interface using the initial local adapter? |
| 8 | [BSS-008](BSS-008-groq-provider-adapter.md) / BSS-BATCH-08 | `planned` | BSS-005 | Can the Groq adapter provide validated structured generation and text streaming through the provider-neutral Bridge contract? |

## Scope boundaries

- PostgreSQL remains the canonical persistent state store. `pg-boss` remains the planned queue; Redis, Kafka, Kubernetes, and a standalone vector database are not introduced.
- `Atlas Core` must not depend on Drizzle. Better Auth owns its authentication tables. Agents Bridge receives a separately restricted database role and does not write accepted Atlas state.
- This set establishes schemas and migration mechanics, not the final Atlas domain schema. It does not lock the final skill list, skill contracts, CES assurance normalization, extraction/reconciliation behavior, approval workflow, or publication behavior.
- The initial document adapter is for local development. Its interface must support a later S3/R2 adapter; local files are not a production persistence solution.
- Groq is the selected first model provider. BSS-005 establishes the provider-neutral Bridge contract; BSS-008 implements Groq behind that boundary. Provider secrets, pricing, usage budgets, and rate-limit policy remain Bridge-owned runtime concerns.
- Hosting has not been selected. The Vercel discussion was a feasibility check only; these tickets preserve the baseline stack and do not add Vercel-specific deployment requirements. If Vercel is chosen later, worker placement and durable object storage must be addressed in a deployment ticket.

## Review controls

- Keep each ticket in `planned` until the user authorizes its implementation.
- After the authorized ticket is implemented, validated, and committed, update it to `awaiting_review` and record that commit in its batch entry above.
- Do not start a dependent ticket until the prior checkpoint has a `PASS` review.
- A new technology choice or product behavior that is not in the named baselines is a scope decision, not an implementation detail to add silently.
