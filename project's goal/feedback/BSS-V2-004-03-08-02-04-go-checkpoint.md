# BSS-V2-004-03-08-02-04 GO checkpoint — additive provider-neutral typed multipart messages

- **Ticket:** `BSS-V2-004-03-08-02-04`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-04-additive-provider-neutral-typed-multipart-messages.md`
- **State:** `awaiting_review`
- **Reviewed base:** `be97e881f33b46802a9c8202b9a0e7e9d22f1e7c` (`docs(bss): approve verified image hydration`)
- **Implementation commit / CK review target:** `0cb26011e8290ae52032b10c92c00ebcf3fffb4f` (`feat(atlas): add neutral multipart message contract`)
- **Prerequisites consumed:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.02-01-7ab1953-verification.md` — CK `PASS`; `project's goal/feedback/BSS-V2-BATCH-04.03-08.01-01-7de0276-review.md` — CK `PASS` legacy baseline.
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`; all multipart evidence uses deterministic in-process fake dispatch only.

## Bounded implementation and changed-file impact

| Path | Contract impact | Classification |
| --- | --- | --- |
| `apps/agents-bridge/src/provider-capabilities.ts` | Preserves `ChatMessage.content: string`; adds a separate, versioned neutral multipart request/part/capability contract, pre-dispatch image capability/bounds/cancellation gate, and metadata-only redaction projection. | `INTENDED_NEUTRAL_MULTIPART_SEAM_ONLY` |
| `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts` | Uses a fake dispatch to prove legacy-string compatibility, source-part ordering, safe redaction, unsupported-image denial, pre-abort denial, bounds denial, and zero fake transport calls on each negative. | `INTENDED_DETERMINISTIC_CONTRACT_PROOF_ONLY` |
| `apps/agents-bridge/package.json` | Registers the deterministic multipart contract test in the established bridge suite. | `INTENDED_TEST_REGISTRATION_ONLY` |
| This ticket and this checkpoint | Record GO state and CK-checkable evidence only. No media/base64, credentials, vendor request body, or accepted-truth data is recorded. | `WORKFLOW_EVIDENCE_ONLY` |

## Preserved boundaries

- No concrete provider adapter, vendor request schema, route registry, generic semantic worker, job/reservation, persistence, or source-packet implementation changed.
- Multipart image bytes remain only on the in-memory typed part supplied to a qualified future transport owner. `redactMultipartRequest()` emits source identity plus bounded media metadata and omits both image bytes and text content.
- `dispatchMultipartStructured()` passes the original ordered parts only after cancellation and negotiated image capability/bounds checks. It has no text/label downgrade path, provider selection, retry, or transport implementation.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/multipart-provider-capabilities.test.ts` | PASS — 3 tests: legacy byte compatibility; ordered source identity/redaction; unsupported, aborted, and over-bound negatives with zero fake calls. |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests: generic execution and composition roots retain neutral capability/route boundaries. |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/mistral-provider.test.ts` | PASS — 11 tests; existing string-provider behavior unchanged. |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/gemini-provider.test.ts` | PASS — 8 tests; existing string-provider behavior unchanged. |
| `corepack pnpm --filter @atlas/agents-bridge test` | PASS — 73 tests passed; 4 pre-existing Compose/PostgreSQL-gated integration tests skipped; 0 failures. |
| `git diff --check be97e881f33b46802a9c8202b9a0e7e9d22f1e7c 0cb26011e8290ae52032b10c92c00ebcf3fffb4f` | PASS |

The fake transport only increments its counter after negotiation; the unsupported-capability, pre-aborted, and media-bound cases each observed `0` calls. All validations use fixture-only `Uint8Array` values and local fake functions. `external_provider_attempt_count = 0`; `semantic_job_count = 0`; `unintended_perception_job_count = 0`; `admission_reservation_count = 0`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Preserve legacy `ChatMessage.content: string` exactly; expose explicit ordered typed text/image parts with stable source-part identity, bounded media metadata, and cancellation semantics. | `provider-capabilities.ts` leaves `ChatMessage` unchanged and adds separate `Multipart*` types plus pre-dispatch cancellation. `multipart-provider-capabilities.test.ts` proves exact legacy string preservation and ordered `slot-*` identities. | `PROVEN` |
| `RC-02` | Refuse unsupported images before provider side effects; do not downgrade them to labels/text; leave vendor schema, generic worker selection, and existing string routes unchanged. | `dispatchMultipartStructured()` requires versioned image capability before invoking dispatch and passes only original parts. The fake unsupported case observes zero calls. Boundary, Mistral, and Gemini suites pass without adapter, worker, route, or schema changes. | `PROVEN` |
| `RC-03` | Deterministically prove types/old-new compatibility, redaction, mixed ordering, and unsupported-capability negatives with fake transports and zero real calls. | Focused multipart suite passes all three required scenarios; `redactMultipartRequest()` proves a metadata-only diagnostic projection. Registered bridge suite passes with 0 failures and no external calls/jobs/reservations. | `PROVEN` |

**Known blocks:** none. **CK finding IDs:** not applicable. **Handoff:** independent CK of `0cb26011e8290ae52032b10c92c00ebcf3fffb4f` only; the next leaf is not authorized by this checkpoint.

Internal readiness: READY_FOR_CK
