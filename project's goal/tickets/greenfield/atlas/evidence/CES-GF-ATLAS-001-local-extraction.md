# CES-GF-ATLAS-001 Local Extraction Evidence

**Validated:** 24 July 2026  
**Status:** Validated locally and in hosted CI

## Delivered packages

### Document ingestion

Package: `@company/ces-document-ingestion`

- Accepts one or more Markdown documents.
- Normalizes line endings and workspace-relative paths.
- Produces stable SHA-256 content identities and line counts.
- Sorts documents deterministically.
- Rejects absolute paths, traversal, non-Markdown files, duplicate document IDs,
  and duplicate paths.

### Agent provider SDK

Package: `@company/ces-agent-provider-sdk`

- Versioned request and result contracts.
- Provider-neutral analysis interface.
- Deterministic fixture provider.
- Configurable HTTPS JSON provider with injected transport support.
- Provider/model/prompt-contract execution stamping.
- Schema validation before provider results are returned.
- Explicit rejection when a provider attempts to claim approved review state or
  confirmed/derived/observed candidate origin.
- API keys remain authorization headers and are not included in request bodies.

### Atlas extraction orchestration

Package: `@company/ces-atlas-extraction`

- Combines source indexing, Project Intent, and provider analysis.
- Emits candidates, candidate Business Rules, uncertainties, conflicts,
  clarification questions, source index, and extraction report.
- Validates document identity, normalized path, content hash, and source-line
  bounds for every candidate.
- Rejects duplicate candidate and proposed logical identities.
- Normalizes candidate outputs by stable IDs.

## Boundary evidence

- Candidate contracts have a distinct root shape and fail the approved
  Requirement Package parser.
- Providers return values only; they have no registry dependency or write API.
- Architecture tests permit Atlas dependencies inward to source, provider, and
  candidate contracts only.
- The deterministic policy core has no dependency on Atlas, document ingestion,
  or agent providers.

## Provider examples

The fixture provider proves deterministic CI behavior. The HTTP provider test
uses a redacted injected transport and verifies:

- HTTPS is mandatory;
- provider failures are explicit;
- the configured model is sent;
- authorization remains outside the request body;
- untrusted provider metadata is replaced by configured execution metadata.

No network service or secret is required for repository tests.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     191 passed, 0 failed, 0 skipped
Test files: 27 passed
Build:     passed
```

## Cross-platform CI correction

Linux-hosted validation exposed that Node's default `path.isAbsolute()` follows
the runner operating system and therefore did not recognize a Windows
drive-qualified path as absolute. Document ingestion now applies POSIX and
Windows path semantics explicitly and also rejects Windows drive-relative paths.
Regression coverage includes drive-qualified, drive-relative, UNC, POSIX
absolute, parent-traversal, and non-Markdown paths.

## Hosted validation

- Workflow: `CES repository tests`
- Run: [`30104896323`](https://github.com/adityaa11/ces-platform/actions/runs/30104896323)
- Job: [`89519808383`](https://github.com/adityaa11/ces-platform/actions/runs/30104896323/job/89519808383)
- Result: passed
- Commit: `161cf6604e04a5f0fde93dabe18058b78d751b4f`

## Gate decision

ATLAS-001 is accepted. `CES-GF-ATLAS-002` may begin.
