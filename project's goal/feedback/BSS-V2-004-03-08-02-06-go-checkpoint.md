# BSS-V2-004-03-08-02-06 GO checkpoint — multimodal request bounds, replay/redaction and resource interface

- **Ticket authority:** `BSS-V2-004-03-08-02-06`; explicit user `GO BSS-V2-004-03-08-02-06`.
- **Ticket state:** `awaiting_review`.
- **Base SHA:** `442225daff32169c7c6d3121cd9a6fd20d33fe7a`.
- **Candidate implementation SHA / CK review target:** `42e04664f039dba77985cc8fbb39eb05cdef5dcf` (`feat(bridge): add multimodal request preflight`).
- **Required predecessors:** `08-02-03` CK PASS (`fe788151d3c93dc8a4218a6312c8213b1a31a3c7`), `08-02-04` CK PASS (`0cb26011e8290ae52032b10c92c00ebcf3fffb4f`), and `08-02-05` CK PASS (`0339f158660eb14ea7705989a68e1105d99fc0e2`).
- **Permitted implementation files:** `apps/agents-bridge/src/provider-capabilities.ts` and `apps/agents-bridge/tests/multipart-provider-capabilities.test.ts`. This ticket-state change and checkpoint are workflow evidence only.

## Bounded implementation and preserved boundaries

`preflightMultimodalRequest()` is a provider-neutral, in-memory preflight
function. It validates one known versioned route/profile before a caller may
authorize or dispatch: cancellation/deadline, ordered parts, UTF-8 prompt
bytes, image count/bytes/dimensions/media capability, and supplied image
metadata. It returns a deterministic `MultimodalRequestSpec v1` containing
only schema/text hashes, bounded metadata, profile identity and slot/asset
references. It returns a bounded `ResourceEstimatorInput v1`, or the explicit
`RESOURCE_ENVELOPE_BLOCKED` result for an image request without a qualified
image TPM value. It never estimates image tokens from bytes and never creates a
`RequestResourceEnvelope`.

The change does not touch providers, concrete transport serialization, route
registry, authorization, worker/job handling, database/persistence, admission
reservations, replay storage, reconciliation, UI, Project Facts, CES, or
publication. Existing string-message types and routes remain unchanged.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-01` | Ticket RC-01: bound ordered image/text parts, prompt bytes, profile/media capability and deadline/cancellation; refuse unknown route/profile or unsupported media before authorization or provider side effects. | `preflightMultimodalRequest()` resolves only an exact route/profile and validates cancellation, elapsed/overlong deadline, prompt bytes, ordered image metadata/count/bytes/dimensions and effective media capability before returning. The focused fake-boundary test covers unknown route/profile, expired/overlong deadline, unsupported media, prompt overflow, and observes `authorizations = 0`, `calls = 0` for every rejected case. | `PROVEN` |
| `RC-02` | Ticket RC-02: produce an exact deterministic request-spec identity and bounded resource-estimator inputs only; never treat bytes as tokens; unknown image TPM is `RESOURCE_ENVELOPE_BLOCKED`. | `MultimodalRequestSpec v1` deterministically hashes canonical schema plus profile/version/deadline and ordered hash-only part metadata. The focused test asserts equivalent reordered schema keys produce identical output and excludes prompt text, byte sequence, base64 and secrets from its serializable shape. Qualified image TPM remains an explicit estimator input; unknown TPM produces the required block result, never zero-token accounting. No envelope/scheduler code exists in this diff. | `PROVEN` |
| `RC-03` | Ticket RC-03: fake aborted/duplicate/restart/cancel cases retain no base64 or credentials, make no new perception/semantic/admission effects or duplicate external attempt, and preserve string-only behavior. | The focused fake-boundary suite proves pre-abort/cancelled denial and duplicate/restart identity stability, records zero external attempts/jobs/permits/reservations, and its redacted request-spec assertion excludes bytes/base64/secrets. `semantic-worker.test.ts` passes all five replay/failure cases with no second provider call. Mistral (11/11), Gemini (8/8), and Anoman (6/6) string/adapter regressions pass unchanged. The implementation diff contains no persistence, jobs, provider activation, reservation, retry or reconciliation path. | `PROVEN` |

## Validation evidence

The host's pnpm workspace links are unreadable (`EACCES` before test execution),
so all test evidence below uses a rebuilt local Docker Compose image with only
in-process fake transports and no provider credential.

| Exact command | Outcome |
| --- | --- |
| `docker compose run --build --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/multipart-provider-capabilities.test.ts"` | PASS — 7 focused preflight/redaction/replay tests. |
| `docker compose run --rm --no-deps agents-bridge sh -c "node node_modules/typescript/bin/tsc -p apps/agents-bridge/tsconfig.json --noEmit"` | PASS. |
| `docker compose run --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/anoman-provider.test.ts; node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/provider-capabilities-boundary.test.ts; node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/semantic-worker.test.ts"` | PASS — Anoman 6/6; boundary 2/2; semantic worker 5/5. |
| `docker compose run --rm --no-deps agents-bridge sh -c "node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/mistral-provider.test.ts; node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/gemini-provider.test.ts"` | PASS — Mistral 11/11; Gemini 8/8. |
| `git diff --check` | PASS. |

All provider observations use local fake functions only:
`external_provider_attempt_count = 0`, `semantic_job_count = 0`,
`unintended_perception_job_count = 0`, and `admission_reservation_count = 0`.
No image bytes, base64, credentials, request payloads, or accepted-truth data
were written to this checkpoint.

**Known blocks:** none. **CK finding IDs:** not applicable. **Handoff:**
independent CK of `42e04664f039dba77985cc8fbb39eb05cdef5dcf` only; this checkpoint
does not authorize a successor leaf.

Internal readiness: READY_FOR_CK
