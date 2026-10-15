**BINDING PROSPECTIVE INDEX CORRECTION (2026-10-15):** SEM-CUTOVER-008's old consolidated `03-05 CK PASS` prerequisite is now **SUPERSEDED_BEFORE_GO** under user-authorized winner realignment. The historical sequence below is retained as a planning record, not GO/CK authority for reviving 03-05, 08-03-02/03 or REL-04. Sole executable extraction is SEM-007A stepwise REL-envelope v0.4.0; keep preserved security/oracle obligations and original CK/HMN histories. See `project's goal/feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md`.

---

# Semantic Cutover Phase

This ticket set establishes the proposed `SEM-CUTOVER` path from the approved RUN-003 perception baseline to a single, independently qualified, **offline** stepwise semantic-extraction successor. The binding planning context is [00-SEM-CUTOVER-IMPLEMENTATION-CONTEXT.md](00-SEM-CUTOVER-IMPLEMENTATION-CONTEXT.md). It is a planning package only: it does not issue a `GO`, HMN decision, CFC authorization, CK `PASS`, production semantic job, provider call, admission reservation, or Master mutation.

The package is based on the reviewed source materials in `Backend_Phase/Atlas_Semantic_Cutover_Phase`. The source package remains unchanged; this directory is the ticket-set location for the phase.

## Ticket sequence

| Stage | Ticket | Reviewable outcome | Dependency |
|---:|---|---|---|
| 1 | [SEM-CUTOVER-001](SEM-CUTOVER-001-current-code-inventory-and-conflict-ledger.md) | Actual local-HEAD inventory and frozen conflict ledger | Accessible local repository and PERC-RESET-008 decision evidence |
| 2 | [SEM-CUTOVER-002](SEM-CUTOVER-002-successor-baseline-and-deferred-verification-hmn.md) | Explicit bounded HMN decision for successor policy | 001 independent CK `PASS` and user HMN approval |
| 3 | [SEM-CUTOVER-003](SEM-CUTOVER-003-nonblocking-source-ownership-packet.md) | Owned-source packet with provisional relationship context | 002 approved and explicit GO |
| 4 | [SEM-CUTOVER-004](SEM-CUTOVER-004-single-stepwise-proposal-envelope.md) | One versioned eight-stage request and strict REL envelope | 003 independent CK `PASS` |
| 5 | [SEM-CUTOVER-005](SEM-CUTOVER-005-provisional-accounting-and-replay-handoff.md) | Honest provisional accounting and replay-safe sidecar handoff | 004 independent CK `PASS` |
| 6 | [SEM-CUTOVER-006](SEM-CUTOVER-006-03-05-context-trust-remediation.md) | Bounded repair of 03-05 CK-001.a/b contextual trust findings | 005 independent CK `PASS` and specific CFC/HMN authorization |
| 7 | [SEM-CUTOVER-007](SEM-CUTOVER-007-offline-stepwise-worker-composition.md) | One offline fake-provider worker composition with replay | 006 independent CK `PASS` |
| 7A-a | [SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE](SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE.md) | Hash-bound partial and fully deferred semantic acceptance lifecycle | SEM-007 independent CK `PASS` and HMN-SEM-CUTOVER-007A-001 approval |
| 7A | [SEM-CUTOVER-007A](SEM-CUTOVER-007A-canonical-stepwise-extraction-runtime-cutover.md) | Sole executable stepwise extraction; real/fake neutral adapter; old extraction dispatch retired | 7A-a independent CK `PASS` and explicit GO |
| 8 | [SEM-CUTOVER-008](SEM-CUTOVER-008-final-ck-and-canonical-semantic-baseline.md) | Independent 03-05 CK closure and successor-baseline freeze | 007 independent CK `PASS` |

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 007A-a -> 007A -> 008
```

Every executable leaf needs its own explicit GO. `SEM-CUTOVER-002` is a human decision checkpoint, not coding permission; `SEM-CUTOVER-008` cannot self-approve the final 03-05 CK.

## Program guardrails

- RUN-003 remains the sole canonical upstream perception identity, and normal D1 work still stops at `perceived`.
- SEM-007A must independently CK-PASS the executable stepwise-only runtime dispatch before SEM-008 can become effective. Historical extraction must not remain selectable even though canonical D1 scheduling remains at `perceived`.
- The successor has one stepwise methodology and one selected versioned profile. A changed prompt, request or response schema requires a new profile/hash; legacy `prompt-003/v1` cannot be a fallback.
- Technical integrity failures fail closed at the affected boundary. Unverified relationships limit only dependent trusted interpretation; independent source extraction must remain attributable and provisional where needed.
- Proposals and unresolved relationships never become accepted contextual evidence. Existing `CK-001.a/b` remain genuine findings until independently closed.
- The package permits deterministic fake-only qualification. It excludes real provider calls, new production jobs, admission effects, human-review UI, chatbot authorization, publication, Master mutation, and modification of the protected REL-03 candidate.
- Preserve historical tickets, CK records, source PDFs, accepted RUN-003 state, unrelated dirty files, credentials and canonical Docker resources. Do not use Docker resets or broad Git cleanup.

## Companion planning aids

- [Successor clause ledger template](TEMPLATE-SUCCESSOR-CLAUSE-LEDGER.md)
- [Independent CK evidence matrix](TEMPLATE-SEMANTIC-CUTOVER-EVIDENCE-MATRIX.md)
- [Bounded HMN proposal for 002](HMN-SEM-CUTOVER-002-PROPOSAL.md)

## Security readiness

```yaml
status: applicable
inheritedBoundaries:
  - SEC-SEM-CUTOVER-BOUNDARY-01: RUN-003 source bytes, NormalizedDocument V1, source grants, asset hashes, replay/fencing, and `perceived` termination remain authoritative.
  - SEC-SEM-CUTOVER-BOUNDARY-02: REL-01/02 may represent only proposed or unresolved relationship lineage; accepted contextual use requires a separately validated authorization decision.
  - SEC-SEM-CUTOVER-BOUNDARY-03: BSS-V2-004-03-05 CK-001.a/b remain open security findings until independently re-reviewed on the exact candidate SHA.
trustBoundaries:
  - SEC-SEM-CUTOVER-TRUST-01: Source and derived-asset identity cross from perception into semantic packet construction only through exact document/source/asset bindings.
  - SEC-SEM-CUTOVER-TRUST-02: Proposed relationship context may enter provisional accounting but cannot enter canonical evidence without exact accepted relationship authorization.
  - SEC-SEM-CUTOVER-TRUST-03: Fake provider output crosses into canonical Semantic V1 only after strict envelope parsing, source ownership checks, Atlas-owned identifiers, and trusted finalizer validation.
sensitiveAssets:
  - SEC-SEM-CUTOVER-ASSET-01: Original PDFs, derived visual bytes, source and asset hashes, grants, execution/bundle/document identities, and relationship revisions.
  - SEC-SEM-CUTOVER-ASSET-02: Provider credentials, raw provider responses, raw image/base64 data, accepted canonical perception storage, and protected REL-03 work.
identityContext:
  - SEC-SEM-CUTOVER-IDENTITY-01: Profile/hash, source SHA, asset identity/hash, document and execution identity, relationship lineage/revision, authorization decision, and lease/fencing identity stay explicit at their seams.
extensionSeams:
  - SEC-SEM-CUTOVER-SEAM-01: Preserve a verifier-derived accepted-context interface so later authorization policy can attach without making the finalizer a policy issuer.
  - SEC-SEM-CUTOVER-SEAM-02: Preserve separate provisional sidecar and replay identity so later human confirmation/publication can bind named revisions without rewriting proposals.
prohibitedCouplings:
  - SEC-SEM-CUTOVER-PROHIBIT-01: No legacy profile fallback, model/image-presence dispatch branch, caller-supplied trusted context pair, or provider-specific cast hidden in the worker.
  - SEC-SEM-CUTOVER-PROHIBIT-02: No proposal-to-accepted promotion, Master/publish side effect, unbounded source-accounting claim, or alteration of REL-03/persistence ownership without separate authorization.
verificationSeams:
  - SEC-SEM-CUTOVER-VERIFY-01: 001/002 evidence proves actual HEAD, prerequisite CK/HMN authority, exact clause supersession, and protected local-state inventory.
  - SEC-SEM-CUTOVER-VERIFY-02: 003–005 prove deterministic source ownership, nonblocking provisional accounting, strict request/envelope parsing, and replay-safe sidecar identity.
  - SEC-SEM-CUTOVER-VERIFY-03: 006–008 prove exact accepted-context authorization, strict negatives, replay/fencing, instrumented zero-effect boundaries, and independent CK closure.
unresolvedSecurityPolicy:
  - SEC-SEM-CUTOVER-POLICY-01: Live-provider, admission, human-confirmation, publishing, retention, and production semantic scheduling policy remain outside this ticket set.
planningFindings: []
reviewBindings:
  - REV-SEC-SEM-CUTOVER-01 -> SEC-SEM-CUTOVER-VERIFY-01: Confirm no successor work starts on stale state or self-issued authority; evidence: exact SHA, status, CK/HMN records, and frozen-clause ledger.
  - REV-SEC-SEM-CUTOVER-02 -> SEC-SEM-CUTOVER-VERIFY-02: Confirm every independent source remains attributable while provisional relationships never become trusted evidence; evidence: deterministic positive/negative source, envelope, and replay fixtures.
  - REV-SEC-SEM-CUTOVER-03 -> SEC-SEM-CUTOVER-VERIFY-03: Confirm contextual evidence requires an exact validated authorization and denied paths have zero effective effects; evidence: finalizer negatives, instrumented fakes with positive controls, and independent 03-05 CK record.
```

## Explicit limits

This phase does not prove live-model semantic correctness, broad multilingual/OCR coverage, diagram understanding, real image-token admission, provider privacy posture, production scheduling, user-verification UI, chatbot decisions, Master publication, CES behavior, or commercial release.

---

## Binding amendment — dependency and review order (2026-10-13)

The external planning ZIP is background only; the committed repository and independent CK evidence govern. PERC-RESET-008 PASS is confirmed in feedback/PERC-RESET-BATCH-08-9f31026-review.md.

Keep ticket order 001–008, with one critical added prerequisite: SEM-001 inventories the protected local REL-03 candidate; SEM-002 assigns persistence ownership; a separately approved/CK-qualified durable composite staging boundary (or narrowly authorized REL-03 integration) is required **before 007 GO**. SEM-005 proves pure/fake sidecar contracts only, not SQL durability.

SEM-006 CK = finalizer-component qualification, not entire original 03-05 PASS. SEM-007 CK = offline worker + durable replay integration. Then request a **separate full BSS-V2-004-03-05 CK** on exact final implementation SHA. Only after its PASS may SEM-008 freeze an effective successor baseline. Unverified relationships remain provisional without halting independent extraction; human confirmation is deferred to explicit authorized Master review or chatbot-assisted confirmation.

## Binding runtime-cutover correction (2026-10-15)

The SEM-002 canonical-methodology decision was not fulfilled by the SEM-007 fake-only injection: at HEAD `5471b25`, ordinary semantic worker extraction could still use `buildSemanticSourcePacket()` and legacy `prompt-003/v1` when `offlineStepwise` was absent. **SEM-CUTOVER-007A** owns actual extraction dispatch retirement and one provider-neutral stepwise engine shared by fake and real transport. An actual adapter may be exercised through loopback HTTP during CK without paid provider calls. Ordinary staged RUN-003 D1 remains `perceived`; scheduling/admission is outside the 007A code scope. This amendment does not rewrite earlier CK verdicts.

**Hard stop:** no `GO SEM-CUTOVER-008`, effective semantic baseline, or downstream semantic batch implementation based on a legacy packet until 007A independent CK `PASS`. Final BSS-V2-004-03-05 CK must still independently pass at the exact final reviewed implementation SHA. Explicit user GO and the existing workflow contract remain required.
