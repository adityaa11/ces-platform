# GO checkpoint: IDSER-009-02 / IDSER-BATCH-09-02

- Ticket: `IDSER-009-02-deterministic-production-card-projection.md`
- Ticket state: `awaiting_review`
- Consumed predecessor: IDSER-009-01 `PASS` at `dd5f6cb`, recorded approved at `98adcbb`.
- Implementation commit: this GO handoff commit.

## Changes

- Replaced the downstream-state rejection with a deterministic projection of the approved persisted lifecycle record.
- Added waiting, extracting, needs-attention and ready-for-review states; `X of N` labels and floored persisted progress; bounded technical-failure copy; and invariant Master, facts and unavailable action fields.
- Added exact signed internal-read payload validation so private or invented transport fields are rejected instead of becoming browser lifecycle truth.
- Added deterministic mapper/read-model proof for valid lifecycle variants, partial-progress flooring, invalid state rejection, failure redaction and signed transport shape.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / command | Status |
|---|---|---|---|
| RC-009-02-01 | Exact valid lifecycle-card mapping; ready requires 009-01 completion authority. | `home-projects.ts`; mapper fixtures for legacy/waiting, processing, bounded failure and completion-gated ready. `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` — passed, 4/4. | PROVEN |
| RC-009-02-02 | Exact X/N labels and floor percentage; only completed members count. | Table-driven mapper assertions include 0/2, 1/2, 2/2 and 1/3 -> 33, plus OCR/extraction-only mismatch rejection. Same command — passed, 4/4. | PROVEN |
| RC-009-02-03 | Bounded technical-failure copy; semantic/persisted states remain distinct; no private failure data reaches model. | `technical_failure` maps only to literal `Processing needs attention.`; fixture rejects private transport fields. Same command — passed, 4/4. | PROVEN |
| RC-009-02-04 | Explicit legacy waiting, malformed fail-closed behavior, empty Master/zero facts/unavailable action invariants. | Mapper fixtures cover intact legacy, malformed waiting/ready/failure records and invariant model fields. Same command — passed, 4/4. | PROVEN |
| RC-009-02-05 | Signed internal read transports only approved model; refresh cannot synthesize truth. | `parseApprovedHomeProjectCards` validates the exact response shape and allow-listed values; read service consumes it after signed fetch. Same command — passed, 4/4. | PROVEN |

## Validation

- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` — passed, 4/4 deterministic mapper/read-model tests.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app build` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test` built successfully and then failed only its pre-existing authenticated-home integration test because the `--no-deps` execution has no backing service/database. That test is outside this ticket's deterministic mapper/read-model harness.

Internal readiness: READY_FOR_CK
