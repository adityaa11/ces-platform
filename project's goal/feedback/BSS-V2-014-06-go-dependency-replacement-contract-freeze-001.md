# BSS-V2-014-06 GO-dependency replacement contract freeze 001

- **Ticket:** [BSS-V2-014-06](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-06-parent-release-activation-closure.md)
- **Historical freeze:** [BSS-V2-014-06 parent-release closure contract freeze 001](BSS-V2-014-06-parent-release-closure-contract-freeze-001.md), preserved unchanged.
- **Planning amendment:** [GO-dependency planning amendment 001](BSS-V2-014-06-go-dependency-planning-amendment-001.md).
- **HMN record:** [HMN-BSS-V2-014-06-001](BSS-V2-014-06-hmn-001.md).
- **State:** replacement contract frozen for independent review; not GO-authorized, not an activation approval, and not production-active.

## Replacement applicability

Historical `FRZ-01406-01` and `RC-01406-01` incorrectly required an IDSER production trigger that is neither needed for, nor owned by, BSS parent release implementation. Historical `FRZ-01406-02` and the positive activation portions of `RC-01406-03..05` incorrectly made an unavailable production attestation authority a BSS implementation blocker. The amendment supersedes only those dependency and positive-activation portions. All candidate/active identity, reader, epoch, revision/fingerprint, zero-effect, and GHR requirements remain active.

## Replacement Review Contract

| Replacement clause | Historical mapping | Required observable state | Required proof / forbidden substitute |
| --- | --- | --- | --- |
| `RRC-01406-01.a` | `FRZ-01406-01`, `RC-01406-01` | Exactly one approved v2-only IDSER-to-BSS composition uses the existing authenticated reader and accepts only the pinned qualified candidate. It is valid readiness evidence even when no live IDSER planning trigger exists. | Composition/credential/import inventory plus actual-reader identity, revision, fingerprint, sizing, and zero-effect evidence. No claim that the composition executes live planning; no GHR proxy, scheduler, test fake, v1 path, adapter, or direct BSS SQL. |
| `RRC-01406-01.b` | `FRZ-01406-01` no-invocation conclusion | Absence of a live IDSER planner trigger creates no BSS implementation failure and no downstream effect. Future GHR-to-IDSER initiation remains inactive and separately owned. | Static caller inventory and GHR boundary regression. No new IDSER entrypoint, scheduler, GHR continuation, SEM work, or provider send. |
| `RRC-01406-02.a` | `FRZ-01406-02`, `RC-01406-02`, active-read portion of `RC-01406-04` | The same authenticated endpoint/reader distinguishes an exact isolated immutable candidate (`productionActive:false`) from an exact profile/revision that is active after an authorized epoch (`productionActive:true`). Active resolution is through `active_desired_admission_profile`, never a latest candidate. | Server-bound candidate/active-view fixture with stale/foreign/revision/fingerprint negatives and no numeric fallback. No second endpoint, reader, client-selected profile, or v1 adapter. |
| `RRC-01406-02.b` | `RC-01406-03` negative gate portion | Without independently verified release authority, `bridge.activate_desired_admission_profile(...)` rejects the v2 successor. Missing, stale, foreign, or self-asserted evidence cannot change the activation row or active pointer. | Existing-epoch negative activation fixture under its normal lock plus unchanged-pointer/zero-effect assertions. No new activation epoch, permissive flag, or caller-supplied approval. |
| `RRC-01406-02.c` | `RC-01406-03..05` positive record/activation portions | `RELEASE_ATTESTATION_AUTHORITY_GAP` is explicitly `BLOCKED_AUTHORITY` for environment-specific positive activation. It is not a BSS implementation GO/CK prerequisite and cannot be passed by a fixture, hash, or manifest prepared by the caller. | Durable ownership-gap report and unchanged fail-closed guard. A later independently authorized release-attestation contract is required before a positive activation test or production operation. |
| `RRC-01406-02.d` | `RC-01406-06` | Readiness and negative-gate validation create zero legacy consumer bindings and zero BSS admission/reservation/window/job/transport, GHR continuation/delivery, NDV1 redemption, Better Auth interaction, SEM execution, provider send, reconciliation, projection, or semantic-truth effects. GHR remains `can_continue:false` and `parsed_only`. | Non-inert before/after counters and static GHR/legacy inventory. No downstream substitute. |

## Effective GO boundary

Only `RRC-01406-01.a`, `RRC-01406-01.b`, `RRC-01406-02.a`, `RRC-01406-02.b`, and `RRC-01406-02.d` may be implemented and reviewed after a separate explicit GO. `RRC-01406-02.c` is carried as an explicit production-activation `BLOCKED_AUTHORITY` boundary, not an implementation task and not a pass claim.

No GO is issued by this freeze. Environment-specific production activation requires a future independently reviewed release-attestation authority, a successor amendment/replacement contract if needed, and separate explicit authorization.

## Independent-review request

Independent review must confirm that this replacement removes only the two false GO dependencies, leaves the successor guard fail-closed, makes no live-planning claim, and preserves every GHR and downstream prohibition. Stop after review; do not implement or activate production under this artifact alone.
