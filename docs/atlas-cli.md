# Atlas CLI

Atlas accepts Markdown or native-text PDF PRDs, pauses for explicit human
review, and resumes into approved Requirement Packages, core handoff artifacts,
and JSON, Markdown, and Mermaid system-intent graphs.

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

For a CES-compatible HTTPS provider:

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

API keys, tokens, and secrets are rejected as CLI arguments. The HTTPS provider
reads only `CES_ATLAS_API_KEY`.

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
