# GO checkpoint: IDSER-010-04 / IDSER-BATCH-10-04

- **Ticket:** `IDSER-010-04-concurrent-bundle-identity-isolation.md`
- **State:** `awaiting_review`
- **Predecessor:** IDSER-010-03-02 `PASS` (`f919439`)
- **Scope:** Scenario F only: concurrent same-display-name project/bundle identity, worker/job, context/result, and persisted-materialization isolation.

## Bounded implementation

- Extended the existing deterministic production Compose A–E harness with Scenario F.
- Concurrently creates two authenticated owner projects with the same display name, distinct stable project IDs, and deliberately distinguishable controlled provider payloads.
- Asserts exact project/workspace/bundle/document/execution identity separation; owner-scoped reads; per-bundle N/N completion; one extraction result, reconciliation result, candidate, evidence, and relationship; and no pending pg-boss job for either completed execution scope.
- The controlled Mistral fixture now preserves the distinct Scenario F source payload through the persisted candidate meaning, so a crossed context or result is observable.
- No production identity, membership, queue, worker, reconciliation, retry, replay, or lifecycle semantics changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
|---|---|---|---|
| `RC-010-04-01` | Two authenticated owners run same-display-name projects concurrently; all project/workspace/bundle/document/execution IDs remain unique and each owner sees/mutates only its own rows. | `apps/agents-bridge/tests/idser-010-compose.mjs` Scenario F creates both owners with `Promise.all`, checks all six persisted identities per scope are unique, and verifies the signed owner home-read returns only the caller's project. Host command: `node apps\\agents-bridge\\tests\\idser-010-compose.mjs` (passed; the script returned the stack to the base Compose topology). | PROVEN |
| `RC-010-04-02` | Scoped workers/jobs claim and deliver only their scenario work once, with no unrelated state change and cleanup. | The same production-worker run waits for both Scenario F bundles to reach `ready_for_review`, asserts exactly one extraction/reconciliation result per scope and zero remaining `pgboss.job` rows for either scoped execution ID. | PROVEN |
| `RC-010-04-03` | Distinguishable context/provider response/result stay in their exact scope; no foreign ID/payload and each bundle reaches its own N/N outcome with separate candidates, evidence, and relationships. | Scenario F records distinct controlled provider meanings (`Scenario F alpha assertion.` / `Scenario F beta assertion.`), asserts each persisted bundle contains only its expected meaning, and asserts one candidate/evidence/relationship and N/N outcome per bundle. | PROVEN |

## Direct regressions checked

- `node --check apps\\agents-bridge\\tests\\idser-010-compose.mjs` — passed.
- `node --check apps\\agents-bridge\\tests\\mistral-ocr-mock.mjs` — passed.
- `git diff --check` — passed.
- `node apps\\agents-bridge\\tests\\idser-010-compose.mjs` — passed; starts the deterministic Compose topology and restores the base Compose topology in `finally`.

Internal readiness: READY_FOR_CK

GO makes no PASS determination. CK must review this commit and the three ticket-derived isolation rows.
