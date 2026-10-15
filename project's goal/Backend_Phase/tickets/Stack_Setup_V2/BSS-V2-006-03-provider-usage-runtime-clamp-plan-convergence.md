# BSS-V2-006-03: Provider feedback, usage reconciliation, runtime clamp and plan convergence

- **State:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-03`
- **Dependencies:** BSS-V2-006-02 CK `PASS`; BSS-V2-001 provider-neutral capability boundary
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.2-21.4

## Outcome

Close the generic runtime feedback loop without a live provider: define additive provider-neutral operational feedback, reconcile trustworthy actual usage, handle unknown usage conservatively, durably react to provider pressure, wake existing backlog on plan changes, and rebase fairness epochs when policy changes.

## Provider-neutral feedback seam

The Bridge capability/error boundary may be extended additively with normalized operational metadata:

```text
transportMayHaveStarted
trustworthy usage when available
Retry-After when exposed
limit / remaining / reset observations when exposed
```

Raw headers/provider bodies remain adapter-local. Existing legacy paths may retain old behavior, but a BSS-V2-006-admitted call must guarantee single-transport attempt semantics.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00603-01 | Trustworthy actual usage reconciles reserved quota exactly once. | PASS iff under-use refunds only refundable capacity, over-use records deficit, duplicate outcome cannot double-refund, transmitted request/RPD remain counted. |
| RC-BSSV2-00603-02 | Unknown usage has deterministic fail-safe accounting. | PASS iff definitely-untransmitted releases all; transport-may-have-started releases concurrency at terminal but retains request/RPD and reserved TPM until safe window boundary; missing usage is never zero. |
| RC-BSSV2-00603-03 | Retry-After/lower-limit observations create durable temporary cooldown/clamps bounded by active plan. | PASS iff waiting work survives, restart preserves pressure state, malformed feedback fails closed and higher observations cannot raise configured capacity. |
| RC-BSSV2-00603-04 | 429 without usable metadata uses bounded conservative cooldown/probe. | PASS iff no busy retry/unlimited job churn and any retry is a new explicit attempt/reservation. |
| RC-BSSV2-00603-05 | Plan activation wakes waiting work and converges without preemption. | PASS iff vN -> vN+1 creates one deduplicated domain wakeup, decrease blocks only new admissions, increase is consumable without unrelated activity, in-flight work keeps its authorizing version. |
| RC-BSSV2-00603-06 | Weight/cap change creates a new/rebased fairness epoch and feedback remains separate from BSS-V2-007 analytics. | PASS iff old virtual usage cannot become debt under new weights and runtime-minimum metadata is not the historical cost/provenance ledger. |

## Explicit provider-policy-drift and pressure handling (prospective 2026-10-16)

**Why runtime exists:** A configured BSS-V2-005 provider ceiling is an *observed or configured policy snapshot*, not a guarantee that the next request can be sent. A provider may silently reduce RPM, TPM, RPD, concurrency, or a per-request/context bound at any time. BSS-V2-006 must immediately constrain **future admissions** based on trustworthy feedback and conservative uncertainty even when BSS-V2-005 has not yet published a replacement capacity profile. The first unexpectedly rejected request cannot always be prevented; durable recovery, non-spam retry and truthful accounting **must** be guaranteed.

- **Normalize feedback in the adapter and share only typed operational signals.** Parse applicable status, `Retry-After`, provider-defined limit/remaining/reset/window hints, trustworthy usage, and `transportMayHaveStarted` with documented vendor semantics. Bound and validate units/timestamps, reason, freshness, source, model/route and quota-domain association. Do not assume Anoman (or any vendor) exposes those headers; unrecognized or ambiguous headers must not become numeric authority. Raw headers, provider bodies, credentials and user source bytes remain adapter-local.
- **Clamp safely at the correct scope:** enforce `effectiveLimit = min(active BSS-V2-005 policy ceiling, trusted lower observed/temporary clamp)` independently for each known dimension and window, plus cooldown/unknown-pressure hold. If an observation cannot distinguish RPM from TPM/RPD, do not guess which limit changed; apply a bounded conservative provider-route/quota-domain pressure hold, scoped only as broadly as supported by actual shared-quota evidence. No other customer's/project's results may be exposed.
- **Unknown-feedback path:** HTTP 429 without usable retry or limit metadata triggers persisted bounded backoff/cooldown and a strictly limited eligible probe. No in-process busy retry, automatic alternate model, unlimited retries or second transport under an existing reservation. Unknown RPD reset/window must not be treated as a guessed midnight refill. Each future probe requires a fresh eligible attempt and BSS-V2-006 reservation.
- **Short-term versus confirmed lasting reduction:** immediate pressure lives in BSS-V2-006 runtime. When a lower *structural or durable provider policy* is verified by qualified observation/provider API/docs/operator policy, emit a versioned, provenance-checked **capacity-profile revision request** to BSS-V2-005; only BSS-V2-005 authorized catalogue validation and immutable DesiredAdmissionProfile publication may revise the desired ceiling. BSS-V2-006 observes the new active version via durable wakeup, never writes BSS-V2-005 plans directly or promotes repeated 429 guesses into an authoritative new RPM/RPD number.
- **Queued work under a downgrade:** existing fitting work waits for safer runtime capacity; never silently mutate immutable RequestResourceEnvelope, retries or corpus. If the revised qualified *per-request structural cap* is below an already planned semantic batch, reject its eligibility explicitly and delegate **versioned source-authorized batch replan** to the IDSER planner; do not leave permanently unfit work spinning in a queue or truncate its prompt. In-flight attempts retain their original reservation/plan identity, may fail, and are never retroactively rewritten or forcibly retried.
- **Recovery:** release temporary clamp only after its properly evidenced window/reset expiry or separately authorized trusted recovery/probe; limit increases from raw provider observations cannot exceed the active BSS-V2-005 authorized profile. Restart, duplicate/late/out-of-order feedback and stale plan versions must not accidentally lift a clamp, refund spent capacity or double dispatch.

## Additional binary drift oracles (in addition to RC-BSSV2-00603-01..06)

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-BSSV2-00603-07` | A **mid-run limit reduction** through typed lower-limit/remaining/reset feedback clamps exactly the verified affected quota domain/dimension; denied next attempts emit zero network calls. A different domain remains unaffected; ambiguous dimensions trigger conservative hold without fabricated numeric limits. |
| `RC-BSSV2-00603-08` | `429` with and without `Retry-After` survives worker restart, clamps/cools down durable queue state, permits at most bounded explicit reserved probes, and never retries the same reserved transport; valid expiry/probe releases only safe scope. |
| `RC-BSSV2-00603-09` | Qualified permanent lower provider policy enters **BSS-V2-005** as a new authorized version, republishing desired policy and waking BSS-V2-006. Old reservations remain auditable; future admissions obey lower limits. Untyped/untrusted or increased raw observation cannot rewrite active policy. |
| `RC-BSSV2-00603-10` | Stale, malformed, wrong-domain, duplicate or out-of-order pressure/usage signals cannot lift clamps, double-reconcile consumption, transfer another route's unproven quota domain, or leave permanently structurally unfit waiting work retry-spinning; versioned replan is requested from its owner where applicable. |

## Interactive behavior under provider pressure (prospective 2026-10-16)

A runtime clamp/429 may render even the protected interactive reserve temporarily **unavailable**; reserve is a scheduling protection, **not** a guarantee that the provider will answer. Honor the interactive request's bounded admission/execution deadline and propagate a typed unavailable/expired outcome to its consumer without holding an open caller indefinitely or automatically retrying after disconnect. Background attempts can remain durably waiting for a safe window; no penalty-free retry for interactive. A genuinely transmitted/uncertain interactive attempt still participates in normal exact/unknown usage reconciliation. Use the existing generic BSS response contract, not Anoman-specific chatbot handling.

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00603-11` | Inject a mid-conversation 429/limit clamp with pending interactive and background work: interactive either admits under a genuinely safe active quota/deadline or reports bounded unavailable/expired; background waits; no expired/canceled chat attempt is dispatched during probe/wakeup, and unknown transmitted usage is not refunded as zero. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** normalized provider feedback -> bounded reconciliation/clamp; malformed/unattributable feedback fails closed.
- **Sensitive assets:** operational feedback excludes credentials/raw prompts/source/full response.
- **Identity context:** work/attempt, reservation, transport uncertainty, outcome, plan/window, reconcile fence, clamp, fairness epoch, wakeup.
- **Extension seams:** feedback normalization, reconcile fence, unknown-usage accounting, clamp/probe, plan-change wakeup, fairness rebase.
- **Prohibited couplings:** double refund, missing-usage-as-zero, pressure capacity raise, hidden retry, busy retry, in-flight relabel, analytics takeover.
- **Verification seams:** usage replay, unknown-usage cases, restart clamp, bounded probe, plan wakeup/transition, fairness rebase, redaction.
- **Review bindings:** CK verifies exact/unknown usage, pressure handling, explicit-attempt retry, version-safe wakeup/convergence and fairness rebase.

## Workflow evidence

Use deterministic fake-adapter feedback/pressure/restart/replay/plan-transition fixtures; record exact state/counts and `READY_FOR_CK`.
