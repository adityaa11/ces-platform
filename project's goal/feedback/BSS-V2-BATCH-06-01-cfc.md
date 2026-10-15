# CFC checkpoint — BSS-V2-006-01

- **Ticket:** `BSS-V2-006-01` — Provider-work, reservation, quota-window and attempt foundation
- **Batch:** `BSS-V2-BATCH-06-01`
- **Remediation base / reviewed commit:** `83ee4369ddfc42309881dac871f6f0c05ee2ad40`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-01-83ee436-review.md`
- **Authorized findings:** `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-002.b`, `CK-003.a`, `CK-003.b`

## Frozen finding closure progress

| Clause | Status | Closure evidence and required command outcome | Frozen oracle |
| --- | --- | --- | --- |
| `CK-001.a` | PROVEN | `0031_bssv200601_closure_remediation.sql` compares every immutable registration field after an idempotent insert; `provider-work-reservation-window.integration.test.ts` proves identical replay and conflicting fairness/envelope/deadline replays. `pnpm --filter @atlas/db test:provider-work-reservation-window` PASS. | Conflicting immutable identity input is rejected; an exact replay returns the original waiting attempt. |
| `CK-001.b` | PROVEN | `provider_work_metadata_is_safe` rejects sensitive metadata keys before persistence; the focused test checks synthetic prompt/source/question/authorization/credential/connection sentinels and confirms none persist. Focused test and `pnpm --filter @atlas/db migration:check` PASS. | Content, credentials, and connection metadata cannot be registered in operational state. |
| `CK-002.a` | PROVEN | `validate_provider_quota_window_state` and `put_provider_quota_window_state` require the active profile's exact capacity profile and known per-dimension policy; the focused test rejects missing capacity and unknown policy and proves known-policy state update. Focused test, migration check, and both typechecks PASS. | Window state only uses active exact policy; missing or unknown policy fails closed. |
| `CK-002.b` | PROVEN | `request_provider_work_wakeup` validates active plan/revision and atomically replaces a deduplicated wakeup's attachment on plan cutover; the focused test rejects stale plan input then activates `plan-v2` and observes one wakeup carrying revision 2. Focused test PASS. | Later active plan attachment stays deduplicated; stale or unknown attachments fail closed. |
| `CK-003.a` | PROVEN | Reservation and transport transitions reject expiry/cancellation; cancellation releases a definitely unstarted reservation once and turns possible transport into `consumed_unknown`. Focused test covers pre-reservation cancellation, pre-transport release, post-transport conservative accounting, and execution expiry. | Expired/cancelled work cannot dispatch; unknown transmitted usage is not refunded. |
| `CK-003.b` | PROVEN | Transport and reconciliation transitions require the persisted `state_version`; the focused test proves stale callbacks fail after reconciliation and no second reservation/dispatch is possible. Explicit terminal → reconciled transition preserves the original attempt identity. Focused test, migration check, and both typechecks PASS. | Replay cannot resurrect or reauthorize work; terminal/reconciled fencing is explicit. |

## Direct regressions checked

```text
pnpm --filter @atlas/db test:provider-work-reservation-window   PASS (1 test, 0 failures)
pnpm --filter @atlas/db typecheck                               PASS
pnpm --filter @atlas/agents-bridge typecheck                    PASS
pnpm --filter @atlas/db migration:check                         PASS
git diff --check                                                 PASS
```

Internal readiness: READY_FOR_CK

Ticket remains `awaiting_review` for CK verification. This CFC checkpoint addresses only the frozen clauses above; it adds no fairness policy or provider transport.
