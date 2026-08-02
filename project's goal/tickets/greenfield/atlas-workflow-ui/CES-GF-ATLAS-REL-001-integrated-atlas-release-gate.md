# CES-GF-ATLAS-REL-001 — Integrated Atlas Release Gate

**Stage:** Atlas integrated production release
**Status:** Planned

## Objective

Release the Atlas integrated semantic-model and model-review experience only
when the backend semantic model and production UI independently pass their
qualification gates.

## Dependencies

- ATLAS-HARD-015 backend Safara qualification.
- ATLAS-UI-005 production workflow UI qualification.

## Work

- Verify both dependency reports refer to compatible immutable artifact,
  schema, API, UI, and deployment versions.
- Run the authenticated end-to-end review path from proposed workflow through
  evidence inspection, governed decision, approved materialization, and
  approved projection refresh.
- Confirm project authorization, revision pinning, idempotency, stale-command
  conflicts, secure document delivery, safe bulk approval, and audit records.
- Store the integrated release decision without redefining backend semantics or
  duplicating UI qualification.

## Acceptance criteria

- [ ] HARD-015 passes independently as a backend gate.
- [ ] UI-005 passes independently as a UI gate.
- [ ] Backend artifacts and the deployed UI use compatible pinned versions.
- [ ] The authenticated end-to-end approval path passes without frontend-owned
      semantic inference.
- [ ] Cross-project access, forged reviewer identity, stale commands,
      duplicate commands, and unauthorized source access fail safely.
- [ ] A human release reviewer records the integrated release decision.
- [ ] The released UI is the Node.js-hosted Next.js application and its real
      authenticated projection/decision routes, not the earlier static
      TypeScript prototype.
- [ ] Release evidence proves one canonical model, one bounded integrated
      overview, and synchronized focused projections without fabricated
      cross-model relationships.
- [ ] The frozen UI-000 contracts are version-pinned across backend artifacts,
      Next.js BFF DTOs, React Flow inputs, approved refresh, and qualification
      evidence.

## Outputs and evidence

Integrated release report, dependency report hashes, version compatibility
record, authenticated browser trace, authorization and concurrency test
results, audit references, and human release decision.

## Out of scope

Backend semantic qualification, UI layout qualification, workflow execution,
and any fixture-specific production behavior.
