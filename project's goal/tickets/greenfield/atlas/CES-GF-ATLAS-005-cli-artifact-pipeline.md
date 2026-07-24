# CES-GF-ATLAS-005 — Atlas: CLI and Artifact Pipeline

**Phase:** 3C — Atlas Operationalization  
**Parent:** Greenfield Product Suite  
**Status:** Hosted CI passing; real-provider validation pending

**Evidence:** [`evidence/CES-GF-ATLAS-005-local-cli-pipeline.md`](evidence/CES-GF-ATLAS-005-local-cli-pipeline.md)

## Goal

Provide a safe, resumable command-line workflow that takes Markdown or PDF PRDs
through extraction, human review, approved Requirement Packages, core handoff,
and deterministic graph artifacts.

## Work

- Add Atlas CLI commands for ingest, extract, review preparation, approval
  import, build, inspect, and full resumable execution.
- Accept Markdown through ATLAS-001 and PDF through ATLAS-004.
- Accept a schema-validated `ProjectIntent` file.
- Configure fixture and HTTPS agent providers without embedding credentials in
  arguments, artifacts, logs, or request bodies.
- Add at least one documented provider-adapter example that converts a model
  API response into the existing `AtlasProviderResult` contract.
- Stop after candidate extraction when blocking questions or missing human
  decisions exist.
- Emit a review bundle and resume only from revision-bound human decisions.
- Generate approved Requirement Collection, individual Requirement Packages,
  review report, system-intent JSON, Markdown, Mermaid, and core-handoff
  summaries.
- Write artifacts through a staging directory and publish them atomically only
  after validation succeeds.
- Add stable exit codes and structured diagnostics for input, provider, review,
  graph, and core-handoff failures.
- Record tool, contract, parser, prompt, provider, model, and source revisions
  in a redacted run manifest.

## Target workflow

```text
ces atlas run \
  --prd docs/prd/product.pdf \
  --project-intent project-intent.json \
  --output .ces/generated/atlas

candidate extraction
→ review bundle and questions
→ explicit human decisions
→ ces atlas resume
→ approved packages and graph artifacts
```

The initial command must never interpret the absence of human decisions as
approval.

## Target artifacts

```text
.ces/generated/atlas/
├── run-manifest.json
├── source-index.json
├── candidate-analysis.json
├── clarification-questions.json
├── review-input.json
├── review-report.json
├── requirement-collection.json
├── requirement-packages/
├── system-intent-graph.json
├── system-intent-graph.md
├── system-intent-graph.mmd
└── core-handoff/
```

## Acceptance criteria

- [x] A real Markdown PRD completes extraction through graph generation after
      explicit human review.
- [x] A supported real PDF PRD completes the same workflow through ATLAS-004.
- [x] Blocking questions and missing decisions pause the workflow with a
      non-success exit code and resumable artifacts.
- [x] No agent can approve, correct, or supersede its own candidates.
- [x] Replaced source, candidate, decision, or configuration revisions invalidate
      stale resume state.
- [x] Repeated runs with equivalent approved inputs produce byte-identical
      approved artifacts.
- [x] Generated Mermaid renders without editing and matches graph JSON identity.
- [x] Provider secrets never appear in arguments, artifacts, logs, or hashes.
- [x] Failed runs do not partially replace the last valid output.
- [x] Existing Phase 1 and Phase 2 CLI behavior remains compatible.

## Required evidence

- [x] End-to-end Markdown fixture using the deterministic provider.
- [x] End-to-end native-text PDF fixture.
- [x] Mocked HTTPS provider fixture with redacted request evidence.
- [x] Pause, review, resume, stale-resume, and correction fixtures.
- [x] Atomic-output and interrupted-run fixtures.
- [x] JSON/Markdown/Mermaid artifact determinism fixtures.
- [x] Hosted CLI smoke test with no external secret.
- [ ] Manual real-provider run evidence stored without PRD text or credentials.

## Out of scope

- Automatic approval of agent output.
- Interactive browser graph visualization.
- Organization-wide authentication and reviewer roles.
- Provider billing management.
- Sending original PDF bytes to an agent provider.

## Depends on

- `CES-GF-ATLAS-004`
