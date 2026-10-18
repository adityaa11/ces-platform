# GO checkpoint: IDSER-012-03-01-01 / IDSER-BATCH-12-03-01-01

- **Ticket:** `IDSER-012-03-01-01 — Strict input body and accepted-fixture derivation`
- **Ticket state:** `awaiting_review`; this is a CK handoff, not a self-issued PASS.
- **Predecessors consumed:** approved IDSER-012-01 / PERC-RESET-008 accepted `NormalizedDocument v1` boundary. The validation creates and accepts an isolated RUN-003-shaped record through that existing boundary; it does not use a synthetic acceptance fixture.
- **Implementation paths:** `packages/atlas-db/src/semantic-batch-plan-input.ts`, its public export, and `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts`.

## Bounded change

- Added the receiver-owned `SemanticBatchPlanInput/v1` exact five-field type,
  canonical serializer, and strict canonical JSON parser. It rejects missing,
  extra, duplicate, prototype-bearing, oversized, malformed-hash,
  malformed-execution, wrong-version, and whitespace/noncanonical bodies.
- Added a read-only Atlas fixture repository. Its sole query joins completed
  `document_perception_execution`, matching `perceived` member, original
  document source, and live `normalized_document_cache`; it returns only the
  five fields plus reproducible fixture provenance and digest. It returns no
  normalized source/media content and has no resolver or redemption behavior.
- No resolver, cache mutation, planner, durable plan, GHR issuer/header/route,
  BSS activity, provider call, semantic execution, candidate/evidence/index,
  or reconciliation behavior was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-012030101-01` | Frozen row 01 | Reproducible fixture from completed execution, `perceived` member, source SHA, cache key, `v1`, and completion fingerprint; lookalike has no fixture | `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` creates a real accepted staged record through `PostgresPerceptionAuthority`, derives twice, checks persisted values/provenance/digest, and rejects an identity with no accepted facts. `DATABASE_URL=postgresql://atlas:…@localhost:5432/atlas_dev pnpm --filter @atlas/db test:semantic-batch-plan-input` — pass, 1/1. | `PROVEN` |
| `RC-012030101-02` | Frozen row 02 | Exact five-field parser accepts qualified body and rejects all named negative classes | Same integration test accepts the derived canonical JSON and asserts missing, extra, duplicate, prototype-bearing, oversized, malformed hash, empty execution, wrong version, and noncanonical whitespace rejection. | `PROVEN` |
| `RC-012030101-03` | Frozen row 03 | Opaque reference with zero downstream effects | Same test snapshots normalized-cache, semantic-execution/result/candidate/index, and reconciliation-result counts before derivation/parser and proves they are unchanged afterwards; implementation has no write or downstream dependency. | `PROVEN` |
| `RC-012030101-04` | Frozen row 04 | Fixture remains replaceable through the same parser without trusted GHR contract | Parser is exported independently from the read-only fixture repository; the body contains only the five references and the test confirms no storage path or normalized document/media body is copied. No GHR header, issuer, policy grant, route, queue, or resolver was introduced. | `PROVEN` |

## Validation

- `pnpm --filter @atlas/db typecheck` — passed.
- `DATABASE_URL=postgresql://atlas:…@localhost:5432/atlas_dev pnpm --filter @atlas/db test:semantic-batch-plan-input` — passed, 1/1 against the canonical local Compose PostgreSQL service.
- Post-test database check for the fixture prefix — `0` projects, `0` executions, `0` caches left behind.
- `git diff --check` — passed.

## Canonical persisted-record provenance

Read-only validation against the canonical local Compose PostgreSQL corpus
selected `safara-professional-perception`:

- Repository path: `atlas.document_perception_execution -> atlas.extraction_bundle_document -> atlas.document -> atlas.normalized_document_cache`.
- `perceptionExecutionId`: `39cc9cad-9d74-4cfa-8eb6-9c435d03022e`.
- `normalizedDocumentRef` (persisted cache key): `748e12f471fd8c893ad1d396caa64ad178f14eaf18c0570497af4c8fe7296ba1`.
- `sourceSha256`: `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`.
- `normalizedDocumentFingerprint` (completed execution): `a1701b0a66592d4d8c8638177f3cd612bfb564add29354de20de149d83a1392e`.
- Canonical five-field JSON is 369 UTF-8 bytes with SHA-256 `0e2a96dce94288e95bd912468159c8211e01b2969128a1c470cf4dc0e776be65`.

The selected member was `perceived`, execution was `completed`, cache was
live and RUN-003-qualified. The query read no normalized JSON, raw source, or
media bytes; no caller-supplied value determines either persisted hash.

## Scope boundary

This checkpoint stops at parser and non-authorizing fixture derivation. In particular, it does not implement the `-03-01-02` resolver, permit a reference/hash to grant access, partition a corpus, persist a plan, activate BSS/SEM, or issue/deliver a real GHR handoff.

Internal readiness: READY_FOR_CK
