import { getFixtureScenario, type FixtureScenario } from "@atlas/fixtures";
import { ProjectLibrary } from "../../components/ProjectLibrary";

const scenarioIds: FixtureScenario["id"][] = ["owner-ready", "editor-ready", "viewer-ready", "empty-library", "processing-uploading", "processing-extracting", "processing-modeling", "processing-ready", "processing-needs-attention", "processing-failed", "approved-result"];

export default async function DemoPage({ searchParams }: { searchParams?: Promise<{ scenario?: string }> }) {
  const requestedScenario = (await searchParams)?.scenario;
  const scenario = getFixtureScenario(scenarioIds.includes(requestedScenario as FixtureScenario["id"]) ? requestedScenario as FixtureScenario["id"] : "owner-ready");
  return <ProjectLibrary projects={scenario.projects} user={scenario.session} workspace={scenario.workspace} />;
}
