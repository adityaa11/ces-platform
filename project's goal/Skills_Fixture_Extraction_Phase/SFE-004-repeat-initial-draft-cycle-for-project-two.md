# SFE-004: Repeat the Initial Draft cycle for project 02

> **Runtime identity:** “Project 01” and “project 02” label the first and second modal submissions only. The implementation must resolve both project IDs, workspace IDs, paths, and provenance from their respective fixture records.

- **State:** planned
- **Review batch:** BATCH-29
- **Depends on:** SFE-000 approved; SFE-003 approved
- **Baseline:** [SFE phase scope](SFE-README.md); [SFE-000 integration map](SFE-000-skills-to-sfe-integration-map.md); [SFE-001](SFE-001-project-intake-and-initial-workspace.md); [SFE-002](SFE-002-initial-draft-extraction.md); [SFE-003](SFE-003-route-and-switcher-initial-draft-wiring.md); [Atlas PRD extraction skill](../../.agents/skills/atlas-prd-extraction/SKILL.md); [Atlas fixture verification skill](../../.agents/skills/atlas-fixture-verification/SKILL.md)
- **SFE-000 map entries:** SFE-M0 source isolation; SFE-M1 independent extraction and normalized comparison; SFE-M2 extraction-results handoff; SFE-M5 distinct IDs, project isolation, and comparison checks
- **Source authority:** The comparison uses only the two independently uploaded SFE workspace artifacts and their skill outputs; see the [SFE workspace-source rule](SFE-README.md#sfe-workspace-source-rule).

## Outcome

Create a distinct second scenario project through the same project modal and repeat the Extracting-card, Initial Draft extraction, generated workspace ID, and route-wiring sequence from SFE-001 through SFE-003. Resolve its ID from the modal record; `project-safara-02` and “project 02” are test labels, not implementation inputs. Its PDF 01 extraction is independent and compared with the first scenario project's result.

## Scope

- Have the user submit the Create a project modal for project 02 with Foundation Enrollment PDF 01; create the card and processing job from that submission.
- Generate the second scenario project's own Initial Draft workspace ID during its SFE-001-style modal submission, store PDF 01 at `docs/PRD/<project-id>/<workspace-id>/<uploaded-filename.pdf>`, and independently process those bytes through SFE-002-style extraction.
- Create an empty project 02 Master and a Ready-to-review Initial Draft with its own candidate IDs, extraction provenance, and source grounding.
- Wire project 02's card and route to its own project/workspace records using the same route behavior as project 01.
- Compare the normalized extraction result against SFE-002 using the updated SFE-M1 accounting and rich-extraction contract. Generated project, workspace, artifact, candidate, execution IDs, and timestamps remain distinct; candidate meaning, ambiguity classification, exact quotes, page provenance, detailed payloads, workflow steps, branches, and relationships must match.

## Out of scope

- Publishing project 02's Initial Draft; SFE-005 owns the completed approval/publication scenario.
- Modifying project 01 or reusing its extraction output as project 02's result.
- Adding PDF 02; SFE-006 owns its upload through the new-workspace modal.

## Acceptance criteria

- Project 02 is created from the user's modal submission and initially displays Extracting, then transitions to Ready to review after its independent PDF 01 extraction completes.
- Project 02 has distinct project, job, workspace, candidate, and provenance IDs; its Initial Draft ID uses the agreed format and its files resolve only under the project 02 workspace directory.
- The normalized project 02 extraction output matches SFE-002's project 01 output for assertions, ambiguity classifications, source excerpts, and page references. The comparison report lists exact differences if any; a semantic difference fails the ticket.
- Both runs have separate source-accounting inventories and distinct project, artifact, candidate, and execution IDs. The comparison covers complete factual and workflow meaning, including ordering, conditions, branches, dependencies, inputs, outputs, and relationships; it ignores generated identifiers but does not normalize away semantic detail.
- Project 02's Master starts empty. Its card and route resolve the project 02 record and Initial Draft rather than project 01 data.
- Project 01 remains Ready to review, openable, and without Master work after project 02 is created and processed.

## Validation

- Repeat the actual browser creation and extraction path for project 02 rather than inserting a seeded card or cloning a fixture result.
- Verify the uploaded PDF hashes match, the two skill invocations and source-accounting inventories are independent, all project/artifact/candidate/execution IDs are distinct, and the normalized comparison passes.
- Switch between project 01 and project 02 and verify the route, card, workspace selector, file path, and extraction provenance never cross project boundaries.
- Run fixture relationship, extraction, route, keyboard/accessibility, and focused visual checks for both initial-draft projects.
