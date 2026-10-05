# SEM-ANM-PROMPT-001 CFC progress

- **Ticket:** `SEM-ANM-PROMPT-001`
- **Source CK artifact:** `SEM-ANM-PROMPT-BATCH-001-5a66442-review.md`
- **Reviewed base:** `5a664426bf85f4b3a4386ebdef60ee57bab09b89`
- **Cycle:** first bounded CFC remediation, directly authorized by the user.
- **State:** `awaiting_review`

| Frozen clause | Current status | Evidence target |
| --- | --- | --- |
| CK-001.a | PROVEN | `prompt-provenance.mts` contains the complete explicit material-instruction inventory; `checkpointCoverage(...)` asserts no unmapped or duplicate IDs, and `.atlas-data/sem-anm-prompt001/checkpoint-coverage.json` records the resulting audit. |
| CK-002.a | PROVEN | `test.mts` supplies a cyclic local `$ref` pair and asserts `Cyclic JSON Schema reference`, alongside the retained valid, missing-description, and broken-reference cases. |

No previously proven Review Contract row was reopened. This progress view does not alter the frozen CK closure oracles.

## Validation and shadow-CK readiness

`corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts` — PASS. It exercised the complete coverage audit and the cyclic-reference assertion; the deterministic prompt SHA-256 remained `5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4`.

`corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/run.mts` — PASS. It regenerated the ignored schema, prompt, SHA-256, and complete coverage artifact.

`git diff --check -- scripts/sem-anm-prompt001 project's goal/feedback/SEM-ANM-PROMPT-001-cfc-progress.md` — PASS.

Direct regression check: changes are limited to the provenance/coverage audit, its artifact input, the cyclic-ref negative test, and this CFC record. The schema, fixed scaffold, renderer semantics, provider boundary, and all previously proven rows remain unchanged.

Internal readiness: READY_FOR_CK
