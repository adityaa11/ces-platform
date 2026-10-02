# DOCGRAPH-002: Docling Graph local LLM semantic feasibility

- **State:** `awaiting_review`
- **Review batch:** `DOCGRAPH-BATCH-02`
- **Predecessors:** DOCSPIKE-001 CK-resolved local perception evidence; DOCGRAPH-001 terminal `FAIL` report and HMN evidence.
- **Frozen inference target:** Windows local execution using `C:\venvs\docgraph\Scripts\python.exe`; Docling Graph `backend=llm`, `inference=local`, `provider_override=ollama`, and `model_override=qwen3:4b` only.

## Outcome and authority

Run one reproducible, local-only feasibility experiment to determine whether the
official Docling Graph LLM backend can provide Atlas with source-grounded
semantic proposals. The sole changed variable from DOCGRAPH-001 is inference:

```text
Docling Graph: backend=llm
inference:     local
provider:      ollama
model:         qwen3:4b
```

DOCGRAPH-001 is complete as a terminal `FAIL` for the Docling Graph VLM plus
NuExtract-2.0-2B path. Its semantic result, fixture transport, finalizer
rejection, and accepted predecessor evidence are not subject to remediation or
reopening by this ticket.

```text
immutable repository PRD / controlled fixture
  -> existing local Docling perception -> NormalizedDocument v1
  -> DOCGRAPH-001 deterministic serializer and controlled 11-unit fixture
  -> Docling Graph LLM + local Ollama qwen3:4b proposal
  -> DOCGRAPH-001 Pydantic proposal transport and Atlas-owned finalizer
  -> real parseSemanticExtractionResult(...) / parseSemanticReconciliationResult(...)
```

Atlas remains authority for source scope and identity, NormalizedDocument,
semantic v1 contracts, canonical candidate IDs, reference/source accounting,
persistence, review, publication, and Master. Docling Graph, Ollama, Pydantic
objects, model output, and graph output remain untrusted proposals or
diagnostics only.

## Frozen scope

### In scope

- Reuse DOCGRAPH-001's serializer, controlled 11-source-unit fixture, Pydantic
  proposal transport, Atlas-owned finalizers, semantic-v1 parsers, evidence
  rules, and locality/security boundaries unchanged.
- Implement only the local LLM/Ollama runner/configuration necessary to invoke
  the frozen inference target with the existing qualified Python environment.
- Record Ollama model identity/digest when available, localhost provider
  evidence, CUDA/RTX 4050 device evidence, absence of CPU-only fallback, and
  end-to-end inference latency.
- First execute only the existing controlled extraction fixture. It must produce
  non-empty semantic candidates where appropriate, account for every one of
  the eleven authorized source units as `candidate` or `non_fact`, use no other
  source IDs, preserve uncertainty, survive the unchanged finalizer, and pass
  the real `parseSemanticExtractionResult(...)`.
- Only after that gate passes, execute the frozen sequence: Safara extraction;
  Finance extraction; Readiness extraction; controlled ten-relationship
  reconciliation fixture; real `parseSemanticReconciliationResult(...)`;
  repeated Safara extraction and determinism comparison; graph/provenance;
  resource/latency observations; and Atlas validation.
- Repair the existing `esbuild` launcher defect only if it blocks execution of
  the unchanged real Atlas finalizer. Such work is bounded spike infrastructure
  remediation, not semantic-contract work.
- Keep generated source-derived artifacts local and ignored beneath
  `.atlas-data/docling-graph-spike/`; record committed summary evidence in
  `project's goal/feedback/DOCGRAPH-002-docling-graph-local-llm-semantic-feasibility.md`.

### Explicitly excluded

- Reopening, changing, or remediating DOCGRAPH-001's terminal semantic result.
- Any different model, provider, backend, inference mode, hosted fallback, or
  remote processing of PRD content. Gemini, Mistral, OpenAI, OpenRouter, and
  all other hosted processing are forbidden.
- Changes to semantic v1 extraction/reconciliation contracts, source
  accounting, NormalizedDocument, candidate/persistence authority, BSS-V2-004,
  production routes, workers, queues, databases, review/UI projections,
  publication, or Master.
- Deterministic filling of missing model meaning, classifications, relationships,
  evidence, source IDs, or parser output; a second test methodology; model
  weights, caches, raw PRD debug exports, credentials, or secrets in Git.

## Fail-fast gate and terminal classification

The controlled 11-unit extraction is the mandatory first semantic gate. A
semantic failure at this gate is terminal `FAIL`: record the evidence and stop;
do not run Safara, Finance, Readiness, reconciliation, determinism, or graph
assessment. An environment inability to use the specified local target is
`ENVIRONMENT_BLOCKED`; it does not authorize CPU-only execution or any fallback.

If the gate passes, terminal classification is exactly one of `PASS`,
`PASS_WITH_LIMITS`, or `FAIL` based on the full frozen experiment. Successful
environment setup, model loading, or an isolated model call does not end GO.

## Required transport and finalization rules

The existing sixteen extraction candidate kinds and ten reconciliation
relationship types remain exhaustive. Every serialized source unit receives
exactly one proposal disposition: `candidate` with valid destination local IDs,
or `non_fact` with a bounded reason and no destination. Unknown, duplicate, or
omitted source IDs; unknown/duplicate local IDs; unsupported kinds; ungrounded
candidates; or missing current-candidate accounting fail finalization.

Finalizers may map proposal representations to existing shapes, resolve known
Atlas locators and evidence refs, and invoke the real parsers. They cannot
invent omissions or make the proposal authoritative.

## Review Contract

| Row | Exact bounded behavior | Binary evidence and closure oracle |
| --- | --- | --- |
| RC-DOCGRAPH-002-01 | The stated qualified Python environment runs the exact Docling Graph local LLM/Ollama path without changing global or production environments. | Version/import/config evidence. **PASS iff** the configuration is `llm/local/ollama/qwen3:4b` in the specified environment. |
| RC-DOCGRAPH-002-02 | Inference is local to the RTX 4050 through Ollama with no CPU-only or hosted fallback. | Localhost/provider and GPU/device evidence plus elapsed latency. **PASS iff** no remote service receives source content and GPU execution is evidenced. |
| RC-DOCGRAPH-002-03 | The unchanged serializer and 11-unit fixture retain every authorized source unit and exact locator identity. | Existing serializer hashes/counts and negative tests. **PASS iff** repeated serialization matches and no marker/locator changes. |
| RC-DOCGRAPH-002-04 | The controlled extraction passes complete authorized-ID/source disposition accounting and the real extraction parser without invented meaning. | Proposal, unchanged finalizer output, and `parseSemanticExtractionResult(...)` result. **PASS iff** all 11 units are truthfully accounted and all valid fixture concepts are represented or explicitly uncertain. |
| RC-DOCGRAPH-002-05 | Safara, Finance, and Readiness each reach terminal extraction through the unchanged parser. | Per-document finalization and metrics. **PASS iff** each has complete accounting and parser acceptance. |
| RC-DOCGRAPH-002-06 | Safara has broad semantic consideration across the existing nine anchors without silent omissions. | Heading-coverage inspection. **PASS iff** omissions/non-facts/limits are explicit. |
| RC-DOCGRAPH-002-07 | The existing controlled reconciliation fixture spans all ten relationship types through the real parser. | Matrix, finalizer output, and `parseSemanticReconciliationResult(...)`. **PASS iff** IDs, targets, evidence, resolution state, and candidate accounting validate. |
| RC-DOCGRAPH-002-08 | Repeated equivalent Safara extraction characterizes determinism without masking differences. | Raw/intermediate/final hashes and semantic diff. **PASS iff** identical or structurally equivalent with no material drift. |
| RC-DOCGRAPH-002-09 | Graph/provenance is assessed while Atlas evidence remains authoritative. | Provenance/graph report. **PASS iff** usefulness/limits are recorded with Atlas identity intact. |
| RC-DOCGRAPH-002-10 | A truthful non-production terminal report preserves all contracts and closed predecessor state. | Report, affected checks, and diff review. **PASS iff** terminal classification follows evidence and semantic v1, production routes, BSS-V2-004, and DOCGRAPH-001 remain unchanged. |

## Security readiness

```text
SecurityReadiness
status: applicable
inheritedBoundaries:
  - BOUNDARY-DOCGRAPH-002-SOURCE: only repository fixtures/PRDs; source-derived runtime artifacts stay local and ignored.
  - BOUNDARY-DOCGRAPH-002-SEMANTIC: Docling Graph/Ollama proposals remain untrusted; existing Atlas parsers remain final contract authority.
  - BOUNDARY-DOCGRAPH-002-IDENTITY: model/graph IDs cannot become Atlas canonical IDs.
  - BOUNDARY-DOCGRAPH-002-LOCALITY: `ollama` is the local provider only; no remote inference or fallback receives content.
  - BOUNDARY-DOCGRAPH-002-PERSISTENCE: no production database or trusted semantic-state writes.
sensitiveAssets:
  - ASSET-DOCGRAPH-002-PRD: authorized PRD content, source IDs, and locators.
  - ASSET-DOCGRAPH-002-CONTRACT: semantic v1 authority and evidence integrity.
identityContext:
  - IDCTX-DOCGRAPH-002-ATLAS: source IDs, locators, evidence refs, and candidate manifests must reach unchanged finalizers.
extensionSeams:
  - SEAM-DOCGRAPH-002-TRANSPORT: existing bounded Pydantic transport retains future policy attachment without contract change.
  - SEAM-DOCGRAPH-002-FINALIZATION: real TypeScript finalizers remain the deterministic audit point.
  - SEAM-DOCGRAPH-002-OBSERVABILITY: hashes, provider locality, GPU evidence, latency, provenance, and retry records remain inspectable.
prohibitedCouplings:
  - COUPLING-DOCGRAPH-002-PRODUCTION: no service, route, worker, queue, graph persistence, or provider migration.
  - COUPLING-DOCGRAPH-002-CONTRACT: no weakened parser/accounting or deterministic semantic fill.
  - COUPLING-DOCGRAPH-002-REMOTE: no hosted processing or remote fallback.
verificationSeams:
  - VERIFY-DOCGRAPH-002-SOURCE: existing serializer/finalizer negative tests and controlled fixture prove exact authorized-ID accounting.
  - VERIFY-DOCGRAPH-002-LOCALITY: configuration, Ollama endpoint, GPU/device, and process evidence prove local inference without CPU fallback.
  - VERIFY-DOCGRAPH-002-AUTHORITY: real parser invocation proves Atlas retains semantic authority.
unresolvedSecurityPolicy:
  - POLICY-DOCGRAPH-002-FUTURE: production hosting, retention, access control, and provider policy are intentionally out of scope.
planningFindings: []
reviewBindings:
  - REV-DOCGRAPH-002-01 -> VERIFY-DOCGRAPH-002-SOURCE: confirm no missing/invented IDs or committed raw source artifacts.
  - REV-DOCGRAPH-002-02 -> VERIFY-DOCGRAPH-002-LOCALITY: confirm no hosted receiver or CPU-only fallback handles source content.
  - REV-DOCGRAPH-002-03 -> VERIFY-DOCGRAPH-002-AUTHORITY: confirm unchanged real parsers/finalizers, not a Python clone, make final acceptance.
```

## Recovery and handoff

GO may repair only spike-local runner/configuration/launcher defects that block
the frozen local experiment. It must not alter source truth, semantic v1, the
model target, local-only boundary, or production state. A controlled semantic
gate failure is terminal `FAIL`; a complete passing experiment is `READY_FOR_CK`
only after every applicable Review Contract row is proven. CK alone issues the
terminal review decision.
