# Backend package ownership

This note records the intended ownership boundaries for the Atlas backend workspace. It follows the [Backend Production Baseline](../project's%20goal/Backend_Phase/atlas-backend-production-baseline-mistral-synced.md#14-package-structure). The current workspace contains `apps/atlas` and `packages/atlas-fixtures`; the other packages below are planned boundaries and are not created by this note.

| Workspace path | Ownership |
|---|---|
| `apps/atlas` | User-facing Atlas web application and its API composition. It coordinates Atlas-owned services and presents the existing fixture-driven prototype while that UI remains in transition. |
| `apps/agents-bridge` | Independently runnable reasoning API, interactive streaming, background worker entry points, provider adapters, execution, and model usage controls. It handles only bounded context explicitly supplied by Atlas and does not commit trusted Atlas state. |
| `packages/atlas-core` | Framework-independent Atlas domain behavior, including project/workspace, document, revision, knowledge, reconciliation, approval, and publication semantics. It owns deterministic validation and trusted-state transitions; it does not depend on Drizzle or web frameworks. |
| `packages/atlas-db` | PostgreSQL connection and role configuration, Drizzle schema and migrations, and database repository adapters. It owns persistence mechanics, not Atlas domain semantics. |
| `packages/atlas-contracts` | Provider-neutral TypeScript and JSON Schema contracts for reasoning, execution, and events shared across services and workers. |
| `packages/atlas-skills` | Provider-neutral reasoning capabilities for extraction, reconciliation, semantic mediation, Addendum authoring, CES assessment, and related candidate generation. Skills return candidates and do not mutate trusted state. |
| `packages/document-store` | The storage-neutral interface and adapters for immutable source document bytes, beginning with the local-development adapter. |
| `packages/atlas-fixtures` | Test scenarios, golden fixtures, regression material, and architecture verification only. Fixtures are not production truth or a runtime source of record. |

Packages should depend on the boundary that owns the capability they need. In particular, `atlas-core` remains independent of database and web frameworks, while Agents Bridge remains separate from Atlas authorization, retrieval, and trusted-state mutation. This ticket establishes the ownership note and shared compiler defaults; it does not create the planned services or settle the final domain schema or skill contracts.
