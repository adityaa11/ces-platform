# GO checkpoint: IDSER-012-03-02-03 / IDSER-BATCH-12-03-02-03

- **Ticket:** `IDSER-012-03-02-03` — Structural-fit corpus partition proposal.
- **State:** `awaiting_review`.
- **Implementation commit:** `fc310aca` (`feat(idser): add structural corpus partition proposal`).
- **Dependencies consumed:** `IDSER-012-03-02-01` CK verification `PASS` at `c1eff7e9`; `IDSER-012-03-02-02` CK `PASS` at `e91993ce`; and the retained `IDSER-012-03-01-03` CK `PASS` at `719b9d12`.

## Bounded implementation

`proposeStructuralFitCorpusPartition` composes only the approved
`createIdserProspectiveCapacitySnapshotConsumer` surface and
`estimateAcceptedCorpusDemand`. It first pins the authenticated BSS
prospective structural/policy/estimator identity, then deterministically
forms ordered owned batches from the estimator's eligible canonical locators.
Each candidate supplies measured `requestBytes` and `inputTokens` to the same
BSS consumer. A BSS structural `unfit` result causes a smaller deterministic
candidate; an indivisible candidate blocks. Reader errors or a changed pinned
source/enforcement/process/workload identity block; changed corpus, policy, or
estimator identities against a supplied prior proposal create a new immutable
`REPLAN` result with an explicit predecessor.

The proposal retains the immutable BSS policy projection, structural bound,
estimator/model-route fixture identities, source/policy/estimator hashes,
per-batch resource demand, full fit trace, exactly-once owned locators, and
explicit deferred/unexamined units. It has no database, queue, BSS write,
runtime-constraint, SEM, GHR, provider, semantic-truth, or reconciliation
dependency. `NO_ELIGIBLE_SOURCE` returns zero batches without fabricating an
empty handoff. The existing reader now labels an authoritative BSS `unfit`
response for this consumer so the proposal can perform the ticket-authorized
smaller structural retry; it remains a non-admission planning read.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-012030203-01` | Frozen row 01: only consistent approved `-02-01` reads and `-02-02` demand values may yield a proposal; missing, stale, foreign, unsupported, unknown-mandatory, or zero state blocks. | `idser-structural-fit-corpus-partition.ts` pins the initial BSS policy identity and compares every candidate result before accepting it. The focused suite simulates a changed BSS revision and observes `STRUCTURAL_REVISION_CHANGED`; `capacity-planning-snapshot.integration.test.ts` composes the real authenticated reader. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — PASS (3 tests, 0 failures). `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs ./apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts` — PASS (1 real PostgreSQL test, 0 failures, 0 skips). | `PROVEN` |
| `RC-012030203-02` | Frozen row 02: preserve independent BSS RPM/TPM/concurrency and authorized unknown/not-enforced RPD without fabricating daily capacity; preserve known RPD policy. | Proposal binds `eligibleDimensions`, the complete immutable BSS enforcement projection, and separate exact request-demand envelopes. Focused cases prove unknown RPD retains positive day demand and known RPD retains `rpd` plus its BSS-owned limit. Real Anoman evidence proves the authorized unknown/not-enforced RPD shape. | Focused command above — PASS. PostgreSQL command above — PASS. | `PROVEN` |
| `RC-012030203-03` | Frozen row 03: deterministically own every eligible locator once, retain bounded zero-owner context position, and preserve table/visual/media/REL/deferred fidelity or block. | The planner consumes the approved estimator's canonical ordered units without reconstructing source or REL. Focused evidence proves repeatability, three distinct owned locators across deterministic smaller-fit batches, and explicit no-source/indivisible results. The estimator predecessor's CK evidence covers tables, media, visual, REL, and fidelity classifications consumed unchanged here. | Focused command above — PASS. | `PROVEN` |
| `RC-012030203-04` | Frozen row 04: use real structural maxima and conservative prompt/schema/input/output/media/REL-overhead demand; no page count or remaining runtime quota. | Candidate demand originates only from the approved estimator; every candidate passes that request's measured bytes/tokens to the BSS prospective consumer. The proposal records the BSS structural bound and exact batch envelopes. | Focused command above — PASS. PostgreSQL command above — PASS. | `PROVEN` |
| `RC-012030203-05` | Frozen row 05: no transient-pressure rebatching; structural/source/media/policy/estimator change produces immutable replan or block without mutation. | No runtime-capacity read exists in the proposal module. Focused evidence observes a changed BSS revision as `STRUCTURAL_REVISION_CHANGED`, creates `REPLAN` only with its immutable predecessor, and confirms different proposal identity; no old object is mutated. | Focused command above — PASS. | `PROVEN` |
| `RC-012030203-06` | Frozen row 06: positive and failure paths produce zero BSS writes/attempts/reservations/provider sends, GHR delivery, durable handoff, SEM, or Atlas semantic/reconciliation effects. | The module imports only the approved read/estimate value surfaces. The real PostgreSQL integration records BSS attempts/reservations/jobs/sends/quota mutations plus durable profile/plan, GHR, semantic delivery/execution/result, and reconciliation counters before and after the real proposal. | PostgreSQL command above — PASS; all counters unchanged. | `PROVEN` |

## Validation and limitations

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `node --env-file=../../.env scripts/migrate.mjs --check` from `packages/atlas-db` — **PASS** (`Atlas database migration check passed`).
- `git diff --check fc310aca^ fc310aca -- <authorized paths>` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge test` — ticket suites, including the new structural-fit suite, passed. The command later fails at the existing unrelated `tests/docling-provider.test.ts:109-112` assertion because `docling-digital-pdf` no longer carries the approved RUN-003 qualification. This path neither overlaps the implementation commit nor creates a direct in-scope regression.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control returns to CK for the frozen ticket.
