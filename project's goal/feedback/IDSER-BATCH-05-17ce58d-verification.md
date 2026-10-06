# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `17ce58d6d1a0a1b18f51b9f6f83eafa3e85dd575` (`test(idser): complete semantic evidence assertions`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`; the checkpoint records consumption of `HMN-IDSER-005-008`.
- HMN authority: `project's goal/feedback/IDSER-005-hmn-008.md`; bounded verification of frozen original `CK-002.a`--`CK-002.e` only. `CK-001` remains resolved and is not reopened.
- Review type: HMN-authorized post-CFC verification.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed `HEAD` is the exact CFC handoff commit that consumes HMN-008. The ticket remains `awaiting_review`. Unrelated generated Safara fixture changes and pre-existing untracked planning/feedback artifacts remain untouched; the reviewed commit and target are unambiguous.
- Reviewed the frozen ticket, HMN-008 authorization, prior CK verification, committed remediation diff, and the registered `semantic-worker.integration.test.ts` assertions. Review was limited to frozen `CK-002.a`--`CK-002.e` and direct regressions from this remediation.
- `git diff --check HEAD^ HEAD` passed.
- The committed CFC checkpoint reports that Docker/Compose was available and lists the required build, startup, migration, typecheck, semantic integration, semantic, Bridge, Core, DB, contracts, skills, and whitespace commands as successful. Those runtime commands were not independently rerun in this CK turn; the checkpoint is recorded as the validation evidence supplied with the handoff.
- The assertions now cover the five authorized production-path scenarios and many of their required lifecycle, fence, retry, provider-count, and replay observations. However, the redaction helper checks recorded loopback route responses and explicitly supplied Bridge `last_error` values only. It does not inspect the queued job payload or thrown errors. HMN-008 explicitly requires those operational surfaces to be checked, so the listed clauses are not fully proven.
- No direct production behavior regression was identified in the test-only remediation diff.

## Original finding verification

| Frozen clause | Verification | Ticket authority, unsatisfied evidence, and observable closure |
|---|---|---|
| `CK-002.a` — conflicting idempotency/stage | **Unresolved.** The test asserts separate provider counts, winner/loser lifecycle and acceptance/failure counts, winner fencing, immutable replay, recovery, and cleanup. Redaction checks cover the winner's recorded route responses and stored Bridge error, but do not inspect the queued loser job payload or thrown errors around conflict and recovery. | HMN-008 clause `CK-002.a` requires redaction during conflict and recovery; IDSER-005 requires bounded/redacted operational errors. The existing production-path case must assert the required redaction on its job and thrown-error surfaces as well as its current response and stored-error surfaces. |
| `CK-002.b` — Atlas context bound | **Unresolved.** The context response and stored Bridge error are checked by `assertRedacted`, alongside provider count, Atlas lifecycle, Bridge fence, and no-replay observations. The queued job payload and thrown errors are not checked for redaction. | HMN-008 clause `CK-002.b` explicitly names job, public-response, stored-error, and thrown-error redaction. Add the missing job-payload and thrown-error observations in this existing scenario. |
| `CK-002.c` — result-envelope bound after stage | **Unresolved.** The test synchronizes on the bounded handoff error, checks the envelope before and after, retains the fenced replay, and checks recorded responses/stored error. It does not inspect the queued job payload or thrown errors for redaction. | HMN-008 clause `CK-002.c` requires retry identity and redaction; IDSER-005 requires bounded/redacted operational errors. Complete redaction observation on the existing job and thrown-error surfaces while preserving the asserted retry identity. |
| `CK-002.d` — semantic-worker cancellation | **Unresolved.** The test observes one cancelled provider call, no acceptance/failure/replay, running Atlas lifecycle, pending fenced Bridge effect, and successor acceptance. Its redaction helper still does not inspect the queued job payload or thrown errors; it also does not assert a bounded cancellation error value before passing the stored value to the helper. | HMN-008 clause `CK-002.d` requires the bounded cancellation outcome and all required redaction at the pre-stage boundary. Assert those missing observations in the existing cancellation case before successor retry. |
| `CK-002.e` — orderly in-flight stop and fresh worker | **Unresolved.** The test compares the replay envelope across stop, checks Bridge/replay fence identity and successor completion/cleanup, and checks recorded responses/stored error. It does not inspect the queued job payload or thrown errors for redaction at the stop/recovery boundary. | HMN-008 clause `CK-002.e` requires redaction alongside Atlas and Bridge lifecycle/fence observations. Complete redaction observation on the job and thrown-error surfaces in the existing stop/recovery case. |

## Scope-change observations

None. The remaining gaps concern only the frozen CK-002 evidence requirements selected by HMN-008. `CK-001` was not reviewed or reopened.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `17ce58d6d1a0a1b18f51b9f6f83eafa3e85dd575` for unresolved original clauses `CK-002.a`--`CK-002.e`. The remediation closes the specified provider, lifecycle, fence, and replay observations, but its redaction evidence omits the explicitly required queued-job and thrown-error surfaces; the cancellation case also lacks an assertion of the bounded cancellation error value. Return control to human/planning authority. Any further remediation requires a fresh explicit user `hmn` invocation.
