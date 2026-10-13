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
| 8 | [SEM-CUTOVER-008](SEM-CUTOVER-008-final-ck-and-canonical-semantic-baseline.md) | Independent 03-05 CK closure and successor-baseline freeze | 007 independent CK `PASS` |

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008
```

Every executable leaf needs its own explicit GO. `SEM-CUTOVER-002` is a human decision checkpoint, not coding permission; `SEM-CUTOVER-008` cannot self-approve the final 03-05 CK.

## Program guardrails

- RUN-003 remains the sole canonical upstream perception identity, and normal D1 work still stops at `perceived`.
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
