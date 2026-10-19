# GO checkpoint: IDSER-012-04-05 / IDSER-BATCH-12-04-05

- **Ticket:** `IDSER-012-04-05` — GHR reference-only v2 compatibility.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-05-ghr-reference-only-v2-compatibility.md`.
- **Dependency consumed:** `IDSER-012-04-04` CK `PASS` at `66df38b5`, recorded in `project's goal/feedback/IDSER-BATCH-12-04-04-66df38b-verification.md`.
- **Implementation commit:** `72430455` (`feat(idser): validate v2 semantic plan ready refs`).
- **Ticket state:** `awaiting_review`.

## Bounded implementation

Extended the internal, non-delivering `SemanticBatchPlanReady/v1` fixture
receiver to dispatch persisted immutable plan and handoff records through the
approved v1/v2 parsers.  The external body remains exactly
`documentPlanRef`, `planHash`, `batchCount`, and `batchHandoffRefs`.

For v2, the receiver verifies the persisted parent record hash, version-paired
handoff, parent hash, scoped parent identity, deterministic batch ID/slot, and
complete once-only eligible ownership from v2 inventory.  It reuses the
`-04-04` parsers and hash replay interfaces; it adds no persistence path or
parser semantics.  The receiver still has no route, issuer, queue, outbox,
forwarding, acknowledgement, BSS action, SEM intake, provider call, semantic
truth, reconciliation, Master, or CES effect.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120405-01` | An actual persisted v2 plan must validate through internal dispatch while the external v1 body stays unchanged. | `semantic-batch-plan-ready-fixture.ts` dispatches persisted records through `parseImmutableSemanticCorpusPlanRecord()` and `parsePlannedSemanticCorpusHandoffRecord()`; the v2 PostgreSQL test persists a real v2 plan then validates its canonical four-field body. | `node --env-file=.env --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test --test-name-pattern="v2 persisted records dispatch" packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS** (1 test). | `PROVEN` |
| `RC-0120405-02` | Invalid/missing/extra/duplicate/oversized/foreign/stale refs, hash/count/slot mismatch, ownership errors, and zero eligible source must reject or emit no body. | The v2 PostgreSQL test covers body field/count/reference/hash/size rejection, a persisted wrong slot, and unchanged counters. Existing `NO_ELIGIBLE_SOURCE` and strict immutable v2 parser tests cover empty output and persisted malformed/duplicate/incomplete ownership rejection. | V2 PostgreSQL command above — **PASS**. `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS** (4 tests). | `PROVEN` |
| `RC-0120405-03` | Consume immutable `-04-04` interfaces without another persistence path or parser reimplementation. | Receiver imports only the approved parser/hash-replay interfaces and performs read-only existing-table queries; the diff adds no migration or write API. | `corepack pnpm --filter @atlas/db typecheck` — **PASS**. `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS**. | `PROVEN` |
| `RC-0120405-04` | Non-inert validation must still cause zero GHR, BSS, SEM, semantic, reconciliation, Master, or CES effects. | The v2 PostgreSQL test snapshots pgboss, BSS admission/attempt/reservation/dispatch, SEM execution/candidate/evidence, knowledge index, and reconciliation before/after validation; every counter is unchanged. | V2 PostgreSQL command above — **PASS** (zero-effect counter assertion). | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS** (4 tests).
- The v2 PostgreSQL command above — **PASS** (1 test).
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS**.
- `git diff --check -- packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS** before commit.

The broader `semantic-batch-plan-ready-fixture.integration.test.ts` invocation
also ran its unrelated real-composition test, which stopped in the approved
predecessor BSS partitioner before receiver dispatch because its proposal was
`BLOCKED` rather than `READY`.  The isolated required v2 receiver harness
above passes; this ticket neither owns nor modifies that predecessor path.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`.
Control returns to CK for the frozen ticket.
