# BSS-V2-004-03-08-01-03: Source-input Zod and v0.3.1 stage-authority map

- **Status:** `draft_planning_only`; **implementation authority:** NOT GRANTED; HMN must approve this specific leaf, its current dependencies and frozen review rows before GO.
- **Parent:** `BSS-V2-004-03-08` multimodal Semantic V1 v0.3.1 handoff, sizing amendment §§6–7.
- **Workstream:** `BSS-V2-004-03-08-01` (non-executable group). This file is **one** proposed GO/CK unit, not authorization for successor leaves.
- **Repository target:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/`.
- **Prior approved-contract preservation:** old `prompt-003/v1` and historical `03-01/02/03`, IDSER CK artifacts immutable; any shared-code change requires candidate-HEAD legacy regression against `08-01-01` parent-HEAD manifest.

## Bounded outcome, prerequisites and Review Contract

- **Size:** `M`; **dependencies:** `01-01` and `01-02` CK PASS with no open schema-fit blocker; **owns:** additive provider-neutral source-input `.describe()` and explicit eight-stage authority/ordering specification, **not** compiler implementation.
- **RC-01:** Source modalities, authorized ownership vs reference context, image/title/legend/table semantics, temporal/aspectual negative-vs-not-yet-vs-unknown distinctions are represented by source-input Zod descriptions or separately identified reviewed static policy.
- **RC-02:** Every step from §0.6 has a unique source-of-instruction owner: `ZOD_SEMANTIC`, `ZOD_SOURCE_INPUT`, `STATIC_POLICY`, or outside-model validator; no manually duplicated 16-kind taxonomy and no language-keyword hard-coding.
- **RC-03:** The new contract remains additive and provider-independent; canonical semantic V1 and approved `prompt-003/v1` schema/bytes are unchanged against `01-01` baseline.
- **RC-04:** Deterministic schema/description/source-stage-map tests and ambiguity/legend/temporal negatives pass offline; real image bytes, compiler integration and provider execution stay out of scope.
- **GO terminal:** new source-input authority + frozen step-to-authority matrix; independent CK, no preview-model qualification claim.

## Security Refactor Readiness

**Status** `applicable`.
- **Inherited boundary:** `BOUNDARY-0040308-0103-CANONICAL-DESCRIPTIONS` — canonical Semantic V1 Zod owns semantic-kind definitions; source-input Zod adds only modality/relationship guidance.
- **Trust boundary:** `TRUST-0040308-0103-INSTRUCTION-PROJECTION` — source and semantic descriptions become provider instructions only through explicit, versioned ownership.
- **Sensitive assets:** `ASSET-0040308-0103-SEMANTIC-DESCRIPTIONS` — descriptions of kinds, literals, temporal meaning and source context.
- **Identity context:** `IDENTITY-0040308-0103-STAGE-AUTHORITY` — each of eight stages binds to exactly one authority class.
- **Extension seam:** `SEAM-0040308-0103-AUTHORITY-MAP` — static policy and outside-model validation remain separately identifiable and reviewable.
- **Prohibited coupling:** `COUPLING-0040308-0103-NO-DUPLICATE-TAXONOMY` — no copied 16-kind table, language-token rule or provider-specific instruction authority.
- **Verification seam:** `VERIFY-0040308-0103-OWNER-MAP` — deterministic description/stage tests and temporal/legend negatives.
- **Unresolved security policy:** provider enforcement of prompt/schema instructions remains a later route qualification.
- **Review bindings:** `REV-READY-0040308-0103-01` verifies `IDENTITY-0040308-0103-STAGE-AUTHORITY` by ownership-map inspection and offline tests.

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
