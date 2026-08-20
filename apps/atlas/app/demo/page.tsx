import { getFixtureScenario } from "@atlas/fixtures";
import { ProjectLibrary } from "../../components/ProjectLibrary";

export default function DemoPage() {
  const scenario = getFixtureScenario("owner-ready");
  return <ProjectLibrary projects={scenario.projects} user={scenario.session} />;
}
