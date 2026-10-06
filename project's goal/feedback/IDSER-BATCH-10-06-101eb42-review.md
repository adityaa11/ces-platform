# CK review: IDSER-010-06 / IDSER-BATCH-10-06

- **Ticket:** `IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Review type:** First consolidated CK review
- **Reviewed commit:** `101eb423f429fe6d400550b6262cc304b1eb12fc` (`test(idser): complete deterministic composition checkpoint`)
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md`
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-10-06-go-checkpoint.md`
- **Result:** `CHANGES_REQUIRED`

## Target and scope

The ticket and GO checkpoint both identify IDSER-010-06 / IDSER-BATCH-10-06 and record `awaiting_review`. The GO checkpoint is part of reviewed commit `101eb42`; `HEAD` resolves to that exact commit. Its recorded base, `df92532`, is the approved IDSER-010-05 checkpoint. There is no earlier CK artifact for this batch.

The worktree contains generated build state, IDSER-009 ticket edits, prior artifacts, and test logs outside this checkpoint. The ticket, GO checkpoint, IDSER-010 harness, provider fixture, and browser test changes are committed and have no working-tree edits. These unrelated changes do not make the IDSER-010-06 review target ambiguous.

The named predecessors are recorded as passing: IDSER-010-01, -02, -03-01, -03-02, -04, and -05. This review evaluates the four frozen rows in IDSER-010-06 only. It does not reopen predecessor implementation or add live Mistral/IDSER-011 requirements.

## Review Contract traversal

| Row | Ticket authority | Status | Evidence assessment |
|---|---|---|---|
| `RC-010-06-01` | Ticket Review Contract row 01: configured production-shaped Compose A–H composition, executed scenarios, linked child evidence, and per-scenario IDs/DB/queue/provider observations. | `IMPLEMENTED_UNPROVEN` | The committed harness asserts the scenario outcomes and its passing run reports A/B/C/D/E/F/H plus a separate G result. The GO checkpoint summarizes A–E but does not retain their per-scenario safe IDs and DB/queue/provider observations. The untracked `.codex-tools/idser-010-06-compose.out` contains detailed F/G/H observations, but is not a durable checkpoint artifact and does not fill the A–E evidence gap. See `CK-001.a`. |
| `RC-010-06-02` | Ticket Review Contract row 02: complete AC-01–40 ledger with child evidence and final owner; compositional completion, card, conflict, replay, concurrency, and hard-stop observations. | `PROVEN` | The committed parent ledger maps AC-01–40 to an approved proof child and final owner. The GO checkpoint identifies all six approved child checkpoints, records its reconciliation of all 40 rows, summarizes the required composition observations, and reports the browser regression at 11/11. The child checkpoints and post-CFC PASS artifacts are present. |
| `RC-010-06-03` | Ticket Review Contract row 03 and hard stop: named regressions, exact commands/counts, service health, migration results, and targeted screenshots when refreshing IDSER-009-04 evidence; classify every non-pass honestly. | `IMPLEMENTED_UNPROVEN` | The checkpoint records migration check, typecheck, build, rendered HTML/CSP, browser commands and counts, and honestly classifies the two pre-existing lint diagnostics. The Compose harness starts services with `--wait`, and the browser output shows 11/11 passing; however, the durable checkpoint does not record a service-health result or link screenshots from the refreshed IDSER-009-04 visual run. The available local PNG artifacts are dated 2026-09-26, so they do not establish fresh captures for this checkpoint. See `CK-001.b`. |
| `RC-010-06-04` | Ticket Review Contract row 04 and security negatives: empty Master/no downstream state, no revision/HEAD movement, Bridge direct-mutation denial, and secret-safe evidence. | `PROVEN` | The committed harness asserts empty Master across ten controlled projects and that the prohibited downstream relations, including workspace revision/HEAD relations, are absent. Scenario F checks the Bridge role lacks Atlas schema usage. The reviewed checkpoint and captured output contain safe IDs, counts, and hashes; no credential or raw secret was found in the durable checkpoint or inspected output. |

## Validation and evidence inspected

- Inspected reviewed commit `101eb423f429fe6d400550b6262cc304b1eb12fc`, the frozen ticket, GO checkpoint, parent AC ledger, committed Compose harness/provider fixture/browser test diff, named child checkpoints, and the corresponding predecessor review artifacts.
- The GO checkpoint reports `node apps/agents-bridge/tests/idser-010-compose.mjs` passed; its captured output reports A/B/C/D/E/F/H passed and contains detailed F/G/H observations. The checkpoint reports `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` passed 11/11, migration check passed, recursive typecheck passed, app build passed, rendered HTML/CSP passed 7/7, and lint failed only on the two classified pre-existing diagnostics.
- Inspected `.codex-tools/idser-010-06-compose.out` and `.codex-tools/idser-010-06-browser.out` as submitted local run output, not committed checkpoint evidence. The browser output shows the 009-04 visual matrix passed, but the GO checkpoint does not identify screenshot paths; available local PNG artifacts are dated 2026-09-26, not this 2026-10-01 run. These files are not committed evidence. The required commands were not independently rerun during CK.
- No direct implementation regression or scope-change issue was identified in the committed diff. No dependency boundary is reopened.

## Frozen Finding Closure Matrix

### CK-001 — Required integrated checkpoint evidence is incomplete

#### CK-001.a — Scenarios A–E lack the required durable per-scenario observations

- **Exact ticket authority:** `RC-010-06-01` requires per-scenario IDs/DB/queue/provider observations and linked child evidence; the ticket hard stop requires scenario IDs and DB/queue observations in the checkpoint evidence. The parent scenario ledger specifies the relevant observations for A–E.
- **Unsatisfied evidence:** The committed GO checkpoint summarizes A–E results but does not preserve their safe scoped IDs or scenario-specific DB/queue/provider observations. The submitted Compose output contains detailed F/G/H records only, and is untracked. Thus the durable handoff does not demonstrate the row's required observations for A–E.
- **Observable correction/proof:** Add durable, secret-safe A–E evidence to the IDSER-010-06 checkpoint or a linked committed evidence artifact. It must identify the safe scoped IDs and record the ticket-named composition observations for each scenario, alongside the passing Compose result and the corresponding child evidence locations.
- **Binary closure oracle:** **RESOLVED** only when the committed IDSER-010-06 evidence identifies A–E's safe scoped IDs, records their ticket-named DB/queue/provider composition observations, links the child evidence, and records the passing deterministic Compose command/result. **UNRESOLVED** if any A–E scenario remains represented only by a summary, untracked output, or a generic suite pass without its required observation.
- **Exact evidence location/validation:** IDSER-010-06 GO checkpoint or a committed linked evidence artifact; `apps/agents-bridge/tests/idser-010-compose.mjs` and a passing `node apps/agents-bridge/tests/idser-010-compose.mjs` result.
- **Direct-regression boundary:** The A–E observations made by the final deterministic composition harness; no change to approved child behavior or their frozen contracts.

#### CK-001.b — The regression handoff does not retain health and refreshed visual evidence

- **Exact ticket authority:** `RC-010-06-03` requires commands/counts/service health and targeted screenshots where the existing IDSER-009-04 proof needs refresh; the ticket hard stop requires service health and exact validation evidence before `awaiting_review`.
- **Unsatisfied evidence:** The GO checkpoint records successful commands and counts, including the 11/11 browser run, but no service-health result. Although the browser output reports the IDSER-009-04 visual matrix passed, the durable checkpoint does not link screenshot paths, and the available local PNG artifacts are dated 2026-09-26 rather than the checkpoint run on 2026-10-01.
- **Observable correction/proof:** Record the Compose service-health result for the validation run and link the fresh IDSER-009-04 targeted screenshot artifacts in the durable checkpoint evidence. Preserve the already-recorded command outcomes and lint classification.
- **Binary closure oracle:** **RESOLVED** only when the durable IDSER-010-06 checkpoint or a committed linked artifact records the relevant Compose service health and identifies the fresh IDSER-009-04 screenshots produced by the passing browser matrix. **UNRESOLVED** if health is only inferred from test success or the screenshots remain unlinked local artifacts.
- **Exact evidence location/validation:** IDSER-010-06 GO checkpoint or committed linked evidence artifact; Compose health output and screenshot artifacts from `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser`.
- **Direct-regression boundary:** The required Compose/app/browser regression evidence for IDSER-010-06, especially the refreshed IDSER-009-04 card visual matrix; no new regression suite or product behavior is added.

Both clauses trace to explicit IDSER-010-06 evidence requirements and are frozen here. No scope-change observation is required.

## Decision

`IDSER-BATCH-10-06` receives `CHANGES_REQUIRED` for `CK-001.a` and `CK-001.b`. The committed harness and recorded runs provide substantial composition and regression evidence, but the checkpoint does not yet retain all evidence required by the frozen handoff contract. Keep IDSER-010-06 at `awaiting_review`; this review does not itself authorize CFC or advance IDSER-011.
