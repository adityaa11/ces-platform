# IDSER-010: Deterministic Compose and regression checkpoint

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-10`
- **Depends on:** IDSER-001 through IDSER-009 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 39-44, especially 41.1-41.9 and scenarios A-H; AC-01 through AC-40. See [README](README.md) for ownership.
- **Execution environment:** Real Compose Atlas/PostgreSQL/pg-boss/Bridge/worker/DocumentStore with controlled Mistral responses.

## Outcome

Prove the complete production bundle flow, exact semantic cases, failure/replay
safety and regressions using repeatable provider responses. This checkpoint
does not replace the mandatory real-provider checkpoint in IDSER-011.

## Scope

- Add an integrated synthetic-PDF/controlled-provider harness and runnable package scripts using existing test/config boundaries; tests must exercise the production dispatcher and MistralProvider capabilities rather than substitute TestRuntime or fixture authority.
- Use real authenticated project creation, DocumentStore writes, Atlas transactions, pg-boss jobs, internal handoffs and worker processes. Test isolation must not let concurrent test consumers steal production/test jobs.
- Keep mock endpoint configuration explicit in the test environment. It must never become silent fallback when production credentials are missing.
- Add only validation/harness changes and bounded fixes belonging to reviewed IDSER behavior. A new requirement or frozen-boundary incompatibility is `SCOPE_CHANGE` with exact evidence.

## Required scenarios

| Scenario | Test and required evidence |
|---|---|
| A: one PRD, no conflict | Authenticated creation -> real bundle/perception/extraction/reconciliation -> 1/1 -> ready; all identities/evidence/provenance resolve. |
| B: one PRD, internal conflict | Two conflicting statements in the same PDF remain separate candidates with unresolved relationships; ready is permitted. |
| C: multiple PRDs, support/duplicate | D2 sees bounded D1 incoming semantics; support and duplicate relationships persist without replacing candidates. |
| D: multiple PRDs, contradiction | Conflicting values remain unresolved; neither upload nor page order selects a winner; bundle becomes ready. |
| E: three-document order | Persisted execution/job history proves D2 waits for D1 reconciliation and D3 waits for D2; OCR/extraction alone never advances count. |
| F: concurrent users/bundles | Independent authorized projects/bundles progress concurrently without shared context/results/counts; same display names do not merge identities. |
| G: invalid semantic output | Schema, evidence, inventory and unauthorized-reference faults yield bounded technical failure/Needs attention, zero false progress and no successor job. |
| H: replay/restart | Interrupt after staging and after Atlas acceptance; replay exact results without another provider call for staged work, duplicate IDs/rows/counts/jobs or stale lease effects. |

Also cover all ten relationship types, full current-candidate accounting,
non-fact-only documents, context byte/count boundaries and selected-neighborhood
overflow metadata through focused suites. The E2E suite need not duplicate every
unit case, but the checkpoint must map each required section 41 obligation to
actual test evidence.

## Mandatory regression and negative authority matrix

- PCC source storage-before-commit, auth/session, membership, upload validation, duplicate creation, cross-project denial and browser-safe error/read boundaries remain valid. Replace only old production no-perception assertions explicitly extended by IDSER.
- BSS-006 transaction/lease/retry/fencing and BSS-007 immutable byte/hash tests pass.
- BSS-008 configured Mistral adapter contract tests and BSS-009 source grant/perception/cache/replay tests pass; no second OCR path.
- `/demo` remains fixture-only with its creation/share/processing behavior; production never calls local-fixture APIs or routes real projects into `/demo`.
- App build/lint, applicable typechecks, rendered HTML/CSP, auth and directly affected browser regressions pass.
- Actual `agents_bridge` role cannot discover/mutate Atlas semantic records; context/result access requires authenticated execution authority.
- Inspect absence of resolved knowledge, approval, publication, review decisions, CES assessment, projection and conversation state. Where a downstream schema does not exist, assert its absence rather than create it just for a negative test.
- Master remains empty with no revision or HEAD movement in success, failure, replay and concurrent cases.

## Validation and evidence

1. Record HEAD and the reviewed prerequisite checkpoint references.
2. Start/health-check PostgreSQL, apply/check migrations, then start the complete Compose stack with explicit deterministic provider configuration.
3. Execute registered focused/E2E scripts in Compose. Record exact commands and test counts; verify required DB-backed cases ran rather than being conditionally skipped.
4. Record service health, permissions outcome, scenario IDs, non-sensitive project/bundle/execution IDs, state/count assertions and replay call-count evidence.
5. Record app/browser/CSP results and reference IDSER-009 rendered evidence or refresh it if changes require it.
6. Document pre-existing unrelated failures with evidence; do not misreport them as passing or weaken affected requirements.

Existing script entry points include `@atlas/db migration:check`,
`test:permissions`, `test:project-repository`, `test:perception-authority`;
`@atlas/contracts test`; `@atlas/core test`; `@atlas/agents-bridge test` and
`test:perception-compose`; and `@atlas/app test`, `lint`, `test:browser`.
Use the [README Compose command form](README.md#execution-and-review-controls).
Register and cite the exact new IDSER suite command in implementation evidence.

## Acceptance criteria

1. Scenarios A-H pass through the real production-shaped boundaries with controlled Mistral output and no TestRuntime semantic work.
2. Every AC-01 through AC-40 maps to passing directly affected evidence; table/queue inspection proves sequential processing, concurrency isolation, exactly-once logical effects and no truth advancement.
3. Failure injection covers creation rollback, stage-persistence/enqueue rollback, context/result denial, provider rejection and recovery.
4. Required regressions remain green; unrelated pre-existing failures are accurately documented, with no false claim of a clean suite.
5. The phase remains incomplete pending IDSER-011. This checkpoint can pass without a live API key because its tests are deterministic.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** all reviewed IDSER seams plus frozen PCC/BSS/auth/demo authority.
- **Trust boundaries / assets:** integrated browser/Atlas/queue/Bridge/provider/DB chain; synthetic documents and secret-safe test evidence.
- **Identity context:** real user/project/workspace/bundle/document/execution/semantic IDs with versioned scenario provenance.
- **SEAM-IDSER-010-01:** Scenario-to-AC evidence matrix keeps authority, failure and concurrency obligations reviewable.
- **COUPLING-IDSER-010-01:** No fixture authority, skipped required integration disguised as pass, raw secret dumps or weakened tests to complete a checkpoint.
- **Unresolved security policy:** live credential availability is the next ticket's gate, not an inferred permission to omit it.
- **Planning findings:** none; concrete incompatibilities discovered by tests must be reported against exact frozen boundaries.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-010-01 | SEAM-IDSER-010-01 | Does the matrix prove scenarios A-H and AC-01 through AC-40 across real boundaries? Commands/counts/DB and queue assertions. |
| REV-READY-IDSER-010-02 | COUPLING-IDSER-010-01 | Are regression and negative-authority results honest, isolated and secret-safe? Harness/config/evidence review. |

## Review checkpoint

**Question:** Is the full deterministic pipeline proven with preserved
regressions and no downstream truth authority, ready for real-provider proof?

**Implementation checkpoint:** Not started; record commit, complete evidence
matrix and consolidated review. Passing this ticket does not complete IDSER.
