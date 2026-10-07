# CFC checkpoint: BSS-V2-005-01 / BSS-V2-BATCH-05-01

- **Ticket:** `BSS-V2-005-01` — External quota-domain and provider-capacity catalogue
- **Review source:** `project's goal/feedback/BSS-V2-BATCH-05-01-84f4452-review.md`
- **Reviewed base:** `84f4452bbe507de4bf889a3d8e38472b2ef431cb`
- **Authorization:** First bounded CFC pass for the consolidated `CHANGES_REQUIRED` review; no HMN authorization is required or consumed.

## CFC working progress view

| Frozen clause | Status | Evidence locator | Frozen oracle outcome |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/capacity-catalogue.ts` rejects common credential-shaped prefixes before profile creation. `apps/agents-bridge/tests/capacity-catalogue.test.ts` proves the synthetic `sk-proj-EXAMPLE0123456789` value is rejected while the existing ordinary opaque alias parses. | **PASS** — credential-shaped aliases are rejected; the ordinary alias acceptance proof remains in the same deterministic harness. |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/src/capacity-catalogue.ts` validates `daily_calendar` time zones through `Intl.DateTimeFormat` and reset times as 24-hour `HH:mm`. `apps/agents-bridge/tests/capacity-catalogue.test.ts` proves `UTC`/`00:00` is accepted and rejects `Not/AZone` and `99:99`. | **PASS** — only interpretable calendar-reset values are accepted, and both frozen invalid examples fail closed. |

## Validation

Executed successfully from `C:\Workspace\atlas\ces-platform`:

```text
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts
git diff --check
```

The focused catalogue suite passed all 3 tests. The change is limited to alias and `daily_calendar` parser validation plus the deterministic assertions required by the frozen matrix. No route sharing, profile versioning, capacity-state, provider/runtime, or database behavior changed.

## Handoff

This bounded remediation addresses only `CK-001.a` and `CK-001.b`. Both frozen closure oracles pass. Internal readiness: `READY_FOR_CK`.

The ticket remains `awaiting_review`; CFC does not issue `PASS`. CK must verify only the frozen clauses, this remediation diff, the listed evidence, and direct regressions introduced by this remediation.
