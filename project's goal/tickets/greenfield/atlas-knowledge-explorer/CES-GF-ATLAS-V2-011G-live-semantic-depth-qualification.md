# CES-GF-ATLAS-V2-011G - Live Semantic-Depth Qualification

**Status:** In Progress
**Depends on:** ATLAS-V2-011F

## Outcome

Prove in production-shaped runs that Atlas understands substantive PRD content
deeply enough for correct graphs to emerge from the semantic model.

## Scope

- Qualify Safara as a golden objective without hardcoding labels or topology.
- Qualify at least one unrelated workflow PDF and one unrelated non-workflow PDF.
- Measure relevant-source disposition, concept/evidence coverage, recursive depth,
  unresolved relationships, unsupported-view suppression, and traceability.
- Assert the complete pipeline boundary: evidence coverage, capability detection,
  decomposition, engineering intent, relationship model, then graph projection.
- Exercise module selection, nested navigation, representation switching,
  breadcrumb behavior, graph evidence selection, and rendered PDF evidence.
- Fail publication for shallow, misleading, ungrounded, or structurally invalid output.

## Acceptance

- Safara Main Workflow remains high-level while substantive modules expose
  source-supported concepts and applicable detailed representations.
- Qualification proves at least one evidence-justified nested concept path.
- Safara qualification rejects introductory-context nodes presented as module
  workflow detail and rejects a module detail containing only incidental external
  dependencies when substantive internal semantics are evidenced.
- Every displayed semantic item and graph element resolves to exact PDF evidence.
- Generic cases prove the implementation is not Safara-specific.
- Unit, contract, integration, UI, and production build gates pass.

## Verified evidence

- Production-shaped qualification passes for the Safara objective, an unrelated
  warehouse workflow, and an unrelated non-workflow library structure.
- The corrected live Safara PDF run reached `awaiting_human_review` with 9 modules,
  110 semantic concepts (101 below modules), 14 resolved semantic relationships,
  3 review-required unresolved relationships, 15 detail representations, 133
  facts, and evidence across all 7 pages.
- The live gate exposed and corrected overly strict parent-label grounding that
  had discarded valid section facts when the exact parent heading was in another
  unit of the same bounded scope.
- Contract, extraction, selection, assembly, governance, CLI, API, UI, generic
  end-to-end, typecheck, and production Next.js build gates pass.

## Remaining qualification

- The repository currently contains no unrelated workflow PDF or unrelated
  non-workflow PDF. Live-provider runs for both are still required before this
  ticket and the V2-011 parent may be marked Completed.
