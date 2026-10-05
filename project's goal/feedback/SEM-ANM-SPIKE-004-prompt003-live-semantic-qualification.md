# SEM-ANM-SPIKE-004 GO checkpoint

- **Ticket:** `SEM-ANM-SPIKE-004` — PROMPT-003 live semantic qualification
- **Batch:** `SEM-ANM-SPIKE-BATCH-004`
- **Ticket state:** `awaiting_review`
- **GO authorization:** explicit user `GO SEM-ANM-SPIKE-004`
- **Predecessor:** `SEM-ANM-PROMPT-003-BATCH-03` CK `PASS`, approval commit `8b098ad` reachable from the execution checkout.
- **Terminal result:** `FAIL` — this is a valid bounded experiment result, not a GO or CK failure.

## Bounded execution

All required local gates passed before provider use:

- `node scripts/sem-anm-prompt003/prompt-compiler.test.mts`
- `node scripts/sem-anm-prompt003/differential-artifacts.test.mts`
- `node scripts/sem-anm-prompt003/qualification.test.mts`
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike004/test.mts`

The runner asserted the approval reachability and every frozen artifact identity before each call. It then made exactly two independent calls to `https://api.anoman.io/v1/chat/completions` using `gemini-2.5-flash`, `stream=false`, `temperature=0`, and `response_format={"type":"json_object"}`. No retry, fallback, correction, or third call occurred.

| Run | HTTP | Latency | Zod | Source accounting | S1 | S2 | S3 | S4 | Result |
| ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | 200 | 8,119 ms | PASS | PASS | PASS | FAIL | PASS | FAIL | Semantic oracle failed |
| 2 | 200 | 7,567 ms | PASS | PASS | PASS | PASS | PASS | FAIL | Semantic oracle failed |

Each run response was captured before normalization in ignored evidence under `.atlas-data/sem-anm-spike004/live-run-1.json` and `live-run-2.json`. Each record includes exact raw provider message content, permitted-fence status, post-fence JSON, parsed proposal, Zod/accounting/oracle results, telemetry, request identities, and any validation error. The records are not committed. Redaction and Authorization-leak scans passed.

The unchanged SPIKE-003 baseline was `S1 PASS`, `S2 PASS`, `S3 PASS`, `S4 FAIL` in both calls. SPIKE-004 preserved the route and used PROMPT-003 system-prompt SHA-256 `da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1`, but S4 remained FAIL in both new calls; Run 1 also failed S2. The evidence does not claim causality beyond this frozen corpus and route.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-ANM4-001` | Exact approved artifacts and approval reachability before both calls. | Local gate and runner assert approval `8b098ad`; reference, PROMPT-002 prompt, PROMPT-003 schema/prompt/provenance, policy, and payload hashes match before each call. | PROVEN |
| `RC-ANM4-002`, `RC-ANM4-004`, `RC-ANM4-005` | Only PROMPT-003 prompt varies; frozen route and payload are retained. | `run-config.json` and both per-run records bind identical endpoint/model/temperature/mode/payload hash and PROMPT-003 hash. | PROVEN |
| `RC-ANM4-003`, `RC-ANM4-008`, `RC-ANM4-009` | Exact Zod authority, permitted fence-only normalization, and exact S1-S4 accounting. | SPIKE-004 local gate negatives pass; both captured runs have Zod PASS and accounting PASS. | PROVEN |
| `RC-ANM4-006`, `RC-ANM4-010`–`RC-ANM4-013` | Unchanged oracle judges S1-S4 in both calls. | Re-exported SPIKE-003 oracle is exercised locally and against both preserved proposals; S4 fails in both calls and S2 fails in Run 1. | PROVEN — oracle evaluated; terminal semantic result is `FAIL`. |
| `RC-ANM4-007`, `RC-ANM4-014` | Exactly two independent calls; no retry or semantic repair. | Two and only two records; direct parse → Zod → accounting → oracle path with no rewrite/correction. | PROVEN |
| `RC-ANM4-015`, `RC-ANM4-017` | Preserve historical artifacts; remain before Atlas finalization/production. | New isolated `scripts/sem-anm-spike004/` only; no SPIKE-003 mutation, parser/finalizer/reconciliation/persistence/BSS/provider-route expansion. | PROVEN |
| `RC-ANM4-016` | Safe attributable evidence and redaction. | Ignored evidence contains raw response and full validation record per call; key and Authorization scans pass; report contains no secret. | PROVEN |
| `RC-ANM4-018` | Record bounded result and stop for CK. | This feedback record and ticket state are `awaiting_review`; no follow-on work performed. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
