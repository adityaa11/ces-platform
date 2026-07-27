# CES-GF-DAPE-004 — Bounded Atlas Agent Roles

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Replace the one-pass super-agent with separately registered, bounded Atlas
roles behind the existing Agents Bridge.

## Work

- Register document-structure, domain-discovery, and section-extractor agents.
- Run extraction per section or bounded source-unit group.
- Give each role its own schema, prompt, budget, model alias, version, and
  authorization policy.
- Add deterministic merge, canonical ordering, ID normalization, provenance
  checks, and conflict detection.
- Keep fixture providers deterministic and real-provider tests opt-in.

## Acceptance criteria

- [ ] No role can approve candidates or mutate source units.
- [ ] Section retries cannot change accepted output from unrelated sections.
- [ ] Merged output is deterministic regardless of completion order.
- [ ] Provider/model replacement requires no semantic contract change.
- [ ] Agents Bridge shared execution logic remains unchanged.

## Depends on

- `CES-GF-DAPE-003`

