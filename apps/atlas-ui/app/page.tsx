import { AtlasReview } from "./review";
import overview from "../data/proposed-project-overview-graph.json";
import workflows from "../data/proposed-workflow-detail-graphs.json";
import relationships from "../data/proposed-relationship-review.json";
import assignmentDiagnostics from "../data/workflow-assignment-diagnostics.json";
import targetDiagnostics from "../data/relationship-target-diagnostics.json";

export default function Page() {
  return (
    <AtlasReview
      overview={overview}
      workflows={workflows}
      relationships={relationships}
      assignmentDiagnostics={assignmentDiagnostics}
      targetDiagnostics={targetDiagnostics}
    />
  );
}
