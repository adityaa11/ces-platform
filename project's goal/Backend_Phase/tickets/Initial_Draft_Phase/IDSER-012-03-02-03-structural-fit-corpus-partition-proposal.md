# IDSER-012-03-02-03 — Structural-fit corpus partition proposal

- **State:** `planned`; GO requires IDSER-012-03-02-01 and IDSER-012-03-02-02 CK `PASS`.
- **Batch:** `IDSER-BATCH-12-03-02-03`.
- **Parent:** [IDSER-012-03-02 split map](IDSER-012-03-02-bss-effective-capacity-corpus-partition.md).
- **Dependencies:** `-03-02-01` and `-03-02-02` CK `PASS`; their approved source/resolver, BSS-reader and estimator interfaces.

## Outcome

Compose the approved read and estimator surfaces into an immutable, deterministic, unpublished semantic corpus plan proposal. This is the only `-03-02` family closure. **STOP before any durable `PlannedSemanticCorpusHandoff`, BSS write/attempt/reservation, GHR issue/delivery, SEM intake, or provider send.**

## Authorized scope

For each run, call the approved BSS prospective reader and use its pinned structural maximum, enforcement policy, route/profile/estimator identity and safety/headroom. Supply candidate `requestBytes` and `inputTokens` to that same read surface where it exposes authoritative structural fit. Reuse the approved estimator; do not recreate its accounting or BSS capacity logic.

Produce stable ordered N-batch ownership where every eligible locator is owned exactly once. Context-only units can repeat with zero ownership; preserve source language, modality, legend/scope, accepted REL direction/necessity, media grants and explicit deferred/unexamined state. Retry deterministic smaller structural candidates on BSS `unfit`; indivisible or fidelity-breaking units return a typed block. Transient pressure/current quota is not an input. A trustworthy structural, source/media, policy or estimator change produces a new immutable replan predecessor or BLOCKED result; no old proposal mutates. Preserve independent enforced RPM/TPM/concurrency and an authorized not-enforced unknown RPD without a fabricated daily number.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030203-01 | Real `-02-01` BSS reads and real `-02-02` demand values yield a proposal only under one consistent authorized source/enforcement/profile/estimator/structural revision set; missing, foreign, stale, unsupported, unknown-mandatory or known-zero state blocks. |
| RC-012030203-02 | Anoman-like enforced RPM/TPM/concurrency with qualified unknown/not-enforced RPD preserves every envelope demand, while known RPD and shared-domain protections still constrain structural fit. |
| RC-012030203-03 | Deterministic full once-only owned coverage, bounded context-only repeats, tables, visuals, media, REL and deferred fidelity conditions are either preserved or explicitly blocked. |
| RC-012030203-04 | Each result binds real structural maxima and conservative request demand including prompt/schema/input/output/media/REL overhead and headroom; it never uses pages or transient remaining quota. |
| RC-012030203-05 | Transient pressure retains partition; structural/source/media/policy/estimator changes create a new versioned replan or BLOCKED result without mutation or truncation. |
| RC-012030203-06 | Positive proposals and every failure create zero BSS writes/attempts/reservations/provider sends, GHR delivery, durable plan/handoff, SEM call, or Atlas semantic/reconciliation effects. |

## Security Readiness

- `SR-012030203-T1`: pinned BSS structural policy + conservative demand → unpublished partition proposal.
- `SR-012030203-C1`: prohibit second BSS planner, runtime-window/quota read, profile mutation, hidden source reconstruction and downstream dispatch.
- `SR-012030203-R1`: CK verifies repeatability, stale fencing, full coverage and non-inert real read; `SR-012030203-R2` verifies exact zero forbidden effects.

## Evidence and hard stop

Store proposal identities/hashes, source and policy revisions, estimator fixtures, fit/retry/block traces and coverage proof. `NO_ELIGIBLE_SOURCE` remains zero records. A CK `PASS` permits only the Atlas persistence child `-03-03-01`; it is never a BSS send permit.
