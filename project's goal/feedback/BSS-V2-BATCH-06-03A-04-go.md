# GO Checkpoint — BSS-V2-006-03A-04

- **Ticket:** `BSS-V2-006-03A-04` — Plan-activation wakeup and bounded convergence intents
- **Batch:** `BSS-V2-BATCH-06-03A-04`
- **Authority:** explicit user command `GO BSS-V2-006-03A-04`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-04-plan-wakeup-and-replan-intents.md`.
- **Predecessors:** 03A-01 CK `PASS` (`BSS-V2-BATCH-06-03A-01-29c7ef3-verification.md`), 03A-02 CK `PASS` (`BSS-V2-BATCH-06-03A-02-7ed97f1-review.md`), and 03A-03 CK `PASS` (`BSS-V2-BATCH-06-03A-03-bb3b514-verification.md`).
- **State:** `awaiting_review`; this is implementation readiness evidence, not a CK decision.

## Bounded implementation

- Added the durable `bridge-provider-work-wakeup-v1` pg-boss queue, dispatch replay fence, immutable convergence intents, active-plan trigger, consumer, and production worker registration. The payload is only the durable domain/key identity; SQL retains the claim, revalidation, and intent fences.
- Activation revalidates waiting work only. Reserved work and its old-plan attribution are untouched. A successful non-stale activation starts a new `(desired_profile_version, activation_revision)` fairness epoch with `virtual_time = 0` and `next_turn = 1`.
- Structural incompatibility records `owner_replan_required`; an immutable capacity downgrade records `capacity_revision_request`. Neither path publishes, changes policy, or treats pressure as an intent source.
- Local upgrade diagnostics found recorded migration `0055` without `bridge.consume_active_plan_wakeup(text,text)` or `bridge.provider_admission_convergence_intent`, an old direct activation trigger, and `bridge.qualified_provider_route_authority` owned by `atlas` with no `agents_bridge` data privileges. Forward-only migrations `0057`–`0062` converge only the missing objects, finalized pressure interfaces needed by the direct upgraded-schema regression, fairness reset, and least-privilege ownership. No migration history was removed, rewritten, or manually marked applied.
- The unregistered `0039`–`0046` files were inspected as diagnostic context only and remain unregistered.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-04-01` | One effective deduplicated vN→vN+1 wakeup; replay cannot dispatch twice. | `0055_bssv200603a_durable_wakeup_consumer.sql`, `0057_bssv200603a_wakeup_schema_convergence.sql`, and `0062_bssv200603a_wakeup_fairness_convergence.sql` provide the durable dispatch and claim fence. `plan-wakeup-convergence.integration.test.ts` proves one `active-plan:2` dispatch and replay rejection; `provider-wakeup-worker.integration.test.ts` proves real production pg-boss consumption and duplicate delivery after restart without a second effective result. | `PROVEN` |
| `RC-04-02` | Waiting work revalidates under the active plan, in-flight attribution/liability remains old-plan, and fairness carries no historic borrow debt. | The direct PostgreSQL test asserts waiting `plan-v1→plan-v2`, reserved work remains `plan-v1`, and persisted fairness state becomes `plan-v2:2`, `0`, `1`. The production-worker test proves the same path through real queue consumption. | `PROVEN` |
| `RC-04-03` | Only qualified immutable structural downgrade creates one owner-replan intent; transient quota/cooldown/pressure creates none. | `consume_active_plan_wakeup` checks immutable active-plan input membership before the owner intent. The direct test removes the active immutable input for v3 and observes exactly one owner intent; its qualified transient pressure call leaves the intent count unchanged. | `PROVEN` |
| `RC-04-04` | Only qualified lasting downgrade creates provenance-bound BSS-005 capacity-revision intent; it never publishes or elevates policy. | `consume_active_plan_wakeup` compares immutable old/new capacity vectors and inserts one unique immutable `capacity_revision_request` with source/active revision provenance. The direct test observes exactly one capacity intent for v2 and no extra intent on replay; no publication or policy mutation path is present. | `PROVEN` |

## Catalog and upgrade evidence

The upgraded local database initially reported `0055` applied while `to_regprocedure('bridge.consume_active_plan_wakeup(text,text)')` and `to_regclass('bridge.provider_admission_convergence_intent')` were null. It also had the enabled legacy `provider_work_plan_convergence` trigger alongside an older wakeup function, and the route-authority table owner was `atlas`. After forward convergence, catalog inspection showed:

```text
bridge.consume_active_plan_wakeup(text,text)                         present; owner agents_bridge
bridge.provider_admission_convergence_intent                         present; owner agents_bridge
active_desired_admission_profile_wakeup                              enabled (O)
bridge.qualified_provider_route_authority                            owner agents_bridge; SELECT/INSERT/UPDATE effective
```

## Validation evidence

Executed from a newly created isolated PostgreSQL database `atlas_bss00603a04_pristine_ready` after running the complete registered migration sequence:

```text
corepack pnpm --filter @atlas/db migrate                                                                    PASS
corepack pnpm --filter @atlas/db migration:check                                                            PASS
corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts               PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-wakeup-worker.integration.test.ts     PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts   PASS (1 test; one claim, one send, one reconciled feedback; replay has no second send)
corepack pnpm --filter @atlas/db exec jiti tests/provider-work-reservation-window.integration.test.ts     PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts PASS (8 tests)
corepack pnpm --filter @atlas/db typecheck                                                                  PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                                       PASS
git diff --check                                                                                             PASS
```

The same migration check, direct 03A-04 test, production wakeup worker test, admitted-worker regression, and 8-test operational-runtime regression were run against the corrected upgraded local database. PostgreSQL's expected cleanup warning, `25P01: there is no transaction in progress`, follows explicit test rollback and does not fail an assertion.

Internal readiness: READY_FOR_CK
