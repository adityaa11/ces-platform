# Atlas Staged Worker Pipeline Realignment
## Fair Docling Perception Admission and Future Semantic/Reconciliation Queue Pattern

**Status:** Implementation context / architecture realignment proposal  
**Repository:** `adityaa11/ces-platform`  
**Branch inspected:** `codex/new-atlas-backend`  
**Inspected branch HEAD:** `0d5e6242757b0adc6efc90904ee76eb3d8fec30b`  
**Encoding:** UTF-8, ASCII-safe Markdown  
**Immediate focus:** establish the local Docling worker/admission gate first; do not silently modify approved historical IDSER/BSS tickets.

---

## 1. Why this context exists

Atlas currently serializes an entire bundle around reconciliation:

```text
D1 perception
  -> D1 semantic extraction
  -> D1 reconciliation
  -> only then D2 perception
```

That sequencing was intentionally frozen by the earlier Initial Draft checkpoints. It was useful for proving the first safe end-to-end lifecycle, but it is now the wrong production execution shape.

The desired production worker pattern is:

```text
project creation
    -> immutable bundle manifest
    -> perception admission backlog
    -> bounded Docling worker pool
    -> accepted NormalizedDocument v1
    -> semantic queue / worker pool
    -> semantic-ready documents
    -> reconciliation admission
    -> one writer per bundle
    -> bundle complete / Ready for Review
```

Only reconciliation requires same-bundle serialization.

Perception and semantic extraction must not wait for prior-document reconciliation.

This is a deliberate lifecycle realignment. It must not be hidden inside BSS-V2-004-03, a provider adapter ticket, or a CFC remediation.

---

## 2. Repository state inspected

The inspected branch currently freezes these relevant behaviors.

### 2.1 Project creation schedules only D1

`packages/atlas-db/src/project-repository.ts`

Current creation behavior:

```text
all documents persisted in upload order
    -> extraction_bundle
    -> D1 member = perception_queued
    -> D2..DN = pending
    -> create only D1 perception execution/grant
    -> enqueue only D1 pg-boss perception job
```

This is the implementation of approved `IDSER-003`.

### 2.2 Reconciliation currently schedules the next PDF

`packages/atlas-db/src/reconciliation-acceptance.ts`

Current accepted reconciliation does:

```text
reconcile Dn
    -> member completed
    -> completed_document_count recomputed
    -> find D(n+1) pending
    -> create D(n+1) perception execution/grant
    -> enqueue D(n+1) perception job
```

This is the procedural coupling that must eventually be removed.

### 2.3 Current selector assumes manifest-sequence reconciliation

`packages/atlas-db/src/reconciliation-selector.ts`

Prior candidates are currently restricted by:

```text
m.sequence < current.sequence
AND prior member state = completed
AND prior reconciliation lifecycle = completed
```

That means the current reconciler is explicitly sequence-oriented. It cannot yet support a ready order such as:

```text
semantic A ready
semantic C ready
semantic B ready

reconcile A
reconcile A + C
reconcile A + C + B
```

without a separate reconciliation redesign.

### 2.4 One Bridge concurrency value is shared across queues

`apps/agents-bridge/src/worker-config.ts`  
`apps/agents-bridge/src/worker.ts`

Current configuration exposes one:

```text
AGENTS_BRIDGE_WORKER_CONCURRENCY
```

and applies the same `localConcurrency` to both:

```text
bridge-background-execution-v1
atlas-document-perception-v1
```

The Docling lane and future semantic lane therefore do not yet have independently bounded worker capacities.

### 2.5 Docling is already a persistent local processor

The accepted path remains:

```text
pg-boss
 -> Agents Bridge worker
 -> BSS-009 source redemption
 -> Compose-private persistent Docling Serve
 -> deterministic mapper
 -> NormalizedDocument v1
 -> Atlas acceptance/cache
```

No Redis/RQ/second broker is needed.

---

## 3. Approved history that must be referenced, not rewritten

The new work must explicitly consume the following accepted contracts.

### Queue/runtime authority

- `BSS-006` - pg-boss background runtime
  - PostgreSQL/pg-boss remains the durable queue authority.
  - Preserve retries, timeout/cancellation, idempotency, graceful shutdown and restricted Bridge DB role.
  - Do not introduce Redis, Kafka, RQ, or another broker.

### Perception/source authority

- `BSS-009`
- `BSS-009-01`
- `BSS-009-02`
  - Atlas owns perception execution state, source grant, result acceptance and normalized cache.
  - Raw PDF bytes never live in ordinary queue/database transport.
  - Source grants remain scoped and expiring.
  - Bridge cannot directly mutate Atlas trusted perception tables.

### Existing bundle kickoff and sequencing

- `IDSER-003`
  - immutable ordered bootstrap bundle
  - transactionally coupled creation + kickoff
  - current historical rule: only D1 is scheduled

- `IDSER-006`
  - accepted perception can atomically create semantic extraction
  - accepted extraction materialization is source/evidence validated

- `IDSER-007`
  - current historical rule: reconciliation acceptance schedules the next perception
  - atomic result/progress/next-job transition
  - same-bundle safety and cross-bundle concurrency

- `IDSER-008`
  - technical failure containment
  - final bundle completion gate
  - Ready for Review only after all required stages are valid

- `IDSER-010-02`
  - current historical proof that D2 is not scheduled before D1 reconciliation and D3 not before D2
  - this is the key rule the future realignment intentionally supersedes

- `IDSER-010-04`
  - concurrent bundle/project identity isolation must remain true

- `IDSER-010-05`
  - durable replay, fencing, acknowledgement-loss behavior and exactly-once logical effects must remain true

### Docling qualified route

- `BSS-V2-004-01`
  - persistent private Docling Serve
  - CPU local processor
  - warm readiness
  - deterministic mapping
  - <=20 second warm route qualification
  - local concurrency is a local resource concern, not an external quota domain

- `BSS-V2-004-02`
  - real D1 lifecycle through qualified Docling and Atlas acceptance
  - pg-boss remains lifecycle authority
  - source/replay/failure boundaries are inherited

### Future capacity work

- `BSS-V2-005`
  - external provider quota domains
  - explicitly **not** the local Docling capacity mechanism

- `BSS-V2-006`
  - later capability admission
  - explicitly requires local processor calls to keep a distinct bounded concurrency/resource seam

The new Docling gate should become that local seam; BSS-V2-006 should later consume/regress it rather than invent a second Docling control.

---

## 4. Historical rules intentionally superseded later

Do not edit the approved historical ticket text or CK evidence.

A new lifecycle amendment must explicitly state that it supersedes only these procedural rules for new production execution:

```text
IDSER-003:
"Only D1 perception is scheduled."

IDSER-007:
"Reconciliation acceptance creates/enqueues the next manifest member's perception."

IDSER-010-02 RC-010-02-03:
"D2 is not scheduled before D1 reconciliation acceptance and D3 not before D2."
```

Everything else remains inherited unless a new ticket explicitly says otherwise.

This distinction is mandatory for CK:

```text
historical proof remains true for the reviewed implementation
+
new ticket deliberately changes future production sequencing
```

not:

```text
rewrite old tickets until they look like the new design
```

---

## 5. Proposed new lifecycle ticket family

Use a new Initial Draft lifecycle amendment rather than hiding this work inside BSS provider productionization.

Recommended namespace:

```text
IDSER-012 - Staged worker pipeline realignment
```

This is a new lifecycle authority after the historical IDSER sequence.

### IDSER-012-01 - Fair bounded local perception admission foundation

Immediate work.

Own only:

```text
explicit Docling local capacity = 2
dedicated Bridge perception worker concurrency = 2
Atlas fair perception admission primitive
bundle-aware fairness
elastic borrowing
global max admitted perception work = 2
fresh BSS-009 grant only for admitted work
pg-boss remains execution queue
race-safe admission
failure/replay/restart proof
```

Do **not** yet redesign semantic extraction or reconciliation ordering in this child.

The safest CK boundary is to establish and qualify the gate first.

### IDSER-012-02 - Multi-document perception/extraction decoupling

Future activation after the production semantic extraction route is qualified/released.

Own:

```text
project bundle documents can become perception-eligible independently
perception completion refills the local perception gate
accepted perception schedules semantic extraction for that document
no dependency on prior-document semantic/reconciliation completion
semantic extraction jobs may proceed independently
```

This child formally supersedes the old D1 -> reconciliation -> D2 scheduling rule.

### IDSER-012-03 - Semantic-ready reconciliation admission and keyed single writer

Future reconciliation redesign.

Own:

```text
semantic-ready state
ready-order reconciliation
one active reconciliation writer per bundle
different bundles may reconcile concurrently
no manifest/upload order as truth priority
reconciliation context = already reconciled bundle knowledge + current document
directional relationship semantics independent of processing order
```

This must not be hidden inside the perception ticket.

### IDSER-012-04 - Completion/failure/read-model regression checkpoint

Final composition.

Own:

```text
N/N completion under the staged pipeline
technical failure behavior
project-card lifecycle projection
restart/replay/fencing
multi-user/multi-bundle isolation
Ready for Review gate
no Master mutation
```

---

## 6. Immediate Docling gate architecture

The immediate target is a standard **admission backlog + execution queue + worker pool** pattern.

Do not enqueue every PDF with an expiring source grant immediately.

BSS-009 grants currently expire after five minutes. A large global backlog in pg-boss would therefore turn queue wait time into source-authorization failure.

Instead:

```text
Atlas bundle manifest
    |
    | members not yet admitted remain durable `pending`
    v
FAIR PERCEPTION ADMISSION GATE
    |
    | at most two admitted executions globally
    | grant created only now
    v
pg-boss atlas-document-perception-v1
    |
    v
Bridge perception workers (2)
    |
    v
Docling Serve local workers (2)
```

The durable bundle manifest is the backlog.

pg-boss contains only **admitted executable perception jobs** with fresh scoped grants.

This is not a second broker.

---

## 7. Three-layer capacity invariant

The local route needs one explicit capacity value with three enforcement layers.

```text
Atlas perception admission permits          = 2
Bridge perception consumer concurrency      = 2
Docling local conversion workers            = 2
```

The layers have different purposes:

```text
Atlas gate:
fairness + just-in-time source grant + no over-admission

Bridge worker:
process-level safety bound + queue consumption bound

Docling:
actual local conversion capacity
```

A mismatch must fail qualification/readiness rather than silently rely on defaults.

### Current repository mismatch to fix

Current Compose contains:

```text
DOCLING_SERVE_WORKERS=1
DOCLING_LOCAL_CONVERSION_CONCURRENCY=1
```

but the observed running Docling v1.36.0 local engine reported:

```text
engine = local
local_workers = 2
```

The new ticket must stop relying on misleading/ignored variables and configure the real Docling Serve setting explicitly.

For the currently observed v1.36.0 local engine, freeze and verify:

```text
DOCLING_SERVE_ENG_KIND=local
DOCLING_SERVE_ENG_LOC_NUM_WORKERS=2
UVICORN_WORKERS=1
```

Keep CPU/thread settings separately bounded.

Do not claim the two-worker profile is CK-qualified merely because the current default happened to be two. Re-run a bounded two-concurrent-document qualification and determinism/resource check.

---

## 8. Split Bridge worker capacity by lane

Current:

```text
AGENTS_BRIDGE_WORKER_CONCURRENCY=2
```

is reused for both semantic/background and perception queues.

Replace the single operational knob with separate bounded values, for example:

```text
AGENTS_BRIDGE_PERCEPTION_CONCURRENCY=2
AGENTS_BRIDGE_BACKGROUND_CONCURRENCY=<existing/default profile>
```

Do not let future semantic worker tuning accidentally change the maximum Docling concurrency.

`apps/agents-bridge/src/worker.ts` should use distinct `workOptions` for:

```text
atlas-document-perception-v1
bridge-background-execution-v1
```

The queue technology and retry semantics remain unchanged.

---

## 9. Fair admission policy

Fairness is **bundle-level**, not user-plan-level.

Do not introduce subscription, tenant priority, paid-plan weighting, or per-user entitlement in this ticket.

When a perception permit becomes free:

1. consider only eligible bundles:
   - bundle state `waiting` or `processing`;
   - at least one `pending` member;
   - no bundle-level technical failure / `needs_attention`;
2. choose the least-recently-admitted eligible bundle;
3. inside that bundle choose the lowest manifest `sequence` still pending;
4. create the perception execution and fresh BSS-009 grant;
5. enqueue the existing pg-boss perception job transactionally;
6. mark that member `perception_queued`;
7. repeat until global admitted work reaches 2 or no eligible work remains.

Tie-breakers must be stable, for example:

```text
never-admitted bundles first
then oldest last admission
then bundle created_at
then stable bundle id
```

Manifest sequence controls which PDF is chosen **within** a bundle.

Manifest sequence does not create truth precedence.

---

## 10. Elastic borrowing

Fairness must not waste a free Docling slot.

If only Project A is active:

```text
Project A: PDF A B C D
capacity: 2

slot 1 -> A
slot 2 -> B
then
slot 1 -> C
slot 2 -> D
```

If Project B and Project C appear while A already owns both slots, do not preempt in-flight work.

When the next slots become free, the never/least-recently-served bundles get the next admissions.

Therefore:

```text
fairness applies at admission boundaries
not by killing/reassigning already-running conversions
```

---

## 11. Required multi-project simulation

Given:

```text
User A / Project A
  PDF A
  PDF B
  PDF C
  PDF D

User B / Project B
  PDF E
  PDF F
  PDF G
  PDF H
  PDF I

User C / Project C
  PDF J
  PDF K
```

When all three bundles are already eligible before admission begins, the logical bundle selection rotates:

```text
A -> B -> C -> A -> B -> C -> ...
```

One valid two-slot illustration is:

```text
admission 1: Project A / PDF A
admission 2: Project B / PDF E

admission 3: Project C / PDF J
admission 4: Project A / PDF B

admission 5: Project B / PDF F
admission 6: Project C / PDF K

Project C empty

admission 7: Project A / PDF C
admission 8: Project B / PDF G

admission 9: Project A / PDF D
admission 10: Project B / PDF H

Project A empty

admission 11: Project B / PDF I
```

Do not freeze exact worker-1/worker-2 completion order as a correctness oracle because real document latencies differ.

Freeze these properties instead:

```text
global admitted/in-flight perception <= 2
no eligible bundle starves
new/least-recently-served bundle receives a turn before an already-served bundle receives another turn under contention
idle capacity is borrowable
within-bundle chosen PDF follows pending sequence
```

If Project A was created earlier and already borrowed both slots before B/C existed, that is valid. B/C receive the next free admissions; no preemption is required.

---

## 12. Race-safe admission transaction

The scheduler must not use:

```text
count active
-> unlock
-> later enqueue
```

because concurrent project creation/completion transactions could both see a free slot and over-admit.

Use one Atlas-owned serialization seam.

Recommended shape:

```text
BEGIN
  acquire Atlas perception-admission gate lock
  count current non-terminal admitted perception executions
  calculate available permits
  while permit available:
      select next fair eligible bundle/member
      create execution + scoped grant
      enqueue pg-boss job using same transaction
      mark member perception_queued
  commit
END
```

A small Atlas-owned singleton gate row with `SELECT ... FOR UPDATE` is preferable to an invisible in-memory mutex.

If a migration is added, it must contain only operational scheduling metadata/lock identity. No source bytes, credentials, semantic truth, pricing, or product entitlement.

Bridge must retain no write access to this Atlas table.

---

## 13. What counts as an occupied permit

A permit remains occupied while its Atlas perception execution is non-terminal.

At minimum, treat these existing execution states as occupying capacity:

```text
queued
fetching_source
perceiving
normalizing
delivering_result
```

Terminal:

```text
completed
failed
cancelled
```

The exact implementation may currently use only a subset of intermediate states, but capacity accounting must fail safe: an execution that has not durably reached a terminal state must not release its slot early.

Result-delivery acknowledgement loss therefore does not accidentally create an extra Docling admission.

---

## 14. Refill events

The gate is refilled only at authoritative state transitions, not by an in-memory callback.

Future activated lifecycle should call the same transactional admission function from:

```text
project/bundle creation
perception acceptance after durable completion
terminal perception failure/cancellation
```

The admission function must be idempotent/race-safe.

Do not add a second polling daemon.

pg-boss remains responsible for admitted-job retry/restart behavior.

---

## 15. Source-grant rule

This is a critical reason not to dump the complete bundle into pg-boss immediately.

Current BSS-009 source grants are bounded and expire.

Therefore:

```text
pending bundle member
    !=
already-issued source grant
```

Only an admitted member receives:

```text
perception execution
source grant
pg-boss perception job
```

A PDF waiting behind other projects cannot lose because its source grant expired before a worker ever had capacity.

Do not extend the BSS-009 grant lifetime merely to make a giant queue work.

Do not place raw PDF bytes or DocumentStore paths in the admission backlog.

---

## 16. Failure behavior

### Perception failure

If an admitted document reaches terminal technical failure:

```text
that member -> needs_attention
that bundle -> needs_attention
```

Preserve IDSER-008.

The failed bundle's remaining pending documents are no longer eligible for new perception admission until an independently authorized recovery design exists.

The released local permit may be assigned to another eligible bundle.

### Worker/process restart

Preserve BSS-006 and IDSER-010-05:

```text
same admitted job
same logical execution
pg-boss retry/replay
no duplicate normalized result
no duplicate logical completion
```

A restart must not allocate an additional permit merely because the process-local worker disappeared.

### Docling restart/readiness loss

Preserve BSS-V2-004-01/02:

```text
unready Docling
-> no successful local conversion
-> bounded retry/failure
-> no trusted partial result
```

The gate does not make container liveness equivalent to route readiness.

---

## 17. Immediate ticket non-goals

`IDSER-012-01` must not implement:

```text
semantic batching
Anoman adapter
provider quota domains
semantic worker fairness
semantic result schema changes
semantic-ready document state
reconciliation queue
single-writer reconciliation
relationship-direction redesign
Ready for Review behavior changes
Master/publication
CES
chat
per-user paid priority
customer plan limits
another queue technology
Docling RQ/Redis
```

Those are separate authorities.

---

## 18. Why reconciliation must be a later ticket

Current reconciliation is structurally sequence-based.

The existing selector requires prior documents to satisfy:

```text
prior sequence < current sequence
prior member completed
prior reconciliation completed
```

The future desired ready-order flow:

```text
semantic A done
 -> reconcile A
 -> accepted A

semantic C done
 -> reconcile against accepted/reconciled A + C
 -> accepted A + C

semantic B done
 -> reconcile against accepted/reconciled A + C + B
 -> accepted A + C + B
```

requires changing the reconciliation authority itself.

That later ticket must solve at least:

```text
semantic_ready lifecycle state
ready-order selection
per-bundle reconciliation lease/single writer
already-reconciled-set selection instead of sequence < current
directional relationship semantics independent of processing order
```

Do not let the perception ticket guess at these semantics.

---

## 19. Future keyed single-writer rule

The final staged pipeline should enforce:

```text
Perception:
global local capacity bound
parallel across/within bundles

Semantic extraction:
provider-capacity controlled
parallel across/within bundles

Reconciliation:
one active writer for bundle X
one active writer for bundle Y
one active writer for bundle Z
X/Y/Z may run simultaneously
```

Never:

```text
one reconciler globally
```

and never:

```text
multiple concurrent reconciliation writers mutating the same bundle
```

The keyed writer identity is the stable bundle ID, not project display name, user name, filename, upload order, or page order.

---

## 20. Direct implementation seams for IDSER-012-01

Expected inspected/edit surfaces:

```text
apps/agents-bridge/src/worker-config.ts
apps/agents-bridge/src/worker.ts
apps/agents-bridge/src/worker-main.ts
apps/agents-bridge/tests/*worker*
apps/agents-bridge/tests/*perception*

docker-compose.yml

packages/atlas-db/src/project-repository.ts
packages/atlas-db/src/perception-authority.ts
packages/atlas-db/tests/project-repository.integration.test.ts
packages/atlas-db/tests/perception-authority.integration.test.ts

packages/atlas-db/migrations/<new-idser012-admission-migration>.sql
```

For the foundation-only child, avoid changing reconciliation acceptance except for direct regression coverage.

Activation/removal of next-document scheduling from:

```text
packages/atlas-db/src/reconciliation-acceptance.ts
```

belongs to `IDSER-012-02`, not `IDSER-012-01`.

---

## 21. Required Review Contract for IDSER-012-01

### RC-012-01-01 - Explicit qualified local capacity

The running local route has one explicit reviewed profile:

```text
Docling local workers = 2
Bridge perception concurrency = 2
Atlas admission capacity = 2
Uvicorn workers = 1
```

**PASS iff:**

- runtime inspection reports the expected Docling local worker count;
- no ignored/misleading variable is represented as the control;
- the profile is deployment configuration, not hard-coded business semantics;
- a mismatch fails readiness/qualification rather than silently drifting.

### RC-012-01-02 - Hard global bound

Under controlled concurrent load, no more than two admitted local perception executions can reach Docling concurrently.

**PASS iff:**

- two calls may be held in-flight;
- a third eligible PDF remains untransmitted/unadmitted until a permit frees;
- observed Docling maximum concurrency never exceeds two.

### RC-012-01-03 - Bundle-fair admission with elastic borrowing

With Projects A/B/C and the 4/5/2 PDF fixture:

**PASS iff:**

- active bundles receive fair turns under contention;
- a new/least-recently-admitted bundle cannot be starved by a large existing bundle;
- only one bundle may borrow both permits when no competing eligible bundle needs them;
- already-running work is never preempted.

### RC-012-01-04 - Fresh grant and transactional enqueue

A pending document receives no perception source grant merely for waiting.

Admission atomically creates:

```text
execution
grant
pg-boss job
member perception_queued state
```

**PASS iff:**

- rollback exposes none of those effects;
- an admitted job has the fresh existing BSS-009 request/grant shape;
- pending jobs have no expiring grant/job;
- raw source/storage keys do not enter queue transport.

### RC-012-01-05 - Race/replay/failure safety

Concurrent project creation, simultaneous slot release, duplicate delivery, worker restart and terminal perception failure preserve:

```text
max admitted <= 2
one logical perception execution per admitted document/version
no duplicate completion/cache
no cross-bundle identity mutation
```

The failed bundle becomes `needs_attention`; other eligible bundles may use the freed capacity.

### RC-012-01-06 - Two-worker Docling qualification

Run real warm two-concurrent supported digital PDFs through the exact qualified profile.

**PASS iff:**

- both outputs remain parser-valid `NormalizedDocument v1`;
- page/content/IDs remain materially deterministic against sequential controls;
- no new concurrency-specific source corruption is observed;
- each document stays within the existing warm-route latency gate or an explicit new performance decision is raised;
- CPU/RAM observations are recorded;
- no CUDA or remote service is silently introduced.

---

## 22. Required Compose proof matrix

At minimum:

```text
1. inspect effective Compose config
2. inspect running Docling engine kind/local worker count
3. inspect Bridge perception worker configured concurrency
4. verify worker warm readiness marker
5. one-bundle / four-PDF elastic borrowing
6. three-bundle A(4), B(5), C(2) fairness case
7. hold two Docling calls and prove third cannot transmit
8. concurrent project-creation race around one free permit
9. admission transaction rollback after pg-boss enqueue
10. worker restart/replay with admitted jobs
11. Docling restart/readiness recovery
12. terminal perception failure frees capacity for another bundle
13. source grant expiry regression: pending/unadmitted member has no grant to expire
14. Bridge DB role denial for new Atlas admission table
15. existing BSS-006 queue regressions
16. existing BSS-009 authority/cache regressions
17. existing BSS-V2-004-01/02 readiness/perception regressions
18. IDSER-010-04 cross-bundle isolation regression
19. IDSER-010-05 replay/fencing regression
20. git diff --check
```

Use scoped fresh identities. Do not destroy volumes as routine cleanup.

---

## 23. Security Refactor Readiness

**Status:** applicable.

### Inherited boundaries

```text
BOUNDARY-IDSER012-PGBOSS
pg-boss remains the only durable execution broker.

BOUNDARY-IDSER012-SOURCE
BSS-009 remains the only source-grant/redemption authority.

BOUNDARY-IDSER012-ATLAS
Atlas owns admission state and bundle/member lifecycle.

BOUNDARY-IDSER012-BRIDGE
Bridge executes admitted work but cannot write Atlas trusted state.

BOUNDARY-IDSER012-DOCLING
Docling receives only exact authorized bytes over the private service boundary.
```

### New seams

```text
SEAM-IDSER012-LOCAL-CAPACITY
one explicit local processor capacity profile

SEAM-IDSER012-FAIR-ADMISSION
race-safe bundle-fair selection before execution enqueue

SEAM-IDSER012-GRANT-JIT
source grant exists only for admitted executable work
```

### Prohibited couplings

```text
COUPLING-IDSER012-RECON-DRIVES-PERCEPTION
reconciliation may not remain the future perception scheduler

COUPLING-IDSER012-USER-PLAN-FAIRNESS
no product-plan/user-priority policy in the local worker gate

COUPLING-IDSER012-SECOND-BROKER
no Redis/RQ/Kafka/extra queue technology

COUPLING-IDSER012-DOC-BYTES-IN-QUEUE
no raw PDF/storage path in queue/admission records

COUPLING-IDSER012-INMEMORY-SEMAPHORE
process-local semaphore cannot be the durable admission authority
```

### Unresolved policy

```text
per-user fairness / customer plan weighting
multi-host distributed Docling capacity
multiple simultaneous perception-route pools
GPU profile
OCR/scanned-PDF capacity
production host sizing
```

These remain future scope.

---

## 24. Interaction with BSS-V2-004-03-07

`BSS-V2-004-03-07` is currently planned and still describes a D1-only semantic continuation.

Do not silently change its implementation while executing another ticket.

Recommended handling:

1. finish/CK the local fair perception gate foundation;
2. keep 004-03-04/05/06 semantic productionization scoped to their existing responsibilities;
3. before executing 004-03-07, explicitly reconcile its planned text with the accepted IDSER-012 state;
4. if multi-document perception activation has not yet occurred, 004-03-07 may retain its bounded D1 extraction proof;
5. activate the full multi-document staged flow only in IDSER-012-02 after the extraction route is qualified.

This keeps provider qualification and lifecycle sequencing as separate review authorities.

---

## 25. Final target after all staged tickets

```text
Authenticated Project Creation
        |
        v
immutable bundle manifest
        |
        v
+--------------------------------+
| Atlas Fair Perception Backlog  |
| bundle-aware / durable         |
+--------------------------------+
        |
        | admit <= 2
        v
+--------------------------------+
| pg-boss Perception Queue       |
+--------------------------------+
        |
        v
Bridge Perception Workers (2)
        |
        v
Persistent Docling Workers (2)
        |
        v
NormalizedDocument v1
        |
        v
+--------------------------------+
| Semantic Queue                 |
+--------------------------------+
        |
        v
Semantic Worker Pool
+ external-provider admission
        |
        v
semantic_ready
        |
        v
+--------------------------------+
| Reconciliation Admission       |
+--------------------------------+
        |
        v
KEYED SINGLE WRITER PER BUNDLE
        |
        v
reconciled document
        |
        v
all N reconciled?
        |
       yes
        v
Ready for Review
```

Core dependency rule:

```text
semantic(document X)
depends only on accepted perception(document X)

reconciliation(document X)
depends on semantic-ready(document X)
and the bundle's current reconciled knowledge snapshot

perception(document Y)
does NOT depend on semantic/reconciliation(document X)
```

---

## 26. Hard-stop rule for the immediate implementation

The first implementation ticket stops after proving the **fair, bounded, two-worker local perception admission foundation**.

Do not continue into semantic/reconciliation lifecycle realignment in the same GO pass.

CK should be able to answer one narrow question:

> Can Atlas safely and fairly feed a two-worker local Docling route across multiple concurrent bundles, with fresh source authorization, no over-admission, no starvation, no second broker, and all existing replay/source/trust boundaries intact?

Only after that receives CK PASS should the next staged lifecycle ticket consume it.
