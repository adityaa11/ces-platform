# CFC checkpoint: SEMIR-001 / SEMIR-BATCH-01

- **State:** `awaiting_review`
- **Ticket / batch:** `SEMIR-001` / `SEMIR-BATCH-01`
- **Remediation base:** `68a474cce430996a1077971752345ac38ffbc5ea`
- **Frozen CK authority:** [SEMIR-BATCH-01-68a474c-review.md](SEMIR-BATCH-01-68a474c-review.md)
- **Provider calls:** `0`

## Bounded remediation

Remediated only frozen clauses `CK-001.a`, `CK-001.b`, and `CK-002.a` in the isolated SEMIR-001 corpus and deterministic checker. The corpus now has 43 human-authored cases. Cases `SEMIR-001-041` through `043` cover the required `definition`, `missing scope`, and `ambiguous attachment` members. No Semantic IR schema, extraction implementation, canonicalization, production contract, `NormalizedDocument v1`, provider integration, or provider configuration changed.

## Frozen Finding Closure Matrix

| Clause | Status | Exact evidence locator | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | PROVEN | `scripts/semantic-ir-v0/semir-001-corpus.mjs`: cases `041`–`043`; `requiredMembers` mappings | `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` — PASS; validates every §13 member mapping and stable case IDs. | PASS: all three omitted members are present, mapped, and asserted. |
| `CK-001.b` | PROVEN | `scripts/semantic-ir-v0/check-semir-001-corpus.mjs`: `requiredMembers` and `contrastCases` assertions | `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` — PASS; reports 50 §13 member expectations and A–E contrasts. | PASS: every required §13 member and every material contrast has deterministic coverage proof. |
| `CK-002.a` | PROVEN | `scripts/semantic-ir-v0/semir-001-corpus.mjs`: `expected.propositions`, `expected.evidenceExpectations`, and cases `023`, `024`, `034`; checker assertions | `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` — PASS; requires proposition expectations for every semantic case, source-grounded evidence expectations for every case, and multiple propositions for cases `023`, `024`, and `034`. | PASS: applicable fixtures carry semantic proposition/evidence expectations; required multi-proposition sources preserve more than one proposition. |

## Direct regressions checked

```text
node scripts/semantic-ir-v0/check-semir-001-corpus.mjs
SEMIR-001 corpus PASS: 43 human-authored cases, 11 coverage families,
50 §13 member expectations, A–E contrasts, proposition/evidence expectations,
zero provider calls.

git diff --check
PASS (no whitespace errors)
```

The check continues to enforce source authorization, disposition/context classification, required A–E case IDs, nested possibility-over-obligation, the valid `needs_review` boundary, and zero provider calls. The remediation leaves all existing mandatory contrast cases and their prior expectations intact.

Internal readiness: READY_FOR_CK
