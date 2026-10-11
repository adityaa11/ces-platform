# BSS-V2-004-03-08-02-06: Multimodal request bounds, replay/redaction and resource interface

- **Status:** `planned`; **GO authorization:** the user's explicit `go` for this leaf (or an explicitly authorized batch) after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-02` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M+` (integration/resource uncertainty); **dependencies:** `02-03`/`02-04`/`02-05` CK PASS; **owns:** structural request limit preflight and privacy/replay-safe *interface* for future `IDSER-012-02-01`, not a new scheduler.
- **RC-01:** Bound image count/bytes/dimensions, ordered parts, prompt bytes, effective profile/media capability, deadlines/cancellation; reject unknown route/profile or unsupported media **before** any provider call, authorization or side effect.
- **RC-02:** Emit exact deterministic request-spec identity (schema/profile/slots/asset refs/hashes without bytes) and bounded resource-estimator *inputs/interface only*. `IDSER-012-02-01` constructs the actual exact per-batch `RequestResourceEnvelope` using estimator/accounting/safety policy. Unknown image TPM -> `RESOURCE_ENVELOPE_BLOCKED`.
- **RC-03:** In fake aborted/duplicate/restart/cancel cases demonstrate no persistent base64 or leaked credentials, no fresh perception job/permit, no semantic execution or reservation, no duplicate external attempt and existing string-only behavior unchanged.
- **GO terminal:** Versioned request-spec/resource-estimation input contract and replay/limits evidence, **not** a completed `RequestResourceEnvelope`, IDSER planner or BSS-V2-005/006 admission.

## Security Refactor Readiness

**Status** `planning-review-required` until safe image-resource bounds are approved or explicitly blocked.
- **Inherited boundary:** `BOUNDARY-0040308-0206-ADMISSION` — BSS-V2-005/006 and IDSER-012-02-01 retain planning and runtime-admission ownership.
- **Trust boundary:** `TRUST-0040308-0206-PREFLIGHT` — complete bounded request metadata is evaluated before authorization or provider side effects.
- **Sensitive assets:** `ASSET-0040308-0206-REQUEST-SPEC` — profile/schema/slot/asset hash metadata, deadlines and resource envelope; not image bytes.
- **Identity context:** `IDENTITY-0040308-0206-REQUEST-ENVELOPE` — route/profile/capability and source-part map bind deterministically to one request identity.
- **Extension seam:** `SEAM-0040308-0206-RESOURCE-INTERFACE` — conservative, versioned limits feed the future planner without creating a scheduler.
- **Prohibited coupling:** `COUPLING-0040308-0206-NO-FALSE-TOKEN-ACCOUNTING` — never equate bytes to tokens, vendor weighted usage to TPM, or unknown cost to zero.
- **Verification seam:** `VERIFY-0040308-0206-PREFLIGHT-REPLAY` — overflow, cancel, duplicate and restart negatives prove redaction/no side effects.
- **Unresolved security policy:** unknown safe vendor image bounds require `RESOURCE_ENVELOPE_BLOCKED` and HMN.
- **Review bindings:** `REV-READY-0040308-0206-01` verifies preflight; `REV-READY-0040308-0206-02` verifies the resource-block condition or approved conservative interface.

## Permitted GO / terminal evidence

1. Verify the user's explicit `go` authorization for **this exact leaf** (or an explicitly authorized batch), prerequisite CK PASS references, repo branch/HEAD and scope owner. Confirm source fixtures/profile hashes and baseline execution environment where relevant.
2. Name permitted changed files and all approved predecessor contracts they can affect. Inspect exact seams before coding; for `M+` size, if >1 independently mutable authority/trust transition is unavoidable, **STOP and seek HMN split**.
3. Execute only this leaf's positive/negative deterministic tests. Rerun all **impacted legacy** tests with unchanged gold at candidate HEAD; record exact commands, observed results, original/candidate SHA and any pre-existing failures.
4. Submit `READY_FOR_CK` **only** when every listed RC has observable evidence. Include `external_provider_attempt_count = 0` and zero unauthorized semantic/perception jobs/reservations (grounded by the relevant test harness). No live Anoman call, hidden model retry, reconciliation, or accepted-truth publishing.

## CK independence and bounded CFC

CK independently reproduces RC evidence, checks the intended diff against the sole owner and changed-file inventory, verifies relevant legacy invariants on the reviewed SHA, verifies no secret/base64 leakage and issues `PASS`, `CHANGES_REQUIRED`, or `BLOCKED` with exact finding IDs. Do **not** approve through new snapshots, diagnostic JSON repairs or an earlier ticket's CK.

CFC may remediate **only** human-authorized CK finding IDs and exact permitted files; rerun both failure tests and impacted old lanes, record new reviewed SHA and stop for CK. On wider interface redesign, unknown grants/cost, schema redefinition, regression of prior approvals or repeated unchanged failure after two targeted attempts, **STOP for HMN** and either isolate/revert or create a narrower ticket; do not iterate indefinitely.

## Hard security / execution exclusions

- Zero external semantic provider calls, automatic fallback, provider retries, new production jobs/admission reservations, reconciliation, UI/Project Facts/CES/publish changes, or undocumented storage privilege.
- Do not mint Atlas truth/IDs from untrusted provider assertions, silently weaken canonical Semantic V1, or alter frozen historical CK artifacts or original manual-response bytes.
- Never preserve image base64/bytes or API keys in logs, SQL, request snapshots or review artifacts. Use hashes and bound metadata for traceable evidence.
- Each leaf owns only its specified handoff to successor CK; whole-family offline completion is **`08-03-03` CK PASS**, not this leaf alone.

## Pre-GO readiness checklist

- [ ] Leaf ownership, prior approvals and dependencies verified at current HEAD.
- [ ] Legacy baseline/impact matrix available, with no unauthorized snapshot updates.
- [ ] RC binary oracles, negatives and exact stop conditions frozen before GO.
- [ ] If `M+`, scope examined and no unresolved split/ownership conflict remains.
- [ ] Review evidence format and CK reviewer independence agreed.
