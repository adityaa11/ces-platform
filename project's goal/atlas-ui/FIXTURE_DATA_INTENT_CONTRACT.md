# Atlas Fixture Data-Intent Contract

This contract is the backend-wiring bridge for the UI prototype. Fixtures are not screen-local mock text: they describe the records and relationships that a future API must supply.

## Identity and ownership

Every UI-visible record has a stable ID. `FixtureScenario` owns the available project list and session; `ProjectWorkspaceFixture` owns the detailed model for one project. A workspace may be shown only when `workspace.project.id` is present in `scenario.projects`.

## Project selection and destinations

The library has **no selected project**. A project becomes selected only after the user chooses a project whose status permits the requested destination.

| Project status | Library behavior | Workflow destination |
|---|---|---|
| `ready` | Selectable | `/demo?projectId=<id>&view=workflow` in the prototype; future API route resolves the same ID |
| `processing` | Selectable for status inspection | No workflow destination until the processing job is `ready` |
| `needs-attention` | Selectable for recovery | No workflow destination; expose the related job/action |

The card, project switcher, processing notice, PRD lens, workflow view, facts, changes, CES results, memberships, and approval state must all resolve through the same `projectId`. Display labels never determine identity or routing.

## Required relationship paths

| UI surface | Required source relationship |
|---|---|
| Project card and switcher item | `scenario.projects[]` by `project.id` |
| Project workspace | `workspace.project.id === selectedProjectId` |
| Processing state | `processingJob.projectId === project.id` |
| PRD lens | `workspace.prds[].id` referenced by workflow groups, workflows, nodes, facts, changes, and CES evidence |
| Workflow overview | `workflowGroup.workflowIds[]` resolves to `workflows[].id`; group order defines the overview sequence |
| Evidence | evidence `documentId` resolves to a workspace PRD; page is within that PRD's page count |
| Change and CES result | referenced workflow/fact IDs resolve within the same workspace |
| Collaboration | membership belongs to the same selected workspace project |

## Backend replacement boundary

Future services replace fixture queries, not UI-owned records. The backend must provide:

- a project library filtered by permitted user access;
- project selection by ID;
- project workspace by ID, including related PRDs, workflow graph, facts, changes, CES results, memberships, approvals, and processing jobs; and
- capability/state information that tells the UI which destination or recovery action is available.

No component may invent a project, current selection, count, route, PRD, workflow, or status not present in this relationship graph.
