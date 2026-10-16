# BSS-V2-006-03A — Route-bound operational feedback, quota accounting, pressure and plan convergence

- **State:** `planned` — new executable ticket; eligible for explicit `GO BSS-V2-006-03A`. No GO/CK has been executed.
- **Review batch:** `BSS-V2-BATCH-06-03A`.
- **Supersedes:** withdrawn `BSS-V2-006-03` **as a newly frozen prospective contract**, not as a CFC continuation, restoration, or adoption of its CK oracles.
- **Required CK-PASS predecessors:** BSS-V2-001/002 qualified provider-neutral routing; BSS-V2-005-01..04 quota catalogue, process/workload envelopes, deterministic plan and immutable publication; BSS-V2-006-01/02 durable attempt/window/reservation and fair atomic dispatch.
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md).
- **Incorporated boundaries:** [BSS-V2-005-01](BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md), [BSS-V2-005-02](BSS-V2-005-02-process-workload-envelope-catalogue.md), [BSS-V2-005-03](BSS-V2-005-03-deterministic-multi-resource-capacity-planner.md), [BSS-V2-005-04](BSS-V2-005-04-desired-admission-profile-publication.md), [BSS-V2-006-01](BSS-V2-006-01-provider-work-reservation-window-foundation.md), [BSS-V2-006-02](BSS-V2-006-02-fair-admission-interactive-protection-atomic-dispatch.md), and [BSS provider consumer interface boundary](../../bss-provider-consumer-contract-checkpoint-20261016.md) **only for the internal operational seams owned here**.
- **Downstream, NOT prerequisites:** `BSS-V2-005-05` registry/automatic policy re-publication and `BSS-V2-006-04` generic external consumer-facing integration. No dependency on either, IDSER, SEM-CUTOVER, live providers, or provider-specific credentials.
- **Scope lock:** only this document's Review Contract and named evidence are the `03A` GO/CK authority. Retired `006-03` tickets, GO/CK/CFC/HMN artifacts, diagnostics and historical acceptance IDs provide background only.

## Outcome and hard stop

Complete the **single Bridge-owned operational runtime path** from server-authorized route attribution and BSS-V2-006-02 admission to durable provider feedback, exact/unknown quota accounting, scoped pressure/cooldown/probe, and active-plan convergence. Consume BSS-V2-005's versioned policy; do not modify its source-of-truth catalogue, invent numeric capacity, run a provider call, or pre-qualify external consumers.

The finished checkpoint is a working, restart-safe internal operational capability used by the existing BSS admission/dispatch seams. `BSS-V2-006-04` later proves the versioned public-facing `RuntimeCapacityConstraint/v1` and `ProviderWorkAdmission/v1` interfaces with independent consumers; `03A` does not pretend those APIs already exist or implement their independent integration harness.

## Non-negotiable execution topology

```text
authenticated server process + qualified route resolver (BSS-V2-002/005)
  -> durable logical work + explicit attempt (BSS-V2-006-01)
  -> selected qualified route binding before reservation
  -> SAME BSS-V2-006-02 admission / fairness / atomic reservation + pg-boss dispatch
  -> SAME fenced executable-job and one-transport-per-attempt boundary
  -> provider adapter port [real vendor OR deterministic fake transport]
  -> SAME provider-neutral normalized operational feedback ingress
  -> SAME durable reconciliation / scoped pressure / wakeup / admission gate
```

The fake substitutes **only the outbound provider transport** under an explicitly authorized test profile. It must emit responses through the *same adapter-result normalization and feedback ingress* consumed by production adapters. Tests may observe persisted state and inject controlled time/failure conditions through standard infrastructure seams, but may not use another scheduler, fake admission service, fake accounting, direct test-only feedback mutation, `testMode` business rules, or a test-only path that bypasses actual reservation/dispatch/feedback.

No separate shadow production architecture, in-memory operational truth, alternate retry worker, second broker, direct semantic executor bypass, or "provider missing => TestRuntime" success. pg-boss remains sole durable broker. Real vendor transport remains disabled in this ticket.

## Fixed ownership and authority

| Owner | Authority available to 03A | Explicit non-authority |
| --- | --- | --- |
| BSS-V2-002 qualified resolver | Server-controlled capability/route/qualification identity | Client-supplied provider/model/endpoint or implicit fallback |
| BSS-V2-005-01..04 | Canonical `quotaDomainId`; immutable capacity/window/accounting-policy and active desired-plan versions; separate interactive reserve | Runtime outcome counters, provider-pressure mutations, direct dispatch |
| BSS-V2-006-01/02 | Fenced attempt, live reservation, exact windows, durable wakeup, weighted fairness, atomic pg-boss dispatch, at-most-once transport claim | Reopening previously approved policies or bypassing their invariants |
| BSS-V2-006-03A | Additive selected-route binding; operational feedback validation, exact/unknown reconciliation, scoped clamps/probes, durable revision-request intent, plan-change admission convergence | New numeric quota ownership, policy publication, fallback, consumer business meaning, billing ledger |
| BSS-V2-005-05 (later) | Registered-process planning, qualified immutable policy re-publication and full versioned planning-read contract | A prerequisite to `03A` or a hidden runtime counter source |
| BSS-V2-006-04 (later) | Independent two-consumer read + execution API integration, full cross-application hard stop | A source of requirements invented during `03A` GO |

**Selected-route rule.** Resolve the route from authenticated, server-authorized BSS-V2-002 qualification and BSS-V2-005 process `eligibleRouteIds` + active quota-domain `associatedRoutes` *before* admission/reservation. Persist an immutable `selectedRouteId` and relevant qualification/profile identity on the attempt/reservation/dispatch attribution, with transactionally consistent binding. A validated single eligible route can be bound deterministically; with multiple candidates, require an already-authorized singular routing decision. If there is no unambiguous authorized route, deny/defer with a typed bounded reason and zero reservation/send; `03A` does not invent load balancing or pick a replacement after pressure. Never accept caller-chosen arbitrary route, silently switch model, or rebind an admitted/maybe-transmitted attempt. Qualified route changes apply to a **new** attempt only.

**Quota-ownership rule.** BSS-V2-005 supplies **one numeric capacity vector/ledger for each canonical `quotaDomainId`**. Routes A and B may share a domain and its numeric accounting, or independently map to different domains. Route-local operational cooldown/pressure may isolate A without blocking B in the shared domain; trustworthy **domain-wide** numeric pressure affects both. Route-local signals that cannot prove shared numeric scope cause **route-scoped conservative holds, not fabricated numeric per-route quotas**. Do not implement simultaneous shared-account plus independent route-local numeric ledgers or treat `routeId` as a quota-domain alias. When scope evidence is inadequate, fail closed at the narrowest actually justified route/domain scope and never raise provider limits.

## State transitions and transactional rules

### A. Identity and atomic admission

- Work/attempt: `waiting -> reserved -> dispatched/transport-may-have-started -> terminal -> reconciled`, retaining BSS-V2-006-01 fences and `006-02` single-transport authority. A canceled/expired definitely-untransmitted attempt can terminalize with full eligible release. `dispatched` alone does not prove transport happened, but **uncertainty may not be downgraded** by a later adapter result.
- Inside the **same authoritative admission transaction/serialization**: resolve active plan and current window state; bind/verify chosen route and canonical domain; evaluate route/domain pressure, per-dimension held+live+deficit state and hard interactive/background limits; select work using `006-02` fairness; create exactly one matching reservation and one pg-boss executable job. No between-check/send bypass and no re-evaluation on a different selected route without a new authorized attempt.
- Reservations and feedback are immutable-attribution records: attempt, reservation, chosen route, canonical domain, active plan/capacity/window-policy/accounting versions, dimension/window identities and fence. Waiting work may be revalidated/rebased on active-plan transition; **in-flight** work retains old authorization identity. A new plan cannot recode prior consumption as free capacity.

### B. Operational feedback ingress

Accept only a bounded, typed, provider-neutral event after adapter-local interpretation of documented vendor semantics: `feedbackId`, `reservationId`, `attemptId`, fenced transport disposition, selected-route/qualification identity, canonical domain, authorizing plan/window-policy revision, provider observation source/trust classification and freshness, and **optional** per-dimension trustworthy quota consumption, 429/status, `Retry-After` and qualified lower-limit/remaining/reset observations. Exact field naming may follow existing implementation conventions, but these identities and validations are mandatory.

A missing field stays **unknown**, never zero; timestamps, windows, dimensions, nonnegative bounded units, replay identity and observation freshness are validated before operational mutation. Wrong-route/domain/plan, unrecognized headers, invalid negative/overflow values, stale/conflicting replay and untrusted source cannot produce numeric authority or lift pressure. Persist only minimized redacted operational facts; raw headers, HTTP bodies, prompts, documents, credentials, vendor tokens and model response text remain outside operational tables.

Adapter status `429` alone is not evidence of RPM, TPM, RPD, a reset instant, a shared account or a new permanent provider limit. Provider SDK automatic retries must be disabled for admitted transport; every retry/probe needs a **new** BSS work attempt and reservation.

### C. Exact accounting and safe release

Maintain domain-owned operational accounting by the **actual dimension and versioned window identity** `(quotaDomainId, capacity/window-policy version, dimension, window instance)`, plus instantaneous in-flight concurrency. A single global `heldResourceEnvelope` cannot release all dimensions based on any unrelated expired window.

- Definitely not transmitted, verified against BSS's own transport fence: release the eligible reservation once; no request/day/token spend and no transport. An untrusted adapter's "not sent" cannot override a durable `may_have_started` fence.
- Possibly transmitted with unknown usage: count request/RPM and RPD, retain reserved TPM (or any unknown metered dimension) conservatively through **its own** safe window, and retain in-flight concurrency until a **durably established terminal** outcome. Timeout with uncertain transport is not terminal proof of provider completion; no premature concurrency release.
- Trustworthy actual consumption: after durable terminal observation, keep transmitted request/RPM and RPD as spent according to the approved accounting policy, replace reserved refundable token usage with exact attributed actual TPM, and release concurrency. Under-use returns **only the difference in the same window**; over-use persists a nonnegative deficit/debit limiting future admission in that same domain/window. Known dimensions may reconcile while omitted dimensions remain unknown independently.
- A window's charge/hold/deficit expires or rolls forward **only** under its approved fixed/rolling/refill/provider-reset/daily policy with witnessed or deterministic safe boundary; unknown reset/refill never means midnight, immediate release, or unlimited capacity. Protected interactive reserve is still a policy portion of the same domain vector, not an extra ledger. Restart, duplicate terminal result, late feedback and old-plan window overlap must not double-refund, double-spend or prematurely release another window.

Uniqueness is enforced both by **reservation terminal-reconcile identity** and feedback event identity: byte-/canonically identical duplicate outcome returns idempotent result; same event ID with different payload or second terminal outcome for the same reservation rejects or remains explicitly nonmutating under a specified bounded conflict rule. No second event may mutate already-final consumption without an independently authorized correction protocol (not in `03A`).

### D. Scoped runtime pressure and bounded recovery

Operational pressure is durable and monotonically conservative within its authorization scope. For each dimension/window, effective numerical ceiling is `min(active BSS-V2-005 authorized ceiling, trustworthy lower domain-scoped observed ceiling)`. A documented observation may constrain a **route** operationally; it must not manufacture a separate route numeric account. Proven shared quota-domain pressure constrains every route sharing that account; independent domains are unaffected.

- 429 with reliable `Retry-After`: persist a bounded cooldown for the supported scope, preserving waiting work. 429 without usable metadata: persist bounded conservative cooldown/hold using a **versioned Bridge runtime-safety policy** (configured by an authorized operator, not invented provider header values). If the policy is missing/invalid, fail closed and emit typed unavailable/blocked status; no unlimited or guessed retry.
- After an authorized cooldown end, permit **at most one** new explicitly reserved probe per stable pressure incident/route/domain scope, protected by durable atomic claim. If it fails or cannot establish safe recovery, retain/renew conservative block **without automatic recursive probing**; recovery requires qualified new evidence or authorized policy change. Success may release only that incident's eligible cooldown/hold; it cannot lift unrelated numeric/domain/window clamps. Probe obeys full hard reserve, deadlines, cancellation and quota budget; it is not a free transport.
- Store active pressure incident identity, observed-at/source, scope confidence, policy/revision, dimension/window if justified, expiry/recovery evidence and probe count/claim. Duplicate, late, out-of-order, wrong-route or higher raw observations never lift active pressure or reset a spent probe budget. Recovery after restart is replay-safe. Safe window expiry applies **only to the matching dimension/window**.
- Never infer an infinite provider cooldown from a malformed timestamp while continuing silent retries. An unresolvable ambiguous event results in an explicit bounded conservative non-success/blocked decision and no transport.

### E. Immutable plan change and consumer-owned replan

Attach a **transaction-compatible durable deduplicated wakeup** to BSS-V2-005-04 active-plan activation per domain/revision. Waiting attempts are revalidated against the new plan before eligibility; reduce/increase changes only future admission and bounded wakeup visibility, **not** the original plan/window/accounting identity on in-flight attempts. Weight/cap revision starts/rebases the new fairness epoch without carrying idle/borrow historical debt; retain independent process/fairness-key protections of `006-02`. Activation replay and concurrent publisher/worker must produce one effective transition, no lost wakeup and no execution with stale plan.

A temporary RPM/RPD/TPM window depletion or cooldown means `waiting/temporarily_blocked`, **never** automatic corpus replan. Only a **qualified immutable per-request structural cap revision**, proved against the work's bound versions, may make a waiting envelope `structurally_unfit`; issue a durable idempotent **typed owner-replan-required event**, preserve original immutable payload identity, and do not split sources or generate a revised request in BSS. BSS-V2-005 alone validates/publishes enduring provider-capacity policy changes; `03A` may emit a traceable qualified **revision request intent** but cannot write a new capacity/desired-profile version, fabricate BSS-V2-005-05 convergence, or alter Atlas truth.

### F. Interactive and background behavior

Preserve `006-02` weighted, work-conserving, debt-free background scheduling; hard protected interactive RPM/TPM/RPD/concurrency vector is **never lent to background**. Interactive may admit only when selected-route pressure, shared quota, reservation, and caller's authenticated bounded admission/execution deadline genuinely fit. Under no fit, return explicit bounded `unavailable / pressure_limited / deadline_expired / cancelled`; do not promise a response or wait indefinitely as though it were background. Expired/canceled work before transport produces **zero late sends** even across queued callback, probe, wakeup, crash and restart. Once a transport could have started, retain conservative accounting. Background work waits durably for safe eligibility without recursive busy jobs. HTTP streaming, chatbot semantics and SEM meaning remain consumer-owned.

## Frozen Review Contract (all rows are required)

CK must evaluate these numbered `03A` rows and the linked scenarios below. The historic withdrawn `006-03` RCs/CK findings are **not** inherited. A row is `PROVEN` only from its observable oracle, not because SQL migration/typecheck/smoke tests passed.

| ID | Required behavior and binary closure oracle | Named evidence |
| --- | --- | --- |
| `RC-BSSV2-00603A-01` | **PASS iff** eligible server-selected route is immutably attributed before atomic reservation/send; forged, unqualified, mismatched-domain and ambiguous multi-route choices produce zero send; same-domain two-route and independent-domain mappings both work with one numeric owner per domain, no hidden reroute. | E01, E08 |
| `RC-BSSV2-00603A-02` | **PASS iff** actual adapter outcome passes one production operational feedback ingress through the existing BSS admission/pg-boss path; fake is swapped only at transport; no separate test/production accounting, pressure or admission state machine; one reservation never sends twice. | E08, E09 |
| `RC-BSSV2-00603A-03` | **PASS iff** bounded normalized feedback rejects secret/raw fields, negative/overflow, stale, unknown source/route/domain/plan/window, unqualified numeric/reset signals and conflicting duplicate identity without operational mutation; absent usage remains unknown. | E05, E09 |
| `RC-BSSV2-00603A-04` | **PASS iff** one terminal reservation reconciles at most once, identical replay is idempotent, conflicting second or late payload cannot double spend/refund or turn maybe-sent into definitely-unsent, even across restart. | E02, E05, E08 |
| `RC-BSSV2-00603A-05` | **PASS iff** trustworthy per-dimension actual under-use credits only refundable held amount, over-use charges an admission-blocking deficit within exact owner/window, transmitted request/RPD stay charged, concurrency releases only after durable terminal; omitted dimensions do not become zero. | E02, E03 |
| `RC-BSSV2-00603A-06` | **PASS iff** definitely-untransmitted releases once, unknown maybe-sent retains request/RPD and reserved unknown token use; independent RPM/TPM/RPD window expiration/release never cross-refunds, and unknown-reset/restart state remains fail-closed. | E02, E03, E08 |
| `RC-BSSV2-00603A-07` | **PASS iff** trustworthy domain-specific lower dimension/window pressure clamps only its canonical owner under active plan and cannot raise it; route-only ambiguous pressure holds the selected route without falsely applying a numeric shared account clamp; two routes in shared/independent domains show exact unaffected traffic. | E01, E04 |
| `RC-BSSV2-00603A-08` | **PASS iff** 429 with and without trusted `Retry-After` durably blocks during configured cooldown, persists across restart, grants no more than one atomically claimed fresh reserved probe per incident, rejects same-reservation retry and does not spin/unboundedly re-probe on failure. | E04, E08 |
| `RC-BSSV2-00603A-09` | **PASS iff** expiry/trusted probe/recovery clears only matching route/domain/dimension/window incident; stale, late, higher, malformed, wrong-route or repeated feedback cannot increase plan ceiling or lift unrelated pressure. | E04, E05 |
| `RC-BSSV2-00603A-10` | **PASS iff** vN → vN+1 activation commits one deduplicated wakeup; old inflight keeps original route/reservation/plan/window, future fitting attempts use active lower/higher policy, fairness epoch rebases with no old borrowing debt and no double dispatch on replay. | E06, E08 |
| `RC-BSSV2-00603A-11` | **PASS iff** qualified immutable per-request structural downgrade alone produces one typed owner-replan-required intent for unfit waiting work; transient rate/cooldown/remaining quota never triggers replan, no BSS corpus changes and no endless unfit retry. | E06 |
| `RC-BSSV2-00603A-12` | **PASS iff** qualified lasting downgrade produces only a provenance-bound BSS-V2-005 revision request, not direct policy publication; raw/unknown/higher signals cannot publish or elevate active policy. Future `005-05` publication remains separate. | E06, E09 |
| `RC-BSSV2-00603A-13` | **PASS iff** protected interactive/independent background work share the same route-aware admission; pressured, canceled or expired interactive returns bounded non-success and zero late sends; background remains durable/fair without reserve lending; maybe-sent work retains usage through restart. | E07, E08 |
| `RC-BSSV2-00603A-14` | **PASS iff** rollback/crash/ack loss and concurrent feedback/admission/recovery show exactly one effective reservation/job/send/terminal accounting per attempt, with persisted counters proving no bypass; Bridge role/redaction and directly affected `005`/`006-01/02` regressions remain green. | E08, E09 |

## Mandatory deterministic evidence matrix

All `E##` groups are mandatory; a single long test can implement them only when independently labeled assertions and durable counts prove **each** row. Execute against **isolated real PostgreSQL + pg-boss and the actual Bridge runtime admission/feedback entrypoints**, with deterministic fake **outbound transport adapter only**; no live provider calls. Permit isolated stable fixture clock/failure injection through ordinary infrastructure ports, not a separate production business path. Record fixture identity, input revision, expected/actual durable rows, exact sends/jobs/reservations/pressure/wakeups and outcome for every case. Inert zero arrays or direct SQL calls alone are insufficient evidence of a transport path.

| Evidence ID | Required scenario and direct negative |
| --- | --- |
| `E01` | Two routes A/B sharing one domain (A-only 429 does not deny B absent shared evidence; domain-wide trusted clamp applies both) **and** A/B on independent domains; unauthorized/ambiguous/wrong-domain route blocked with zero reservation/send; no layered ledger. |
| `E02` | Actual under-reservation and over-reservation TPM with exact deficit/credit; transmitted request/RPD retained; mixed trustworthy/omitted dimensions; definitely-untransmitted and maybe-sent unknown; second feedback ID for same reservation cannot double-effect; verify next-admission capacity. |
| `E03` | Distinct RPM, TPM and RPD window identities/refill/reset dates, with only one window expiring; demonstrate the others remain charged; unknown reset fails closed; restart and old-plan overlap preserve accounting; concurrency released only at durable terminal. |
| `E04` | 429 with trustworthy Retry-After and 429 without; bounded policy-config cooldown; expiry, one reserved probe, probe failure and authorized recovery; route/domain scope, worker restart and exact zero/one send counts. |
| `E05` | Unknown/invalid source, forged route or plan, header/raw payload, invalid time/units, stale and out-of-order feedback, conflicting duplicate IDs, higher observation and unrelated incident release all fail without unsafe state transition. |
| `E06` | Plan vN→vN+1 decrease/increase and weight changes: exactly one wakeup/epoch rebase, in-flight immutable attribution, waiting revalidate, no historical fairness debt; contrast transient pressure waiting with qualified structural owner-replan intent and qualified BSS-005 revision-request intent. |
| `E07` | Saturated background plus interactive with protected headroom; separate pressure/429, full-concurrency, deadline/cancel pre-send, timeout/maybe-sent and restart; no privilege forged class, late send, reserve lending or fabricated success. |
| `E08` | Real PostgreSQL/pg-boss transaction rollback, concurrent admission, double-delivery, crash after dispatch, lost ack and restart. Exercise same external transport port with fake adapter; assert non-inert precise reservations/jobs/provider sends and persisted reconciled/pressure states. |
| `E09` | End-to-end production seam/redaction/role/bridge typed outcome tests plus focused predecessor regression (`005-01/02/03/04`, `006-01/02`), migration check, DB+Bridge typecheck; prove no provider call, secret/source-byte leak, second broker, analytics ledger mutation or Atlas-truth write. |

## Implementation/validation discipline

1. Before coding, GO maps every `RC-BSSV2-00603A-##` to `E##` assertions and its source locator; inspect actual `006-01/02` transactional functions and qualified route resolver. Freeze a small **implementation-side state-transition table** inside the GO checkpoint (not an additional acceptance contract): operation, owner, before/after, fence, ledger key, retry/recovery condition.
2. Implement through additive migration/Bridge source changes while preserving existing `006-01/02` interfaces and invariants. Refactor the common admission seam if necessary; **do not** build a parallel `03A` admission engine or copy divergent business logic for test versus live. Re-running an old migrations snapshot that only patches a failed predecessor is not an acceptable implementation plan.
3. No provider-specific assumptions, no production numeric quota/retry values invented, no live SDK network tests, no automatic model switching, no direct `005` capacity publication, no BSS-V2-007 provenance/cost, no BSS-V2-010 fallback, no BSS-V2-005-05 registry/read surface, no BSS-V2-006-04 complete public consumer API, no SEM/IDSER changes, no Docling quota, no Atlas trusted-state mutation.
4. Required validation: isolated fresh migration application/check including all `03A` migrations, real Bridge PostgreSQL/pg-boss E01–E09, directly affected `005`/`006-01/02` integration suites, route/boundary tests, DB and Bridge typechecks, `git diff --check` and local concurrency/restart/role/redaction observations. Report actual command names, fixtures, exact outputs and failures, not only `PASS` summaries.
5. **GO hard stop:** absence of actual single-route server authorization, lack of an atomic way to preserve route/fence between admission and dispatch, missing trusted window policy, or inability to drive the same production code path with transport-only fake is **BLOCKED_AUTHORITY / NOT_READY**, not permission to invent a second runtime, a numeric route ledger, a new provider or a weakened oracle. Likewise, if a previously approved predecessor requires an incompatible contract change, stop for human/planning instead of silently reopening it.
6. GO may set this ticket to `awaiting_review` and create its bounded checkpoint only after every applicable `03A` row meets the named binary oracle; an incomplete test matrix is `NOT_READY_FOR_CK`, not a handoff. Independent CK alone may issue `PASS`.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Trust boundaries:** BSS-V2-002 qualified selection → immutable attempt-route binding; documented adapter output → typed redacted feedback → Bridge durable accounting/pressure; active BSS-V2-005 publication → Bridge admission; authenticated consumer deadline → execution fence.
- **Sensitive assets:** credentials/authorization, raw provider headers/bodies, prompts/source/document content, customer or provider secrets; excluded from operational tables, fixtures and persisted evidence.
- **Identity:** work, attempt, reservation, claimed send, selected route, canonical domain, active plan/capacity/accounting/window versions, feedback source/ID, incident/probe, policy and fairness epochs.
- **Prohibited couplings:** arbitrary client route, provider-SDK recursive retries, test-only business logic, route numeric-ledger invention, false token refunds, guessed reset, stale clamp lift, plan truth mutation, fake-provenance billing, semantic corpus edit, new broker.
- **Verification seams:** E01–E09 include impersonation/redaction, atomic authorization and send counts, independent scope/window accounting, concurrent replay/restart, service-class safety, roles, and predecessor regressions.
- **Unresolved deployment policy:** actual production provider credentials, provider-reported numeric limits, operator policy values and privacy/ZDR authorization remain future environment decisions, **not prerequisites** for deterministic `03A` GO or fabricated local defaults.

**Ready for explicit GO when this planning commit is present. No GO/CK or provider work is authorized merely by merging this ticket.**
