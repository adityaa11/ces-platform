import { getFixtureScenario, type FixtureScenario } from "@atlas/fixtures";
import { ProjectLibrary } from "../../components/ProjectLibrary";
import { WorkflowWorkspace } from "../../components/WorkflowWorkspace";

const scenarioIds: FixtureScenario["id"][] = ["owner-ready", "editor-ready", "viewer-ready", "empty-library", "processing-uploading", "processing-extracting", "processing-modeling", "processing-ready", "processing-needs-attention", "processing-failed", "approved-result"];

export default async function DemoPage({ searchParams }: { searchParams?: Promise<{ scenario?: string; view?: string; projectId?: string }> }) {
  const requestedScenario = (await searchParams)?.scenario;
  const requestedView = (await searchParams)?.view;
  const requestedProjectId = (await searchParams)?.projectId;
  const scenario = getFixtureScenario(scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario as FixtureScenario["id"] : "owner-ready");
  if (requestedView === "workflow" && requestedProjectId === scenario.workspace?.project.id) return <WorkflowWorkspace initialLens={scenario.lens} user={scenario.session} workspace={scenario.workspace} />;
  return <ProjectLibrary projects={scenario.projects} user={scenario.session} workspace={scenario.workspace} />;
}
