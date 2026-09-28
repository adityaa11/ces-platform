# IDSER-004: Semantic context and result authority

- **State:** `awaiting_review`
- **Review batch:** `IDSER-BATCH-04`
- **Depends on:** IDSER-002 and IDSER-003 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 11, 14-15, 17, 24-25, 32-34, 36-37; AC-03/11/12/25/28/36. See [README](README.md).
- **Execution environment:** Docker Compose for internal HTTP, execution authority and database tests.

## Outcome

Add Atlas-owned execution/context authorization and typed internal result/failure
delivery for semantic work. Bridge receives only the persisted execution's
authorized context and cannot select unrelated scope or write trusted state.

## Inspected seams and edit scope

- Add focused Core semantic authority/internal-route contracts alongside `packages/atlas-core/src/perception-authority.ts` and `perception-internal-route.ts`.
- Add DB execution/capability authority under `packages/atlas-db/src/` using IDSER-001 records and IDSER-003 transaction composition.
- Add internal semantic middleware and registration in the existing Atlas host (`apps/atlas/perception-internal.ts`, `vite.config.ts` are the authority pattern); no additional service.
- Keep the Cloudflare/browser boundary free of local PostgreSQL/filesystem imports. Leave perception source/OCR/cache transport intact.
- Add typed acceptance-handler ports for IDSER-006/007 and context construction ports. Intermediate production handlers reject unavailable functionality; injected tests must never become a success stub in production.

## Scope

- Persist semantic execution identity and an Atlas-issued capability tied to project/workspace/bundle/document, skill/version, stage and exact authorized context identity.
- Reuse the service-credential trust model for context/result/failure routes. Validate credential, request bytes and schemas before resolving persisted execution authority.
- Extraction context contains only the one authorized NormalizedDocument and its binding identities/version. Preserve the exact locator/source representation for that execution; a hash-keyed cache hit from another execution cannot supply mismatched artifact/execution identity.
- Reconciliation context resolves the persisted execution's current candidates and selected prior neighborhood from IDSER-007. Bind a reproducible context snapshot or exact authorized ID set plus fingerprint; later candidate availability cannot silently broaden a replayed execution.
- Reject stale, expired, completed, cancelled, mismatched or unauthorized context requests. Bound response bytes while streaming/serializing; do not return source keys/PDF bytes/history.
- Completion requests bind execution ID, skill/version, project/workspace/bundle/document, result and normalized provider provenance. Persisted scope is authoritative; result fields cannot override it.
- Centralize canonical completion fingerprint checks and logical idempotency. Identical completed result delivery can acknowledge without redeeming a fresh context or re-running handlers; different content/identity conflicts fail. Context redemption and authenticated completion replay intentionally have different lifecycle rules.
- Do not acknowledge until the owning acceptance transaction commits all trusted rows and its continuation. Handler or enqueue failure returns a retryable bounded delivery failure; stale/conflicting/malformed identities fail closed. Schema-invalid output never reaches persistence handlers.
- Define authenticated bounded stage-start/failure notification as needed for persisted lifecycle, including terminal perception/semantic failures. Atlas validates the execution and records state; Bridge never writes it directly. Notification is idempotent and cannot undo accepted completion.
- Preserve a durable, retryable failure-delivery seam in the existing worker/queue for IDSER-005/008; no second monitor/polling service. Distinguish unauthorized rejected requests from failures of an actually authorized current stage.
- Errors/logs expose codes and stable execution metadata only, not provider bodies, full prompts, document material, grants, service secrets or SQL.

## Acceptance criteria

1. A valid Bridge execution gets only its bounded authorized document or candidate neighborhood; wrong project/workspace/bundle/document/capability is rejected.
2. Source hash equality and duplicate names never bypass execution/scope binding. Selected context remains reproducible across retry.
3. A completed context request is rejected while identical authenticated result replay is accepted idempotently; a conflicting fingerprint is rejected.
4. Result dispatch cannot acknowledge before the transactional acceptance handler succeeds, and cannot invoke unimplemented handlers as successful no-ops.
5. Typed failure/lifecycle notifications are scope-checked, idempotent and completion-safe. Atlas remains the lifecycle authority.
6. Internal routes and browser-facing routes share no credential or semantic payload leakage; Bridge SQL discovery remains denied.

## Validation

- Real route/DB tests for service credentials, capability validity, all scope mismatches, expired/cancelled/completed execution, wrong skill/version and oversized streamed bodies/responses.
- Verify identical/completed replay, different fingerprints, concurrent acceptance claims, malformed provenance and different execution reuse of one logical key.
- Inject handler persistence/enqueue failure and prove no success acknowledgement or partial accepted state; register handler-contract tests for later implementations.
- Test normalized cache reuse across identical PDF bytes in distinct projects/executions without cross-scope identity leakage.
- Test retryable and terminal failure notification, duplicate notification and success-vs-failure races. Assert safe error output and negative direct-DB access.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** existing Bridge service credential, Atlas execution/membership authority and BSS-009 source separation.
- **Trust boundaries / assets:** Bridge HTTP -> Atlas authority -> bounded context/result handlers; source-derived data, capabilities and provenance.
- **Identity context:** complete persisted scope, execution/skill/version, context identity and completion fingerprint.
- **SEAM-IDSER-004-01:** Separate credential authentication, capability authorization, schema validation and acceptance-handler dispatch.
- **SEAM-IDSER-004-02:** Reproducible execution context and completion replay independently validate lifecycle and idempotency.
- **COUPLING-IDSER-004-01:** No client/Bridge scope override, direct Atlas DB discovery, unbounded context or provider-body logging.
- **Unresolved security policy:** future credential rotation/access policy can attach here; do not create a competing auth system.
- **Planning findings:** PLAN-IDSER-04 exact normalized binding is required; PLAN-IDSER-06 durable failure projection is completed with IDSER-008.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-004-01 | SEAM-IDSER-004-01 | Are internal routes authenticated, bounded and persisted-scope driven? Route/DB negative tests. |
| REV-READY-IDSER-004-02 | SEAM-IDSER-004-02 | Can completed replay succeed without reopening context or duplicating effects? Concurrency/replay tests. |
| REV-READY-IDSER-004-03 | COUPLING-IDSER-004-01 | Are unrelated state, credentials and provider payloads excluded? Cross-scope and error inspection. |

## Review checkpoint

**Question:** Is every semantic handoff execution-bound and idempotent while
keeping result acceptance and lifecycle decisions under Atlas authority?

**CFC remediation checkpoint:** Repairs CK-001 through CK-005 without changing
the ticket boundary. Completion fingerprints now canonically include recursive
nested values; extraction cache redemption checks the exact perception execution;
and reconciliation redemption snapshots its bounded current/prior candidate
context in an Atlas-owned table so retries cannot broaden it. The route double
now exercises handler failure, `@atlas/contracts` is a direct DB dependency, and
the migration runner includes the persisted-context migration.

**Validation evidence:** In Compose, `corepack pnpm --filter @atlas/db typecheck`,
the semantic fingerprint test, and the Core semantic internal-route test passed.
`corepack pnpm --filter @atlas/db migrate` applied
`0015_idser004_semantic_context_authority`; `corepack pnpm --filter @atlas/app build`
passed. `git diff --check` passed.

**CFC cycle 2 checkpoint:** Consumes `HMN-IDSER-004-002`. Reconciliation now
requires an injected IDSER-007 selection port and rejects unavailable selection
instead of discovering a broad neighborhood itself. The DB authority persists
only the returned, contract-validated context snapshot. Its PostgreSQL suite
now covers persisted retry, exact perception-execution cache binding, replay
conflict, post-completion failure rejection, and Bridge SQL denial.

**Next state:** `awaiting_review`; CK must verify this bounded remediation before
IDSER-005 or IDSER-006 consume its interfaces.
