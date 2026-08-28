import { getFixtureScenario, type FixtureScenario } from "@atlas/fixtures";
import { ProjectLibrary } from "../../components/ProjectLibrary";
import { WorkflowWorkspace } from "../../components/WorkflowWorkspace";
import { ProjectKnowledge } from "../../components/ProjectKnowledge";
import { CesResult } from "../../components/CesResult";

const scenarioIds: FixtureScenario["id"][] = ["owner-ready", "editor-ready", "viewer-ready", "empty-library", "processing-uploading", "processing-extracting", "processing-modeling", "processing-ready", "processing-needs-attention", "processing-failed", "approved-result"];
const lensFromSearch = (initial: FixtureScenario["lens"], prd?: string, mode?: string) => ({ selectedPrdIds: prd ? prd.split(",").filter(Boolean) : initial.selectedPrdIds, mode: mode === "isolate" ? "isolate" as const : initial.mode });

export default async function DemoPage({ searchParams }: { searchParams?: Promise<{ scenario?: string; view?: string; projectId?: string; prd?: string; lens?: string; workflowId?: string; factId?: string; cesItemId?: string }> }) {
  const params = await searchParams;
  const requestedScenario = params?.scenario;
  const requestedView = params?.view;
  const requestedProjectId = params?.projectId;
  const prd = params?.prd;
  const lensMode = params?.lens;
  const scenario = getFixtureScenario(scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario as FixtureScenario["id"] : "owner-ready");
  const scenarioId = scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario : undefined;
  const initialLens = lensFromSearch(scenario.lens, prd, lensMode);
  if (requestedView === "workflow" && requestedProjectId === scenario.workspace?.project.id) return <WorkflowWorkspace initialLens={initialLens} initialWorkflowId={params?.workflowId} projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={scenario.workspace} />;
  if ((requestedView === "facts" || requestedView === "changes") && requestedProjectId === scenario.workspace?.project.id) return <ProjectKnowledge initialFactId={params?.factId} initialLens={initialLens} projects={scenario.projects} scenario={scenarioId} user={scenario.session} view={requestedView} workspace={scenario.workspace} />;
  if (requestedView === "ces" && requestedProjectId === scenario.workspace?.project.id) return <CesResult initialCesItemId={params?.cesItemId} initialLens={initialLens} projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={scenario.workspace} />;
  return <ProjectLibrary projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={scenario.workspace} />;
}
