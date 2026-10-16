# BSS-V2-006-03A GO progress ledger

Historical parent authority: `BSS-V2-006-03A-provider-feedback-accounting-pressure-convergence.md`.
That parent was split before CK into `BSS-V2-006-03A-01` through `-06`; this
ledger is now a dirty-tree allocation record, not an executable GO ledger, CK
handoff, or PASS. A new GO ledger must be opened for the explicit child ticket
being worked. No child inherits a completed RC merely because this ledger marks
a slice implemented.

## State-transition implementation note

| Operation | Owner / fence | Current durable transition | Recovery condition |
| --- | --- | --- | --- |
| Targeted interactive admission | Existing `006-02` admission transaction and domain advisory lock | `waiting -> reserved -> dispatched`, creates one reservation/job and 03A physical window holds | Existing deadline/cancellation checks before claim; background parity still pending |
| Admitted worker claim | `provider_transport_claim` unique reservation fence | `dispatched -> transport_may_have_started` before transport | Replay fails closed after claim; real-worker evidence retained |
| Terminal feedback | feedback ID + reservation terminal uniqueness | exact physical-window hold becomes spent/deficit or released; terminal reconciliation is idempotent | identical event is a duplicate; conflicting event is non-mutating |

## Execution checklist

### Completed and evidenced implementation slices

- [x] Server-owned single-route binding is persisted before targeted interactive admission; forged route binding is rejected.  Evidence: `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts`.
- [x] An admitted `bridge-provider-admitted-execution-v1` pg-boss job is consumed by the Bridge worker exactly once, with one transport claim, one transport send and one ingress outcome.  Evidence: `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts`.
- [x] Basic feedback provenance and replay fences reject untrusted, raw, stale and unsupported-field payloads; an identical event is idempotent.  Evidence: `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts`.
- [x] Physical-window TPM reconciliation proves both under-use and over-use consequences: a 10-TPM hold can settle to 5 TPM, and a 25-TPM actual use records a 15-TPM deficit that blocks the next admission.  Evidence: `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts`.
- [x] Activation creates one durable pg-boss wakeup and the worker can claim that wakeup.  Evidence: `packages/atlas-db/migrations/0055_bssv200603a_durable_wakeup_consumer.sql` and `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts`.
- [x] Fresh/local migration state, DB and Bridge typechecks, and directly affected predecessor suites pass.  Commands: `corepack pnpm --filter @atlas/db migration:check`, `corepack pnpm --filter @atlas/db migrate`, `corepack pnpm --filter @atlas/db typecheck`, `corepack pnpm --filter @atlas/agents-bridge typecheck`, plus the `005-01/02/04` and `006-01/02` integration scripts recorded below.

### In progress — required before READY_FOR_CK

- [ ] **E01 / RC-01:** Complete shared-domain two-capability and independent-domain route matrix, including no unauthorized reservation/send and immutable route attribution across restart.
- [ ] **E02–E03 / RC-04–06:** Add mixed known/unknown usage, definitely-not-sent, may-have-started, independently expiring window, incompatible-policy, restart, late/conflicting feedback and concurrency-completion proof.
- [ ] **E04–E05 / RC-07–09:** Wire and prove trustworthy domain/route pressure, policy selection and missing-policy fail-closed behavior, 429 variants, bounded single probe, recovery, and all invalid/stale/conflicting feedback negatives.
- [ ] **E06 / RC-10–12:** Revalidate waiting work after real activation, prove one effective wakeup/replay, preserve old liabilities, rebase fairness, and implement qualified structural-replan and BSS-V2-005 revision-request intent producers.
- [ ] **E07 / RC-13:** Route-aware background admission through the common authority; prove protected interactive reserve, fairness, cancellation/deadline behavior and restart-safe accounting for both classes.
- [ ] **E08 / RC-02, RC-04, RC-06, RC-08, RC-10, RC-13, RC-14:** Expand the real worker harness for competing admissions, duplicate delivery, crash before/after claim, acknowledgement loss, rollback, feedback/admission races, terminal reconciliation and wakeup/pressure/probe replay.
- [ ] **E09 / RC-02, RC-03, RC-12, RC-14:** Complete role-denial/redaction/boundary proof, migration bootstrap and upgrade validation, no-live-transport proof, and final affected regression/typecheck/diff evidence.

### Readiness rule

- [ ] Every `RC-BSSV2-00603A-01` through `RC-BSSV2-00603A-14` is `PROVEN` and every E01–E09 group has its named real-worker evidence.  **Current result: no Review Contract row is fully proven; do not set `awaiting_review`.**

## Review Contract Closure

| Row | Required proof | Evidence location and command | Status |
| --- | --- | --- | --- |
| RC-BSSV2-00603A-01 | Full E01 two-capability/shared-domain and independent-domain matrix | `bindProviderWorkRouteFromResolver` derives the capability and immutable route identity from the server route registry before calling the DB binding. The current integration test proves this single-route fixture flow and forged-route rejection only. | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-02 | Actual worker, one claim/send, production ingress | `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts` passes with real PostgreSQL/pg-boss delivery, one transport claim/send, one ingress outcome, and a transport-only injected fixture. E08/E09 remains incomplete. | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-03 | Full bounded feedback negative matrix | Current route-bound test covers untrusted/raw/stale/unknown-field negatives | IMPLEMENTED_UNPROVEN pending all E05 cases |
| RC-BSSV2-00603A-04 | Terminal idempotence across restart | Current route-bound test covers identical duplicate/conflict guard | IMPLEMENTED_UNPROVEN pending restart proof |
| RC-BSSV2-00603A-05 | Exact per-window under/over accounting | `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts`; with `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev`, `corepack pnpm --filter @atlas/db test:provider-route-bound-operational-runtime` passes: a 10-TPM reservation settles to 5 TPM and blocks a later 16-TPM admission; a 10-TPM reservation reporting 25 TPM persists `spent_units=25`, `deficit_units=15`, and blocks the next admission in that physical window. | IMPLEMENTED_UNPROVEN pending mixed-known/unknown and independent-window/restart proof |
| RC-BSSV2-00603A-06 | Independent window expiry, unknown/restart handling | Same migration introduces physical boundaries and fails closed on incompatible active policy | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-07 through 09 | Scoped pressure, immutable policy, probe/recovery | Migrations `0049`–`0054` add operator-configured versioned policy rows, durable route/domain incidents, a single atomic probe claim and route-bound admission blocking; E01/E04/E05 recovery and trusted-domain-clamp scenarios remain absent | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-10 | Wakeup and plan convergence | `0055_bssv200603a_durable_wakeup_consumer.sql` turns activation into one persisted pg-boss wakeup delivery and durable claim; the actual Bridge-worker integration asserts that claimed activation wakeup. Waiting revalidation/replay and full plan-change matrix remain absent. | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-11 through 12 | Structural replan and revision-request intent | Tables exist only as durable intent targets; no qualified structural-downgrade producer or evidence is implemented | UNRESOLVED |
| RC-BSSV2-00603A-13 | Interactive/background protection through same operational accounting | Targeted interactive accounting is implemented, background parity absent | IMPLEMENTED_UNPROVEN |
| RC-BSSV2-00603A-14 | Full actual-worker crash/ack-loss/concurrency/role regression matrix | Worker delivery path is proven by admitted-worker integration test; remaining E08/E09 scenarios are absent | IMPLEMENTED_UNPROVEN |

Internal readiness: NOT_READY_FOR_CK. The named E01–E09 matrix is still incomplete; this is not an awaiting-review checkpoint.
