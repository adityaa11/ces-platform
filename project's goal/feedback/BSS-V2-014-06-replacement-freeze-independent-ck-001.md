# BSS-V2-014-06 — Independent replacement-freeze CK review 001

- **Review target:** `BSS-V2-014-06-go-dependency-replacement-contract-freeze-001.md`, together with the GO-dependency planning amendment 001, HMN 001, amended ticket, and parent.
- **Reviewed repository:** `adityaa11/ces-platform`, `codex/new-atlas-backend`.
- **Frozen source SHA:** `b36bbb64a614066849f315b60a5bba81a5b3bdf3`.
- **Review date:** 2026-10-24.
- **Review type:** independent **planning/contract-freeze CK**; not GO implementation CK, not an activation/attestation approval.
- **Verdict:** **PASS — replacement freeze eligible for a separately authorized bounded GO.**

## Source-grounded review

The replacement freeze explicitly supersedes the mistaken requirement to have a live, non-GHR IDSER planning entrypoint before BSS parent implementation. The already approved v2-only IDSER consumer composition, using the existing authenticated BSS read seam, is accepted as candidate-read readiness; it may remain non-executing. No live IDSER planning or GHR continuation is claimed.

The replacement also separates **release-capable BSS implementation** from the currently missing, independently authorized **positive production activation**. The existing `bridge.activate_desired_admission_profile(...)` successor fence remains fail-closed. The `RELEASE_ATTESTATION_AUTHORITY_GAP` is correctly `BLOCKED_AUTHORITY` for positive activation, and must not be passed with caller-supplied flags, fake hashes, fixtures, or an alternate activation path.

Inspected code confirms the scope boundary currently being corrected:
- `apps/agents-bridge/src/main.ts` creates the v2 consumer but ends with `void idserCapacityPlanningSnapshotV2Consumer`; production planning is **not** executing.
- `apps/agents-bridge/src/idser-capacity-planning-snapshot-v2-composition.ts` selects exactly one server-bound, non-prospective v2 principal.
- `apps/agents-bridge/src/capacity-planning-snapshot.ts` has one authenticated reader; the present v2 SQL projection in migration `0097` qualifies a candidate with `productionActive:false`. The replacement contract owns the in-place candidate/active projection changes.
- Migration `0091` retains the successor activation guard.
- `apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts` remains `canContinue:false`.

## Replacement clause assessment

| Clause | Planning review | Boundary / required future implementation evidence |
| --- | --- | --- |
| `RRC-01406-01.a` | PASS | One approved authenticated v2 consumer, exact read identity/revision/fingerprint/sizing and zero effects; do not describe an inert consumer as live planning. |
| `RRC-01406-01.b` | PASS | No invented non-GHR trigger, scheduler, GHR proxy or alternate path. |
| `RRC-01406-02.a` | PASS | Same authenticated endpoint must resolve exact pinned candidate versus exact active pointer, reject latest-candidate-as-active and foreign/stale revisions; an isolated projection fixture is **not** evidence of authorized positive activation. |
| `RRC-01406-02.b` | PASS | Missing/self-asserted attestation leaves existing epoch guard, activation row and active pointer unchanged. |
| `RRC-01406-02.c` | PASS as **explicit blocked boundary**, not as activated behavior | Positive release attestation, successor activation, and live `productionActive:true` operation remain `BLOCKED_AUTHORITY` until separately approved. No positive activation test may masquerade as an authorized release. |
| `RRC-01406-02.d` | PASS | Preserve GHR `can_continue:false` / `parsed_only` and zero BSS admission, reservation, job, SEM/provider/downstream effects; preserve no-v1/dual-read inventory. |

## Applicability and disposition

The original parent/child prose remains in history; where contradicted, the approved HMN, planning amendment, and replacement freeze control the implementation scope. Preserve all unaffected child CK PASS evidence and existing ownership boundaries.

**GO eligibility:** independent replacement-freeze review gate **satisfied**. A separately explicit GO may now implement only `RRC-01406-01.a`, `01.b`, `02.a`, `02.b`, and `02.d`. `02.c` must remain reported as `BLOCKED_AUTHORITY`.

**Not authorized by this review:** positive release-record issuance or promotion, environment-specific activation, bypass/removal of the successor fence, new IDSER planning handler/scheduler, GHR continuation, NDV1 redemption, Better Auth, SEM or provider execution. No code implementation, migration execution, automated tests, or environment activation were carried out during this contract-only review.

**Next checkpoint:** implementation GO checkpoint followed by independent **implementation** CK against the replacement clauses. Review this exact source SHA and this review artifact before GO; use a separate authorization for any future positive production activation.
