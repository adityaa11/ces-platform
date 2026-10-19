# CK replacement-contract freeze: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Ticket:** `IDSER-012-03-03-02` — GHR output compatibility and composition closure.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Frozen child ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`.
- **Parent contract:** `IDSER-012-03-03` — `RC-0120303-03` in `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md`.
- **Historical implementation checkpoint:** `f0e6953251621276de1c8807d0f80ebb21048be5`.
- **Protocol basis:** `3e709a7593ef6fa18b36adecb000ace62001414e` (`docs(atlas): add bounded replacement CK protocol`).
- **Artifact kind:** append-only CK replacement-contract freeze after an authority conflict.
- **Decision:** `REPLACEMENT_CONTRACT_FROZEN` — contract freeze only; not `PASS`, not implementation verification, not a new workflow lifecycle state, and not CFC authorization.

## Active tuple and records preserved

The active ticket is `awaiting_review`. This artifact freezes the replacement
contract for the historical post-CFC checkpoint; it does not review a new
implementation commit. The following records remain immutable and are not
rewritten:

1. Original CK: `project's goal/feedback/IDSER-BATCH-12-03-03-02-e20d7b5-review.md`.
2. First CFC checkpoint: `project's goal/feedback/IDSER-BATCH-12-03-03-02-cfc-checkpoint.md`.
3. Post-CFC CK verification: `project's goal/feedback/IDSER-BATCH-12-03-03-02-f0e6953-verification.md`.
4. HMN authority-conflict diagnosis: `project's goal/feedback/IDSER-012-03-03-02-hmn-001.md`.
5. Planning amendment: `project's goal/feedback/IDSER-012-03-03-02-planning-amendment-001.md`.

The current worktree contains pre-existing unrelated modified and untracked
entries, including the amended ticket records. The reviewed production and
test paths identified by the historical records are not modified by this
invocation. No production code or test was changed or executed.

## Replacement eligibility validation

Every prerequisite in the shared Atlas Review Contract replacement path and
the CK replacement procedure is present and validated:

| Prerequisite | Durable evidence and validation | Result |
| --- | --- | --- |
| Historical clause is unresolved after CFC verification | `IDSER-BATCH-12-03-03-02-f0e6953-verification.md`, `## Original finding verification`, records `CK-002.a` as `UNRESOLVED` and the decision as `CHANGES_REQUIRED`; same-input, asset, profile and structural evidence is explicitly insufficient for the historical source/REL oracle. | `SATISFIED` |
| HMN records the exact authority conflict | `IDSER-012-03-03-02-hmn-001.md`, `## Diagnosis` and `## Ticket-authority trace`, names the frozen changed-source and changed-REL oracle, the unavailable-only REL and accepted-source/resolver/persistence boundaries, and states that satisfying it would require an unauthorized REL revision or source-version/rebinding interface. | `SATISFIED` |
| HMN routes the conflict to human/planning authority and authorizes no ordinary CFC | The HMN decision is `HUMAN_DECISION_REQUIRED`; `## Authorized scope` is `None`; `## Required validation` forbids CFC until planning records the authority change. | `SATISFIED` |
| A subsequent explicit planning amendment supplies replacement authority | `IDSER-012-03-03-02-planning-amendment-001.md` records decision `IDSER_012_03_03_02_RC_03_V1_ALIGNED`, explicitly selecting the planning resolution from `HMN-IDSER-012-03-03-02-001`, and defines the active child and parent V1 contracts. | `SATISFIED` |
| Exact superseded requirements and reason are identified | The amendment's `## Superseded historical requirements` replaces only changed-REL replay, same-document source rebinding, manually changed proposal `sourceHash` as source-change evidence, and unavailable REL as a changed revision; it records the authority reason in `## Authority evidence`. | `SATISFIED` |
| Unrelated original obligations remain binding | The amendment preserves parent cancel, restart, crash-before-commit, lost-ack, concurrent-claim, immutable-version, exact-coverage and authorized structural-replan obligations, and preserves the existing hard-stop and metadata bindings. | `SATISFIED` |
| Replacement remains within approved authority | The amendment explicitly prohibits REL revision support, source rebinding, a second execution path, new provider/runtime, predecessor reopening and implementation authority. Its active contract uses the approved resolver, planner, persistence and non-delivering receiver boundaries. | `SATISFIED` |

The prerequisite audit is complete. The required fresh explicit user `hmn`
invocation is a post-freeze handoff condition, not a prerequisite for writing
this freeze, and is intentionally not present yet.

## Historical clause and supersession mapping

### Historical clause

`CK-002.a` from the original CK frozen matrix is the sole replacement target.
Its original authority was `RC-012030302-03`: replay the composed path across
changed source, asset, REL, profile and structural conditions, while proving
same-input identity stability and preservation of prior immutable plan/handoff
versions through the approved persistence interface.

The post-CFC verification preserves that exact historical oracle and records it
as unresolved. This artifact does not rename, rewrite, or mark `CK-002.a`
resolved.

### Superseded portion only

For effective V1 acceptance, the following portions of the historical
`CK-002.a` interpretation are superseded by planning amendment 001:

1. Replay across a changed accepted REL revision, because approved V1 exposes
   only `rel: { state: "unavailable" }` and has no authorized REL revision
   representation.
2. Any same-document source-rebinding or source-version implication, because
   the approved resolver selects an already accepted source binding and the
   approved persistence interface has no source-version/rebinding authority.
3. Treating a manually changed planner/proposal `sourceHash` as a changed
   accepted source.
4. Treating `rel: { state: "unavailable" }` as a changed REL revision.

The changed-source condition is not deleted wholesale: it is replaced by the
approved stale/mismatched-binding rejection and genuinely-distinct-accepted-
document scoping obligations frozen below.

### Original obligations that remain binding

All non-superseded obligations remain active, including same-input exact
identity replay; changed accepted-source-derived asset, BSS provider/process
profile and structural-bound immutability; exact stored provenance and
metadata; full source coverage; parent cancel/restart/crash-before-commit/
acknowledgement-loss/concurrency/immutable-version/authorized-replan rules;
the existing non-delivering GHR/BSS/SEM hard stop; and all ticket-bound
validation and direct-regression boundaries. The amendment does not reopen or
redesign resolved `CK-001.a`, `CK-001.b`, `CK-002.b`, or `CK-002.c`.

## Frozen replacement clauses

The replacement namespace is distinct and stable: `RCK-001.a` through
`RCK-001.e`. These clauses replace only the superseded portion mapped above.
They are frozen as active V1 acceptance obligations; this artifact does not
verify any of them and does not claim that existing evidence proves them.

### RCK-001.a — Same authorized-input replay identity

- **Active obligation:** The same authorized accepted-source input, passed
  through the approved resolver, planner and persistence interface, produces
  exactly the same persisted plan and handoff identities, hashes and parent
  membership on replay. Replay creates no duplicate records and mutates no
  prior immutable content.
- **Required harness and observations:** Use the real accepted-source
  composition path with the approved parser/resolver, BSS prospective reader,
  estimator, structural partitioner, immutable repository and fixture receiver
  against real PostgreSQL. Submit the identical immutable input twice; compare
  plan/handoff IDs, hashes, parent membership, row cardinality and persisted
  content.
- **Binary closure oracle:** `PASS` iff the committed real-PostgreSQL
  composition assertions show byte-equivalent plan/handoff identity and
  parent membership for both identical submissions, no duplicate records, and
  no mutation of the first immutable records. The CFC checkpoint must cite the
  exact assertions and the executed real-PostgreSQL harness command.
- **Direct-regression boundary:** The approved parser/resolver/planner,
  persistence atomicity/idempotency, immutable record semantics and
  non-delivering receiver must remain intact. No GHR, queue, BSS execution,
  SEM intake, provider call or downstream write may be introduced.
- **Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

### RCK-001.b — Changed asset/profile/structural-bound immutability

- **Active obligation:** When accepted-source-derived asset identity, BSS
  provider/process profile or structural-bound versions change through the
  approved interfaces, the prior plan/handoff content and identity remain
  immutable. Existing resolved findings are not reopened or redesigned.
- **Required harness and observations:** In the same real composition harness,
  persist the baseline, exercise each authorized changed asset, provider/process
  profile and structural-bound version through the approved repository path,
  then read the original plan and every referenced handoff. Observe exact
  identity, hash, parent membership and content preservation.
- **Binary closure oracle:** `PASS` iff each authorized changed-version case
  leaves the original plan and handoffs byte-for-byte unchanged and retains
  their original identities, hashes and parent membership, with assertions in
  the committed real-PostgreSQL harness and a passing recorded command.
- **Direct-regression boundary:** Preserve approved asset authority, BSS
  provenance, structural-fit semantics, immutable persistence and all four
  historically resolved clauses. Do not add a new provider/runtime, replan
  implementation, source rebinding or downstream execution path.
- **Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

### RCK-001.c — Approved source-binding outcomes

- **Active obligation:** (1) A stale or mismatched source binding for an
  existing accepted document fails closed through the approved resolver/
  persistence acceptance checks. (2) A genuinely distinct accepted document,
  resolved through approved Atlas authority, may create its own scoped plan.
  That distinct plan and its handoffs must not mutate the original document's
  plan/handoffs or become an implicit successor. A manually changed proposal
  `sourceHash` is not source-change evidence; same-document source rebinding
  and a new source-version interface are not authorized.
- **Required harness and observations:** Use the real accepted-document
  resolver and persistence acceptance boundary. Record the failed stale/
  mismatched-binding assertion, then resolve a genuinely distinct accepted
  document through Atlas authority and record its independently scoped plan,
  handoffs, source binding and absence of mutation or implicit-successor
  ancestry in the original records. Do not use a proposal-metadata-only hash
  edit as the changed-source observation.
- **Binary closure oracle:** `PASS` iff both the stale/mismatched existing-
  document case rejects closed and the distinct accepted-document case produces
  only its own scoped plan/handoffs with no original mutation or implicit
  successor. The CFC checkpoint must cite the exact resolver/persistence
  assertions and the real harness command; it must not claim same-document
  rebinding or a source-version interface.
- **Direct-regression boundary:** Keep the existing accepted-document,
  project/workspace/bundle/document scope, source-hash validation and
  predecessor compatibility gate. No second resolver, fallback, source store,
  source rebinding or predecessor reopening is allowed.
- **Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

### RCK-001.d — V1 unavailable-only REL contract

- **Active obligation:** V1 preserves exactly `rel: { state: "unavailable" }`
  from accepted-document resolution into persisted plan/handoff content.
  Unsupported or fabricated REL states fail validation or are not admitted.
  Replay across genuinely changed accepted REL revisions is deferred to a
  future separately authorized REL-capable contract and is not V1 completion
  evidence.
- **Required harness and observations:** On the real accepted-source
  composition path, read the persisted plan and every referenced handoff and
  assert the exact unavailable REL state. Exercise or inspect the approved
  validation boundary showing that an unsupported/fabricated REL state is
  rejected or cannot be admitted. Do not fabricate a changed REL revision and
  do not report deferred REL replay as tested or completed.
- **Binary closure oracle:** `PASS` iff stored accepted-source composition
  content contains exactly `rel: { state: "unavailable" }`, every unsupported
  or fabricated REL state is rejected/not admitted by the approved V1
  interfaces, and the evidence explicitly records changed REL revision replay
  as deferred rather than proven. The CFC checkpoint must cite exact stored
  content/validation assertions and the executed harness command.
- **Direct-regression boundary:** Preserve the accepted-document resolver,
  estimator and immutable persistence unavailable-only REL contract. No REL
  graph, REL revision authority, source rebinding or new dependency is
  introduced.
- **Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

### RCK-001.e — Immutable hard stop and exact zero downstream effects

- **Active obligation:** Original persisted plan/handoff content, hashes,
  identities and parent membership remain unchanged. Positive validation
  creates no GHR issuance, outbox, dispatch or acknowledgement; BSS admission,
  provider attempt or send; SEM execution; or reconciliation effect. The
  existing GHR/BSS/SEM hard-stop remains unchanged, including the ticket-bound
  semantic-truth, Master and CES zero-effect boundary where an instrumented
  surface exists.
- **Required harness and observations:** Around a positive, non-inert real
  composition and fixture-receiver validation, capture before/after counts for
  every available ticket-named surface: GHR issue/outbox/forward/ack, BSS
  work/admission/attempt/reservation/dispatch/transport/send, document-scoped
  semantic execution/candidate/evidence/knowledge-index, and reconciliation.
  Record absent GHR/Master/CES routes only through available instrumented
  boundaries; do not invent tables or routes. Confirm durable Atlas plan and
  handoffs exist while all forbidden deltas remain zero.
- **Binary closure oracle:** `PASS` iff the positive real-PostgreSQL harness
  proves the durable plan/handoff and validated unissued body exist, every
  available required before/after counter has zero delta, and the committed
  diff adds no downstream route, execution or delivery implementation. The CFC
  checkpoint must cite each counter assertion, the non-inert positive test and
  the executed command.
- **Direct-regression boundary:** Preserve the non-delivering fixture, exact
  GHR body boundary, no raw payload/credential persistence, no queue/outbox/
  provider/SEM/reconciliation writes, and no OPEN-A or future delivery
  activation.
- **Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

## Historical outcomes and protection rules

| Historical clause | Post-CFC outcome | Treatment after this freeze |
| --- | --- | --- |
| `CK-001.a` | `RESOLVED` | Protected; do not reopen or authorize. |
| `CK-001.b` | `RESOLVED` | Protected; do not reopen or authorize. |
| `CK-002.a` | `UNRESOLVED` | Preserved as historical failure; never authorize or rewrite this ID. Its superseded portion is effective only through `RCK-001.a`–`RCK-001.e`. |
| `CK-002.b` | `RESOLVED` | Protected; do not reopen or authorize. |
| `CK-002.c` | `RESOLVED` | Protected; do not reopen or authorize. |

The historical `CK-002.a` oracle remains visible for audit and is not silently
retained as an impossible active gate. All active non-superseded ticket and
parent obligations remain binding alongside the replacement clauses.

## Workflow decision and handoff

This freeze is complete and valid. It does not issue `PASS`, verify commit
`f0e69532`, authorize remediation, execute CFC, or approve the ticket.

The next workflow command is a **fresh explicit user invocation**:

```text
hmn IDSER-012-03-03-02
```

That HMN invocation may select only unresolved replacement IDs from this exact
artifact for at most one bounded `AUTHORIZE_EVIDENCE_REMEDIATION` CFC cycle.
It must protect `CK-001.a`, `CK-001.b`, `CK-002.b`, and `CK-002.c`, all active
non-superseded original obligations, and the frozen `RCK` oracles. It may not
authorize historical `CK-002.a`, add acceptance criteria, or rewrite this
artifact.

**Stop condition:** control returns to the user for the fresh HMN invocation.
