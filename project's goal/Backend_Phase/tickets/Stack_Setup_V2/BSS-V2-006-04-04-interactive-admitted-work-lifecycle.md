# BSS-V2-006-04-04 — Interactive admitted-work lifecycle

- **State:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-04-04`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** `BSS-V2-006-04-03` CK `PASS` and parent family dependencies.

## Outcome

Qualify a second, independently implemented interactive-like fake consumer through the same operational admission surface, with server-selected service class, deadline and cancellation semantics.

## Authorized scope

Compose the approved hard interactive reserve with `ProviderWorkAdmission/v1`; do not create a chat route, chatbot UX, HTTP/streaming behavior, second scheduler, or privileged sender. The consumer may await typed operational state but owns user-facing behavior. Background remains durable; protected reserve is non-lendable and is not a response-SLA guarantee.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-09` | Authorized interactive work is not blocked behind saturated background when protected capacity fits; if quota/concurrency/clamp makes it unfit, it receives bounded non-success/expiry and no late outbound call. Background retains reserve/fairness constraints. |
| `RC-BSSV2-00604-10` | Caller cancellation, timeout, restart, late delivery and mid-run 429 cannot resurrect expired interactive work, double-dispatch a reservation, prematurely refund possibly transmitted usage, or strand its consumer indefinitely. |
| `RC-BSSV2-00604-12b` | The independent chat-like interactive fixture uses exactly the same generic API and claimed-send path as the background fixture; server authorization prevents class elevation and other quota domains remain isolated. |

## Required evidence

With real PostgreSQL/pg-boss, saturate background work then introduce fitting and unfit interactive work. Cover deadline, cancellation before/after claim, restart, late ack and 429. Assert exact reservations/jobs/claims/sends/outcomes and zero late sends; fake transport is the only substituted provider component.

## Security Readiness

`SR-0404-T1`: authenticated interactive caller/deadline to BSS admission. `SR-0404-C1`: prohibit caller-controlled service-class elevation and deadline resurrection. `SR-0404-R1`: CK verifies durable deadline/fence counters and protected-capacity isolation.
