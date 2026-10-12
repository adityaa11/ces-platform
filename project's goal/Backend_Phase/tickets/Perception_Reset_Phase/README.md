# Perception Reset Phase

This Backend Phase ticket set establishes the canonical local Atlas perception baseline through durable `perceived`, using the already qualified RUN-003 capture and derived-asset path. The binding source context is [00-PERCEPTION-RESET-IMPLEMENTATION-CONTEXT.md](00-PERCEPTION-RESET-IMPLEMENTATION-CONTEXT.md). Each implementation requires its own explicit `GO` and independent review where specified. PERC-RESET-001 is `approved` under evidence-contract amendment v1; PERC-RESET-002 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-02-9a0ef58-verification.md`); PERC-RESET-003 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-03-888b7ca-verification.md`); PERC-RESET-004 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-04-e03e3dc-review.md`); PERC-RESET-005 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-05-7ff0ebb-review.md`); PERC-RESET-006 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-06-715217b-review.md`); PERC-RESET-007 is `approved` after independent CK `PASS` (`PERC-RESET-BATCH-07-cd22c39-review.md`); PERC-RESET-008 remains `planned`.

## Ticket sequence

| Stage | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [PERC-RESET-001](PERC-RESET-001-docker-inventory-and-full-reset.md) | Inventory and reset obsolete Docker state while preserving verified non-empty Docling model cache; local Serve image optional | Parent context v1.2, amended by HMN-PERC-RESET-001-002 |
| 2 | [PERC-RESET-002](PERC-RESET-002-normal-run003-route-activation.md) | Make RUN-003 the sole normal perception route with aligned runtime identities | 001 |
| 3 | [PERC-RESET-003](PERC-RESET-003-zero-visual-and-verified-asset-accounting.md) | Accept valid zero-visual PDFs and enforce exact integrity for captured assets | 002 |
| 4 | [PERC-RESET-004](PERC-RESET-004-clean-canonical-compose-boot.md) | Approved: canonical Compose project using the amended image-embedded model baseline and one RUN-003 route | 001–003 reviewed |
| 5 | [PERC-RESET-005](PERC-RESET-005-professional-project-creation-master-initial-draft.md) | Create authenticated Project A and verify empty Master / Initial Draft boundaries | 004 |
| 6 | [PERC-RESET-006](PERC-RESET-006-professional-multimodal-perception-e2e.md) | Accept source-grounded RUN-003 text, table, and captured visual evidence for Project A | 005 |
| 7 | [PERC-RESET-007](PERC-RESET-007-three-pdf-run003-admission-and-perception.md) | Process three ordered PDFs in Project B through the same RUN-003 route | 006 |
| 8 | [PERC-RESET-008](PERC-RESET-008-restart-manual-baseline-and-legacy-retirement.md) | Prove restart/replay behavior and freeze the RUN-003 successor regression baseline | 007 |

The ticket sequence ends at `perceived`. It does not authorize semantic extraction, provider calls, Master publication, REL work, or automatic execution of a successor ticket. PERC-RESET-001's Docker reset is separately scoped by the binding context's explicit Docling cache/image exception; the cache must be tied to its actual mount and contents before any deletion.

## Dependency flow

```text
001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007 -> 008
          \\________ reviewed prerequisites ________/
```

PERC-RESET-004 requires 001–003 reviewed. The sequence is intentionally one canonical environment and two real projects, not a series of isolated qualification stacks. The frozen downstream baseline rule in context §8A takes effect only after PERC-RESET-008 receives independent CK PASS; existing frozen conflicting clauses require a separately recorded bounded amendment.

## Security readiness

```yaml
status: applicable
inheritedBoundaries:
  - SEC-PERC-RESET-BOUNDARY-01: The v1.2 context's one-time Docker authorization is limited to obsolete local Docker resources; actual Docling model-cache volume(s)/pinned image, host PDFs, bind targets, Git state, .env, and historical CK evidence are protected as specified.
  - SEC-PERC-RESET-BOUNDARY-02: Existing Atlas source grants, scoped derived-asset access, hashes, cancellation, bounds, replay, and `perceived` termination remain authoritative; accepted IDSER-012-01-03-01/02 scopes are reused, not reopened.
trustBoundaries:
  - SEC-PERC-RESET-TRUST-01: Docker context/resource inventory determines the destructive reset target and the real mount that owns downloaded Docling weights.
  - SEC-PERC-RESET-TRUST-02: Authenticated project creation, Atlas source grants, Bridge route/profile identity, and Atlas acceptance gate govern source-to-perception authority.
  - SEC-PERC-RESET-TRUST-03: Captured visuals cross into durable derived storage only through exact source/page/locator/hash-bound handoff and verified readback.
sensitiveAssets:
  - SEC-PERC-RESET-ASSET-01: Downloaded Docling model files and their protected volume/image identities.
  - SEC-PERC-RESET-ASSET-02: Original Safara PDFs, source hashes, and Atlas-owned derived image bytes.
identityContext:
  - SEC-PERC-RESET-IDENTITY-01: Docker context, container/image IDs, volume names/mounts, and Compose project identity remain explicit in reset evidence.
  - SEC-PERC-RESET-IDENTITY-02: Authenticated actor, project/document IDs, source hash, grant, RUN-003 capability/profile/cache identity, and asset locators remain bound through acceptance.
extensionSeams:
  - SEC-PERC-RESET-SEAM-01: Keep route/capability/profile and cache identity explicit so future policy can attach without broad allow-any activation.
  - SEC-PERC-RESET-SEAM-02: Keep source-grant and derived-asset authorization/readback checks at their existing Atlas authority boundaries.
prohibitedCouplings:
  - SEC-PERC-RESET-PROHIBIT-01: No blanket Docker prune/down may cross the protected Docling cache exception; no assumption based on a guessed volume name.
  - SEC-PERC-RESET-PROHIBIT-02: No image-disabled fallback, forged/dropped captured visual, semantic dispatch, or provider understanding claim may make perception appear accepted.
verificationSeams:
  - SEC-PERC-RESET-VERIFY-01: 001/004 evidence identifies the actual cache mount/content before and after canonical adoption and accounts for all Docker resources.
  - SEC-PERC-RESET-VERIFY-02: 002/003 evidence proves exact route admission, valid zero-image output, and strict per-visual asset integrity.
  - SEC-PERC-RESET-VERIFY-03: 005–008 evidence proves authenticated ownership, source-to-result identity, replay/restart idempotency, and zero semantic side effects.
unresolvedSecurityPolicy:
  - SEC-PERC-RESET-POLICY-01: No new security policy is selected by this reset; existing project authorization, grants, retention, and local-runtime boundaries remain in force.
planningFindings: []
reviewBindings:
  - REV-SEC-PERC-RESET-01 -> SEC-PERC-RESET-VERIFY-01: Confirm only the authorized Docker context/resources were changed and protected model data was durably reused; evidence: redacted engine inventories, actual mount/cache identity, command and exit-code record.
  - REV-SEC-PERC-RESET-02 -> SEC-PERC-RESET-VERIFY-02: Confirm RUN-003 is exact and sole, zero visuals are valid, and every present visual is fully source-bound; evidence: focused route/worker/authority tests and real normalized/asset records.
  - REV-SEC-PERC-RESET-03 -> SEC-PERC-RESET-VERIFY-03: Confirm Atlas ownership/grants and lifecycle authority remain intact through authenticated creation, restart, and replay; evidence: DB/queue state, scoped asset readback, and zero-semantic assertions.
```

## Source package

The eight bounded ticket bodies and parent implementation context are carried forward from `Clean up/Atlas_Canonical_Perception_Reset`. PERC-RESET-001's dependency label is aligned to the v1.2 parent context. The source package's Docker reset authorization is not executed by this ticket-authoring step.
