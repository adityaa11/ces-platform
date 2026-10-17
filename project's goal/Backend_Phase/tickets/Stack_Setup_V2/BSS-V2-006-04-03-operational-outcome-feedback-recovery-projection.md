# BSS-V2-006-04-03 — Operational outcome and feedback recovery projection

- **State:** `approved`
- **Review batch:** `BSS-V2-BATCH-06-04-03`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** `BSS-V2-006-04-02` CK `PASS` and parent family dependencies.

## Outcome

Project existing 03A feedback/accounting/pressure/recovery behavior into replayable, bounded external operational outcomes for the admitted background reference consumer.

## Authorized scope

Map normalized provider feedback, trusted usage, possible-start/unknown usage, 429 with and without usable Retry-After, timeout, ack loss, restart and explicit new-attempt retry into the admission API’s durable state/outcome. Reuse 03A’s ledger, clamp/cooldown/probe and recovery behavior exactly; do not reimplement it. A malformed semantic-like output is returned as consumer-owned qualification failure and never creates BSS pressure or a BSS retry.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-03` | Exact/unknown usage, restart, replay and ack loss preserve once-only capacity effects; no double spend/refund, optimistic unknown-usage release, duplicate job or stale release occurs. |
| `RC-BSSV2-00604-13` | 429 with reliable Retry-After and without metadata, timeout and possible-send unknown usage persist scoped pressure and exact consumption across restart, return typed waiting/pressure/terminal outcome, and require a new budgeted reserved attempt for retry. Consumer malformed-output failure does not trigger BSS rate retry. |
| `RC-BSSV2-00604-14b` | Duplicate delivery, lost ack and post-dispatch cancellation/replay do not cause unreserved, late or double transport; in-flight reservation remains auditable. |

## Required evidence

Use real isolated Bridge PostgreSQL/pg-boss, a single-attempt fake transport and restart/crash injection through ordinary infrastructure ports. For every case record reservation, claim, send, usage, pressure and outcome rows. Demonstrate unknown usage remains conservative and that a retry has a distinct attempt/reservation identity.

## Security Readiness

`SR-0403-T1`: untrusted provider feedback to durable capacity effects. `SR-0403-C1`: prohibit feedback-driven semantic interpretation, fabricated completion and recursive retries. `SR-0403-R1`: CK verifies redacted typed feedback and once-only recovery counters across restart.
