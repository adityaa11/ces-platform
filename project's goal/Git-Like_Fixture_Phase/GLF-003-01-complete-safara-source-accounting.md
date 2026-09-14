# GLF-003-01: Complete Safara source accounting and deterministic skill outputs

- **State:** complete
- **Review batch:** BATCH-19.1
- **Depends on:** GLF-003
- **Baseline:** GLF-003; Safara Increment 01-03 PRDs; Atlas skill contracts

## Outcome

Refactor the GLF-003 reference generator so its published bundle represents the
complete Safara operational scenario, not only a manifest eligibility example.
Every Increment 01-03 Safara source PDF has page-grounded extraction output and
the selected Increment 03 branch projects every main operational stage. The
consolidated Buyer PRD is intentionally excluded: it duplicates the same PRD
authority already represented by the incremental source sequence.

## Audit finding and desired output

| Area | Previous GLF-003 output | GLF-003-01 deterministic output |
|---|---|---|
| Source artifacts | Three incremental PDFs | The same three incremental PDFs, treated as the sole authoritative PRD sequence |
| Extraction | 4 assertions total; each PRD claimed no unaccounted statements | 43 candidate assertions, each with its own PDF-page provenance, across three extraction outputs |
| Project facts | Manifest eligibility, manifest snapshot, blocker display | Package/departure, pilgrim, registration, payment, documents, readiness, manifest, reporting, audit, and access facts |
| Main Workflow | One manifest record on every surface | Eleven operational stages, from access through delivery and acceptance |
| Skill outputs | Schema-valid but narrowly hardcoded example | Inspectable deterministic outputs for extraction, repository, staged change, branch projections, and verification |
| Publication gate | Topology/evidence only for the narrow scenario | Source-artifact accounting, non-empty per-artifact extraction, full materialization, and branch-appropriate workflow coverage |

## Scope

- Keep local, deterministic fixture authoring in `codex` mode only.
- Use a checked-in source catalog with exact PDF-page excerpts; do not claim a
  live provider or Agents Bridge execution.
- Build repository candidates, staged proposals, projections, and verification
  responses through the existing five skill contracts.
- Reject publication if any Safara PDF lacks extracted assertions, an extraction
  claims empty accounting incorrectly, branch state is partly materialized, or
  the Increment 03 workflow is missing a required stage.

## Acceptance criteria

- The bundle contains only the three Increment 01-03 Safara PDFs and a stable SHA-256 for each.
- Each extraction response has at least one candidate and accounts for exactly
  the assertions assigned to its source artifact.
- The Increment 03 projection contains these stages: access control,
  packages/departures, pilgrim data, registration, payments, documents,
  readiness, manifest, dashboard/reports, and activity history.
- Project Facts, CES, chatbot, and Main Workflow projections all resolve from
  the selected branch materialized state.
- A deterministic regression test protects source count, assertion count,
  non-empty extraction output, workflow-stage coverage, and representative
  payment/document/dashboard/audit facts.

## Validation

Run `corepack pnpm --filter @atlas/fixtures test`.
