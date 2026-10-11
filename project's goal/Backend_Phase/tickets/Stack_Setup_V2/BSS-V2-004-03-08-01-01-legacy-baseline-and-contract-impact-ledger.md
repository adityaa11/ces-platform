# BSS-V2-004-03-08-01-01: Legacy baseline and contract-impact ledger

- **Status:** `draft_planning_only`; **implementation authority:** NOT GRANTED; HMN must approve this specific leaf, its current dependencies and frozen review rows before GO.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-01` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `S–M`; **GO prerequisites:** approved `03-01/02/03` and exact accessible immutable base HEAD; **owns:** reproducible parent-HEAD baseline capture only, not production modification.
- **RC-01:** At the untouched base SHA, capture canonical/proposal schema, legacy `prompt-003/v1` bytes, ordered sections and hashes, default APIs, source-packet slot order/failure behavior and focused tests with actual commands/versions; if reproducibility is blocked, **`BASELINE_UNVERIFIED`**.
- **RC-02:** Record all existing approved-contract owners and a proposed changed-file→contract→regression matrix; distinguish pre-existing test failure from future regression without updating snapshots.
- **RC-03:** Manifest/artifacts are immutable, checkable by CK from the same SHA and reproducible offline with **zero** provider calls, image reads, jobs and repository runtime changes.
- **GO terminal:** `READY_FOR_CK` with complete parent-HEAD manifest; CK verifies independently before any subsequent shared-code GO. **Not** a claim that future code has passed parity.

## Security Refactor Readiness

**Status** `minimal-relevance` (baseline capture only).
- **Inherited boundary:** `BOUNDARY-0040308-0101-LEGACY-CONTRACT` — canonical Semantic V1, prompt-003/v1, text-only packet and approved provider behavior remain owned by their existing tickets.
- **Trust boundary:** `TRUST-0040308-0101-BASELINE-EVIDENCE` — recorded hashes and commands become the comparison authority; they must be produced from the untouched parent SHA, not regenerated snapshots.
- **Sensitive assets:** `ASSET-0040308-0101-PROVENANCE` — prompt/schema/packet bytes and test evidence; record hashes and metadata only, never credentials or media bytes.
- **Identity context:** `IDENTITY-0040308-0101-PARENT-HEAD` — bind manifest, runtime/tool versions and commands to one immutable base SHA.
- **Extension seam:** `SEAM-0040308-0101-DIFFERENTIAL-LEDGER` — later leaves compare candidate behavior against this independently reproducible manifest.
- **Prohibited coupling:** `COUPLING-0040308-0101-NO-SNAPSHOT-REFRESH` — no production change, golden refresh, provider call or runtime mutation.
- **Verification seam:** `VERIFY-0040308-0101-REPRODUCIBILITY` — CK reruns the manifest at the same SHA and distinguishes pre-existing failures.
- **Unresolved security policy:** none introduced; external-provider and media-read policy remain outside this baseline leaf.
- **Review bindings:** `REV-READY-0040308-0101-01` verifies `TRUST-0040308-0101-BASELINE-EVIDENCE` with immutable artifacts and independent command reproduction.

## Permitted GO / terminal evidence

1. Verify human authorization for **this exact leaf**, prerequisite CK PASS references, repo branch/HEAD and scope owner. Confirm source fixtures/profile hashes and baseline execution environment where relevant.
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

## Ready-for-human checklist

- [ ] Leaf ownership, prior approvals and dependencies verified at current HEAD.
- [ ] Legacy baseline/impact matrix available, with no unauthorized snapshot updates.
- [ ] RC binary oracles, negatives and exact stop conditions frozen before GO.
- [ ] If `M+`, scope examined and no unresolved split/ownership conflict remains.
- [ ] Review evidence format and CK reviewer independence agreed.
