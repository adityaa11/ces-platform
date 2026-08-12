# CES-GF-POL-007-H01 - Human Semantic Approval Evidence

**Evidence type:** Human semantic approval record
**Approver:** CES project owner
**Approval date:** 2026-08-12
**Applies to:** POL-007 implementation chain `7e1117c` -> `4eb3912`
**Candidate vocabulary:** `ces-policy-canonical-vocabulary` revision `1.0.0`

## Approval

The project owner approves the seven representative canonical concepts and the
three proposed canonicalization decisions recorded in candidate revision
`1.0.0`:

- Merge the independently mapped NIST CSF access-authorization and NIST
  SP 800-53 access-enforcement meanings into `ces.access-authorization`.
- Keep `ces.object-authorization-bypass` as a `concern`.
- Keep `ces.object-authorization-testing` as a separate
  `verification_context`.
- Treat `insecure direct object reference` as an alias of the bypass concern,
  not a second canonical concept.
- Approve all seven current concepts as a bounded, representative canonical
  vocabulary rather than a complete future CES vocabulary.

## Mandatory provenance invariant

Canonicalization groups equivalent meaning but must not erase evidence. Every
canonical concept retains every contributing mapping to its raw concept and
source release. Exact source locators remain resolvable through the accepted
POL-006 raw vocabulary.

Downstream lineage remains:

```text
Policy -> Canonical Concept -> Canonical Mapping
       -> Raw Concept -> Source Release -> Exact Source Locator
```

Where multiple sources materially support one canonical concept, downstream
Policies must expose all support rather than choosing one arbitrarily.

## Boundary

This approval authorizes publication of a distinct approved successor POL-007
vocabulary revision. It does not approve final Policies, Policy taxonomy,
project or Safara applicability, Atlas Context Bindings, Capability Needs,
architecture, implementation, complete Safara coverage, or certification
claims.

This evidence record is not a POL ticket-review terminal result.
