# CFC checkpoint — REL-03-DURABLE-001 predecessor closure

- **Ticket:** `REL-03-DURABLE-001` — fenced durable composite staging and replay
- **Frozen CK artifact:** `project's goal/feedback/REL-03-DURABLE-001-041560b-review.md`
- **Post-CFC verification addressed:** `project's goal/feedback/REL-03-DURABLE-001-d5fc728-verification.md`
- **HMN authorization consumed:** `HMN-REL-03-DURABLE-001-009`
- **Authorized clauses:** `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-003.a`
- **Remediation base:** `d5fc728015f0f381d23da3117f94330c609510a7`

## Frozen-clause closure evidence

| Clause | Closure evidence and binary oracle | Exact command and outcome | Status |
| --- | --- | --- | --- |
| `CK-001.a` | SEM-006 now hashes and compares the deferred descriptor's exact provider candidate content, in addition to its existing exact revision, ID, source locator, tuple, necessity, and uncertainty checks. The focused projection matrix rejects foreign tuple, forged ID, wrong revision, wrong locator, and forged candidate meaning before projection output. | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-extraction-finalizer.sem-cutover-006.test.ts` — PASS, 4/4. | `PROVEN` |
| `CK-001.b` | Qualified SEM-005 passes a genuine `null` canonical result into composite accounting. The accounting validator preserves a null hash and rejects a null result whenever any independently finalized meaning, canonical inventory, or canonical binding exists; no empty V1 placeholder is constructed. The fully deferred qualified handoff asserts null-preserving accounting. | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` — PASS, 8/8. | `PROVEN` |
| `CK-002.a` | `verifyQualifiedStepwiseSemanticPreparation()` compares independently held request/proposal context with the immutable retained context, re-derives every provider tuple, validates deferred candidate content, and verifies the accounting hash. The qualified-entry test rejects a recomputed provider candidate mutation while original inputs remain unchanged. | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` — PASS, 8/8. | `PROVEN` |
| `CK-003.a` | The committed qualified-path matrix observes fully deferred, ordinary, and mixed projections; wrong revision, locator, descriptor ID, and candidate meaning; omitted/duplicated/reclassified provider data; missing visual asset; malformed provider run; immutable-context mutation; source identity and slot-state failures. Existing focused sidecar cases retain canonical binding, provenance, asset, tuple, and source negatives. All remain pure preparation with no durable effect. | `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-extraction-finalizer.sem-cutover-006.test.ts` — PASS, 4/4; `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` — PASS, 8/8; `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` — PASS, 11/11. | `PROVEN` |

## Direct regressions and self-review

- `pnpm --filter @atlas/skills typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `git diff --check` — PASS.
- Reviewed the remediation diff against HMN-009: only its seven-file predecessor implementation/test allowlist and this bounded checkpoint are staged; protected `RC-PRE-001` and `RC-PRE-004` are unchanged.
- Shadow-CK result: all four authorized frozen binary oracles have a passing focused harness and direct-regression boundary evidence.

Internal readiness: `READY_FOR_CK`

The ticket remains `awaiting_review`. This checkpoint is not a CK result and does not invoke CK.
