# IDSER-011: Live Mistral acceptance checkpoint — umbrella partition record

- **State:** `partitioned-planned`; no longer directly executable by GO.
- **Original batch:** `IDSER-BATCH-11`; executable children are `IDSER-BATCH-11-01` through `IDSER-BATCH-11-04`.
- **Depends on:** every executable IDSER-010 child—IDSER-010-01, -02, -03-01, -03-02, -04, -05 and -06—at CK `PASS`. The IDSER-010 umbrella remains coverage authority only.
- **Baseline:** SRC-IDSER-01 sections 12.5, 42 Scenario I, 43–45; AC-41–44 and phase invariants; BSS-008/009. See [README](README.md).
- **Execution environment:** real Compose and configured actual Mistral API through the existing BSS-008 adapter. This record authorizes no execution.

## Disposition, preserved outcome and order

This record preserves the full frozen IDSER-011 live-acceptance contract. It is an umbrella coverage authority, not a GO target. Every executable child must receive CK `PASS`; no missing credential, provider failure, skip, mock or partial run may be represented as phase completion.

```text
all IDSER-010 executable children PASS
  -> 011-01 real runtime/credential qualification PASS
  -> 011-02 D1 real production path PASS
  -> 011-03 D2 bounded incremental path PASS
  -> 011-04 final live composition PASS
  -> IDSER-011 complete at Ready for review -> STOP
```

The retained outcome is a real authenticated fresh synthetic multi-PDF project: D1 and D2 execute BSS-009 OCR through `MistralProvider.perceive(...)`, then extraction/reconciliation through `MistralProvider.structured(...)`, authenticated Atlas result acceptance, valid persistence and bounded procedural advancement, and finally `Ready for review`. It does not assert nondeterministic model wording; it asserts valid schema, candidate/evidence/reference accounting, approved identity scope, actual provider provenance, ordering, persistence, lifecycle and negative authority.

No child may redesign BSS-008/009, IDSER persistence, queue/worker, authentication, schemas, reconciliation authority, lifecycle or Project Card semantics. No child may introduce Mistral Files, Agents, Conversations, provider-hosted memory, TestRuntime handling, a mock/alternate fallback, a second OCR pipeline, worker or queue. Human review UI, canonical resolution, publication, Master movement, chatbot/conversations, CES and projections remain out of scope.

## Executable-child topology and sizing

| Child | Dominant authority question | RC rows | Why coherent |
|---|---|---:|---|
| [011-01](IDSER-011-01-live-runtime-credential-qualification.md) | Is the approved real Mistral runtime genuinely available and secret-safe? | 3 | Deployment secret, reviewed Compose image and non-secret qualification share one provider-config/evidence oracle; no document path is claimed. |
| [011-02](IDSER-011-02-live-first-document-production-path.md) | Can D1 traverse the approved provider/Atlas path to validated reconciliation completion? | 4 | One D1 execution/persistence trail runs from OCR through authenticated reconciliation acceptance. |
| [011-03](IDSER-011-03-live-incremental-sequencing-context.md) | Does D2 preserve Atlas-authorized bounded incremental reconciliation? | 4 | The new authority relative to D1 is temporal/context scope; ordering, selection and D2 accounting are one proof surface. |
| [011-04](IDSER-011-04-integrated-live-acceptance-checkpoint.md) | Do accepted deterministic and live interfaces compose to reviewable completion without truth authority? | 4 | Final lifecycle/card/negative observations must be read together from one bundle; it consumes child PASS evidence. |

Each child has an enumerable binary Review Contract, local CFC repair seam, narrow HMN residual and explicit GO hard stop. The final child is composition only: a material discovery in a child-owned contract is a `SCOPE_CHANGE`/predecessor authority problem, never hidden final-checkpoint implementation.

## Lossless parent-to-child ownership ledger

Every frozen obligation has exactly one primary executable owner and `011-04` as final integration owner. “Final” means a bounded composition observation, not duplicate primary proof.

| Frozen IDSER-011 obligation | Primary owner | Final owner | Evidence / closure oracle |
|---|---|---|---|
| Credential gate; real key only at Bridge/deployment-secret boundary; absent/unavailable gate blocks honestly | 011-01 | 011-04 | Secret-safe initialization/outcome; real provider succeeds or remains factual `BLOCKED`/`FAIL`, never mock-qualified. |
| Configured base URL, OCR/structured models, ZDR, limits/retries and non-secret identity | 011-01 | 011-04 | Reviewed configuration/image plus approved provenance; path/identities attributable without value leakage. |
| Procedure 1: reviewed HEAD, predecessor PASS, Compose health and migrations | 011-01 | 011-04 | PASS/HEAD/image/health/migration ledger identifies the reviewed runtime. |
| Procedure 2: authenticated project, >=2 synthetic PDFs, safe IDs/hashes/upload order/initial state | 011-03 | 011-04 | Fresh two-PDF scoped create records and source hashes prove a synthetic authenticated scope. |
| Scenario I / procedure 3: D1 OCR -> NormalizedDocument through real BSS-009 `perceive(...)` | 011-02 | 011-04 | D1 perception execution/provenance/persistence identifies actual OCR adapter path. |
| Scenario I / procedure 3–4: D1 extraction -> validation/candidates/evidence/index -> reconciliation -> authenticated acceptance -> processed | 011-02 | 011-04 | D1 structured executions and scoped validated records resolve only inside D1 bundle and completion follows reconciliation. |
| D2 waits for D1 validated reconciliation completion | 011-03 | 011-04 | Ordered execution/member/job history permits no earlier D2 semantic work. |
| Scenario I / procedure 5: D2 real OCR, extraction, reconciliation and authenticated acceptance | 011-03 | 011-04 | D2 actual-provider/handoff trail is attributable to its fresh scope. |
| D2 has only bounded same-bundle D1/current-D2 context; no foreign project/workspace/bundle | 011-03 | 011-04 | Authorized context IDs/fingerprint/count/bytes/overflow meet frozen selector contract. |
| D1 candidate/evidence/source/reconciliation references and provenance resolve to its actual run | 011-02 | 011-04 | Scoped D1 persistence/accounting has no missing or mis-scoped reference. |
| D2 candidate/evidence/source/reconciliation references and provenance resolve to its actual run | 011-03 | 011-04 | Scoped D2 persistence/accounting has no missing or mis-scoped reference. |
| Procedure 7: completion gate, workspace ready, card ready, N/N and 100% | 011-04 | 011-04 | Bundle/member/result/card states agree after all reconciliations. |
| Procedure 8: Master empty, published facts zero, review unavailable, no downstream state | 011-04 | 011-04 | Scoped DB/read/permission negatives are all absent/zero. |
| Existing worker, no TestRuntime, no direct Bridge trusted-state mutation | 011-03 | 011-04 | Two-document worker/provider/handoff/permission observations reject substitute/direct authority. |
| Environment evidence row | 011-01 | 011-04 | Exact secret-safe commands, HEAD, services and migrations. |
| Provider evidence row | 011-01 | 011-04 | Configured/actual non-secret OCR and structured identities/provenance. |
| Execution evidence row | 011-03 | 011-04 | Two-document worker/skill/order/context summaries with no substitute runtime. |
| Persistence evidence row | 011-03 | 011-04 | Complete two-document result/accounting/reference records. |
| Lifecycle, authority and combined deterministic/live evidence rows | 011-04 | 011-04 | Final completion, negative authority, IDSER-010 A-H references, limits/skips classification. |
| Parent acceptance 1: secret never business/evidence data | 011-01 | 011-04 | RC-011-01-02/03 plus final redaction inspection. |
| Parent acceptance 2: >=2 PDFs use OCR and both semantic skills | 011-03 | 011-04 | Fresh D1/D2 actual-provider stage records. |
| Parent acceptance 3: schemas, accounting and authorized references valid | 011-03 | 011-04 | Validated two-document persistence. |
| Parent acceptance 4: sequencing/context/completion proves pipeline and ready | 011-04 | 011-04 | Ordered contexts and final lifecycle/card. |
| Parent acceptance 5: no truth promotion/Master/downstream state | 011-04 | 011-04 | Final negative-authority inspection. |
| Parent acceptance 6: 010 and live gate PASS; blocked credential leaves phase incomplete | 011-04 | 011-04 | PASS/blocked status ledger. |
| AC-41 | 011-01 | 011-04 | Existing secret boundary and redacted qualification. |
| AC-42 | 011-03 | 011-04 | OCR plus both structured paths across fresh D1/D2. |
| AC-43 | 011-04 | 011-04 | Two-PDF incremental live run through completion and ready. |
| AC-44 | 011-01 | 011-04 | Credential gate state and final completion guard. |

## Security readiness and review bindings

**SecurityReadiness status: applicable.** Inherited boundaries are BSS-008 secrets/provider configuration, BSS-009 perception, authenticated Atlas context/result acceptance, IDSER bounded context and reviewable-only lifecycle. Sensitive assets are the credential, synthetic source-derived context, provider metadata and execution evidence. Identity context is reviewed HEAD/image, project/workspace/bundle/document/execution IDs, source hashes, skill versions and approved provenance.

| Readiness item / binding | Primary owner | Final owner | Preserved boundary |
|---|---|---|---|
| `SEAM-IDSER-011-01` | 011-01 | 011-04 | Real qualification is distinct from deterministic mocks; child 02/03 preserve its live path/context boundary, credentials stay deployment-only and Atlas remains authorization/persistence authority. |
| `COUPLING-IDSER-011-01` | 011-04 | 011-04 | No secret dump/confidential fixture/fallback/skipped gate; no excess context or Bridge truth authority. |
| `REV-READY-IDSER-011-01` | 011-03 | 011-04 | Secret-safe evidence proves actual OCR and both structured skills on two PDFs. |
| `REV-READY-IDSER-011-02` | 011-04 | 011-04 | Evidence is redacted and completion is withheld on live gate failure/block. |

Unresolved security policy remains unchanged: confidential deployment material/privacy approval is outside this synthetic checkpoint. No ticket contains a credential, tells GO to print one, or accepts `env`, `printenv`, `docker compose config` or equivalent secret-expanding evidence. Provider/model/endpoint identities may be recorded only through existing non-secret provenance/configuration boundaries.

## Compose integrity and long-running execution

All children use fresh scoped identifiers and bounded approved-harness cleanup. Diagnose stale image, stale/reused container, stale process, PostgreSQL state, pg-boss jobs, DocumentStore artifacts, fixture contamination, code/config defect and credential/provider/network outcome before recording a failure. Source/config changes require rebuilding/recreating affected services before final evidence. Broad teardown/pruning—including `docker compose down -v`, `docker system prune`, and volume pruning—is not routine live-test cleanup.

GO starts, observes, polls and completes every Compose/live provider operation, then inspects persisted final state and runs every assertion before `READY_FOR_CK`. A running operation or execution-window boundary cannot create an awaiting-review checkpoint.

## Final partition self-check

| Question | Result |
|---|---|
| Does every parent obligation have a primary executable and final owner? | YES — no shared-only or deferred row. |
| Can GO complete each child before CK? | YES — 3–4 bounded binary RC rows and hard stops. |
| Does Scenario I have an owner for every arrow? | YES — 011-01 runtime, 011-02 D1, 011-03 D2/context, 011-04 completion/hard stop. |
| Are AC-41–44 concrete child obligations? | YES — mapped above and in README. |
| Are real-provider, secret, Compose-staleness and long-running rules retained? | YES — partitioned by their exercised authority. |
| Has future review/projection scope been pulled forward? | NO. |

This planning record authorizes no implementation, live call, GO, CK, CFC or HMN action. IDSER-011 ends only at validated live `Ready for review`, then **STOP**.
