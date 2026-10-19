# GO checkpoint: IDSER-012-04-03 / IDSER-BATCH-12-04-03

- **Ticket:** `IDSER-012-04-03` — BSS structural-fit corpus partition.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-03-bss-structural-fit-corpus-partition.md`.
- **Dependencies consumed:** `IDSER-012-04-01` CK `PASS` in `IDSER-BATCH-12-04-01-f530280-review.md`; `IDSER-012-04-02` CK `PASS` in `IDSER-BATCH-12-04-02-3de09b9-review.md`; the already-qualified authenticated BSS prospective-reader boundary.
- **Implementation commit:** `22ced704` (`feat(idser): compose complete structural fit partition`).
- **Ticket state:** `awaiting_review`.

## Bounded implementation

`proposeStructuralFitCorpusPartition()` now builds every temporary candidate
through the approved `buildStepwiseSourcePacket()` selection boundary and
measures that complete packet through `estimateCompleteSemCandidateRequest()`.
It sends only the resulting `requestBytes`, `inputTokens`, and existing
resource envelope to the authenticated prospective BSS reader. It pins the
reader's policy/profile/workload identity before candidate fitting and blocks
on inconsistent identity, reader failure, estimator failure, or changed
structural revision.

The proposal is frozen and unpublished. It retains deterministic source order,
once-only owned locators, candidate packet hashes, complete fit traces, and
the pinned BSS structural projection. Empty text/table units are explicit
`deferred` inventory. Because the current route exposes no authorized
image-token accounting, visuals are explicit `unexamined` inventory and do not
enter a ready text/table batch. No persistence, GHR output, BSS admission or
reservation, provider work, SEM call, semantic truth, reconciliation, Master,
or CES seam was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120403-01` | Approved builder/estimator plus one authenticated consistent BSS snapshot must yield deterministic boundaries and exact once-only eligible ownership. | `idser-structural-fit-corpus-partition.ts` builds and measures each candidate before its BSS read; focused suite proves stable two-batch ownership and immutable output. `capacity-planning-snapshot.integration.test.ts` composes the real authenticated reader. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS** (5 tests). `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs ./apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts` — **PASS** (1 PostgreSQL integration test). | `PROVEN` |
| `RC-0120403-02` | Every candidate must satisfy applicable structural constraints; foreign, inconsistent, stale, unsupported, or double-counted policy/accounting must fail closed. | The BSS reader identity is pinned and compared on every read; foreign estimator identity blocks before candidate fitting, and changed BSS revision blocks. The authenticated integration proves authorization, inactive prospective-only status, policy/profile shape, unfit handling, and unavailable/unauthorized policy rejection. | Focused partition command above — **PASS**. Authenticated PostgreSQL command above — **PASS**. | `PROVEN` |
| `RC-0120403-03` | Individually unfit source blocks explicitly; no truncation, invented REL/context, or temporary-pressure repartition. | The focused suite observes `INDIVISIBLE_STRUCTURAL_UNIT` with zero batch fabrication; the implementation has no runtime-pressure reader and requests every candidate from the pinned structural reader. Candidate construction supplies no invented context or relationship. | Focused partition command above — **PASS**. | `PROVEN` |
| `RC-0120403-04` | Valid text/table candidates may qualify while unqualified visuals remain explicit non-ready inventory. | Focused visual case proves a ready text batch while a granted visual remains `unexamined` with `image_accounting_unavailable`; no visual demand is fabricated. | Focused partition command above — **PASS**. | `PROVEN` |
| `RC-0120403-05` | Positive proposals and failures must have zero durable plan/handoff, GHR, BSS admission/reservation/send, SEM, truth, reconciliation, Master, or CES effects. | Module imports only the builder, estimator, resource-envelope type, and read-only prospective consumer. The real PostgreSQL integration snapshots BSS attempts/reservations/jobs/sends/quota state and durable profile/plan, semantic delivery/execution/result, reconciliation, and job counters before/after the proposal and rejection probes. | Authenticated PostgreSQL command above — **PASS**; all scoped counters unchanged. | `PROVEN` |

## Validation and limitation

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/skills test` — **PASS** (18 tests).
- `corepack pnpm --filter @atlas/agents-bridge test` — the ticket suites pass, then the existing unrelated `tests/docling-provider.test.ts` fails its stale expectation that `docling-digital-pdf` names the RUN-003 qualification. This test and route configuration are outside this ticket's authorized paths and no partition code runs after that failure.
- `git diff --check -- <authorized paths>` — **PASS** before commit.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control returns to CK for the frozen ticket.
