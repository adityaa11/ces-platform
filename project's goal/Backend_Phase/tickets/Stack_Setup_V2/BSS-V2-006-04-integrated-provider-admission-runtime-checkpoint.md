# BSS-V2-006-04: Integrated durable provider-admission runtime checkpoint

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-04`
- **Dependencies:** BSS-V2-006-01/02, BSS-V2-005-05, and an independently qualified successor newly planned after withdrawn BSS-V2-006-03 must each have CK `PASS`. BSS-V2-006-01/02 qualify against existing approved BSS-V2-005-04 so this integrated consumer gate does **not** create a dependency cycle.
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21

## Outcome

Prove one reusable external-provider admission authority before semantic extraction becomes a client.

## Required deterministic scenario

Use one shared synthetic quota domain with hard interactive work, request-heavy/token-heavy background lanes, multiple fairness keys, explicit RPM/TPM/RPD/concurrency window policies and a single-attempt fake transport. Exercise saturation, borrowing, a late lane, interactive arrival, plan increase/decrease, weight-change rebase, actual under/over usage, unknown usage after possible transport, 429/Retry-After, restart, ack loss and deduplicated wakeup. **Also inject provider-limit drift while work is queued/in-flight:** credible dimension-specific RPM/TPM/RPD downgrade, ambiguous 429 without rate headers, stale/wrong-domain feedback, changed structural per-request maximum, observed recovery, and a trusted persistent downgrade leading to BSS-V2-005 profile-version publication. Assert exact future-call counts and isolated quota-domain effects rather than only checking a status string.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00604-01 | Every fake outbound transport has one prior durable reservation + explicit attempt. | PASS iff denied work has zero transport and no reservation authorizes two outbound attempts. |
| RC-BSSV2-00604-02 | Background cannot block protected interactive work and fairness is work-conserving/debt-free. | PASS iff reserve survives saturation and a late lane does not monopolize because another borrowed idle capacity earlier. |
| RC-BSSV2-00604-03 | Quota windows, exact/unknown usage, restart/replay/ack-loss preserve once-only capacity effects. | PASS iff no double-spend/refund, optimistic unknown-usage release, duplicate job or stale release occurs. |
| RC-BSSV2-00604-04 | Plan/provider-pressure changes alter future admissions dynamically. | PASS iff activation itself wakes sleeping backlog, vN -> vN+1 changes admissions without preemption, weight change rebases fairness and clamp survives restart. |
| RC-BSSV2-00604-05 | Runtime observations never exceed active plan and analytics stay BSS-V2-007-owned. | PASS iff higher observed limits cannot raise capacity and only operational-minimum metadata is persisted. |
| RC-BSSV2-00604-06 | Local Docling and Atlas trusted state remain outside this authority. | PASS iff no local perception route needs quota metadata and Bridge roles cannot mutate Atlas truth. |

## Additional integration closure (prospective 2026-10-16)

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-07` | A vendor unexpectedly lowers a verified dimension during execution: BSS-V2-006 immediately persists the lower effective clamp and future admission obeys it; 429 without usable metadata leads to bounded conservative hold and one-reservation-per-probe, with another domain unaffected. |
| `RC-BSSV2-00604-08` | Proven persistent lower provider ceiling versions through BSS-V2-005 and changes desired plan with a deduplicated wakeup; stale/conflicting higher observations cannot increase policy. Waiting old requests that remain within the new structural envelope resume by fair admission, while oversized batch corpus is explicitly invalidated for a versioned planner replan; none silently truncate or spin forever. |

## Prospective service-class / user-waited closure (2026-10-16)

Existing `RC-BSSV2-00604-02` already verifies hard interactive protection; do not open a second scheduler or demand a vendor-specific chatbot route. Add **end-to-end fake transport / isolated PostgreSQL** proof of the *interactive request lifecycle* alongside established background admission, including queue saturation, independent RPM/TPM/RPD/concurrency headroom, caller deadline/cancellation, provider clamp, plan change, restart and late ack. Preserve pg-boss as sole broker, one reservation per attempt, and consumer-owned HTTP/streaming UX; tests must not claim a guaranteed user-response SLA from an exhausted provider.

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-09` | Authorized interactive work (representing synchronous chatbot usage) is never blocked behind a saturated background fairness queue when protected capacity actually fits; if provider quota/concurrency/clamp makes it unfit, a bounded non-success/expiry outcome occurs without a late outbound call. Concurrent background admission still respects reserve and fairness. |
| `RC-BSSV2-00604-10` | Caller cancellation, timeout, restart, late delivery and mid-run 429 cannot resurrect an expired interactive work item, double-dispatch a reserved attempt, prematurely refund possibly transmitted usage or strand its consumer indefinitely; fake provider counters and persisted state prove each path. |

## Consumer-facing Hard Stop B — reusable runtime capacity/read and provider work/admission service (planned)

BSS-V2-006-04 must independently prove a versioned **`RuntimeCapacityConstraint/v1`** read-only interface *and* a separate **`ProviderWorkAdmission/v1`** operational interface. These names are prospective contract labels rather than claims of existing TS exports. [Full consumer interface matrix and execution ordering](../../bss-provider-consumer-contract-checkpoint-20261016.md).

- **Read** validates server-authorized process/route/quota-domain, active desired plan and effective constraint revisions, exact structural versus transient pressure status, safe scoped cooldown/window/clamp and interactive/background eligibility. No reservation, no quota counter mutation and no guarantee that a subsequent call will be admitted. Unknown/stale/unavailable state fails conservatively, never a fictitious positive current "available token" budget. A planning-only consumer can inspect without acquiring provider capacity.
- **Execute** exposes idempotent logical-work registration and explicit attempt identity, validated RequestResourceEnvelope and immutable consumer payload **references/hashes** (never source/secret bytes), waiting/reserved/dispatched/may-have-started/terminal/pressure-limited/expired outcomes, and provider-neutral feedback/error/usage reconciliation. One BSS-owned atomic reservation+pg-boss dispatch authorizes at most one outbound transport per attempt; consumer code must not dispatch from a read-only budget or reuse a permit.
- **Failure** `429` or trusted lower limit/Retry-After creates BSS-V2-006 conservative durable clamp/wait/probe; any retry requires new admitted attempt, not provider SDK recursion. Permanent profile downgrade converges to BSS-V2-005 authorized plan. Semantic parse/meaning failure remains consumer-owned and never automatically translates into BSS capacity failure or model switching. Expiry/cancellation protect interactive calls; background remains durable.
- **Isolation:** at least two independent fake consumers (background semantic-like and interactive chat-like) must use the **same** generic consumer contracts, separate service-class credentials and actual isolated Bridge PostgreSQL/pg-boss with non-inert exact reservation/transport counters; no SEM extraction, chatbot UI or CES business logic inside the BSS checkpoint.

| ID | PASS iff / failing negative |
| --- | --- |
| `RC-BSSV2-00604-11` | A genuine *external* read-only planning fixture reads BSS-005 policy and BSS-006 effective constraint versions/eligibility without changing quota counters, creating attempt, reservation, pg-boss job or transport. Stale/foreign/unknown/cooldown snapshots fail conservatively; a read never authorizes sending. |
| `RC-BSSV2-00604-12` | Independent semantic-like **background** and chat-like **interactive** fake consumers both register work and process typed outcomes through the same process-neutral BSS runtime API; actual positive send requires one durable matching reservation/attempt and no direct adapter bypass. Hard reserve, protected latency/deadline and other quota domains remain isolated. |
| `RC-BSSV2-00604-13` | A consumer receives 429 (both with reliable Retry-After and without), or timeout/possible-send unknown usage: BSS persists scoped pressure and exact consumption across restart, delivers **waiting/pressure/terminal** operational outcome, and any retry is a new budgeted reserved attempt. Unrelated semantic malformed-output failure does not trigger a BSS rate retry. |
| `RC-BSSV2-00604-14` | Read→admit TOCTOU, active-plan decrease, stale envelope/payload hash, cancellation, duplicate delivery and lost ack do not result in unreserved/late/double transport or implicit corpus truncation; structurally unfit work is rejected for versioned consumer replan and in-flight old reservation remains auditable. |

## Hard stop

After independent CK PASS of **all** generic consumer contract oracles, BSS-V2-006 becomes shared admission infrastructure providing read-only effective constraints and durable attempt/feedback operations. **No** SEM-CUTOVER algorithm, actual chatbot response, reconciliation, CES, Atlas truth or provider production approval is implied. Without qualifying both interfaces, do not claim a reusable consumer-ready hard stop.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** secret-free waiting -> reservation -> one fake transport -> exactly-once feedback reconciliation.
- **Identity context:** logical work/attempt, lane/key, quota domain/window, active plan/fairness epoch, envelope, reservation, job, outcome, wakeup.
- **Prohibited couplings:** consumer-local limiter, bypass, hidden retry, sensitive evidence, Docling quota, Atlas truth.
- **Verification seams:** transport gate, protection/debt-free fairness, windows/unknown usage, restart/replay, plan-pressure convergence, role exclusion.
- **Review bindings:** CK verifies the complete deterministic scenario.

## Workflow evidence

Close all rows in one harness with exact commands/counts/redacted observations; `READY_FOR_CK`; stop.
