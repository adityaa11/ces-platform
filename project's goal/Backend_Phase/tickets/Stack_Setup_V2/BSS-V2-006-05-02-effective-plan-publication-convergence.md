# BSS-V2-006-05-02 — Effective-plan publication convergence

- **State:** `awaiting_review`; executable leaf, not GO/CFC/HMN authority or CK PASS.
- **Review batch:** `BSS-V2-BATCH-06-05-02`.
- **Parent:** [BSS-V2-006-05 split map](BSS-V2-006-05-policy-driven-optional-capacity-dimensions-anoman.md).
- **Dependencies:** parent predecessors and `BSS-V2-006-05-01` CK `PASS`; consume its effective policy only.

## Outcome

BSS-V2-005 deterministically derives eligible background/interactive capacity and protection from enforced, known dimensions only, then publishes/activates a new immutable `DesiredAdmissionProfile` through the already-approved version/revision fence and durable wakeup seam when the effective policy changes. No omitted RPD becomes a numeric capacity, daily refill, or fairness denominator.

## Authorized scope

Adapt only BSS-V2-005 planning/publication representations needed to carry provider state plus enforcement decision, plan/profile-policy bindings and eligible-dimension math. An identical effective input is a no-op; a changed/revoked/stale policy yields the prescribed new version or blocks future work. Reuse the approved wakeup mechanism; do not add a planner, broker, activation authority, consumer runtime, or direct Bridge-table read.

## Review contract

`RC-00605-02` is discharged only by canonically repeatable effective policy, nonfabricated resource bounds and a versioned `DesiredAdmissionProfile` preserving RPM/TPM/concurrency ceilings and hard interactive protection. Known RPD, known zero, wrong domain, unknown mandatory limit and unqualified reset block. Demonstrate authorized effective-mask changes create one durable existing wakeup, identical inputs create no publication/revision/wakeup, and old immutable versions stay historical.

## SecurityReadiness

- `SR-0502-T1`: policy-to-plan publication is an authority transition; activation revision is the replay/convergence boundary.
- `SR-0502-C1`: prohibit transient usage/cooldown as plan input, plan mutation, direct runtime authority and alternate wakeup/broker paths.
- `SR-0502-R1`: CK verifies deterministic inputs, atomic per-domain activation, no-op replay, stale/revoked block, and preserved old-plan identity through the actual durable wakeup.

## Hard stop

If planner ownership, compatible public-plan evolution, effective-dimension math, or activation fencing cannot be frozen, stop `BLOCKED_AUTHORITY` rather than publishing a partial or optimistic plan.
