# CES-GF-AGB-007 - Policy Taxonomy Agent Golden Replay

**Status:** Implemented candidate; pending REVIEW_GATE
**Review class:** REVIEW_GATE
**Depends on:** Accepted AGB-006 and AGB-008
**Blocks:** AGB-014

## Outcome

Register a provider-neutral Policy Taxonomy Agent in the existing Agents Bridge
and prove the accepted POL-008-R02 sensitive-data decision as its first golden
semantic replay.

## Scope

- Registered, versioned structured-generation agent using the canonical bridge
  route and existing provider/model registries.
- Input pinned to accepted raw v1.2, canonical v1.5, predecessor taxonomy v1.1,
  the two approved data-protection concepts, and their provenance.
- Structured `ADD`, `MERGE`, or `REJECT` proposals with predecessor comparisons.
- Policies-owned transformation into the AGB-006 proposal contract.
- Golden evaluation for semantic equivalence rather than byte equality.

## Acceptance contract

- The replay proposes classification `ADD` and disclosure-minimization `MERGE`
  into one reusable sensitive-data Policy, or an equivalently valid proposal.
- Both canonical meanings and raw lineages remain distinguishable.
- Comparison evidence covers every relevant predecessor and the relationship
  between the proposed concepts.
- Policy wording remains WHAT-not-HOW, reusable, technology-independent, and
  free of Safara-specific terms.
- Output remains candidate/proposed and cannot self-approve or publish.
- Malformed, invented, stale, ungrounded, or authority-escalating output fails.

## Explicit non-goals

- Exact reproduction of historical prose, complete Safara replay, final
  POL-008 approval, or changes to accepted POL-008-R02.
- A second Policy-specific bridge or caller-selected prompts/models.

## Review focus

Semantic fidelity, project independence, lineage, predecessor comparison,
bridge reuse, and the non-authoritative proposal boundary.

## Implementation evidence

- Registered agent: `ces.policy-taxonomy-agent` version `1.0.0` in the existing
  Agents Bridge runtime and provider/model registries.
- Governed input requires an AGB-006 `POLICY_GAP` request plus exact approved
  canonical-obligation and predecessor-Policy payloads.
- Output is transformed into the AGB-006 content-addressed proposal contract;
  execution requires structured output and human review and permits no tools.
- The POL-008-R02 golden replay uses semantically equivalent, non-byte-identical
  rationales and passes the accepted AGB-008 validator as a reviewable proposal
  with `grants_policy_authority: false`.
- The production agent resolves the accepted raw v1.2, canonical v1.5, and
  predecessor taxonomy v1.1 tuple from a server-controlled, fail-closed
  registry and enforces AGB-008 before returning any proposal.
- A canonical `executeRegisteredAgent(...)` test proves both branches: valid
  replay output returns, while structurally valid but AGB-008-invalid output
  fails with `INVALID_AGENT_RESULT` and cannot escape successfully.
- Focused evidence: 24 bridge/architecture tests passed and
  `@company/ces-agents-bridge` typecheck passed.

This evidence is implementation evidence only. It does not accept this ticket,
publish the proposed Policy, or grant final POL-008 authority.
