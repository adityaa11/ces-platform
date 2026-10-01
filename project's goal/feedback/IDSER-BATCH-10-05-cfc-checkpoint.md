# CFC remediation checkpoint: IDSER-010-05 / IDSER-BATCH-10-05

- **Ticket:** `IDSER-010-05-staged-result-replay-restart.md`
- **Ticket state:** `awaiting_review`
- **Consumed HMN authorization:** `HMN-IDSER-010-05-001` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- **Reviewed base:** `0d39413c9538b9d3481afd2f9a66e638d7f54771`
- **Authorized closure target:** `CK-001.a` only

## Bounded remediation

The controlled Compose-only Atlas host boundary now records successfully accepted
`/internal/semantic/result` request envelopes when its test-only observation
path is enabled. Scenario H starts Atlas only after the real worker has been
stopped, starts the real worker, and queries that authenticated Atlas-boundary
observation after restart. It deep-compares every observed resumed envelope to
the durable pre-interruption `validated_envelope`; it does not use a second
outbox read, independently reconstructed expected payload, or a pre-restart
fingerprint as the delivery proof.

Exact closure evidence is in:

- `apps/agents-bridge/tests/idser-010-compose.mjs:317-337` — restart-time
  observation, deep equality assertions, canonical fingerprint equality, and
  emitted Scenario H evidence.
- `apps/atlas/perception-internal.ts` — optional authenticated, Compose-only
  observation at the accepted trusted Atlas semantic-result boundary.
- `docker-compose.perception-smoke.yml` — enables that observation only for the
  disposable controlled test topology.

## Frozen finding closure matrix

| Clause | Ticket authority | Evidence and oracle result | Status |
|---|---|---|---|
| `CK-001.a` | `RC-010-05-01`, ticket row 20 | Full Scenario H run observed the actual real-resumed-worker request at `/internal/semantic/result` after restart, deep-compared it with the pre-stop durable staged envelope, and asserted canonical SHA-256 equality. The frozen binary oracle passed. | `PROVEN` |

`RC-010-05-02` and `RC-010-05-03` remain frozen `PROVEN` and were not
redesigned or reopened. Their existing Scenario H assertions ran as direct
regression preservation through the required Compose command.

## Deterministic Scenario H evidence

The passing run emitted:

- execution ID: `9f782d05-af70-4bf6-ab8e-a1263dd4ae5b`
- staged-envelope SHA-256: `6cf4e9e56d8a001fbc95cdbfd0190e715c9c5895d0684ee97587a79ecad78f02`
- observed resumed Atlas-bound-envelope SHA-256: `6cf4e9e56d8a001fbc95cdbfd0190e715c9c5895d0684ee97587a79ecad78f02`
- observed resumed Atlas-bound envelope count: `1`
- equality: `true`
- staged lease generation: `1`; resumed lease generation: `4`
- provider structured calls: `26 -> 29`; one scoped extraction call after the
  restart/replay sequence
- singular final effects: completed lifecycle, expected/completed `1/1`, and
  one extraction result, candidate, evidence, relationship, and completed job.

## Validation

- `node apps/agents-bridge/tests/idser-010-compose.mjs` — **passed**:
  controlled Compose scenarios `A/B/C/D/E/F/H`, including the restart-time
  trusted-boundary equality observation; disposable services, volumes, and
  network were removed in `finally`.
- `node --check apps/agents-bridge/tests/idser-010-compose.mjs` — **passed**.
- `docker compose -p idser-010-compose -f docker-compose.yml -f docker-compose.perception-smoke.yml config -q` — **passed**.
- `docker compose -p idser-010-compose -f docker-compose.yml -f docker-compose.perception-smoke.yml run --rm --no-deps agents-bridge-worker corepack pnpm --filter @atlas/agents-bridge typecheck` — **passed** in the built Compose image.
- `git diff --check` — **passed** for the bounded remediation.

An exploratory Atlas-wide `tsc --noEmit` was not a ticket-required validation
and reports existing unrelated app/fixture/Cloudflare typing failures; it did
not affect the required Compose result-boundary validation or this clause's
closure oracle.

## Readiness and handoff

Internal readiness: `READY_FOR_CK`

This bounded remediation consumes `HMN-IDSER-010-05-001`, leaves the ticket
state `awaiting_review`, and hands off to CK to verify only frozen `CK-001.a`,
this bounded remediation diff, and direct regressions.
