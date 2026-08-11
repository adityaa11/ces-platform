# CES-GF-POL-005 - Raw Source Vocabulary Model

**Status:** Proposed
**Depends on:** POL-002

## Outcome

Define a source-faithful contract for extracted concepts before CES
canonicalization.

## Scope

- Stable raw-concept identity tied to one immutable source release.
- Source locator, source term, bounded description, provenance, and extraction
  metadata.
- Semantic role and a separate software-scope disposition.
- Roles covering objective, control, requirement, risk concern, verification
  context, and evidence expectation.

## Acceptance contract

- Every raw concept resolves to an existing source release and locator.
- Source terminology is preserved without silently canonicalizing it.
- Semantic role and in/out-of-software-scope disposition are independently
  representable.
- Duplicate identity and missing provenance fail validation.
- The contract can represent all four source families without source-specific
  fields in its core shape.

## Explicit non-goals

- Performing extraction or defining canonical CES vocabulary.
- Treating a WSTG test, implementation technique, or organizational control as
  a canonical policy.
- Selecting storage or search technology.
