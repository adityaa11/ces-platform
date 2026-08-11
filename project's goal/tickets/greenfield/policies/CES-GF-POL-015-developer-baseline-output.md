# CES-GF-POL-015 - Developer Baseline Awareness Output

**Status:** Proposed
**Depends on:** POL-014

## Outcome

Publish a renderer-neutral, developer-facing baseline that explains applicable
obligations, grounding, concerns, capability needs, and unresolved decisions.

## Scope

- Versioned baseline identity and immutable binding references.
- Machine-readable artifact plus one human-readable reference renderer.
- Atlas fact provenance, source/canonical provenance, applicability, resolution,
  and validation status.
- Explicit display of awareness versus decisions required.

## Acceptance contract

- Every displayed obligation traces to exact binding, policy baseline, and
  Atlas revision identities.
- Renderer output cannot add, remove, or reinterpret obligations.
- Missing and decision-required information is visible, never silently empty.
- No certification claim or implementation prescription is emitted.
- Re-rendering the same baseline is deterministic apart from declared metadata.

## Explicit non-goals

- Architecture recommendations, stack selection, code generation, scoring, or a
  complete production UI.
- Replacing Assurance evidence or claiming ISO certification.
