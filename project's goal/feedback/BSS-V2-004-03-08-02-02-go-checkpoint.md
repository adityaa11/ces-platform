# BSS-V2-004-03-08-02-02 GO checkpoint — service identity, grant and derived-image authorization

- **Ticket:** `BSS-V2-004-03-08-02-02`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-02-02-service-identity-grant-and-derived-image-authorization.md`
- **State:** `awaiting_review`
- **Implementation commit:** `a31ba9c` (`feat(atlas): add scoped derived image grants`)
- **Reviewed base:** `68dce9e4f97e9f553db9c76fcd10d88d35dfc1a8` (`docs(bss): approve 08-02-01 after CK verification`)
- **Prerequisites consumed:** `BSS-V2-BATCH-04.03-08.02-01-7ab1953-verification.md` CK `PASS`; `IDSER-BATCH-12-01-03-02-7d842ad-verification.md` CK `PASS`.
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`; local deterministic test environment.

## Bounded implementation and changed-file impact

| Path | Contract impact | Classification |
| --- | --- | --- |
| `packages/atlas-core/src/derived-image-grant.ts` | Adds the Atlas-owned service identity, exact scope parser, HMAC-protected opaque grant, expiry and single-use replay-fence verifier. The scope binds tenant/project/document/document-version/source SHA/profile/page/locator/asset-ref/manifest hash/media type and either a current semantic execution or a narrow offline grant. | `INTENDED_AUTHORIZATION_SEAM_ONLY` |
| `packages/atlas-core/src/index.ts` | Additive export of the service-grant contract only. | `INTENDED_AUTHORIZATION_SEAM_ONLY` |
| `packages/atlas-core/tests/derived-image-grant.test.ts` | Fake-authority positive and denial matrix for scope, replay, stale, tampered, cookie-bearing, unsupported-media and mismatch requests. | `INTENDED_AUTHORIZATION_SEAM_ONLY` |
| `packages/atlas-core/package.json` | Includes the new deterministic authorization suite in the established core test command. | `INTENDED_AUTHORIZATION_SEAM_ONLY` |

The diff does not touch `apps/atlas/derived-asset-resolver.ts`, `packages/document-store`, the derived-asset manifest, browser endpoints, session resolution, Bridge, provider adapters, queues, reservations, database migrations, UI, fixtures/gold, or historical CK records. The grant contract has no byte reader, storage-key/path field, cookie field, media callback, provider client, job API, or persistence handle; `02-03` remains the only hydration owner.

## Authorization boundary

`DerivedImageGrantIssuer` accepts only a configured service identity and an exact, closed identity object. It delegates the current semantic-execution or offline-grant decision to `DerivedImageGrantAuthority`, so persistence remains the sole authority for current scope without lending the service a database, mount, browser session, or storage capability. A grant is opaque, lifetime-bounded to five minutes or less, signed, bound to a random replay fence, rechecked by the authority immediately before redemption, and consumed once.

The deterministic fake authority supplies retained derived-image identity only as metadata: `derived/<uuid>` reference, image media type, manifest hash, and document/source/locator binding. It does not retrieve image bytes. The existing session resolver and accepted derived-evidence policy are unchanged; this additive service contract neither broadens browser resolution nor changes DocumentStore policy.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/core test` | PASS — 22 deterministic tests, including 3 new derived-image authorization tests and existing perception/internal-route regression tests. |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 18 tests, including unchanged text-only packet parity and deterministic unhydrated multimodal packet/visual relationship coverage. |
| `git diff --check 68dce9e4f97e9f553db9c76fcd10d88d35dfc1a8 a31ba9c` | PASS |

The fake-authority negative matrix proves foreign tenant/project/document, wrong profile/execution, stale authority, replay, signature tamper, locator/ref mismatch, extra cookie-bearing input, unauthenticated service identity, and unsupported media fail before any media effect. Its asserted counters are `media_access_count: 0`, `external_provider_attempt_count: 0`, `semantic_job_count: 0`, `unintended_perception_job_count: 0`, and `admission_reservation_count: 0`. No live provider call, image retrieval, retry, reconciliation, publish, or accepted-truth mutation occurred. No pre-existing failure occurred in the required lanes.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Bind service caller; tenant/project/document/version/source SHA; current execution or offline grant; profile/page/locator/ref/manifest hash; expiry and replay fence. Reject user-cookie borrowing and arbitrary storage authority. | `derived-image-grant.ts` uses exact closed-object parsing, a configured service identity, opaque HMAC grants, `DerivedImageGrantAuthority`, a five-minute maximum lifetime, and a single-use replay fence. `derived-image-grant.test.ts`, `service-only derived-image grants bind every manifest identity and consume one replay fence` and `a narrowly scoped offline grant is an alternative authority and expires fail-closed`, pass. | `PROVEN` |
| `RC-02` | Fake authority rejects foreign tenant/project/document, wrong profile/execution, stale/replayed/tampered grant, locator/ref mismatch, unauthenticated request and unsupported media before media access. | `derived-image-grant.test.ts`, `fake authority denies scope, credential, stale, replay, tamper, cookie, and media violations before any media effect`, exercises every named negative and asserts all media/provider/job/reservation counters remain zero. The core suite passes. | `PROVEN` |
| `RC-03` | Preserve historical accepted visual evidence and existing session resolver; do not broaden browser endpoints or DocumentStore policy. | The committed diff is limited to the core authorization seam, export, core test registration and test. It changes neither resolver nor storage implementation. The retained `@atlas/skills` packet/legacy tests and existing core perception/internal-route tests pass unchanged. | `PROVEN` |

Internal readiness: READY_FOR_CK

**Handoff:** Stop for independent CK of `a31ba9c`. This checkpoint is not a CK `PASS` and does not authorize `02-03` or any media hydration.
