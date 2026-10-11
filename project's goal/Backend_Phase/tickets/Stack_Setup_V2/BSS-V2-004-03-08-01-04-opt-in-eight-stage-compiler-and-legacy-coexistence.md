# BSS-V2-004-03-08-01-04: Opt-in eight-stage compiler and legacy coexistence

- **Status:** `planned`; **GO authorization:** the user's explicit `go` for this leaf (or an explicitly authorized batch) after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-01` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M+` (shared frozen compiler risk); **dependencies:** `01-03` CK PASS and `01-01` baseline CK PASS; **owns:** versioned new profile, eight ordered stages, deterministic hashes/provenance and old/new coexistence.
- **RC-01:** New profile deterministically compiles all eight prescribed stages in order from canonical and source-input Zod plus reviewed static sections; section/stage authority and hashes are inspectable. **No** provider ID, fallback, runtime prompt repair, hidden chain-of-thought or model calls.
- **RC-02:** `compileExtractionPrompt()` legacy default, full bytes, schema, section order/ownership, provenance and old text-only packet stay identical to actual `01-01` parent baseline; frozen `crossFieldSemanticCompositionPolicy` and historical gold untouched.
- **RC-03:** Two-build/old→new→old reproducibility, concurrent profile isolation, unknown-profile rejection, legacy exact-byte parity and source-as-instruction negative tests. Untrusted source strings must not be interpolated into immutable system-policy sections. No automatic activation or altered legacy exports.
- **RC-04:** Changed-file/contract impact matrix and same-environment baseline-vs-new test ledger prove `INTENDED_NEW_PROFILE_ONLY`; unexpected deviation -> `LEGACY_REGRESSION_BLOCKED` and no CK PASS.
- **GO terminal:** immutable new-profile IDs/hashes and independently reproducible compiler/legacy test logs. **No images transmitted; no provider calls.**

## Security Refactor Readiness

**Status** `applicable`.
- **Inherited boundary:** `BOUNDARY-0040308-0104-LEGACY-PROFILE` — `prompt-003/v1`, its API/default, sections, hashes and packet behavior are frozen baseline contracts.
- **Trust boundary:** `TRUST-0040308-0104-PROMPT-COMPILER` — canonical/source-input Zod and reviewed static policy project into a new opt-in instruction profile.
- **Sensitive assets:** `ASSET-0040308-0104-PROMPT-PROVENANCE` — stage/section hashes, schema/profile identity and static policy text.
- **Identity context:** `IDENTITY-0040308-0104-PROFILE-STAGE` — bind profile revision to ordered stage IDs, authority and rendered hashes.
- **Extension seam:** `SEAM-0040308-0104-OPT-IN-REGISTRY` — explicit profile selection permits later controls without a default flip.
- **Prohibited coupling:** `COUPLING-0040308-0104-NO-IMPLICIT-ACTIVATION` — no image-presence dispatch, dynamic repair, provider choice or hidden reasoning output.
- **Verification seam:** `VERIFY-0040308-0104-OLD-NEW-ISOLATION` — byte parity plus old→new→old, concurrent isolation and malformed-profile negatives.
- **Unresolved security policy:** live transport and provider schema enforcement remain out of scope.
- **Review bindings:** `REV-READY-0040308-0104-01` verifies `TRUST-0040308-0104-PROMPT-COMPILER`; `REV-READY-0040308-0104-02` verifies the legacy profile through baseline differential evidence.

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
