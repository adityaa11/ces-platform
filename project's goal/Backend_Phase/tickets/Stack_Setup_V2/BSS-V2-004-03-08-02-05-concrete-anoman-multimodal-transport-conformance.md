# BSS-V2-004-03-08-02-05: Concrete Anoman multimodal transport conformance

- **Status:** `awaiting_review`; **GO authorization:** consumed from the user's explicit `GO BSS-V2-004-03-08-02-05` after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-02` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M`; **dependencies:** `02-03`/`02-04` CK PASS and **existing `BSS-V2-004-03-04` CK PASS or explicit HMN-authorized amendment with sole ownership of typed-image vendor mapping**; **owns:** no more than the image serialization/conformance delta and regressions, not the sibling adapter's full lifecycle.
- **RC-01:** Captured fake Anoman request contains exact ordered text/image parts, valid bounded wire encoding, existing pinned route/model/JSON-mode and deadline/cancellation; no provider schema authority fabricated and no image source reclassification.
- **RC-02:** Existing Anoman text-only behavior, Gemini provider, routing, errors, usage metadata and credential redaction pass their owner-specific regressions at reviewed SHA; unsupported capability and oversized/invalid media fail without HTTP side effects.
- **RC-03:** No actual Anoman call, zero retries/fallback and no semantic provider activation; documentation states transport *conformance* ≠ provider vision accuracy/qualification.
- **GO terminal:** fake transport captures + vendor capability/provenance; **BLOCKED** until `03-04` ownership is resolved. If `03-04` is amended to own the transport, this leaf becomes **test/conformance only**, never a second implementation owner.

This checkpoint establishes bounded **transport conformance only**. It neither
claims nor qualifies Anoman vision/perception accuracy, live semantic execution,
provider privacy/residency, admission, or image-cost policy.

## Security Refactor Readiness

**Status** `planning-review-required` until the existing Anoman adapter's sole ownership is confirmed.
- **Inherited boundary:** `BOUNDARY-0040308-0205-ANOMAN-OWNER` — BSS-V2-004-03-04 owns the adapter lifecycle and route/config contract.
- **Trust boundary:** `TRUST-0040308-0205-VENDOR-SERIALIZATION` — verified neutral text/image parts are mapped to bounded Anoman wire data.
- **Sensitive assets:** `ASSET-0040308-0205-PROVIDER-REQUEST` — content ordering, model/route metadata, deadlines and credential-adjacent transport state.
- **Identity context:** `IDENTITY-0040308-0205-ROUTE-CAPABILITY` — qualified route, media capability and request identity must be bound before serialization.
- **Extension seam:** `SEAM-0040308-0205-FAKE-WIRE-CAPTURE` — fake transport conformance proves mapping without real requests.
- **Prohibited coupling:** `COUPLING-0040308-0205-NO-SECOND-ADAPTER-OWNER` — no sibling ownership override, retry/fallback, provider schema authority or source reclassification.
- **Verification seam:** `VERIFY-0040308-0205-LEGACY-TRANSPORT` — typed capture, invalid/oversize no-side-effect and existing Anoman/Gemini regressions.
- **Unresolved security policy:** actual provider privacy, admission and vision reliability are not resolved by offline wire conformance.
- **Review bindings:** `REV-READY-0040308-0205-01` verifies sole adapter ownership before GO; `REV-READY-0040308-0205-02` verifies fake-wire and legacy behavior.

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
