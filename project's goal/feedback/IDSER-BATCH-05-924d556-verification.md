# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `924d556cb23a99c55b50af39a80b067bd3ddd3a9` (`fix(idser): preserve staged winner after lease loss`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`. The CFC checkpoint records that this commit consumed `HMN-IDSER-005-001`.
- HMN authority: [IDSER-005-hmn-001.md](IDSER-005-hmn-001.md), `AUTHORIZE_NEXT_CFC`, authorizing resolution of original CK-001 and CK-002 only.
- Review type: HMN-authorized post-CFC verification of original findings CK-001 and CK-002 only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- `924d556` is the committed remediation named by the ticket and is followed only by documentation commit `0aac480`. Pre-existing untracked feedback artifacts do not change the target. `git diff --check 924d556^..924d556` passed.
- Reviewed the active HMN artifact, remediation diff, original consolidated findings, and the evidence necessary to assess them. The diff is limited to the replay lease-loss type, dispatcher behavior, and its unit test.
- In Compose, `corepack pnpm --filter @atlas/agents-bridge typecheck` passed and `test:semantic` passed 3/3. The registered Bridge test suite was run; its reported service, provider, perception, semantic, and worker checks passed through worker integration. As at the prior checkpoint, those registered tests contain no real semantic replay/worker/Atlas integration path.

## Original findings verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-001: fenced immutable replay must not allow a stale claimant to terminally fail the winning execution | **Implementation direction corrected, but not fully verified.** | `apps/agents-bridge/src/semantic-worker.ts:24-28` now handles `SemanticReplayLeaseLostError` by reloading and delivering a same-execution staged envelope, and rethrows when no winner exists; it no longer directly reaches `client.fail(...)`. This corrects the code-level terminal-failure path. However, the only test (`apps/agents-bridge/tests/semantic-worker.test.ts:32-37`) is an in-memory double that throws the error and returns a winner; it does not execute `createSemanticResultReplay`'s actual `bridge.background_effects` lease query, replay row, pg-boss retry, or fenced completion/cleanup. Original CK-001 and the HMN authorization both require that actual worker/DB proof. |
| CK-002: real mocked-HTTP, Bridge-ledger, Atlas-route, restart/fencing, and configuration integration matrix | **Unresolved.** | The commit adds no semantic Compose integration suite, no `createAtlasSemanticClient` coverage, no real Mistral HTTP transport through the semantic dispatcher, and no Atlas semantic context/result/failure route coverage. It therefore does not provide either production skill, acknowledgement-loss/delivery-outage/restart call counts, replay ledger/effect lease observations, handler-unavailable proof, or the required credentials/bounds/timeout/cancellation/shutdown matrix. This is also contrary to the exact comprehensive evidence package authorized by `HMN-IDSER-005-001`. |

## Scope-change observations

None. The two unresolved findings remain within the frozen IDSER-005 replay and validation authority.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `924d556cb23a99c55b50af39a80b067bd3ddd3a9`. The HMN-authorized CFC did not complete the required verification evidence. Return control to human/planning authority; another remediation requires a fresh explicit `hmn` authorization and may address only unresolved original findings.
