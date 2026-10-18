# BSS-V2-006-05-05 — Policy-revision operational recovery

- **State:** `approved` following CK `PASS` for reviewed commit `6b47d84`; **Review batch:** `BSS-V2-BATCH-06-05-05`.
- **Parent:** [BSS-V2-006-05 split map](BSS-V2-006-05-policy-driven-optional-capacity-dimensions-anoman.md).
- **Dependencies:** parent predecessors and `BSS-V2-006-05-04` CK `PASS`.

## Outcome

BSS-V2-006 converges waiting work under current authorized policy while retaining original immutable plan and physical-usage liability for reserved or possibly-sent work. An ambiguous 429 with RPD non-enforced still follows the existing scoped conservative cooldown/probe/recovery path and never invents a daily quota, reset or BSS-V2-005 publication.

## Authorized scope

Adapt only revalidation, wakeup/restart/replay, attempt/reservation/claim/transport accounting and feedback tests required by policy revision/removal. Each actual retry has one fresh reservation; cancellation, ack loss and concurrent workers remain exactly deduplicated. Do not revise historical work, auto-publish policy, add another recovery path, direct transport, provider poller or capacity truth write.

## Review contract

Discharge `RC-00605-05` with at-least-once wakeup/restart, retry, cancellation, ack loss and concurrent-worker evidence: stale/removed policy blocks new sends while old liabilities persist. Discharge `RC-00605-06` with ambiguous 429 showing scoped conservative pressure/cooldown/recovery and no fictitious daily quota or automatic plan publication.

## SecurityReadiness

- `SR-0505-T1`: policy revision crosses waiting-work revalidation while historical reservations retain prior liability.
- `SR-0505-C1`: prohibit retroactive relabeling, policy publication from feedback and duplicate/direct sends during replay.
- `SR-0505-R1`: CK verifies exact durable counters across restart/replay and scope-limited 429 recovery with a claimed-transport stub.

## Hard stop

If the old-liability boundary or existing 429 recovery ownership cannot be preserved, stop `BLOCKED_AUTHORITY`; do not use a global hold or speculative RPD ceiling.
