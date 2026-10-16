# GO Checkpoint — BSS-V2-006-03A-01

- **Ticket:** `BSS-V2-006-03A-01` — Route-bound admitted execution and authoritative feedback ingress
- **Batch:** `BSS-V2-BATCH-06-03A-01`
- **Ticket state:** `awaiting_review`
- **Authority:** explicit user command `GO BSS-V2-006-03A-01`; frozen ticket at `Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-01-route-bound-admitted-execution.md`.
- **Predecessors checked:** BSS-V2-001/002, BSS-V2-005-01..04, and BSS-V2-006-01/02 each have recorded CK `PASS` artifacts. No predecessor scope was reopened.

## Bounded implementation

The Bridge now binds the resolver-selected route identity before the existing
006-02 admission transaction can insert its reservation; a database trigger
rejects unbound work before any reservation or admitted job exists. The real
`bridge-provider-admitted-execution-v1` pg-boss consumer claims a durable
reservation before calling its sole injected outbound transport port. It sends
only route/adapter/qualification metadata and a content-free fixture reference.
The result enters one typed, redacted database ingress with route, domain,
plan, qualification, attempt, trust, freshness, bounded-shape, replay, and
conflict fences.

This checkpoint intentionally does not implement physical-window settlement,
pressure, wakeups, replan intents, background admission, a public API, or a
provider-specific transport.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence locator and validation | Status |
| --- | --- | --- | --- |
| RC-01-01 | Server-qualified route/capability/domain identity must persist before reservation; forged/unqualified/client identities create no reservation, job, or send. | `0037_bssv200603a_route_bound_operational_runtime.sql` validates process and quota-domain eligibility, makes the binding immutable, and triggers rejection before every reservation insert. `provider-route-bound-admission.integration.test.ts` first proves unbound admission rejection, then binds exclusively through the production resolver before successful admission. | PROVEN |
| RC-01-02 | A real pg-boss consumer claims once before one outbound transport call; duplicate/replay cannot cause another send. | `provider-admitted-worker.ts`, `provider-operational-runtime.ts`, and `worker.ts` register the admitted queue, claim with a reservation-unique durable fence, then invoke exactly one injected transport. `provider-admitted-worker.integration.test.ts` records one completed job, claim, send, and ingress outcome using PostgreSQL and pg-boss. | PROVEN |
| RC-01-03 | One typed redacted ingress rejects invalid identity/trust/freshness/shape/replay conflicts without mutation. | `0037...sql` is the sole feedback ingress and rejects raw/secret fields, invalid route/domain/plan/qualification/attempt, malformed usage, conflicting duplicate feedback, and unclaimed downgrade. Its trigger validates qualified source/trust and freshness. `provider-route-bound-admission.integration.test.ts` proves raw-field rejection, a redacted persisted event, and idempotent duplicate handling. | PROVEN |
| RC-01-04 | Production resolver + ordinary admitted job path, only outbound transport substituted; prove reservation/job/claim/send/outcome and no live transport. | `provider-admitted-worker.integration.test.ts` uses `createRouteRegistry`, `bindProviderWorkRouteFromResolver`, the ordinary 006-02 admission function, live pg-boss worker registration, and a transport-only fixture. It asserts one persisted job, reservation claim, send, feedback outcome, and reconciled attempt. | PROVEN |

Validation executed against a disposable clean PostgreSQL database migrated from
`0000` through `0037` (then removed):

```text
node packages/atlas-db/scripts/migrate.mjs                                      PASS
node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs \
  packages/atlas-db/tests/provider-route-bound-admission.integration.test.ts    PASS (1 test)
node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs \
  apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts         PASS (1 test)
corepack pnpm --filter @atlas/db typecheck                                       PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                            PASS
```

The integration transport is an injected fixture and asserts the content-free
payload reference; no live provider transport is configured or invoked.

Internal readiness: READY_FOR_CK
