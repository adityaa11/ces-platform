# IDSER-012-04-06 — Read-only SEM batch reconstruction

- **State:** `approved`; independent CK `PASS` is recorded in `project's goal/feedback/IDSER-BATCH-12-04-06-3eafcd78-verification.md` for reviewed remediation commit `3eafcd78`.
- **Batch:** `IDSER-BATCH-12-04-06`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** `IDSER-012-04-01` and `IDSER-012-04-04` CK `PASS`; established server-owned accepted-document resolver. `IDSER-012-04-05` CK `PASS` is required before family composition closure, but this child does not depend on GHR behavior.

## Outcome

Implement the minimal SEM-facing read-only boundary that proves a persisted v2 handoff reconstructs exactly the packet IDSER planned. **STOP after verified reconstruction; no SEM worker or provider path is activated.**

## Authorized scope

Given an authorized v2 batch reference, resolve its exact handoff and parent, derive authorized document scope, retrieve the original accepted `NormalizedDocument V1` through the established server-owned resolver, resolve exact owned/context selections, invoke the shared `-04-01` builder, recompute the canonical `sourceSpecification` SHA-256, compare it to the persisted hash, and return verified output or fail closed.

Reject foreign/stale/invalid refs, mismatched parent/selection/packet version/profile identity, unavailable accepted source, and hash mismatch. Do not re-run Docling, replace the document, rebuild a different selection, repartition, mutate a plan, access BSS admission, use a provider, write semantic truth, or treat `rel.state = unavailable` as relationship authority.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120406-01` | Authorized persisted v2 handoff and parent resolve to the exact authorized original document and exact owned/context selection. |
| `RC-0120406-02` | Shared builder reconstruction is byte-identical to planned `sourceSpecification` and its SHA-256 matches; mismatch is an integrity failure. |
| `RC-0120406-03` | Foreign/stale/cancelled/missing/mismatched reference, source, selection, parent, or hash fails closed without fallback conversion or repartition. |
| `RC-0120406-04` | Reconstruction is read-only and creates zero GHR delivery, BSS admission/reservation/send, SEM provider call/worker activation, semantic acceptance, reconciliation, Master, or CES effect. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120406-B1` retains Atlas resolver authorization, immutable v2 identity, and SEM’s shared packet builder boundary.
- **Trust / identity:** `SR-0120406-T1` authorized handoff → scoped parent/document resolution → verified packet hash.
- **Prohibited couplings:** `SR-0120406-C1` prohibits direct content-store access, Docling fallback, selection mutation, repartition, or execution activation.
- **Verification / unresolved policy:** `SR-0120406-V1` requires positive replay and mismatch/foreign/stale fail-closed tests; `SR-0120406-U1` preserves unavailable REL/image policy.
- **Review binding:** `SR-0120406-R1` verifies `T1/C1` with authorized-resolution, byte/hash parity, and zero-effect evidence.

## Evidence and hard stop

Record only refs/hashes/version identities and resolver/verification outcomes; do not log source text, image bytes, prompts, or credentials. A missing accepted source is an exact evidence failure, never authority to re-perceive it. CK `PASS` exposes reconstruction proof to `-04-07` only.
