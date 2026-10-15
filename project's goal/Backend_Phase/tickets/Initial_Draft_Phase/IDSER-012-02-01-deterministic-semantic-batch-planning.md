# IDSER-012-02-01 — Capacity-aware Semantic Batch Planner and durable Planned Corpus hard stop

- **State:** `planned`; **GO BLOCKED** until exact BSS-V2-005/006 capacity interfaces, source/REL continuity and SEM corpus-compatibility prerequisites are demonstrably authorized. This prospective rewrite is **not** an implementation GO, CK PASS, or permission to activate semantic/provider work.
- **Batch:** `IDSER-BATCH-12-02-01`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Dependencies:** accepted PERC-RESET-008 / IDSER-012-01-03-02 NormalizedDocument V1 and granted asset identities; BSS-V2-005-01..04 genuine CK-qualified capacity/workload/DesiredAdmissionProfile contracts; BSS-V2-006-01..04 **when** runtime effective-constraint eligibility is required, with separately proven read-only interface; compatible versioned SEM-CUTOVER-007A corpus ownership and prompt/request/profile contract. Process registration and automatic plan convergence are a prospective separate [BSS-V2-005-05](../Stack_Setup_V2/BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md) obligation, not an assumed approved capability.
- **Decision record:** [October 16 hard-stop and process-agnostic plan](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md). [SEM winner](../../../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md) remains the sole semantic-methodology authority.

## Single owned responsibility: plan semantic corpus, then STOP

For each accepted, source-authorized `NormalizedDocument V1`, form **one or many semantic batches** according to *real capacity*, not page count or an assumed fixed token budget. Each batch contains exact **owned corpus slots**, optional bounded **context-only slots**, qualified source/asset/relationship references, and a per-batch multi-resource `RequestResourceEnvelope`. Freeze one deterministic full-document partition/plan plus **one durable `PlannedSemanticCorpusHandoff` per batch**; then stop.

```text
Perceived NormalizedDocument V1 + Atlas authorized derived-asset/source identities
      + BSS-V2-005 capacity/quota-domain + registered process/workload profiles
      + BSS-V2-006 effective safety constraint/eligibility authority
  -> deterministic, capacity-fit owned/context/REL corpus partition
  -> immutable document plan + durable per-batch PlannedSemanticCorpusHandoff
  -> HARD STOP (no provider request, reservation, semantic result, preparation or reconciliation)
                  |
                  v
Future SEM-CUTOVER corpus intake -> same stepwise v0.4.0 methodology
```

**The hard-stop artifact is NOT a Qualified Semantic Handoff.** That later semantic outcome is emitted **per batch** by SEM-CUTOVER after strict parsing, REL/SEM qualification and authorized persistence, and may independently trigger reconciliation preparation. Planner must neither wait for nor execute those stages. Complete document-level source accounting is a separate lifecycle proof and cannot hold back independent eligible batch work.

## Process-agnostic capacity input and fit, without guessing available tokens

1. **BSS-V2-005** owns external provider quota-domain ceilings (RPM/TPM/RPD/concurrency and window policy), qualified active/eligible process registry, versioned workload structural limits, estimators, output reservation, safety headroom, protection and `DesiredAdmissionProfile`. Planner must use the **chosen semantic process/workload identity as data**, not hard-code a special semantic quota algorithm. Future process types are registered under independently authorized versions.
2. **BSS-V2-006** owns effective runtime windows, observed pressure, clamp/cooldown, reservation, protected interactive budget and fair admission. Planner's capacity check consumes an explicitly qualified **read-only effective-constraint/eligibility seam** where needed; it **cannot** infer runtime capacity from catalogue values alone, invent an API or self-issue admission. If current runtime constraints are unavailable, mark planning/eligibility blocked or waiting according to an approved policy.
3. **Stable corpus sizing is distinct from transient quota availability.** Partition by approved structural/per-request maximum, conservative versioned estimates including system prompt, source specification, strict response schema, reserved output, media and relationship-context resource cost. A temporarily exhausted RPM/TPM window or cooldown makes existing fitting batches **wait for BSS-V2-006**, not become smaller or have their immutable contents silently rewritten. A structural/profile/route change may invalidate the plan and requires explicit versioned replan/requalification before any dispatch.
4. **Bootstrap, not a circular activation claim:** `-02-02` activates the semantic consumer only after this planner CK. For planning, use a separately registered **inactive/prospective qualified workload-envelope version** plus a genuine externally active quota-domain policy and any permitted BSS-V2-006 constraint read; this is **not** semantic route activation or a provider reservation. If the BSS interfaces cannot safely expose these inputs before activation, STOP `CAPACITY_PROFILE_BOOTSTRAP_GAP` and assign the missing integration to the BSS owner, rather than fabricate an already-active semantic process.
5. The planner is not the BSS capacity planner and does not update `DesiredAdmissionProfile`, change fairness weights, reclaim interactive reserves, query secrets, or infer provider limits. Generic BSS-V2-005 process-registration change re-planning and BSS-V2-006 backlog-driven fair borrowing remain separate owners. All outbound semantic calls later require **one fresh BSS-V2-006 reservation per actual attempt**.

## Planned Corpus Handoff contract (prospective, versioned)

Durable **document plan**: project/workspace/bundle/document/source SHA/NormalizedDocument and perception-execution identity; semantic profile and source-accounting version; exact eligible owned-locator partition across all batches (one owner per eligible locator); deterministic ordered batch IDs; plan version/hash; immutable BSS quota-domain/capacity/policy/workload/estimator/safety versions; explicit invalidation/replan reference.

Durable **per-batch handoff**, bound to the plan: `batchId`, scoped `planHash`, exact list of `ownedSourceLocators` and permitted `contextOnlySourceLocators`, relationship-revision IDs/hashes and direction/necessity, unresolved/deferred dependencies, granted asset locator/identity/hash references, qualified semantic profile/schema/request-estimator identities, and bounded `RequestResourceEnvelope` with independent RPM/TPM/RPD/concurrency and request/media/output bound. Include BSS versioned capacity snapshot/constraint identity where available. **No raw PDF, image bytes, provider secrets, or full prompt body in BSS work/admission metadata.** Future SEM intake redeems corpus text/media through Atlas-authenticated source grants, never trusts arbitrary caller-supplied bytes.

Context-only source can repeat across batches but never owns or emits `source_results`. Owned source is assigned exactly once across batches; visual locators missing actual granted media remain explicitly unexamined and cannot be declared non-fact. Preserve title/legend/condition temporal and contextual meaning; a split that requires unverified context must produce an explicit blocked/deferred relationship reference, not guessed canonical knowledge. Changes to any owned/context source, asset, REL revision, process/workload/estimator/profile or request inputs invalidate the corresponding hashes and eligibility.

**SEM ownership gap:** the current shared `buildStepwiseSourcePacket({document,assetIdentities})` consumes the whole document, and ordinary `runStepwiseSemanticComposition` does not place loaded prior provisional revisions in its provider-facing packet. Planner may define the source-authorized batch corpus interface, but **must STOP `SEM_BATCH_CORPUS_INTAKE_GAP`** if exact batch-owned/context bytes, cross-batch relationship meaning, final prompt/schema/wire-size proof or version/hash equality cannot be obtained from a separately authorized SEM-owned intake extension. Do **not** mutate the frozen `v0.4.0` profile in place, forge single-batch byte equivalence, or implement a second extractor/compiler under IDSER.

## Frozen review contract (every item must be proven for CK PASS)

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-0120201-01` | A source-authorized perceived document produces a stable, immutable full partition/plan and durable **one-to-many per-batch Planned Corpus handoffs**; exact replay makes no duplicate batch or job. |
| `RC-0120201-02` | Every eligible normalized locator belongs to **exactly one** owned corpus, while context-only may repeat with **zero ownership**; missing, duplicated, swapped, foreign and stale references fail closed. |
| `RC-0120201-03` | Exact project/workspace/bundle/document/perception/source identity, granted asset references, REL revision/condition/direction and per-batch hash are checked; one changed locator/revision/media/profile invalidates the plan/handoff. |
| `RC-0120201-04` | Real versioned **BSS-V2-005** quota-domain, process/workload, estimator, reserved output, prompt/schema/media/safety and cap constraints produce a **per-batch** fit; no fixed page/token assumption or invented quota. |
| `RC-0120201-05` | Qualified read-only **BSS-V2-006** effective safety/eligibility is used where relevant, without taking a reservation; temporary window depletion/cooldown **waits without silently re-batching**, and changed hard constraints fail or explicitly replan. Missing runtime read/authorization is an explicit BLOCKED. |
| `RC-0120201-06` | Future SEM-CUTOVER intake can resolve *only* planned owned/context corpus slots under the same canonical stepwise algorithm; exact prompt/user/schema/media/request-envelope fit and cross-batch REL equivalence must be demonstrated against SEM-owned versioned contract. Until then STOP at `SEM_BATCH_CORPUS_INTAKE_GAP`, **not** fictitious CK PASS. |
| `RC-0120201-07` | Single and multiple batch fixtures (text/tables/zero-visual/authorized image and cross-batch legend/condition) preserve all source and qualified-deferred accountability with no fabricated understanding. |
| `RC-0120201-08` | Zero provider transport, BSS attempts/reservations, semantic candidates/index/evidence, Qualified Semantic Handoff, reconciliation preparation/job, Master/publish/projection effects; non-inert positive controls and negative counters. |
| `RC-0120201-09` | Process-neutral profiles from the BSS registry select the same generic resource algorithm for distinct process types and changing active-profile sets, with versioned capacity inputs and protected interactive reserve; no active semantic route is fabricated in bootstrap. |
| `RC-0120201-10` | Isolated persisted handoff survives restart, cancellation, plan invalidation and duplicate delivery; matching hashes resume exactly, altered plan/scope/revision/fence cannot be redeemed. |

## GO/CK and out-of-scope

Use synthetic source and actual versioned BSS fixtures, including known/unknown/zero quotas, runtime pressure and profile revisions; avoid provider calls or canonical RUN-003 mutation. Independently qualify source/asset grants and durable/replay proof. Never assert that BSS-V2-006's planned read API or SEM batch corpus intake exists without implementation evidence. Every mandatory RC must have actual tests/observations or remain BLOCKED. BSS process-registry evolution is the new [BSS-V2-005-05](../Stack_Setup_V2/BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md) owner, not a loophole for the planner to create policy.

**STOP:** `CAPACITY_PROFILE_BOOTSTRAP_GAP`, `BSS006_CAPACITY_READ_GAP`, `SEM_BATCH_CORPUS_INTAKE_GAP`, or `UNQUALIFIED_SOURCE_RELATIONSHIP_GAP` with exact owner/input/failed evidence. The planner does **not** authorize semantic provider admission, acceptance, reconciliation or Master mutations.
