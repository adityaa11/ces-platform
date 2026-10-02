# DOCGRAPH-001: Docling Graph local semantic feasibility

- **State:** `awaiting_review`
- **Review batch:** `DOCGRAPH-BATCH-01`
- **Primary source:** [Docling Graph semantic feasibility spike implementation context](../../atlas-docling-graph-semantic-feasibility-spike-implementation-context.md), sections 1-38
- **Predecessor:** CK-resolved DOCSPIKE-001 perception evidence, including the existing deterministic `NormalizedDocument v1` path; reuse it rather than reopening perception.
- **Frozen environment/model target:** Windows local execution; isolated `.venv-docling-graph/`; Python 3.13-compatible `docling==2.132.0`, `docling-graph[vlm]==1.9.1`; `numind/NuExtract-2.0-2B` only.

## Outcome and authority

Run one reproducible local feasibility experiment that answers whether Docling Graph can propose source-grounded semantic candidates and reconciliation relationships from Atlas-authorized document content, and whether Atlas-owned deterministic adapters can transform those proposals through the unchanged current semantic v1 parsers.

```text
immutable repository PRD
  -> existing local Docling perception -> Atlas NormalizedDocument v1
  -> deterministic semantic-source serialization
  -> Docling Graph + local NuExtract 2B proposal
  -> deterministic Atlas finalizer
  -> parseSemanticExtractionResult(...) / parseSemanticReconciliationResult(...)
```

Atlas remains authority for scope authorization, source identity, `NormalizedDocument`, semantic contracts, canonical candidate IDs, reference/source accounting, persistence, review, publication, and Master. Docling Graph, its Pydantic objects, its model output, and NetworkX graph output are untrusted proposal/diagnostic material only.

## Frozen scope

### In scope

- Verify the human-provided global Python/Docling installation without mutating it; create a Git-ignored repo-local virtual environment and record resolved versions.
- Build inspectable spike-only code under `scripts/docling-graph-spike/`: pinned requirements, runner, local VLM invocation, extraction/reconciliation templates, deterministic serializer, deterministic finalizers, small controlled fixtures, and summarization/report support.
- Serialize every non-empty `NormalizedDocument v1` source unit in deterministic page/block/table order with its exact Atlas locator ID; hash and repeat the serialization.
- Use a smaller, bounded Pydantic-native model transport: candidates, source dispositions, questions, and reconciliation relationships must preserve enough source IDs/meaning to reconstruct the unchanged Atlas final shapes without semantic invention.
- Run a local NuExtract 2B micro-smoke, controlled extraction fixture, required Safara/Finance/Readiness extraction runs, a repeated Safara run, and controlled reconciliation fixture; perform optional real cross-document reconciliation only after those required rows complete.
- Finalize proposals using the real current TypeScript `parseSemanticExtractionResult(...)` and `parseSemanticReconciliationResult(...)`, never Python clones or weakened contracts.
- Evaluate provenance and NetworkX usefulness without elevating either to Atlas authority; record determinism and qualified resource observations.
- Keep generated data under ignored `.atlas-data/docling-graph-spike/`; write the summarized terminal report at `project's goal/feedback/DOCGRAPH-001-docling-graph-semantic-feasibility.md`.

### Explicitly excluded

- Any change to semantic v1 extraction/reconciliation contracts, candidate/persistence authority, `NormalizedDocument`, BSS-V2-004, DOCSPIKE perception mapping, production provider configuration, routes, workers, queues, databases, review/UI projections, publication, or Master.
- A Docling Graph production service/adapter, Neo4j or graph persistence, root pnpm/production dependency changes, hosted-inference fallback, different model target, remote embedding/semantic extraction, or any remote processing of PRD content.
- Model weights/caches, raw PRD debug exports, global environment files, API keys, or other secrets in Git.

## Required transport and finalization rules

The extraction proposal uses only the current sixteen candidate kinds. Each candidate has a result-local ID, semantic key/meaning, optional source wording/bounded payload, `needs_resolution`, and one or more authorized source-unit IDs. Every source unit receives exactly one consolidated disposition: `candidate` with valid destination IDs, or `non_fact` with bounded reason and no destination. Omitted accounting, unknown/duplicate source IDs, unknown/duplicate local IDs, or a candidate without valid grounding fail finalization.

The reconciliation proposal uses only the current ten relationship types. It supplies authorized current/prior candidate IDs, grounded source-unit IDs, bounded rationale/payload, and `requires_resolution`; `new` has no target and every other type requires one. Candidate order is never precedence, and model output never creates a canonical Atlas candidate.

The finalizers resolve Atlas source IDs to the current page/locator and existing evidence refs, build the current result shapes, enforce complete source/current-candidate accounting, preserve questions, and invoke the real parsers. They may normalize representation but cannot invent missing meaning, classifications, relationships, or references.

## Required experiment and evidence

1. Verify global Python/Docling, then create/verify the isolated pinned environment without changing the global installation; record local model repository/revision when discoverable, license observation, cache/download-location class, device, and no-provider-key micro-smoke.
2. Reuse/regenerate the existing DOCSPIKE normalized outputs through its existing components. Serialize the authorized input deterministically, retaining every marker if a local rendered PDF transport is needed by the installed VLM backend.
3. Run a small synthetic extraction fixture covering actor, business object, rule, condition, workflow step, state transition, input, output, exception, unresolved ambiguity, and non-fact prose. Record missing/invented concepts, kind errors, source-ID hallucinations, non-fact errors, and duplicate candidates.
4. Run extraction for Safara, Finance, and Readiness; rerun Safara with the identical environment/configuration/template/input. Per document record source-unit/candidate/non-fact/question counts, kinds, unknown or unaccounted IDs, final parser result, latency, model identity, and qualified CPU/memory observations where practical.
5. Inspect Safara against the nine evaluation anchors from the context. Do not place those headings in prompts; report coverage, non-fact-only areas, and material under-extraction honestly.
6. Run the controlled reconciliation manifest spanning every current relationship type; record expected/observed label, ID/evidence/`requires_resolution` validity, current-candidate accounting, and real parser result. A real cross-document observation remains qualitative unless authoritative expected relationships already exist.
7. Record serialized-input, raw-model, canonical-proposal, and final-result hashes; classify Safara reruns `IDENTICAL`, `STRUCTURALLY_EQUIVALENT`, or `MATERIALLY_DIFFERENT` without sorting away semantic differences.
8. Record graph node/edge counts, stable-node behavior, provenance availability, field loss, candidate-relationship representability, and whether graph fusion adds value over Pydantic proposals. Atlas evidence remains `source-unit ID -> NormalizedDocument locator -> evidence_ref`; approximate graph provenance stays approximate.
9. Execute affected Atlas contract/core tests, Python/template syntax/import checks supported by the installed API, the full runner, and `git diff --check`. Report every recovery attempt and terminal classification.

## Review Contract

| Row | Exact bounded behavior | Binary evidence and closure oracle |
| --- | --- | --- |
| RC-DOCGRAPH-001-01 | Isolated pinned Docling Graph environment runs without changing the human global Python/Docling installation. | Version/install/import evidence and ignored venv. **PASS iff** compatible Python, Docling 2.132.0, and Docling Graph 1.9.1 run in isolation. |
| RC-DOCGRAPH-001-02 | NuExtract-2.0-2B performs local bounded extraction with no hosted inference receiving source content. | Micro-smoke, model/device identity, and provider/network evidence. **PASS iff** the target model runs locally and no hosted inference endpoint receives PRD content. |
| RC-DOCGRAPH-001-03 | Deterministic serializer preserves every non-empty authorized source unit and exact locator identity. | Repeated byte hash/count plus negative tests. **PASS iff** output repeats and no marker/locator is invented or dropped. |
| RC-DOCGRAPH-001-04 | Controlled extraction yields grounded candidate/source-disposition proposals finalizable through the real current extraction parser. | Fixture coverage/error matrix and parser output. **PASS iff** required concepts and complete source accounting validate without unauthorized IDs or semantic invention. |
| RC-DOCGRAPH-001-05 | All three required PRDs reach terminal extraction and unchanged Atlas extraction validation. | Per-document run metrics/results. **PASS iff** each has complete accounting and parser acceptance without a semantic-v1 change. |
| RC-DOCGRAPH-001-06 | Safara output demonstrates broad semantic consideration across the nine evaluation anchors. | Heading-coverage inspection. **PASS iff** material omissions are not silent; non-fact/under-extracted limits are explicit. |
| RC-DOCGRAPH-001-07 | Controlled reconciliation spans all ten current relationship types and finalizes through the real current reconciliation parser. | Relationship matrix and parser output. **PASS iff** IDs, targets, evidence, and current-candidate accounting validate. |
| RC-DOCGRAPH-001-08 | Equivalent Safara reruns characterize semantic determinism without masking differences. | Raw/intermediate/final hashes and semantic diff. **PASS iff** results are identical or structurally equivalent with no material semantic drift. |
| RC-DOCGRAPH-001-09 | Graph/provenance is assessed without becoming Atlas authority. | Graph/provenance evaluation. **PASS iff** usefulness/limits are recorded and Atlas locator/evidence identity remains authoritative. |
| RC-DOCGRAPH-001-10 | Terminal report makes a truthful, non-production adoption recommendation. | Required report with classification, result matrix, recovery history, and state declarations. **PASS iff** classification follows evidence and semantic v1, production routes, and BSS-V2-004 are unchanged. |

## Security readiness

```text
SecurityReadiness
status: applicable
inheritedBoundaries:
  - BOUNDARY-DOCGRAPH-001-SOURCE: repository-owned PRDs/synthetic fixtures only; source-derived runtime artifacts are local and ignored.
  - BOUNDARY-DOCGRAPH-001-SEMANTIC: model/Docling Graph proposals are untrusted; existing Atlas parsers are the contract boundary.
  - BOUNDARY-DOCGRAPH-001-IDENTITY: graph/model local IDs cannot become canonical Atlas IDs.
  - BOUNDARY-DOCGRAPH-001-NETWORK: acquisition only; semantic inference stays local.
  - BOUNDARY-DOCGRAPH-001-PERSISTENCE: no production database or trusted semantic-state writes.
sensitiveAssets:
  - ASSET-DOCGRAPH-001-PRD: authorized repository PRD content and source locators.
  - ASSET-DOCGRAPH-001-CONTRACT: current semantic v1 authority and evidence integrity.
identityContext:
  - IDCTX-DOCGRAPH-001-ATLAS: Atlas source IDs/page locators/evidence refs and candidate manifests remain available to finalizers.
extensionSeams:
  - SEAM-DOCGRAPH-001-TRANSPORT: bounded proposal schemas permit future policy attachment without changing final contracts.
  - SEAM-DOCGRAPH-001-FINALIZATION: deterministic TypeScript finalizers expose validation/audit points.
  - SEAM-DOCGRAPH-001-OBSERVABILITY: hashes, provenance, metrics, and retry records preserve future audit hooks.
prohibitedCouplings:
  - COUPLING-DOCGRAPH-001-PRODUCTION: no Agents Bridge activation, route/provider change, worker, queue, or persistent graph integration.
  - COUPLING-DOCGRAPH-001-CONTRACT: local-model transport cannot weaken semantic v1 or replace its parsers.
  - COUPLING-DOCGRAPH-001-REMOTE: no hosted inference fallback or remote processing of PRD content.
verificationSeams:
  - VERIFY-DOCGRAPH-001-SOURCE: serializer/finalizer negative tests prove exact authorized-ID accounting.
  - VERIFY-DOCGRAPH-001-LOCALITY: smoke/run evidence proves local target-model inference and secret-safe acquisition records.
  - VERIFY-DOCGRAPH-001-AUTHORITY: real parser validation proves final contract ownership.
unresolvedSecurityPolicy:
  - POLICY-DOCGRAPH-001-FUTURE: production model hosting, access control, retention, and provider/fallback policy are intentionally out of scope.
planningFindings: []
reviewBindings:
  - REV-DOCGRAPH-001-01 -> VERIFY-DOCGRAPH-001-SOURCE: confirm no missing/invented source IDs or committed raw source artifacts; evidence: serializer/finalizer tests and Git inspection.
  - REV-DOCGRAPH-001-02 -> VERIFY-DOCGRAPH-001-LOCALITY: confirm no hosted inference receives source content; evidence: micro-smoke/run configuration and network/provider records.
  - REV-DOCGRAPH-001-03 -> VERIFY-DOCGRAPH-001-AUTHORITY: confirm unchanged real parsers remain final acceptance; evidence: finalizer commands/results and diff review.
```

## Recovery, classification, and handoff

GO may repair only spike scripts/templates/serializers/adapters, recreate the isolated venv, clear corrupted spike-only output/cache, retry acquisition/initialization, reduce spike transport batch size, and rerun affected evidence. It must not alter source truth, semantic v1, the model target, production state, or install a hosted fallback. If bounded remediation cannot run the required local model, classify only `ENVIRONMENT_BLOCKED` with exact evidence; otherwise end at exactly one of `PASS`, `PASS_WITH_LIMITS`, or `FAIL` using the context’s definitions.

The final report must state the result, Python/Docling/Docling Graph versions, model/revision/device/license observation, actual external-inference status, and `Atlas semantic v1 changed: no`, `Production routes changed: no`, and `BSS-V2-004 state changed: no`. It must cover method, environment, both transports, accounting, fixtures, three real documents, parser results, provenance/graph, determinism, resources, failures/retries, limits, conclusion, next planning recommendation, and review-contract closure.

**CK question:** Does complete, local, source-grounded evidence prove the stated terminal feasibility classification while the existing Atlas semantic v1 contracts and authority boundaries remain intact? A PASS/PASS_WITH_LIMITS supports a separately authorized comparison of local, provider-facing transport, and hybrid architecture shapes only; it never authorizes implementation of any of them.
