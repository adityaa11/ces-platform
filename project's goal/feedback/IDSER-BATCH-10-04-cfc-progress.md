# CFC progress: IDSER-010-04 / IDSER-BATCH-10-04

- **Authority:** Initial consolidated CK artifact `IDSER-BATCH-10-04-95cc521-review.md`, result `CHANGES_REQUIRED`.
- **Reviewed commit:** `95cc521d63daae3188e2d698f619464ffd4cfe1e`.
- **Remediation base:** current `HEAD` at `95cc521d63daae3188e2d698f619464ffd4cfe1e`.
- **Scope:** CK-001.a, CK-001.b, CK-001.c only; see the cited CK artifact for their frozen ticket traces, required proof, harness/scenarios/observations, and closure oracles.
- **Protected:** already `PROVEN` ticket rows are retained. No other rows are in this first CK matrix. Existing unrelated worktree changes are preserved.

## Clause progress

| Clause | Current status | Evidence location |
|---|---|---|
| CK-001.a | `PROVEN` | `IDSER-BATCH-10-04-cfc-evidence.json`: `deniedContext`, `deniedCrossOwnerProgressMutation`, `ownersAndIds`; progress snapshots are byte-for-byte equivalent across each denied operation. |
| CK-001.b | `PROVEN` | `IDSER-BATCH-10-04-cfc-evidence.json`: four unique `queueJobs`, overlapping `workerEvents`, completed stage states, zero acknowledged outbox rows, and unchanged unrelated queue state. |
| CK-001.c | `PROVEN` | `IDSER-BATCH-10-04-cfc-evidence.json`: `deniedContext`, `deniedForeignCandidateReference`, and `finalScopes` show rejection with unchanged target/control observations and owner-local N/N results/materialization. |

**Validation:** `node --check apps/agents-bridge/tests/idser-010-compose.mjs`, `node --check apps/agents-bridge/tests/mistral-ocr-mock.mjs`, `git diff --check`, and `node apps/agents-bridge/tests/idser-010-compose.mjs` all passed. The Compose output is retained locally at `.codex-tools/idser-010-cfc-final.out`; durable scoped evidence is in the JSON artifact above.
