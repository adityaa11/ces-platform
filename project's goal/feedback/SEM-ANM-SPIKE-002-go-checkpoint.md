# SEM-ANM-SPIKE-002 GO checkpoint

- **Ticket:** `SEM-ANM-SPIKE-002`
- **Batch:** `SEM-ANM-SPIKE-BATCH-002`
- **State:** `awaiting_review`
- **Terminal result:** `FAIL`
- **Authorization:** explicit user `GO SEM-ANM-SPIKE-002`
- **Predecessor:** `SEM-ANM-PROMPT-001` CK `PASS`; checkpoint `42f59279d5f599d4d9a580ee2fa9986124cc8361`
- **Accepted parser boundary:** `BSS-V2-004-02` CK `PASS`; checkpoint `8a58d01a27985031b3961b3b1a002b83ed2144ad`
- **Detailed review artifact:** `project's goal/feedback/SEM-ANM-SPIKE-002-prompt001-live-semantic-qualification.md`
- **Implementation:** `scripts/sem-anm-spike002/`

Exactly two equivalent authenticated Anoman calls completed. Both used the
approved prompt hash `5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4`,
schema hash `b0316a004d4f1f94a0b9da240bfa730e3b1956e8f52808f3b6b07083dba97fa5`,
and the same parsed synthetic S1-S4 fixture. Both outputs passed Zod, source
accounting, deterministic finalization, and `parseSemanticExtractionResult(...)`.
The S1-S4 oracle passed S1, S3, and S4, and failed S2 because both outputs
classified the maximum-two-products-per-order statement as `rule` rather than
`constraint`. No semantic repair, retry, fallback, third call, predecessor
change, or prompt change occurred. Secret-safe raw run records and complete
available telemetry are under ignored `.atlas-data/sem-anm-spike002/`.

## Validation

- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts` — PASS.
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/run.mts` — PASS; approved hashes and complete coverage.
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/test.mts` — PASS; 26 positive/negative oracle and validation cases, including generic-rule S2 rejection, fixture/parser/finalizer and redaction behavior.
- `node --check scripts/sem-anm-spike002/run.mts` — PASS.
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/run.mts` — two requests; both HTTP 200; terminal `FAIL` on S2 semantic kind.
- `.env` ignored and `ANOMAN_API_KEY` present; evidence redaction scan PASS.
- `git diff --check` on bounded checkpoint paths — PASS.

## Review Contract Closure

| ID | Ticket authority | Required proof and actual evidence | Status |
| --- | --- | --- | --- |
| `RC-ANM2-001` | Ticket start gate / §2 | Predecessor CK `PASS`; checkpoint and approved artifacts identified. | PROVEN |
| `RC-ANM2-002` | Ticket §§4, 15 | Exact prompt hash matched immediately before both equivalent calls. | PROVEN |
| `RC-ANM2-003` | Ticket §§12, 18 | Same approved Zod schema hash and successful parse in both calls. | PROVEN |
| `RC-ANM2-004` | Ticket §7 / SR-ANM2-SA-01 | Root `.env` ignored; key present and used; missing-key local path fails closed; no key/header in source or artifacts. | PROVEN |
| `RC-ANM2-005` | Ticket §6 | Both calls used frozen Anoman model, temperature, stream, and response-format values. | PROVEN |
| `RC-ANM2-006` | Ticket §11 | Allowed full outer-fence stripping only; local negatives reject prose/partial fences. | PROVEN |
| `RC-ANM2-007` | Ticket §15 | Exactly two equivalent HTTP 200 runs; no retries/fallback/repair; outputs preserved. | PROVEN |
| `RC-ANM2-008` | Ticket §§9, 13, 19 | Required oracle executed against both runs: S1/S3/S4 pass; S2 fails required kind. Outcome supports terminal `FAIL`; no claim that provider passed semantic acceptance. | PROVEN |
| `RC-ANM2-009` | Ticket §14 | Deterministic finalization and unchanged Atlas parser pass in both runs. | PROVEN |
| `RC-ANM2-010` | Ticket §16 | Per-slot semantic comparison to manual baseline records preserved S1/S3/S4 and S2 mismatch. | PROVEN |
| `RC-ANM2-011` | Ticket §17 | Available per-call usage, cost, latency, routing, provider region, guardrail/cache fields and hashes recorded safely. | PROVEN |
| `RC-ANM2-012` | Ticket §§20, 25 | Diff/fingerprints and two-run config show unchanged predecessor and frozen prompt/route/call budget. | PROVEN |
| `RC-ANM2-013` | Ticket §13.1 | Bounded oracle normalization tests pass; proposal snapshots unchanged across validation/finalization in both runs. | PROVEN |
| `RC-ANM2-014` | Ticket §18 / hygiene | Focused validation, ignored evidence, redaction scan, and whitespace check pass. | PROVEN |

Internal readiness: READY_FOR_CK

This is implementation handoff readiness for CK review of a complete negative
qualification result. It is not a self-issued CK `PASS` and does not authorize
prompt remediation or production routing.
