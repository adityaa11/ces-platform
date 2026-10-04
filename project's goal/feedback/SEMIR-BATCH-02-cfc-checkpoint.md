# CFC checkpoint: SEMIR-002 / SEMIR-BATCH-02

- **State:** `awaiting_review`
- **Ticket / batch:** `SEMIR-002` / `SEMIR-BATCH-02`
- **Remediation base:** `f04d413a797699d5f67be1976fd4265d97741ecc`
- **Frozen CK authority:** [SEMIR-BATCH-02-d7ea37f-review.md](SEMIR-BATCH-02-d7ea37f-review.md)
- **Provider calls:** `0`

## Bounded remediation

Remediated only frozen clause `CK-001.a`. The isolated SEMIR-002 checker now exercises the two missing top-level rejection cases: an out-of-enum `discourseRole` and an empty `sourceSlot`. No schema contract, frozen corpus, provider call, production import, route, persistence, `NormalizedDocument v1`, old-parser, reconciliation, or canonicalization changed.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | PROVEN | `scripts/semantic-ir-v0/check-semir-002-schema.mjs`: negative-fixture list includes `discourseRole: 'invented-role'` and `sourceSlot: ''`; the existing `safeParse` assertion requires every fixture to be rejected. | `node scripts/semantic-ir-v0/check-semir-002-schema.mjs` — PASS; the 43 frozen valid cases parse and all structural negative fixtures, including both added cases, are rejected. | PASS: the checker contains invalid-role and empty-slot fixtures, and exits 0 with both rejected by `safeParse`. |

## Direct regressions checked

```text
node scripts/semantic-ir-v0/check-semir-002-schema.mjs
SEMIR-002 schema PASS: 43 frozen SEMIR-001 cases parse; independent dimensions,
structural failures, and Zod JSON Schema descriptions verified; zero provider calls.

git diff --check
PASS (no whitespace errors)
```

The named checker continues to cover the frozen 43-case SEMIR-001 mapping and existing structural negative assertions. This remediation does not modify any broader test or production surface.

Internal readiness: READY_FOR_CK
