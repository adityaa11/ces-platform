# BSS-V2-004-03-08-02-04: Additive provider-neutral typed multipart messages

- **Status:** `awaiting_review`; **GO authorization:** consumed from the user's explicit `GO BSS-V2-004-03-08-02-04` after required predecessor CK PASS, with the current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-02` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M`; **dependencies:** `02-01` CK PASS and `01-01` baseline; **owns:** typed ordered text/image message parts and capability negotiation only, **not** vendor wire format.
- **RC-01:** Existing `ChatMessage.content: string` consumers remain valid/byte-for-byte compatible; new explicit typed text/media content carries stable source-part identity, media constraints and abort semantics.
- **RC-02:** Unsupported image capability refuses request *before* provider side effects; no implicit visual-label downgrade; provider schema, generic semantic-worker selection and existing string provider routes remain unchanged.
- **RC-03:** Types/contract tests, old/new compatibility, serialization/redaction boundary, mixed-part ordering and unsupported-capability negatives pass using fake transports with zero real calls.
- **GO terminal:** neutral typed-message contract and fake capability capture; **not** Anoman adapter implementation.

## Security Refactor Readiness

**Status** `applicable`.
- **Inherited boundary:** `BOUNDARY-0040308-0204-PROVIDER-NEUTRAL-MESSAGES` — generic execution remains independent of vendor wire formats.
- **Trust boundary:** `TRUST-0040308-0204-TYPED-PARTS` — bounded text/media parts become an explicit capability-negotiated request representation.
- **Sensitive assets:** `ASSET-0040308-0204-MEDIA-METADATA` — source-part identity, type, bounds and abort context; media content remains elsewhere.
- **Identity context:** `IDENTITY-0040308-0204-ORDERED-PART` — ordered part IDs and associated source identity survive neutral serialization.
- **Extension seam:** `SEAM-0040308-0204-CAPABILITY-NEGOTIATION` — adapters opt into images explicitly while string-only consumers stay unchanged.
- **Prohibited coupling:** `COUPLING-0040308-0204-NO-SILENT-DOWNGRADE` — unsupported images fail before side effects; no label-only fallback or generic worker provider branch.
- **Verification seam:** `VERIFY-0040308-0204-COMPATIBILITY` — type/serialization/redaction ordering tests plus no-call capability denial.
- **Unresolved security policy:** vendor-specific image wire encoding is owned by the later sole adapter owner.
- **Review bindings:** `REV-READY-0040308-0204-01` verifies typed-parts trust and no-silent-downgrade with fake transports.

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
