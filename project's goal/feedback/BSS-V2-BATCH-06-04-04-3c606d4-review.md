# BSS-V2-BATCH-06-04-04 CK review

- **Ticket:** `BSS-V2-006-04-04` — Interactive admitted-work lifecycle
- **Ticket state:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-04-04`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-04-04-interactive-admitted-work-lifecycle.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-06-04-04-go-checkpoint.md`
- **Reviewed commit:** `3c606d46127d4986a749f142e6385e49c73292f5` (`feat(admission): add interactive admitted work lifecycle`)
- **Review type:** first consolidated CK review
- **Result:** `PASS`

## Review basis and target

The active-ticket tuple resolves unambiguously from the explicit `ck` request,
the frozen ticket, and the committed GO checkpoint. The ticket is
`awaiting_review`; the GO checkpoint records implementation commit `3c606d4`.
`HEAD` is the later record-only checkpoint commit `391dde4`, which contains the
GO record and does not change the reviewed implementation. The worktree has
unrelated untracked files, including predecessor-era migration files, but no
ticket-owned implementation, ticket, or GO checkpoint paths are modified, so
the reviewed target is unambiguous.

Authority used: the frozen ticket and its explicit Review Contract, the
committed GO checkpoint, the approved `BSS-V2-006-04-03` dependency boundary,
and repository evidence. No chat route, chatbot UX, HTTP/streaming behavior,
second scheduler, privileged sender, provider deployment, or future dependency
work was required.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00604-09` | `PROVEN` | The real PostgreSQL/pg-boss fixture saturates a one-unit background lane, admits fitting interactive work through protected capacity, rejects over-capacity interactive work as terminal with zero job, and proves one claimed send for the fitting work. Expired work is settled after a fresh worker restart with zero send and a released reservation. |
| `RC-BSSV2-00604-10` | `PROVEN` | The fixture covers deadline expiry before claim, cancellation before claim with a late queue delivery, cancellation during an in-flight claimed send, late terminal 429 feedback, and worker restart. It proves terminal cancellation precedence, no claim/send resurrection or double dispatch, one settled feedback event, spent usage retained, and scoped pressure persistence. |
| `RC-BSSV2-00604-12b` | `PROVEN` | Distinct background and interactive principals use the same generic HTTP admission API and `createProductionBridgeWorker` claimed-send path. A caller-supplied `serviceClass` is ignored; persisted process, quota domain, and service class are server-selected, and the fake transport is the only substituted provider component. |
| `SR-0404-T1`, `SR-0404-C1`, `SR-0404-R1` | `PROVEN` | The migration requires and persists an interactive deadline, derives service identity from the authenticated principal, fences replay against the persisted deadline, preserves cancellation precedence, and exposes durable reservation/claim/window evidence verified by the focused fixture. |

## Validation and evidence

The first focused invocation without `DATABASE_URL` skipped by design. It was
rerun with the repository-documented local Compose PostgreSQL URL against the
healthy `ces-platform-postgres-1` service; it passed without a skip.

- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migrate` — PASS (already current)
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check` — PASS
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev AGENTS_BRIDGE_PASSWORD=agents_bridge_local_dev_only corepack pnpm --filter @atlas/agents-bridge test:interactive-provider-work-admission` — PASS (1/1)
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev AGENTS_BRIDGE_PASSWORD=agents_bridge_local_dev_only corepack pnpm --filter @atlas/agents-bridge test:provider-admitted-worker` — PASS (4 focused test files)
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS
- `corepack pnpm --filter @atlas/db typecheck` — PASS
- `git diff --check 3c606d4^ 3c606d4` — PASS

The focused fixture is `apps/agents-bridge/tests/interactive-provider-work-admission.integration.test.ts` and the implementation boundary is
`packages/atlas-db/migrations/0074_bssv20060404_interactive_admitted_work_lifecycle.sql`.

## Findings

None. All ticket-derived Review Contract rows and explicit security-readiness
obligations are proven. No Frozen Finding Closure Matrix is required because
there are no findings to close.

## Scope-change observations

None. No ticket change, new provider/runtime/deployment target, architecture or
product decision, unresolved policy, or approved-predecessor reopening is
needed.

## Decision

`PASS`. The committed interactive lifecycle satisfies the frozen ticket,
required real PostgreSQL/pg-boss evidence, named deadline/cancellation/restart/
late-delivery/429 observations, server-selected identity boundary, and direct
regression checks. This CK result approves the checkpoint for the next ticket
whose dependency gate names `BSS-V2-006-04-04` CK `PASS`.
