# IDSER-010-01: Deterministic production-shaped single-document foundation

- **State:** `awaiting_review`; **Review batch:** `IDSER-BATCH-10-01`.
- **Predecessors:** IDSER-001 through IDSER-008 and the complete IDSER-009 series through IDSER-009-04 `PASS`.
- **Consumes:** frozen PCC create/auth, BSS-006 pg-boss, BSS-007 DocumentStore, BSS-008 `MistralProvider`, BSS-009 perception, and approved IDSER-004/005/006/008 authority without reopening them.
- **Execution environment:** Compose PostgreSQL, actual Atlas/Bridge/worker processes, actual DocumentStore and queue, explicit controlled Mistral endpoint/configuration.

## Authority and bounded outcome

Own the reusable deterministic production-shaped test capability **and** the complete single-document semantic contract. Add the smallest runnable IDSER suite/script and fixtures needed to create an authenticated production project with a synthetic PDF, drive the actual perception -> `atlas.semantic.extract/v1` -> `atlas.semantic.reconcile/v1` route, and observe Atlas persistence and completion. The controlled provider must be reached through the production dispatcher and existing `MistralProvider` capability; it is not semantic authority.

Scenario A proves one normal document reaches 1/1 and Ready for review with resolved IDs, candidates, evidence, full validated results and provenance. Scenario B proves two internally conflicting statements persist separately with an unresolved relationship, still reach ready, and do not promote a semantic winner. This child also proves explicit mock configuration, unknown-skill failure closed, no production semantic TestRuntime, bounded handoff shapes, Bridge direct-DB denial, and the existing pg-boss/worker/DocumentStore route.

## Explicit non-authority

This child does not prove multi-document prior selection, all relationship vocabulary, D2/D3 ordering, concurrent isolation, failure rollback/terminal handling, staged replay/restart, browser/CSP regression, full negative downstream-state inspection, or a live API key. It must not introduce a second worker, queue, OCR route, fixture authority, silent fallback, production hook, or provider credential requirement.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-01-01 | The harness uses authenticated project creation, real DocumentStore, pg-boss, BSS-009, existing worker, Atlas internal context/result routes, production dispatcher and `MistralProvider`; mock endpoint/config is explicit and secret-free. | Compose suite plus service/DB observations. **PASS iff** every named production boundary is observed and no TestRuntime, direct Bridge mutation, second queue/OCR/worker, credential dependency, or silent mock fallback appears. |
| RC-010-01-02 | Scenario A persists valid full extraction/reconciliation results, candidate/evidence rows and provenance, then reaches 1/1 and ready. | One controlled-provider single-PDF fixture with provider-call, IDs, DB state and card/read-model assertions. **PASS iff** all records resolve in the same scoped bundle and completion follows reconciliation. |
| RC-010-01-03 | Scenario B preserves both candidates and an unresolved internal relation; no accepted/resolved truth or `Needs attention` is fabricated. | One deterministic conflicting-PDF fixture. **PASS iff** two source-grounded candidates and unresolved relation persist, Master stays empty, and the completed bundle is ready. |
| RC-010-01-04 | Dispatcher, skill and handoff boundaries remain constrained: only two versioned semantic skills, unknown skill fails closed, bounded identities contain no bytes/storage keys, and Bridge cannot mutate trusted Atlas state. | Existing focused worker/contract/permission suites plus IDSER harness shape assertions. **PASS iff** each negative rejects before trusted semantic mutation. |

## Security, repair and handoff

**Security readiness: applicable.** This owns `SEAM-010-01` / `REV-010-01`: user/project/workspace/bundle/document/execution identity crosses the controlled provider only through authenticated Atlas authority; provider configuration and evidence are secret-safe. Mandatory negatives are TestRuntime prohibition, unknown skill, direct Bridge DB denial, raw source/storage-key absence, and mock fallback absence. Direct regressions are BSS-008/009 provider/perception and semantic worker/authority suites.

Normal CFC work is local to the deterministic harness, configuration boundary, worker dispatch fixture, or its exact assertions. HMN may resolve one residual such as an explicit-config assertion, a single boundary observation, or a fixture identity mismatch; it may not authorize multi-document, failure, replay, concurrency, browser, or live-provider work.

## Hard stop and required handoff

Before `awaiting_review`, every RC row is `PROVEN` with exact Compose commands, counts, service health, non-sensitive IDs and provider-call evidence; the single-document foundation authority is complete. 010-02 alone owns multi-document bounded reconciliation. GO must not begin the other scenario families. Record `Internal readiness: READY_FOR_CK`; CK decides this one boundary/single-document contract only.

## GO checkpoint — IDSER-BATCH-10-01

- **Implementation scope:** registered `test:idser-010-compose`, a controlled local Mistral endpoint, and the deterministic A/B Compose harness. No production runtime, schema, queue, provider, or application behavior changed.
- **Authorized paths:** `apps/agents-bridge/package.json`, `apps/agents-bridge/tests/mistral-ocr-mock.mjs`, and `apps/agents-bridge/tests/idser-010-compose.mjs`.

### Review Contract Closure

| Row | Ticket authority / required proof | Evidence locator and validation outcome | Status |
|---|---|---|---|
| RC-010-01-01 | Production-shaped authenticated create, DocumentStore, pg-boss, BSS-009, worker, internal routes, dispatcher, `MistralProvider`, explicit secret-free mock; no alternate semantic authority. | `tests/idser-010-compose.mjs` starts the existing Compose topology plus only the test overlay, creates through `/api/projects`, observes the two worker semantic executions and mock calls, and checks the Bridge role has no Atlas schema privilege. | PROVEN |
| RC-010-01-02 | Scenario A persists full extraction/reconciliation, candidates/evidence/provenance, reaches 1/1 ready after reconciliation. | Same harness creates one synthetic PDF, asserts two completed semantic executions, `1/1`, ready Initial Draft, empty Master, candidate/evidence rows and a `new` relation. | PROVEN |
| RC-010-01-03 | Scenario B persists conflicting candidates plus unresolved relation without promotion or fabricated attention state. | Same harness creates a distinct conflicting synthetic PDF and asserts two candidate rows still in `candidate` state with `needs_resolution`, one `contradicts` relation, 1/1 ready and empty Master. | PROVEN |
| RC-010-01-04 | Only the versioned semantic skills and bounded handoffs cross the dispatcher; unknown/malformed input and direct Bridge mutation fail closed. | Existing registered `@atlas/contracts`, `@atlas/skills`, `@atlas/core`, `@atlas/db`, and `@atlas/agents-bridge` semantic/permission suites retain the focused schema, unknown-skill, bounded-handoff and trusted-route negatives. The new harness adds the actual-process boundary observation. | PROVEN |

**Validation (2026-10-01):** `corepack pnpm --filter @atlas/agents-bridge test:idser-010-compose` passed on the host-operated Compose harness. It starts the isolated controlled-provider overlay, verifies scenario A and B, removes fixture-only semantic rows in dependency order, and restores the normal stack in `finally`. The direct Compose regressions also passed: `@atlas/agents-bridge test:semantic` (5 tests), `@atlas/contracts test` (11), `@atlas/skills test` (1), `@atlas/core test` (19), `@atlas/db test:permissions` (1), and `@atlas/db test:semantic-authority` (1). `node --check apps/agents-bridge/tests/idser-010-compose.mjs` and `node --check apps/agents-bridge/tests/mistral-ocr-mock.mjs` passed. The Compose harness is intentionally host-operated because it controls the service topology; it invokes `docker compose -f docker-compose.yml -f docker-compose.perception-smoke.yml up -d --build --wait` itself.

Internal readiness: READY_FOR_CK

**Next state:** `awaiting_review`; CK must review this bounded deterministic single-document contract. 010-02 remains blocked on CK `PASS` and owns multi-document sequencing only.
