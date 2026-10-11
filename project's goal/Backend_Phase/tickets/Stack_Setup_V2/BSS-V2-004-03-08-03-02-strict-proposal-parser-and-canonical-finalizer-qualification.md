# BSS-V2-004-03-08-03-02: Strict proposal parser and canonical-finalizer qualification

- **Status:** `planned`; **GO authorization:** the user's explicit `go` for this leaf (or an explicitly authorized batch) after required predecessor CK PASS, with current frozen scope and review rows. **No preliminary HMN is required for ordinary GO.** HMN is reserved for a documented blocked decision, out-of-scope change, or a later remediation cycle.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-03` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M`; **dependencies:** `03-01` CK PASS and **`BSS-V2-004-03-05` CK PASS**; **owns:** deterministic fake-response validator/finalizer-specific tests, not the sibling finalizer implementation.
- **RC-01:** Exact raw v0.3.1 fence and uppercase enum fail the authoritative parser; diagnostic unwrapping/case folding cannot make them accepted. Positive lowercase/unfenced fake response passes existing Zod and finalizer.
- **RC-02:** Valid candidates receive trusted Atlas-owned IDs/evidence and exact source inventory from slot map; provider cannot choose trusted locators, candidate IDs, questions' evidence or accepted truth.
- **RC-03:** Invalid/dangling/duplicated slots, malformed payload, lost context-only evidence, invented title candidate or cross-slot ownership fail closed; no silent semantic repair, provider request or reconciliation.
- **GO terminal:** independently reviewed fake-response/strict-parser matrix; no change to `03-05` owner unless separately authorized.

## Security Refactor Readiness

**Status** `applicable`.
- **Inherited boundary:** `BOUNDARY-0040308-0302-FINALIZER-OWNER` — BSS-V2-004-03-05 remains the sole finalizer implementation owner.
- **Trust boundary:** `TRUST-0040308-0302-UNTRUSTED-PROPOSAL` — provider-shaped raw output is parsed strictly before Atlas IDs/evidence can be assigned.
- **Sensitive assets:** `ASSET-0040308-0302-CANDIDATE-EVIDENCE` — trusted candidate IDs, evidence refs and source inventory.
- **Identity context:** `IDENTITY-0040308-0302-SLOT-INVENTORY` — finalization binds accepted candidates to the trusted packet slot map, not provider locators.
- **Extension seam:** `SEAM-0040308-0302-STRICT-PARSER` — deterministic fake-response tests attach to the canonical finalizer without a repair layer.
- **Prohibited coupling:** `COUPLING-0040308-0302-NO-REPAIR-OR-RECONCILIATION` — no fence stripping, enum coercion, source reassignment, automatic repair or reconciliation.
- **Verification seam:** `VERIFY-0040308-0302-RAW-FAIL-CLOSED` — fenced/uppercase, malformed, dangling/duplicate-slot and context-provenance negatives.
- **Unresolved security policy:** provider transport and runtime admission are not authorized in this qualification leaf.
- **Review bindings:** `REV-READY-0040308-0302-01` verifies strict untrusted-proposal handling; `REV-READY-0040308-0302-02` verifies finalizer-owner scope.

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
