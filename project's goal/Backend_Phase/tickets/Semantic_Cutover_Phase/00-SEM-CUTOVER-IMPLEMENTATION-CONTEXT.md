# Atlas — Canonical Stepwise Semantic Cutover Implementation Context

**Program:** `SEM-CUTOVER`  
**Prepared:** 2026-10-13  
**Planning status:** Proposed ticket package; **NOT** an executable GO, HMN approval, CFC authorization, or CK PASS.  
**Reference repository:** `adityaa11/ces-platform`; remote `codex/new-atlas-backend` inspected at `07304cb503f523f1e3b4b4c73a5e4d614e8d35c5`. The implementer MUST verify its actual local HEAD, working tree, reviewed artifacts and latest CK status before action.  
**Start:** User-reported PERC-RESET-008 CK PASS; canonical `atlas-digital-pdf-run-003-capture-v1` perception baseline through durable `perceived`. The checked-in baseline note still contains its pre-CK `READY_FOR_CK` condition; confirm the actual independent PERC-RESET-008 PASS artifact locally rather than infer it from that note.  
**Target:** Independent CK PASS for **BSS-V2-004-03-05**, plus one reviewable canonical stepwise **offline** semantic successor baseline.  
**Production terminology:** The one canonical, reproducible, qualified implementation path that downstream Atlas development uses; NOT commercial cloud deployment or live provider execution.

> This is **not another Docker reset**. Do not clean, delete, migrate, reimport, restart or repurpose the accepted RUN-003 canonical Compose project, its volumes, database, projects, assets or original PDFs. No real provider calls or new semantic jobs are authorized here.

## 1. Objective and hard constraints

Produce **one** semantic extraction implementation path after RUN-003: a stepwise eight-stage methodology originating with `atlas.semantic.extract.stepwise_multimodal/v0.3.1`, an attributable proposal/relationship envelope, trusted source accounting, deterministic finalization and replay-safe result handoff. Retire the historical `prompt-003/v1` **default/byte-equivalence requirement** from the successor acceptance baseline. Historical artifacts survive unchanged. A unique successor profile/hash is required if the compiled instructions, provider-response schema or request semantics differ from the frozen v0.3.1 contract: do not silently reuse its ID or claim frozen bytes changed lawfully.

**Core principle:** Capability-bounded, evidence-honest progress. Atlas should do the maximum authorized and useful work its actual capabilities support; acknowledge uncertainty and limitations without manufacturing verified truth, demanding unnecessary human intervention, or blocking unrelated work. Technical integrity failures still fail closed at the smallest correct boundary. An unresolved model-inferred relationship is not a technical error and is not authority.

The eight logical stepwise stages describe **one structured semantic reasoning procedure**; they are not eight external provider requests, nor eight automatically retried calls. Offline fake-only composition is in scope. Production semantic admission, paid live-model qualification, real human review interface, publication and chatbot authorization **are not**.

## 2. Evidence-backed starting state

1. `docker-compose.yml` has one canonical RUN-003 Docling `atlas.document.perceive` route, local image-embedded model weights, Atlas `perceived` termination and **zero semantic execution** for ordinary canonical D1 work.
2. Accepted RUN-003 corpus: Project A professional PDF (12 pages / 254 text blocks / 4 tables / 5 visual regions / 5 derived assets); Project B three PDFs (73/68/88 text blocks; 2/3/1 tables; zero captured visuals/assets). These are provenance-bearing inspection/fixture inputs, NOT guaranteed complete semantic understanding.
3. `packages/atlas-skills/src/semantic-prompt.ts`: `compileExtractionPrompt()` defaults to legacy `atlas.semantic.extract.prompt-003/v1`; stepwise `...stepwise_multimodal/v0.3.1` is explicitly selected. The current `buildSemanticSourcePacket()` compiles the legacy path.
4. `apps/agents-bridge/src/semantic-worker.ts`: extraction presently calls `buildSemanticSourcePacket()` and `provider.structured()` with text messages; reconciliation uses a separate existing production skill. Generic `StructuredReasoningProvider` is string-message based; provider-specific multipart support is additive and is not yet one canonical extraction composition.
5. `packages/atlas-skills/src/semantic-source-packet.ts`: `buildUnhydratedMultimodalSourcePacket()` supports source/visual slots, accepted `referenceContexts`, pending assets, but can throw `SOURCE_RELATIONSHIP_BLOCKED` for an unaccepted essential requirement. That is correct for **trusted context use**; it must not automatically prohibit provisional extraction of independent facts.
6. `REL-01` CK PASS and `REL-02` CK PASS: they create/source-check durable-shaped **proposed** relationship revisions and an optional provisional packet extension (empty is valid). Neither grants accepted/trusted context. Local `REL-03` candidate is out of scope and must be inspected/protected; no committed REL-03 implementation was found at the inspected remote HEAD.
7. `apps/agents-bridge/src/semantic-extraction-finalizer.ts`: the existing `AcceptedContextEvidence` only has two slot strings; role checking alone can attach untrusted visual evidence. `BSS-V2-BATCH-04.03-05-298021d-review.md` returned `CHANGES_REQUIRED` for `CK-001.a` and `CK-001.b`; other review rows were proven **at that reviewed SHA**, not blanket re-qualification of future edits.
8. Canonical Semantic V1 permits `kind: unresolved`, `needs_resolution`, clarification questions and `candidate|non_fact` source accounting. It has NO third inventory classification for meaningful, unverified visual interpretation. Do not invent one, silently use `non_fact`, or label unexamined visuals understood.
9. Frozen downstream 03-05 RC-03, 08-03-02, 08-03-03 RC-03 and IDSER-012-02-01 contain old-profile/old single-packet/perception compatibility language. PERC-RESET superseded **old perception profile parity only**; separately authorize semantic supersession.

## 3. Non-negotiable capability/authority separation

| Dimension | Required behavior | What it does NOT prove |
|---|---|---|
| Perception | Immutable source bytes, trusted locators, image manifest/ref, integrity/ownership | Correct meaning of diagrams, charts or legends |
| Semantic extraction | Generate source-grounded candidates, questions, provisional relationships and explicit dependencies | Model semantic correctness, relationship acceptance or Master truth |
| Deterministic validation | Strict Zod, exact owned-source accounting, asset/source scope, no invented trusted IDs, replay safety | That an interpretation is substantively true |
| Relationship proposals | Durable, immutable, revision/source-attributed `proposed` or `unresolved` state | Authorization to use context as verified evidence |
| Trusted contextual use | Independently authorized, identity- and revision-bound accepted relationship | Global correctness of every derived semantic claim |
| User verification (later) | Explicit, authenticated review/publication or chatbot-driven *confirmation* of identified revisions | Automatic confirmation on chat open, conversation or page view |
| Published Master (later) | Only eligible, governed verified/trusted meaning promoted | Validation or publication of every pending hypothesis |

**When a relationship is missing:** independent source units/candidates continue; dependent interpretation remains reviewable and explicitly conditional/provisional, not represented as an accepted Semantic V1 claim. The absence of a future user verifier alone is NOT a whole-document extraction error. Conversely, actual forged/foreign/malformed evidence, invalid proposal, unsafe access or unrepresentable authoritative result blocks its **affected** operation. The workstream must prove it can isolate the dependency; otherwise declare a precise representability gap and seek HMN, not fake completion.

**Raw-context anti-pattern:** Atlas must attempt bounded source understanding and present meaningful, attributable proposals/questions. Do not offload raw images/tables to the user as a routine substitute for semantic work. Do not promise full understanding of unexamined visuals. User review is the *later* confirmation boundary.

## 4. Intended successor shape (offline qualification only)

```text
RUN-003 accepted NormalizedDocument V1 + manifest / authorized asset refs
  -> deterministic source unit ownership + bounded provisional relationship context
  -> stepwise eight-stage compiler (one versioned profile; one intended path)
  -> authorized ephemeral visual hydration (where authorized) + typed multipart
  -> provider-neutral preflight / resource estimator inputs
  -> FAKE provider returns schema-valid or deliberately invalid envelope
       { semantic_proposal, relationship_proposals }
  -> strict parser + exact source ownership + REL-01 proposed revision materializer
  -> candidate finalizer: only independent/actually authorized contextual evidence
  -> canonical Semantic V1 + separately governed provisional sidecar
  -> existing envelope/replay/fenced stage/handoff for approved offline scenarios
  -> STOP: canonical D1 remains perceived; no actual semantic admission or provider call

LATER, OWNED BY REVIEW / CHATBOT / PUBLISHING:
  -> explicit user decision on named relationship revision/evidence
  -> append-only accepted/rejected revision as governed, without rewriting proposal
  -> optional re-evaluation/binding of dependent meaning
  -> publication gate only for meaning being promoted
```

**Important version identity:** Stepwise v0.3.1 is the adopted **methodology**. Frozen v0.3.1 hash/profile is an immutable historical artifact; if response envelope, static policy or request output shape needs new bytes, name and freeze a successor `stepwise_multimodal` profile revision only through an approved decision. There must still be **one normal extraction path**, not a model/image-presence fallback tree.

**Important phase identity:** The canonical *code path* may become stepwise while normal D1 still stops at `perceived`. Calling a path 'canonical production' does NOT authorize a semantic job or a real provider call.

## 5. Legacy-retirement ledger (the correct scope)

| Item | Successor treatment |
|---|---|
| Historical `atlas-digital-pdf-no-ocr-v1` route parity | Already superseded by PERC-RESET-008; use RUN-003 for all current perception regression |
| `prompt-003/v1` as implicit default extraction | Retire from canonical extraction code; fail closed on accidental legacy dispatch, no fallback |
| `buildSemanticSourcePacket()` as canonical text-only source path | Supersede with one stepwise-owned packet entry point; retain historical code/tests only if archival/useful, not an admission condition |
| Frozen exact legacy prompt/packet byte/hash comparisons | Preserve historical records; remove from **successor** PASS oracles after explicit amendment |
| Shared provider-neutral string message API | RETAIN for reconciliation and unrelated supported capabilities; not itself a legacy flaw |
| Stepwise 8 stages, V1 meaning authority and stable source fields | RETAIN and qualify; preserve immutable IDs/hashes or bump successor profile deliberately |
| REL-01/02 proposal lineage, authorization=null | RETAIN; cannot imply trusted relationship |
| 03-05 CK-001.a/b | RETAIN as genuine findings; close with actual context-authority enforcement and nonblocking provisional path |
| Source SHA/asset hash, grants, strict schema, IDs, full source accounting, replay/fencing | RETAIN mandatory, no weakening |
| Exact old test snapshots as new default | RETIRE; replace with successor functional/negative tests and oracle fingerprints |
| Reconciliation skill semantics, Master, CES, review/chat flows | No edits in this program; document future handoff |

## 6. Frozen-contract change protocol

1. `SEM-CUTOVER-001` inventories the current local HEAD, dirty/untracked paths, relevant CK findings, original frozen oracles and exact conflict clauses. Do not modify implementation. Mark any missing evidence explicitly.
2. `SEM-CUTOVER-002` prepares **one bounded HMN authority decision** to supersede only conflicting prospective requirements (03-05 RC-03/default; 08-01-04 legacy default for successors; 08-03-02/03 future legacy differential; IDSER-012-02-01 old single-packet parity; perceived RUN-003 compatibility). User must explicitly approve it; independent CK may verify its contract/evidence. No self-authorization.
3. Later leaves consume that approved successor authority. Do not retrospectively rewrite historical reviewed contracts/GO/CK artifacts. If an in-place frozen ticket amendment is required, add a signed/attributable successor amendment with exact affected clause IDs, version and effective point; never erase prior terms.
4. Existing `03-05` `CHANGES_REQUIRED` is not waived. **CFC** may address only already-authorized CK-001.a/b; any separately owned worker/compiler/packet/schema/persistence change requires a distinct GO/owner and its own CK. The 03-05 final independent review must cite both the remediation evidence and the new cutover authority.
5. DO NOT infer new approval from a passing unit test, a ticket being `planned`, a draft HMN, or local instructions. Each executable leaf requires an explicit user GO, prerequisite independent CK PASS, and bounded implementation review.

## 7. Protected data, branch hygiene, runtime and cost

- Protect the accepted `atlas-canonical-perception` runtime, PostgreSQL/DocumentStore volumes, the original four source PDFs in `docs/example`, all five verified Project A assets, accepted Project B outputs, `.env`/credentials, the pinned Docling image and embedded model weights.
- Protect **REL-03 candidate/branch/history** (the original PERC-RESET planning notes mention candidate baseline `8a2dd24`), whether committed or uncommitted. Compare local branch state to the remote; do not assume remote snapshot includes local REL-03 work.
- Protect every pre-existing unrelated dirty/untracked file, especially `project's goal/feedback/` and implementation-context Markdown. No `git add -A`, blanket `git clean`, `reset --hard`, stashing, global formatting, or mass checkout. Stage only exact ticket-owned paths. No `docker compose down -v`, Docker prune, or fresh Docker reset.
- Use isolated deterministic fixtures/Compose profiles where tests require database or server effects, not the accepted canonical database. Read-only inspection of canonical state is allowed if a ticket explicitly owns it.
- All SEM-CUTOVER leaves are **zero external provider call**, **zero new production semantic/perception job**, **zero admission reservation**, **zero Master mutation**. Fake calls require instrumented non-inert counters and a positive control proving counters work. No API keys, full raw responses, image bytes/base64 or secrets in evidence or logs.
- Shared modifications must stop on `OWNERSHIP_CONFLICT_BLOCKED`. Unsatisfied mandatory context representation -> `SCHEMA_FIT_BLOCKED`. Unknown image TPM / missing admission policy -> `RESOURCE_ENVELOPE_BLOCKED` before dispatch. Repeat failing a single targeted hypothesis twice without new evidence -> HMN, not prompt churn.

## 8. Work package & ordering

| Order | Leaf | Only owned outcome | Dependency |
|---|---|---|---|
| 1 | `SEM-CUTOVER-001` | Actual-HEAD inventory, upstream and CK impact ledger | Verified accessible repo / baseline |
| 2 | `SEM-CUTOVER-002` | Bounded successor HMN/contract supersession and deferred-review decision | 001 CK PASS / explicit user HMN approval |
| 3 | `SEM-CUTOVER-003` | Nonblocking owned/provisional/context source packet boundary | 002 approved |
| 4 | `SEM-CUTOVER-004` | One versioned stepwise request + strict REL proposal envelope | 003 CK PASS |
| 5 | `SEM-CUTOVER-005` | Durable-shaped provisional outcome/accounting + replay interface, no truth promotion | 004 CK PASS |
| 6 | `SEM-CUTOVER-006` | 03-05 CK-001.a/b pure finalizer repair using trusted accepted-context interface | 005 CK PASS, bounded 03-05 CFC/HMN authorization |
| 7 | `SEM-CUTOVER-007` | Offline stepwise worker composition, staged-winner/replay & D1 no-dispatch proof | 006 CK PASS |
| 8 | `SEM-CUTOVER-008` | Independent 03-05 CK closure, successor baseline freeze / downstream conflict handoff | 007 CK PASS |

Each leaf has its own file, review contract, positive and negative oracles, permitted mutation scope, exclusion matrix and terminal state. This sequence is a **proposed plan**, not automatic authorization of its successors. If 006's prerequisite owner/review route is incompatible with frozen 03-05, stop at 002 for a narrow HMN split rather than silently absorbing the defect into another leaf.

## 9. Terminal acceptance and explicit limits

The program completes only if independent reviewers prove:

- RUN-003 is the only canonical upstream perception identity; four accepted sources and five assets remain unchanged.
- A single stepwise semantic extraction composition is the intended normal successor; legacy default/byte parity is no longer a prospective CK condition and no hidden fallback can dispatch.
- Every supplied meaningful source has attributable accounting; unresolved essential context stays provisional without blocking unrelated processing, without image->table guessed joins, and without inventing `non_fact`.
- Real accepted-context evidence can only be used with exact trusted relationship authorization; existing `CK-001.a/b` closed by independent 03-05 CK review, not erased by changing scope.
- Fake strict response parse, Atlas-owned IDs/evidence, invalid/foreign/duplicate/oversized negatives, cancellation, replay, stale claimant, no duplicated provider effects, and zero-production-activation are proven.
- `BSS-V2-004-03-05` independently marked PASS on the exact reviewed SHA; terminal successor baseline documentation maps downstream 08-03-02/03 and IDSER-012-02 to revised prospective obligations.

**Not proven or activated:** reliable live model meaning, multilingual generalization across unseen PDFs, OCR-only documents, understanding every chart/diagram, real image token admission, live provider privacy/ZDR, production semantic batch scheduling, human verification UI, chatbot decisions, Master publication, CES or commercial release.

## 10. Sources inspected (do not substitute document text for live code review)

- `project's goal/feedback/CANONICAL-PERCEPTION-BASELINE-v1.md`; PERC-RESET-008 GO and reported CK PASS.
- `apps/agents-bridge/src/{semantic-worker,semantic-extraction-finalizer,worker-main,provider-capabilities}.ts`.
- `packages/atlas-skills/src/{semantic-prompt,semantic-source-packet,semantic-source-input-v031,relationship-extraction-envelope,provisional-relationship-packet,relationship-provenance}.ts`.
- `packages/atlas-contracts/src/{semantic-v1,semantic}.ts`.
- `project's goal/feedback/BSS-V2-BATCH-04.03-05-298021d-review.md` (CK-001.a/b).
- Frozen `BSS-V2-004-03-05`, `08-01-04`, `08-02-01`, `08-03-02`, `08-03-03`, and IDSER-012-02-01 ticket texts.
- REL-01 CK PASS and REL-02 CK PASS records; REL-03 local candidate existence noted but not remote-verified.
