# CES-GF-DAPE-010 — Semantic Mapping, Disposition, and Gaps

**Priority:** P1 — Shared model  
**Status:** Planned

## Goal

Give every approved semantic record a reviewed downstream disposition without
changing its business meaning.

## Work

- Add semantic-to-capability and semantic-to-trait mapping contracts.
- Record mapping rationale, confidence, provenance, reviewer, and registry
  target versions.
- Require one of: mapped policy, mapped capability, implementation-only,
  architecture-only, verification-only, policy gap, capability gap,
  clarification required, or not applicable with reason.
- Publish explicit capability-gap and policy-gap artifacts.
- Prevent mapping agents from approving or rewriting business records.

## Acceptance criteria

- [ ] No approved record disappears from downstream processing.
- [ ] Business truth remains separate from engineering derivation.
- [ ] Unknown needs produce gaps rather than invented registry IDs.
- [ ] Equivalent reviewed mappings are deterministic.

## Depends on

- `CES-GF-DAPE-009`

