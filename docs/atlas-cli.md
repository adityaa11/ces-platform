# Atlas CLI

Atlas accepts Markdown or native-text PDF PRDs, pauses for explicit human
review, and resumes into approved Requirement Packages, core handoff artifacts,
and JSON, Markdown, and Mermaid system-intent graphs.

## One-command local workflow

From the repository root, a configured `agent.env` and installed workspace
dependencies are the only prerequisites:

```text
pnpm atlas:run
```

The cross-platform Node runner builds the CLI and Agents Bridge, waits for the
bridge, runs extraction, accepts only exit code `7` (review pending), stops the
bridge, and starts the UI. Generated artifacts default to
`.ces/generated/safara-buyer`, staged PDFs to `.ces/runtime/atlas-pdfs`, and
bridge logs to `.ces/runtime/agents-bridge.*.log`. The printed URL is derived
from the generated manifest. `Ctrl+C` stops the UI; the bridge has already
stopped and the UI continues to read the generated files.

Custom projects use an output directory whose final segment is the generated
project ID:

```text
pnpm atlas:run -- --prd docs/prd/other.pdf --project-intent docs/prd/other.json --output .ces/generated/other-project
```

Use `--no-ui` when only artifact generation is wanted.

### Local workflow verification record

On 2026-08-19, `pnpm test:atlas-local` passed all four orchestration tests. A
production-shaped `pnpm atlas:run -- --no-ui` run from the repository root then
confirmed that the runtime packages built, the bridge became ready, extraction
returned review-pending exit code `7`, and the generated manifest identified
`safara-buyer` revision `1`. Artifacts were written beneath
`.ces/generated/safara-buyer`, the source PDF was staged beneath
`.ces/runtime/atlas-pdfs/safara-buyer`, and port `8787` was no longer listening
after extraction. The normal `pnpm test` path also contains this runner suite;
the repository-wide Vitest phase subsequently reported 503 passes and two
pre-existing bootstrap process-timeout test failures.

## 1. Prepare Project Intent

Create `project-intent.json`:

```json
{
  "schema_version": "1.0.0",
  "project": {
    "id": "sample",
    "lifecycle": "greenfield",
    "application_type": "transactional_web_application",
    "business_domain": "project_management"
  },
  "delivery": {
    "team_size": 3,
    "expected_delivery_months": 6,
    "deployment_preference": "managed_cloud"
  },
  "constraints": {
    "expected_users": 1000,
    "data_sensitivity": "internal",
    "multi_tenant": false
  },
  "skills": {
    "preferred_languages": ["typescript"],
    "preferred_databases": ["postgresql"]
  }
}
```

## 2. Extract Candidates

For the local Agents Bridge, load the git-ignored `agent.env` file. Atlas uses
`CES_ATLAS_API_KEY` when present and otherwise reuses
`AGENTS_BRIDGE_API_KEY`:

```powershell
node --env-file=agent.env apps/agents-bridge/dist/main.js
```

In another terminal:

```powershell
node --env-file=agent.env apps/cli/dist/index.js atlas run `
  --prd docs/prd/Safara_Buyer_Business_PRD.pdf `
  --project-intent docs/prd/safara-project-intent.json `
  --provider-endpoint http://127.0.0.1:8787/v1/atlas/analyze `
  --provider agents-bridge `
  --model gemini-3.1-flash-lite `
  --output .ces/generated/atlas
```

For another CES-compatible HTTPS provider:

```powershell
$env:CES_ATLAS_API_KEY = "<provider-api-key>"
node apps/cli/dist/index.js atlas run `
  --prd docs/prd/product.pdf `
  --project-intent project-intent.json `
  --provider-endpoint https://provider.example/atlas `
  --provider example-provider `
  --model example-model `
  --output .ces/generated/atlas
```

The expected exit code is `7`, meaning Atlas produced resumable review
artifacts and is waiting for human decisions. It is not an extraction failure.

For deterministic tests, replace the provider options with:

```text
--provider-result fixtures/atlas-provider-result.json
```

API keys, tokens, and secrets are rejected as CLI arguments. An HTTPS provider
reads `CES_ATLAS_API_KEY`; the local bridge may use the
`AGENTS_BRIDGE_API_KEY` fallback.

## 3. Review

Inspect:

```powershell
node apps/cli/dist/index.js atlas inspect `
  --output .ces/generated/atlas
```

Use `review-input.json` to create `decisions.json`:

```json
{
  "schema_version": "1.0.0",
  "decisions": [
    {
      "schema_version": "1.0.0",
      "candidate_id": "CANDIDATE-001",
      "candidate_revision_hash": "sha256:...",
      "source_revision_hash": "sha256:...",
      "decision": "approved",
      "decided_by": "product_owner"
    }
  ],
  "clarification_answers": []
}
```

Copy revision hashes exactly from `review-input.json`. Valid decisions are
`approved`, `rejected`, `corrected`, `superseded`, and `deferred`. A corrected
decision also supplies a `correction` object.

## 4. Resume

Create an assurance context:

```json
{
  "exposure": "private_network",
  "criticality": "standard",
  "tenancy": "single_tenant",
  "data_classes": ["internal"],
  "delivery_semantics": "synchronous"
}
```

Then resume:

```powershell
node apps/cli/dist/index.js atlas resume `
  --output .ces/generated/atlas `
  --decisions decisions.json `
  --assurance assurance.json `
  --baseline-version 1.0.0
```

Optional approved graph relationships can be supplied with `--links
requirement-links.json`.

Resume rejects modified source content, run configuration, candidate analysis,
candidate revisions, source revisions, and stale decisions. Valid output is
published atomically, so a failed run does not replace the previous directory.

## Provider endpoint

The endpoint protocol is documented in
[the provider adapter example](<../project's goal/tickets/greenfield/atlas/evidence/CES-GF-ATLAS-005-provider-adapter-example.md>).
