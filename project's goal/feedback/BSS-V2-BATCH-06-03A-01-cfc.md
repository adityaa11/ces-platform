# CFC checkpoint — BSS-V2-006-03A-01

- **Ticket:** `BSS-V2-006-03A-01` — Route-bound admitted execution and authoritative feedback ingress
- **Batch:** `BSS-V2-BATCH-06-03A-01`
- **Authority:** explicit user command `cfc BSS-V2-006-03A-01`; frozen ticket and first consolidated CK review at `feedback/BSS-V2-BATCH-06-03A-01-66787c0-review.md`.
- **Remediation base:** `66787c07eea229264f4c05b0db3e94dbed0ae948`
- **Scope:** only unresolved frozen clauses `CK-001.a` and `CK-002.a`. No physical-window settlement, pressure, wakeup, replan, public API, or provider-specific transport behavior was added.

## Frozen finding closure progress

| CK clause | Ticket authority and frozen oracle | Remediation and exact evidence | Status |
| --- | --- | --- | --- |
| `CK-001.a` | `RC-01-02`: the production Bridge composition must consume the admitted job, durably claim before one outbound-port call, record one outcome, and prevent a duplicate/replay or crash-after-claim from sending again. | `src/production-worker-composition.ts` is now the composition used by `worker-main.ts`, with `createProviderAdmittedExecutionHandler` permanently registered. `tests/provider-admitted-worker.integration.test.ts` starts that composition with only its outbound port replaced. It proves one admitted pg-boss job, one claim, one outbound call, and one ingress outcome; it then verifies a duplicate identity and a crash-after-claim replay cannot make a second outbound call. | `PROVEN` |
| `CK-002.a` | `RC-01-01`: only the resolver-qualified identity may bind before admission; forged, unqualified, contradictory, and client-selected identities must leave zero reservation, job, or send, while the valid binding is immutable. | Migration `0038` adds the Bridge-only `qualified_provider_route_authority`; the resolver publishes identity there and the bind function derives capability/adapter/qualification from it. The admission role has no execute grant. `tests/provider-route-bound-admission.integration.test.ts` proves a forged/unpublished and client-chosen route leave zero reservations, pg-boss jobs, and claims before the resolver binds the valid immutable route. | `PROVEN` |

## Validation

Executed against a newly created local PostgreSQL database, migrated from the
exact `0000` through `0038` migration set:

```text
corepack pnpm --filter @atlas/db migrate                                      PASS
corepack pnpm --filter @atlas/db typecheck                                    PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                         PASS
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-admission.integration.test.ts  PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts  PASS (1 test; production composition, duplicate/replay and crash-after-claim coverage)
git diff --check                                                              PASS
```

Direct regressions checked: the admitted queue registration/claim/ingress path,
outbound-call fencing, and resolver-bound route/qualification attribution. The
test transport remains a content-free fixture; `worker-main` keeps the
production port fail-closed until a later, separately authorized ticket owns a
provider-specific payload contract.

Internal readiness: READY_FOR_CK

**Checkpoint state:** `awaiting_review`. CFC has completed one bounded pass
and stops for CK verification.
