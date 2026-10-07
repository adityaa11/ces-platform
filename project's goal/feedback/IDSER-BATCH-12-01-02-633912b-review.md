# CK review: IDSER-012-01-02 / IDSER-BATCH-12-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-01-02-two-worker-docling-perception-composition.md`
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `633912b84f5f9e037d575e71d621ce0e93dd84bf` (`feat(idser): qualify two-worker Docling perception`)
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-12-01-02-go-checkpoint.md`
- **Review type:** First consolidated CK review
- **Result:** `PASS`

## Review target and scope

The ticket and GO checkpoint are committed together at the reviewed HEAD. The checkpoint identifies the active ticket and batch; the ticket remains `awaiting_review`. The worktree has no tracked changes. Its unrelated untracked feedback artifacts do not overlap this review target.

Review authority is the ticket's five Review Contract rows, its explicit validation and hard-stop requirements, its Security Refactor Readiness bindings, the incorporated §21.7 planning amendment, and the approved predecessor boundaries actually consumed. Review stayed within the two-worker local-perception composition and terminal `perceived` behavior.

## Review Contract traversal

| Row | Ticket authority and required proof | Status | CK evidence |
|---|---|---|---|
| `RC-0120102-01` | Outcome / RC-01: effective profile is 2 Atlas permits / 2 Bridge perception consumers / 2 Docling local conversions / 1 Uvicorn worker; mismatch fails readiness or qualification. | `PROVEN` | Fresh Compose qualification observed Uvicorn 1, local conversions 2, CPU device, remote services disabled, Bridge background 1 / perception 2, and rejection of perception concurrency 3. The pinned image and Compose-private Docling service are in `docker-compose.yml`; no Docling host port is published. |
| `RC-0120102-02` | RC-02: real concurrent load holds two Docling calls while a third stays unadmitted until a durable terminal release. | `PROVEN` | Fresh Compose qualification held two real upstream calls: Atlas nonterminal 2, pg-boss active 2, Docling active/peak 2. The third member had no execution, grant, or job. Releasing one call admitted the third while peak remained 2. |
| `RC-0120102-03` | RC-03: success accepts one parser-valid `NormalizedDocument v1`, records durable `perceived`, leaves bundle/read lifecycle processing, and creates no semantic execution/job. | `PROVEN` | Qualification observed one accepted cache per successful member, completed perception, `perceived`, and bundle `processing`; Atlas semantic execution count was zero. A direct pg-boss query during the same isolated qualification counted zero `bridge-background-execution-v1` semantic jobs. `PostgresPerceptionAuthority.deliver` calls `parseNormalizedDocument` before persistence. |
| `RC-0120102-04` | RC-04: acknowledgement loss, duplicate, restart, terminal failure and refill preserve once-only effects. | `PROVEN` | Qualification observed acknowledgement-loss replay and duplicate with unchanged result fingerprint and admission turn (5 -> 5); restart stayed at two nonterminal executions and all three members converged; terminal failure left one `needs_attention` member and one pending unadmitted member; a healthy bundle refilled to `perceived`. |
| `RC-0120102-05` | RC-05: sequential/concurrent approved PDFs preserve material normalized output under the exact profile, meet the warm-route boundary, and record resource/infrastructure observations. | `PROVEN` | Qualification used `Safara_PRD_01_Foundation.pdf` and `Safara_PRD_02_Finance_Documents.pdf`. A CK probe scoped cache reads by `c.source_sha256=d.source_sha256` and compared each PDF's pages/content/source hash: sequential and concurrent results matched per PDF (Foundation `e2f3b9a9…`, Finance `67cc96be…`). Sequential times were 4,420 / 4,696 ms; concurrent 5,069 / 5,090 ms, wall 5,091 ms; peak 2. Container resource stats were recorded; CUDA was unavailable; Compose uses the private pinned CPU Docling service and introduces no second broker. |

## Security and dependency boundaries

- BSS-009 source grant and result acceptance remain in Atlas. The live qualification observed one source grant per admitted execution; the permission and perception-authority suites passed, including Bridge trusted-write denial and source authority negatives.
- Docling remains Compose-private and credential-minimal: the service publishes no host port, disables remote services, and is contacted over the private Compose route. Atlas parser validation remains the result-acceptance boundary.
- pg-boss remains the job lifecycle/replay authority. Atlas enqueue privileges are limited to the queue operations used by the transactional producer; Bridge owns worker lifecycle operations.
- No semantic work was released, and the ticket's `perceived` hard stop was preserved.
- The ticket's unresolved production-host sizing, multi-host, GPU and OCR policy remains outside this review's acceptance scope.

## Validation and evidence

CK independently ran the committed fresh-Compose qualification:

- `node apps/agents-bridge/tests/idser-012-01-02-qualification.mjs` — **PASS**, exit 0. It exercised effective profile/mismatch, held concurrency/refill, terminal lifecycle, acknowledgement-loss replay, duplicate, restart, failure/refill, and real sequential/concurrent PDF controls.
- Re-ran that harness as a temporary CK probe adding an actual semantic-job count assertion and source-hash-scoped cache lookup. **PASS**, exit 0; the semantic queue count was 0 and per-PDF sequential/concurrent material hashes matched. The temporary probe file was removed.
- In a fresh isolated Compose PostgreSQL project on host port `18433`: Bridge and DB typechecks, `migration:check`, `worker.integration.test.ts`, `perception-integration.test.ts`, `perception-negative.integration.test.ts`, and `test:staged-perception-admission` — **PASS**.
- In the same isolated database: `test:permissions` and `test:perception-authority` — **PASS**.
- `git diff --check HEAD^ HEAD` — **PASS**.

The committed qualification's cache-read query was not source-hash-scoped and its JSON report supplied a literal semantic-job zero. CK did not rely on those two values: the temporary probe added the source-hash predicate and queried pg-boss directly; both required observations passed. No committed files were changed by the probe.

## Frozen Finding Closure Matrix

No ticket-bound deficiencies remain. All five Review Contract rows are `PROVEN`; there are no findings or closure clauses to freeze.

## Scope-change observations

None. No product, policy, architecture, provider, runtime or deployment decision is needed to review the frozen ticket.

## Decision

`PASS`. The committed work satisfies the five ticket rows, the explicit validation and review bindings, and the hard stop at `perceived`. Required inherited queue, source-authority, permission, and staged-admission regressions passed. No in-scope regression was identified.
