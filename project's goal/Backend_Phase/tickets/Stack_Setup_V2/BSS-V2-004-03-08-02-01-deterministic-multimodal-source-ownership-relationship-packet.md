# BSS-V2-004-03-08-02-01: Deterministic multimodal source ownership/relationship packet

- **Status:** `awaiting_review`; **GO authorization:** the user's explicit `go` for this leaf (or an explicitly authorized batch) after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-02` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M`; **dependencies:** `01-02` and `01-04` CK PASS; **owns:** provider-neutral slot/locator/reference-context/image-part descriptors without reading image bytes.
- **RC-01:** Each owned text/table/visual locator gets one deterministic temporary slot; context-only provenance never generates a false assertion. Actual NormalizedDocument V1 and derived manifest bind an image to a visual locator, **not to a table**. Consume only HMN-approved, Atlas-validated relationship provenance from `01-02`, never proximity, common page, pixels or the manual hash pairing. Essential unproven link -> `SOURCE_RELATIONSHIP_BLOCKED`, independent slots retained.
- **RC-02:** Unlabeled image assets remain pending meaningful evidence, never silent `non_fact`; reject absent/duplicate/foreign/unsupported or guessed relationships and over-bound context before transport.
- **RC-03:** Exact packet/source-spec/hash repeatability, reference-context nonownership and unchanged legacy text-only packet bytes/failure decisions demonstrated with frozen and negative fixtures.
- **RC-04:** Explicitly document what must be supplied later by the resolver and resource planner; no bytes, no vendor API, no jobs and no invented media-token estimate.
- **GO terminal:** deterministic *unhydrated* source packet + source-to-visual relationship mapping; CK on packet contract only.

## Security Refactor Readiness

**Status** `applicable`.
- **Inherited boundary:** `BOUNDARY-0040308-0201-NORMALIZED-SOURCE` — accepted NormalizedDocument/derived-manifest authority determines eligible owned units.
- **Trust boundary:** `TRUST-0040308-0201-SOURCE-RELATIONSHIP` — normalized metadata is converted into deterministic owned slots, reference context and pending media descriptors.
- **Sensitive assets:** `ASSET-0040308-0201-SLOT-MAP` — source/page/locator/asset-reference identities and contextual governance relationships.
- **Identity context:** `IDENTITY-0040308-0201-SLOT-LOCATOR-ASSET` — each image part is attributable to exactly one authorized visual slot and locator.
- **Extension seam:** `SEAM-0040308-0201-UNHYDRATED-PACKET` — resolver and planner inputs stay separate from bytes and provider transport.
- **Prohibited coupling:** `COUPLING-0040308-0201-NO-UNLABELED-MEDIA` — no bare image, fake business assertion, foreign join or image-byte read.
- **Verification seam:** `VERIFY-0040308-0201-REPEATABLE-PACKET` — repeatability, invalid joins/context and legacy text-packet parity.
- **Unresolved security policy:** service grant and actual media integrity are owned by successor leaves.
- **Review bindings:** `REV-READY-0040308-0201-01` verifies `TRUST-0040308-0201-SOURCE-RELATIONSHIP` with frozen positive/negative packet fixtures.

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

- [x] Leaf ownership, prior approvals and dependencies verified at current HEAD.
- [x] Legacy baseline/impact matrix available, with no unauthorized snapshot updates.
- [x] RC binary oracles, negatives and exact stop conditions frozen before GO.
- [x] If `M+`, scope examined and no unresolved split/ownership conflict remains.
- [x] Review evidence format and CK reviewer independence agreed.
