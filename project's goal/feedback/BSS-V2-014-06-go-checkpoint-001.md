# BSS-V2-014-06 — GO checkpoint 001

- **Ticket:** [BSS-V2-014-06 parent release/activation closure](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md)
- **GO authority:** explicit `GO AUTHORIZED — BSS-V2-014-06`, after independent replacement-freeze CK PASS at `c04272f4995c86f80fb600ae426267594726e3b2`.
- **Governing replacement contract:** [replacement contract freeze 001](BSS-V2-014-06-go-dependency-replacement-contract-freeze-001.md).
- **State:** `awaiting_review`.
- **Scope implemented:** `RRC-01406-01.a`, `RRC-01406-01.b`, `RRC-01406-02.a`, `RRC-01406-02.b`, and `RRC-01406-02.d` only.

## Bounded implementation

`0106_bssv201406_candidate_active_authenticated_snapshot` preserves the sole
authenticated reader and makes its v2 selection deterministic:

- without an active v2 pointer, it returns the newest immutable candidate with
  `productionActive:false` and `isolated:true`;
- with a v2 pointer, it reads only the pointer's exact profile plus its exact
  immutable candidate and activation row, returning the active epoch revision;
- an active pointer without that exact activation row is a typed stale stop;
  a newer inactive candidate never replaces an active profile.

The migration does not change `bridge.activate_desired_admission_profile(...)`.
That existing successor guard continues to reject the v2 successor. The IDSER
v2 consumer accepts a server-authenticated active view only when its activation
provenance is exact; candidate views reject an injected activation revision.

No IDSER trigger, scheduler, GHR continuation, alternate reader, direct BSS
SQL consumer, v1 path, admission/reservation/job flow, SEM/provider flow, or
activation authority was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation command | Status |
| --- | --- | --- | --- | --- |
| `RRC-01406-01.a` | Replacement freeze §Replacement Review Contract | One approved v2-only IDSER composition uses the authenticated reader with exact identity/revision/fingerprint/sizing and no effects. | `pnpm --filter @atlas/agents-bridge exec jiti tests/idser-capacity-planning-snapshot-v2.test.ts` — 7/7 pass; `pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts` — 2/2 pass. | `PROVEN` |
| `RRC-01406-01.b` | Replacement freeze §Replacement Review Contract | No new planner trigger, scheduler, GHR proxy, or downstream effect; future GHR initiation stays inactive. | `pnpm --filter @atlas/agents-bridge test:ghr-01b` — 3/3 pass; `pnpm --filter @atlas/agents-bridge test:ghr-03a` — 4/4 pass. Static v2 inventory remains one composition with no fallback. | `PROVEN` |
| `RRC-01406-02.a` | Replacement freeze §Replacement Review Contract | Same reader returns exact candidate before v2 activation or exact active pointer/profile/epoch afterwards; stale/foreign/revision/fingerprint defects fail closed; no numeric fallback. | `pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts` — 2/2 pass. Rollback-only existing-epoch fixture proves the active pointer wins over a newer candidate and missing activation-row linkage is `active_profile_binding_missing`; composition consumes that active view. | `PROVEN` |
| `RRC-01406-02.b` | Replacement freeze §Replacement Review Contract | Missing/self-asserted evidence leaves the existing epoch guard and active pointer unchanged. | Same calculated-v2 integration command — pass. It invokes the existing function only for the rejected successor attempt and observes the pre-existing active pointer unchanged. No positive activation invocation occurs. | `PROVEN` |
| `RRC-01406-02.c` | Replacement freeze §Replacement Review Contract | `RELEASE_ATTESTATION_AUTHORITY_GAP` remains a positive production activation boundary. | Existing guard is retained and negative-only evidence above passes. No release record, attestation authority, positive activation test, or production-active operation was created. | `BLOCKED_AUTHORITY` (out of GO/CK implementation scope) |
| `RRC-01406-02.d` | Replacement freeze §Replacement Review Contract | Preserve GHR `can_continue:false` / `parsed_only`, no v1/dual-read inventory, and zero downstream effects. | GHR commands above pass; calculated-v2 integration asserts zero attempts/reservations/window mutations/jobs/transports; `pnpm --filter @atlas/db test:permissions` — 1/1 pass. | `PROVEN` |

## Validation record

| Command | Result |
| --- | --- |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/idser-capacity-planning-snapshot-v2.test.ts` | PASS, 7 tests |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts` | PASS, 2 tests |
| `pnpm --filter @atlas/agents-bridge test:ghr-01b` | PASS, 3 tests |
| `pnpm --filter @atlas/agents-bridge test:ghr-03a` | PASS, 4 tests |
| `pnpm --filter @atlas/db test:permissions` | PASS, 1 test |
| `pnpm --filter @atlas/db migration:check` | PASS |
| `git diff --check` | PASS |

## Handoff

The implementation is ready for an independent implementation CK of the
replacement rows only. This checkpoint is not a CK `PASS` and does not
authorize production activation.

Internal readiness: READY_FOR_CK
