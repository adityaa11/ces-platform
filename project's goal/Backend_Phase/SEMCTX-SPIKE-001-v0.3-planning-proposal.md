# SEMCTX-SPIKE-001 v0.3 — deterministic ownership and honest partial coverage

- **Status:** `PLANNING_READY_FOR_REVIEW`; implementation is **not authorized**.
- **Authority:** user-directed HMN re-specification on 2026-10-11; the v0.2 charter and its execution evidence are diagnostic input, not a v0.3 oracle.
- **Scope:** an offline, isolated F1–F3 batching experiment only. F4 correction and simulated reconciliation are future qualification concerns and are excluded.
- **Hard boundary:** this proposal neither changes nor authorizes Semantic V1, production code, schemas, queues/admission, source-relationship authority, reconciliation, acceptance, providers, or `SCHEMA_FIT_BLOCKED`.

## 1. v0.2 failure and lessons-learned ledger

| ID | Observed v0.2 fact | Why it is insufficient | v0.3 control |
| --- | --- | --- | --- |
| L-01 | F1 initially encoded empty `deferred` as an array while populated results were source-keyed maps. | A result representation was not one type across all cases. | One canonical source-record ledger, with a source ID key in every state. |
| L-02 | The planner's F3 result owned `F3-D`; gold deferred it with `F3-C`. | Gold assumed that context for C cannot independently be semantic work. That policy was never established. | Eligibility is per original source. Context role in one request never changes ownership or eligibility elsewhere. |
| L-03 | Closure followed every authorized essential edge transitively. | It obscured the difference between required input for an owner and independently eligible output. | Closure is owner-local and includes only declared **essential** incoming context; optional/comparison edges are excluded. |
| L-04 | Deferred was used as the main planning signal. | It collapsed not-planned, oversized, cyclic, and unexecuted work. | `planned`, `executed`, `completed`, and `deferred` are distinct state transitions. |
| L-05 | The experiment combined batching, F4 mock correction, and mock reconciliation. | A failure in one concern could not isolate a batching/coverage conclusion. | F4 is removed. v0.3 has no correction or reconciliation behavior. |
| L-06 | Fixture hashes covered inputs but no complete immutable oracle bundle. | A later expected-result edit could silently rationalize an implementation. | A content-addressed manifest binds fixtures, oracle, negative matrix, profile, and legacy-read-only baseline hashes before any simulator exists. |

The v0.2 F3 mismatch is therefore recorded as a rejected assumption, not a simulator defect to patch. It does not establish that F3-D must be deferred.

## 2. Behavioral and ownership contract

### 2.1 Source identity and output ownership

An **original source identity** is the immutable tuple `(document_sha256, scope, locator, source_id, source_content_sha256)`. It belongs to the input inventory and cannot be synthesized, renamed, or transferred.

An **output owner** is exactly one independently eligible original source that a request is allowed to semantically interpret. Each completed provisional assertion names one output owner. Repeated context names an original source with role `essential_context`; it is never an output owner in that request and does not consume its independent ownership right.

Every source has exactly one document-ledger terminal disposition:

| Disposition | Meaning | Counts as semantic coverage? |
| --- | --- | --- |
| `completed` | Its owned request executed and returned a static untrusted provisional assertion. | Yes, for that source only. |
| `deferred` | It was not semantically interpreted; the record names a stable reason and dependency/budget evidence. | No. |

The operational states are separate and ordered: `unplanned -> planned -> executed -> completed`, or `unplanned/planned -> deferred`. `planned` only records an admissible payload; it is not coverage. `executed` only records the deterministic mock executor was invoked; it is not coverage. A source has no completed state until its fixed expected assertion record is emitted. No state emits `semantic_ready`, acceptance, or a canonical Semantic V1 envelope.

### 2.2 Context eligibility policy

For each source, the oracle declares one of:

- `independent_eligible`: may be an output owner in a standalone bounded request.
- `context_only`: may appear only as declared essential context and is never independently semantically interpreted. This is valid only with a fixture-local, explicit policy reason and a source-specific test assertion.
- `not_eligible`: cannot be interpreted in this experiment; it must be deferred with a reason.

`context_only` is not inferred from graph position, kind, adjacency, request reuse, or the fact that another source needs it. It is a narrow deliberate policy, not a convenience to force expected ownership.

**F3-D decision:** F3-D is `independent_eligible`. Its v0.2 standalone request fits the synthetic limit, and no independently established policy makes it context-only. It must therefore produce one independent untrusted provisional assertion, while it may also appear as essential context for F3-C. This does not make F3-C fit.

### 2.3 Dependency closure and cycles

An owner payload contains the owner plus its direct, authorized, scope-matching **essential** context. Essential context recursively includes an upstream source only when the edge explicitly says that the context source itself requires it to make the owner meaningful. Optional and comparison edges are recorded but never enlarge a request. Rejected, mock-only, stale, foreign-scope, substituted, or fabricated edges never enter closure.

A directed essential cycle is detected by strongly connected components before planning. All members of a cyclic component are deferred with `ESSENTIAL_DEPENDENCY_CYCLE`, the component member IDs, and edge IDs. The planner must not break a cycle by arbitrarily selecting a root or by treating a cycle member as context-only. Work outside the component remains eligible under its own closure.

### 2.4 Bounded planning and graceful deferral

The frozen profile is synthetic: full canonical UTF-8 serialized request bytes `<= 4096`, `owned_slots = 1`, `context_slots <= 2`. All envelope fields count. An indivisible source cannot be truncated or row-split. If an owner plus its authorized essential closure exceeds a bound, only that owner is deferred as `IRREDUCIBLE_ESSENTIAL_CLOSURE_OVERFLOW`; independently eligible context remains independently plan-able unless it separately fails.

Deferral is a first-class outcome, with `reason`, `blocking_edges`, `closure_members`, `observed_payload_bytes` when applicable, and `state=deferred`. It is never encoded as `non_fact`, completion, or success.

### 2.5 Document-level coverage

Document coverage is computed only from ledger rows, not claimed by a model:

`coverage = complete` iff every inventory source is `completed`; otherwise `coverage = partial` iff at least one source is completed; otherwise `coverage = none`.

All v0.3 F2/F3 document results are `partial`; F1 is `complete`. A partial document has no partial canonical acceptance: every assertion remains `untrusted_provisional`, `accepted=false`, and `semantic_ready=false`; no aggregate becomes a canonical candidate or invokes reconciliation.

Image assets are independently inventoried with `(source_id, asset_ref, asset_sha256, locator)`. If included as context but not semantically interpreted, their ledger row is `deferred` with `ASSET_CONTEXT_ONLY_NOT_INTERPRETED`; they count as uncovered and are never labeled `non_fact`. If they are neither context nor owner, they still require a ledger row, normally `NOT_SEMANTICALLY_ELIGIBLE_BY_POLICY` with the explicit fixture policy. F2 deliberately rejects any attempt to hide F2-V this way.

## 3. Complete fixture specification and negative-case matrix

All fixtures are new v0.3 JSON inputs under a new directory. They reuse no v0.2 file as authority and contain no real document, provider, or image read.

| Fixture | Sources and declared edges | Expected plan and ledger | Independent justification |
| --- | --- | --- | --- |
| **F1 complete** | `F1-P` self-contained paragraph; `F1-T` indivisible self-contained table; no essential edges. Both `independent_eligible`. | Two one-owner requests; both `planned/executed/completed`; `coverage=complete`; two provisional assertions; no deferrals. | Neither source needs context and each serialized request fits. Distinct source identities prevent duplicate ownership. |
| **F2 unproven visual context** | `F2-P` independent paragraph; `F2-T` table whose required legend is `F2-V`; `F2-V` meaningful visual asset. The only T→V edge is rejected (same page/pairing/stale evidence). | P completes. T defers `SOURCE_RELATIONSHIP_UNPROVEN` citing rejected edge. V defers `MEANINGFUL_ASSET_UNINTERPRETED`, citing the absence of trusted interpretation/relationship authority. `coverage=partial`. | A rejected edge cannot enter closure; interpreting T would invent authority. V is meaningful and cannot be silently non-fact. P has no such dependency. |
| **F3 bounded mixed work** | A/B independent paragraphs; C indivisible oversized table; D independently eligible paragraph. C→D is authorized essential. E↔F are authorized essential-cycle edges. A→B comparison and B→C optional. | A, B, and **D** independently complete. C defers `IRREDUCIBLE_ESSENTIAL_CLOSURE_OVERFLOW` with C+D byte calculation. E/F each defer `ESSENTIAL_DEPENDENCY_CYCLE`. `coverage=partial`. | Optional/comparison edges do not close requests. C needs D and the joined payload exceeds 4096; D alone fits and has no context-only policy. The E/F SCC cannot be safely oriented. |

The fixture profile shall choose F3 content lengths such that `bytes(payload(D)) <= 4096` and `bytes(payload(C + D)) > 4096`, and record the exact fixed byte values in the oracle. This makes the F3-D conclusion mechanically testable rather than inferred from prose.

| Negative case | Fixture mutation | Binary expected result |
| --- | --- | --- |
| `N-01` forged identity | Duplicate or malformed locator, changed document SHA, or source content hash mismatch. | Reject before any plan/ledger output: `INTEGRITY_REJECTED`. |
| `N-02` edge authority spoof | Promote F2's rejected edge; use stale, foreign-scope, substituted, or fabricated edge evidence. | Reject authority-dependent operation; never plan T from that edge. |
| `N-03` all-edge closure | Mark F3 optional/comparison edge as implicitly mandatory without changing its declared type. | Plan hash/closure must be unchanged; otherwise fail. |
| `N-04` ownership leak | Put a context item in `owned`, duplicate any owner, or omit an inventory source. | Reject exact-once ownership/ledger assertion. |
| `N-05` silent overflow | Truncate C/D text, split C, or produce a payload over 4096. | Reject; C must remain deferred with the overflow reason. |
| `N-06` cycle escape | Remove a cycle member from deferral or select it as a root without an oracle edge change. | Reject `ESSENTIAL_DEPENDENCY_CYCLE` assertion. |
| `N-07` false coverage | Mark a planned/executed/deferred source completed, `non_fact`, accepted, or `semantic_ready`. | Reject document coverage/acceptance assertion. |
| `N-08` asset accounting loss | Omit F2-V or mark it non-meaningful/non-fact without an immutable policy declaration. | Reject asset inventory and uncovered-asset assertion. |
| `N-09` nondeterminism | Shuffle input order or run ten times. | Canonical plan, ledger, request hashes, and outcome hash are byte-identical. |

## 4. Immutable fixture-and-oracle hash strategy

Before a simulator is written, an independent reviewer creates `v0.3/gold/manifest.json` with SHA-256 for: each raw fixture; the normalized canonical fixture object; the exact expected plan; expected source ledger; expected assertion list; negative matrix; profile; and the read-only baseline path hashes. The manifest also contains a SHA-256 of itself computed over a canonical form that excludes only its `manifest_sha256` field.

The runner reads fixture and oracle bytes, recomputes every manifest member hash before importing simulator code, and fails closed on any mismatch. Expected outputs are compared to canonical JSON bytes, not merely subsets. The expected F3-D completion, F3-C overflow, and F2-V uncovered asset row are individual oracle fields. A source input, oracle, profile, or manifest change creates a new versioned fixture-and-oracle bundle and requires a fresh oracle-readiness review; it cannot be refreshed during a run.

Legacy baseline hashes are observation-only guards. They prove this isolated experiment did not alter named legacy files; they are not v0.3 behavior authority and do not permit modifying those files to make a check pass.

## 5. Binary acceptance criteria and stop conditions

`PLANNING_READY_FOR_REVIEW` is the only current result. Future implementation can report `READY_FOR_CK` only if every item below is true:

1. Manifest verification passes before execution; all F1–F3 inputs/oracles/profile hashes match.
2. Every original source has exactly one ledger row and exactly one terminal disposition; no source has more than one output owner.
3. Context roles are never owners in the same request; F3-D completes independently and remains context only within C's attempted closure.
4. Direct essential closure, edge authority/scope, optional-edge exclusion, and SCC deferral match the oracle exactly.
5. Every serialized request hash and byte count matches, all payloads are within bounds, and C's recorded required closure is over-bound.
6. F1 coverage is complete; F2/F3 coverage is partial with exact deferred reasons; no result has `semantic_ready`, `accepted=true`, canonical envelope, reconciliation result, or provider call.
7. F2-V's asset identity and un-interpreted disposition are asserted exactly.
8. All N-01 through N-09 fail/succeed exactly as specified; ten replays and a source-order perturbation produce identical canonical output hashes.
9. Static isolation and counters prove zero provider calls, image reads, database writes, queue/admission activity, and production mutations.

Stop immediately—without changing fixture, gold, simulator, production code, or legacy baseline—on: an undefined eligibility policy; an expected outcome lacking a source-local justification; unresolved exact byte boundary; a hash mismatch; any ambiguity in edge authority/scope; a test that cannot assert an acceptance item; a drift outside the isolated v0.3 paths; or any proposal to include F4/reconciliation. Record the reason as `PLANNING_DECISION_REQUIRED` and ask the planning authority the exact unresolved question.

## 6. Independent oracle-readiness review (required before GO)

The review is a separate, read-only artifact performed after this proposal and before any implementation authorization. It must verify, row by row, that each promised item has (a) immutable input IDs, (b) an exact expected value, (c) a named assertion site, and (d) no simulator-derived oracle. It must confirm:

- F1, F2, and F3 source inventories, byte calculations, statuses, request ownership/context sets, and coverage values are all fixed;
- every reason code and each N-01–N-09 mutation has a binary expected result;
- F3-D's independent eligibility and completed output are expressly asserted;
- F2-V's asset fields, un-interpreted state, and coverage effect are expressly asserted;
- F4/reconciliation assertions are absent; and
- the isolated inventory below contains no production path.

The review returns only `ORACLE_READY` or `ORACLE_NOT_READY` plus blocking rows. `ORACLE_NOT_READY` means no GO authorization. It does not revise expected outcomes itself.

## 7. Proposed isolated changed-file inventory and implementation budget

No files in this inventory are authorized to be created or changed now. A later, separately authorized implementation is limited to:

| Proposed path | Maximum responsibility |
| --- | --- |
| `scripts/semctx-spike-001-v0.3/fixtures/f1-complete.json` | F1 immutable input. |
| `scripts/semctx-spike-001-v0.3/fixtures/f2-unproven-context.json` | F2 immutable input. |
| `scripts/semctx-spike-001-v0.3/fixtures/f3-bounded-mixed.json` | F3 immutable input and calibrated synthetic text. |
| `scripts/semctx-spike-001-v0.3/gold/manifest.json` | Immutable oracle/hash bundle. |
| `scripts/semctx-spike-001-v0.3/planner.mjs` | Deterministic pure planner and ledger only. |
| `scripts/semctx-spike-001-v0.3/run.mjs` | Offline assertions, negative mutations, replay/isolation checks. |
| `scripts/semctx-spike-001-v0.3/README.md` | Invocation and explicit non-production limitations. |
| `project's goal/feedback/SEMCTX-SPIKE-001-v0.3-oracle-readiness-review.md` | Independent pre-GO review only. |
| `project's goal/feedback/SEMCTX-SPIKE-001-v0.3-execution-evidence.md` | Future execution evidence only. |

Budget: one pure Node.js module, one runner, three fixture files, one manifest, and documentation/evidence; no dependencies beyond Node built-ins; no imports from production packages; no edits outside these proposed paths. The budget excludes F4, mock correction, reconciliation, provider qualification, and any runtime integration.

## 8. Handoff

The next permitted activity is an independent, read-only oracle-readiness review of this v0.3 proposal. It is not GO and does not implement the simulator. `SCHEMA_FIT_BLOCKED` remains open and no downstream ticket is authorized.
