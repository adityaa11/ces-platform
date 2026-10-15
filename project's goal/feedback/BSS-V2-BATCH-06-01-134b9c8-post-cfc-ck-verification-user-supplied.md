# CK post-CFC verification — BSS-V2-006-01 (user-supplied record)

> **Provenance / source limit:** faithfully recorded from the post-CFC CK verification pasted by the user in this conversation on 2026-10-16. This is **not** a newly executed CK review, not a replacement for the original consolidated frozen CK artifact, and not independent test evidence. The original artifact `project's goal/feedback/BSS-V2-BATCH-06-01-83ee436-review.md` was **not found in the inspected GitHub branch** at `134b9c83b3d0b2f4e6d10e10a0c1be8c1ecb0cc0`; it may exist in a local working tree not accessible through this remote inspection. The next CFC must read that authentic original matrix as well as this residual verification before changing code. Do not invent or redefine original CK closure oracles.

**CK verification result:** `CHANGES_REQUIRED` after CFC commit `134b9c8`.

**Unresolved frozen clauses:** `CK-001.b`, `CK-002.a`, `CK-003.b`.

**Resolved and protected frozen clauses:** `CK-001.a`, `CK-002.b`, `CK-003.a`.

- **Ticket:** `BSS-V2-006-01` — Provider-work, reservation, quota-window and attempt foundation
- **Batch:** `BSS-V2-BATCH-06-01`
- **Ticket state:** `awaiting_review`
- **Original reviewed commit:** `83ee4369ddfc42309881dac871f6f0c05ee2ad40`
- **CFC remediation commit:** `134b9c8` (`fix(admission): close provider work foundation review findings`)
- **Original CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-01-83ee436-review.md`
- **CFC artifact:** `project's goal/feedback/BSS-V2-BATCH-06-01-cfc.md`
- **Review type:** post-CFC verification of original frozen clauses only

## Scope and authority (from user-supplied verification)

The CFC names the six authorized clauses `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-002.b`, `CK-003.a`, and `CK-003.b`. This verification checks only those frozen closure oracles, the remediation diff in `134b9c8`, the evidence required by those oracles, and direct regressions in the affected provider-work behavior. No new finding or stronger oracle is introduced.

## Frozen clause outcomes (from user-supplied verification)

| Clause | Outcome | Verification evidence |
| --- | --- | --- |
| `CK-001.a` | **RESOLVED** | `0031_bssv200601_closure_remediation.sql:28-38` compares all immutable registration fields after replay. The focused PostgreSQL test rejects changed fairness, envelope, and deadline inputs while retaining the original exact replay. |
| `CK-001.b` | **UNRESOLVED** | The frozen oracle requires sensitive content to be rejected while allowed resource metadata remains registrable. `provider_work_metadata_is_safe` at `0031...sql:3-7` rejects the valid numeric envelope `{"requestUnits":1,"tokenUnits":2,"dayUnits":1,"concurrencyUnits":1}` in the reviewer probe (`false`), so the remediation does not preserve allowed resource metadata. The committed test covers sensitive key names only and does not prove valid-envelope acceptance. |
| `CK-002.a` | **UNRESOLVED** | Active-profile and known-policy validation now rejects the prior missing-policy probe, but `put_provider_quota_window_state` at `0031...sql:43-64` only writes caller-supplied state; no fixed/rolling/refill rollover transition or restart validation was added. The focused test proves policy binding/update, not policy-driven rollover/refill or restart persistence required by the frozen oracle. |
| `CK-002.b` | **RESOLVED** | `0031...sql:146-161` validates active plan/revision and updates the existing deduplicated row. The focused test rejects stale input, activates `plan-v2`, and observes one wakeup attached to revision 2. |
| `CK-003.a` | **RESOLVED** | Reservation and transport transitions now check execution expiry, cancellation, and the persisted state version. The focused test proves pre-transport release, possible-transport `consumed_unknown`, and execution-expiry rejection. |
| `CK-003.b` | **UNRESOLVED** | The remediation adds expected-state-version checks and a terminal-to-reconciled transition, and the focused test rejects a stale callback after reconciliation. However, no worker/database restart or lost-ack replay scenario was executed or added; the frozen oracle specifically requires proof after restart, lost acknowledgement, or replay. |

## Validation and direct-regression checks (reported by user-supplied CK)

```text
pnpm --filter @atlas/db migrate                                      PASS
pnpm --filter @atlas/db test:provider-work-reservation-window        PASS (1 test, 0 failures)
pnpm --filter @atlas/db test:desired-admission-profile-publication   PASS (1 test, 0 failures)
pnpm --filter @atlas/db typecheck                                    PASS
pnpm --filter @atlas/agents-bridge typecheck                         PASS
pnpm --filter @atlas/db migration:check                              PASS
git diff --check HEAD^ HEAD                                          PASS
```

The Compose PostgreSQL service was healthy. The reviewer probe was read-only for the safety predicate and returned `false` for the valid numeric envelope noted above; no repository data was changed by that probe.

## CK decision (reported by user)

`CHANGES_REQUIRED`. `CK-001.b`, `CK-002.a`, and `CK-003.b` remain **UNRESOLVED** against their original frozen closure oracles. `CK-001.a`, `CK-002.b`, and `CK-003.a` are **RESOLVED**. Return control to human/planning authority; do not start another CFC cycle from this verification.
