# GHR-02B CK verification

- **Ticket:** `GHR-02B` — Atomic NDV1 acceptance integration and pointer-only pg-boss publication
- **Ticket state:** `awaiting_review`
- **Reviewed implementation commit:** `dde68c561b0c2e189f8543ad6d9adeed3644045b`
- **Documentation checkpoint:** `b4279a1883c72988d21dd06baf54a538a66973e5`
- **Replacement contract:** [GHR-02B-b4279a18-replacement-contract-freeze.md](GHR-02B-b4279a18-replacement-contract-freeze.md)
- **Evidence correction:** [GHR-02B-b4279a18-replacement-contract-freeze-correction-001.md](GHR-02B-b4279a18-replacement-contract-freeze-correction-001.md)
- **Historical CK:** [GHR-02B-dde68c56-review.md](GHR-02B-dde68c56-review.md), preserved as historical `CHANGES_REQUIRED`
- **Result:** `PASS`

## Verification scope

This is the bounded CK verification of the amended effective contract. It
does not reopen historical `CK-001.a`, which remains preserved as an
historical finding. It verifies the frozen replacement clause `RCK-001.a`,
the protected non-superseded rows `GHR-02B-RC-02` through
`GHR-02B-RC-05`, and direct regressions in the reviewed implementation.

## RCK-001.a verification

The canonical Compose project `atlas-canonical-perception` was inspected
read-only through its running PostgreSQL container
`atlas-canonical-perception-postgres-1`. The authorized fresh run recorded
by GO was present with:

- execution `9af1bf28-55cb-4ee1-825d-990ce127bdd8` in `completed`;
- bundle member state `perceived`;
- exactly one immutable intent;
- exactly one `atlas-generic-handoff-v1` job in `created` state;
- exact job data
  `{"type":"GenericHandoffJob/v1","handoffId":"ghr-handoff-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f"}`;
- singleton key
  `ghr-ndv1-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f`,
  matching the intent idempotency key;
- zero semantic executions and zero semantic candidates; and
- no `bridge.generic_handoff_delivery` relation.

The protected-clone PostgreSQL integration result recorded in the GO
checkpoint proves the remaining transaction-only oracle: injected publication
failure rolls back accepted state and intent, and leaves no dangling pointer
job. The clone identity is `atlas-ghr02b-qualification-postgres`,
database `atlas_ghr02b`, host port `15434`.

Therefore the replacement oracle passes: the canonical normal path proves
fresh accepted-state-to-intent/job publication, and the protected clone proves
atomic rollback.

## Non-superseded rows and direct regression

Historical GO/CK evidence remains valid and was not invalidated by the
documentation-only amendment:

- RC-02: live Perception facts remain the sole GHR-02A contract.
- RC-03: replay/restart preserves one immutable intent and singleton job.
- RC-04: queue metadata remains pointer-only with no consumer or Bridge-owned
  delivery state.
- RC-05: receiver, ACK, resolver, planner, BSS, SEM, provider,
  reconciliation, and projection effects remain zero.

Executed checks:

- `pnpm --filter @atlas/db test:ghr-02b-boundary` — PASS.
- `pnpm --filter @atlas/db test:ghr-02a-boundary` — PASS.
- `pnpm --filter @atlas/db typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `git diff --check dde68c56^ dde68c56` — PASS.
- Canonical Docker PostgreSQL read-only evidence inspection — PASS.

No production code, canonical database, or canonical volume was mutated by
this verification. No direct remediation regression was found.

## Decision

`PASS`. All active ticket-derived obligations and the frozen replacement
oracle are proven. Historical `CK-001.a` remains visible as historical
workflow history; it is not silently rewritten or renumbered.
