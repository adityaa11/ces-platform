import { getFixtureScenario, projectCardStressFixtures, resolveFixtureProjectRoute, type FixtureScenario } from "@atlas/fixtures";
import { ProjectLibrary } from "../../components/ProjectLibrary";
import { WorkflowWorkspace } from "../../components/WorkflowWorkspace";
import { ProjectKnowledge } from "../../components/ProjectKnowledge";
import { CesResult } from "../../components/CesResult";
import { SourcesWorkspace } from "../../components/SourcesWorkspace";
import { WorkspaceSwitcherPreview } from "../../components/WorkspaceSwitcherPreview";

const scenarioIds: FixtureScenario["id"][] = ["owner-ready", "editor-ready", "viewer-ready", "empty-library", "processing-uploading", "processing-extracting", "processing-modeling", "processing-ready", "processing-needs-attention", "processing-failed", "approved-result"];
const lensFromSearch = (initial: FixtureScenario["lens"], prd?: string, mode?: string) => ({ selectedPrdIds: prd ? prd.split(",").filter(Boolean) : initial.selectedPrdIds, mode: mode === "isolate" ? "isolate" as const : initial.mode });

export default async function DemoPage({ searchParams }: { searchParams?: Promise<{ scenario?: string; stress?: string; preview?: string; view?: string; projectId?: string; prd?: string; lens?: string; workflowId?: string; factId?: string; cesItemId?: string }> }) {
  const params = await searchParams;
  const requestedScenario = params?.scenario;
  const requestedView = params?.view;
  const requestedProjectId = params?.projectId;
  const prd = params?.prd;
  const lensMode = params?.lens;
  const projectCardStress = params?.stress === "project-cards";
  if (params?.preview === "workspace-switcher") return <WorkspaceSwitcherPreview />;
  const scenario = getFixtureScenario(scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario as FixtureScenario["id"] : "owner-ready");
  const scenarioId = scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario : undefined;
  const projectRoute = resolveFixtureProjectRoute(scenario, requestedProjectId);
  const initialLens = lensFromSearch(scenario.lens, prd, lensMode);
  if (projectRoute.canOpenWorkspace && requestedView === "workflow") return <WorkflowWorkspace initialLens={initialLens} initialWorkflowId={params?.workflowId} projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={projectRoute.workspace!} />;
  if (projectRoute.canOpenWorkspace && (requestedView === "facts" || requestedView === "changes")) return <ProjectKnowledge initialFactId={params?.factId} initialLens={initialLens} projects={scenario.projects} scenario={scenarioId} user={scenario.session} view={requestedView} workspace={projectRoute.workspace!} />;
  if (projectRoute.canOpenWorkspace && requestedView === "ces") return <CesResult initialCesItemId={params?.cesItemId} initialLens={initialLens} projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={projectRoute.workspace!} />;
  if (projectRoute.canOpenWorkspace && requestedView === "sources") return <SourcesWorkspace initialLens={initialLens} projects={scenario.projects} scenario={scenarioId} user={scenario.session} workspace={projectRoute.workspace!} />;
  return <ProjectLibrary projects={projectCardStress ? projectCardStressFixtures : scenario.projects} scenario={scenarioId} user={scenario.session} workspace={projectCardStress ? undefined : scenario.workspace} />;
}
