# BSS-V2-004-03-08-02-02: Service identity, grant and derived-image authorization

- **Status:** `planned`; **GO authorization:** the user's explicit `go` for this leaf (or an explicitly authorized batch) after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-02` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M+` (security decision); **dependencies:** `02-01` CK PASS and approved `IDSER-012-01-03-02`; **owns:** narrow Atlas-controlled semantic read authorization/identity contract, **not** image streaming.
- **RC-01:** Bind service caller, document/version/source SHA, current authorized semantic execution or narrowly scoped offline grant, profile, page, locator, `assetRef`, manifest hash and expiry/replay-fence identity; reject user session cookie borrowing, arbitrary key/path or Bridge DB/storage mounts.
- **RC-02:** Fake-authority validation rejects foreign tenant/project/document, wrong profile/execution, stale/replayed grant, tamper, locator/ref mismatch, unauthenticated requests and unsupported media *before* any media access.
- **RC-03:** Prove service-only authorization compatibility with retained historical accepted visual evidence and existing session resolver; no broadening of browser endpoints or DocumentStore policy.
- **GO terminal:** reviewed authorization interface/issuer-verifier and negative matrix, with **zero media retrieval and external calls**. Missing security policy -> HMN block.

## Security Refactor Readiness

**Status** `planning-review-required` until a narrowly scoped service-read authorization design is approved.
- **Inherited boundary:** `BOUNDARY-0040308-0202-DERIVED-EVIDENCE` — existing document/execution authorization and browser resolver ownership remain intact.
- **Trust boundary:** `TRUST-0040308-0202-SERVICE-GRANT` — a service identity requests a derived visual only under a scoped, expiring, replay-fenced grant.
- **Sensitive assets:** `ASSET-0040308-0202-DERIVED-VISUAL` — retained image evidence and its document/source/manifest binding.
- **Identity context:** `IDENTITY-0040308-0202-CALLER-GRANT` — caller, document/version/source SHA, execution/profile/page/locator/ref/manifest and expiry must agree.
- **Extension seam:** `SEAM-0040308-0202-ISSUER-VERIFIER` — a server-controlled issuer/verifier interface permits later bounded read implementation.
- **Prohibited coupling:** `COUPLING-0040308-0202-NO-SESSION-OR-MOUNT` — no user-cookie borrowing, arbitrary path/key, Bridge DB or storage mount privilege.
- **Verification seam:** `VERIFY-0040308-0202-DENIAL-MATRIX` — foreign, stale, replayed, tampered and mismatch requests fail before media access.
- **Unresolved security policy:** missing grant issuer, storage privilege or retention policy is an HMN blocker, not an implementation default.
- **Review bindings:** `REV-READY-0040308-0202-01` verifies `TRUST-0040308-0202-SERVICE-GRANT` using the denial matrix; `REV-READY-0040308-0202-02` verifies browser-resolver compatibility.

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
