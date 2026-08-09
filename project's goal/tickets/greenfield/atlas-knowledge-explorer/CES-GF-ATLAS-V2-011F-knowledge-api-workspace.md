# CES-GF-ATLAS-V2-011F - Knowledge API and Detail Workspace

**Status:** Completed
**Depends on:** ATLAS-V2-011E

## Outcome

Expose and render recursive semantic detail while preserving the established
three-column Atlas layout and permanently visible Main Workflow.

## Scope

- API returns selected subject, ancestry, ordered semantic children, source
  coverage, evidence IDs, available representations, and selected projection.
- Explore lists modules and lazily expandable source-supported concepts.
- Detail shows breadcrumb, semantic kind, source pages/unit count, source-derived
  overview, nested concepts, available representations, and selected graph.
- Representation choices show their source-supported purpose/concern and do not
  appear when their semantic prerequisites are absent.
- Selecting a concept or representation updates detail below Main Workflow.
- Selecting any semantic or graph element synchronizes exact PDF evidence.
- Do not invent UI children, fixed representation tabs, or fallback graphs.

## Acceptance

- `Main Workflow > Module > Nested Concept` comes entirely from backend ancestry.
- Main Workflow does not disappear when detail changes.
- Available representations reflect support assessments exactly.
- PDF evidence remains original-language, revision-pinned, and traceable.
- The evidence panel exposes exact text, PDF page/source unit, confidence, and
  review status for the selected semantic node or relationship.

## Completion evidence

- The revision-pinned API returns semantic children, depth, source pages/unit
  counts, exact overview evidence, and full available representations separately.
- Explore expands source-supported concepts; the detail workspace renders source
  coverage, nested concepts, representation choices, and the selected projection
  below the permanently visible Main Workflow.
- Representation switching does not alter semantic breadcrumbs, while semantic
  and graph selection continue synchronizing the PDF evidence panel.
