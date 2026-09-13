"use client";

import { useEffect, useState } from "react";
import { resolveFixtureProjectRoute, resolveFixtureWorkspaceContent, resolveFixtureWorkspaceRoute, type FixtureRouteProjectRecord, type FixtureScenario, type ProjectFixture } from "@atlas/fixtures";
import { CesResult } from "./CesResult";
import { ProjectKnowledge } from "./ProjectKnowledge";
import { SourcesWorkspace } from "./SourcesWorkspace";
import { WorkflowWorkspace } from "./WorkflowWorkspace";

type Props = { scenario: FixtureScenario; scenarioId?: string; projectId: string; workspaceId?: string; view: "workflow" | "facts" | "changes" | "ces" | "sources"; prd?: string; lens?: string; workflowId?: string; factId?: string; cesItemId?: string };
type Registry = { modalProjects: FixtureRouteProjectRecord[] };
const lensFromSearch = (initial: FixtureScenario["lens"], prd?: string, mode?: string) => ({ selectedPrdIds: prd ? prd.split(",").filter(Boolean) : initial.selectedPrdIds, mode: mode === "isolate" ? "isolate" as const : initial.mode });

export function RuntimeFixtureRoute({ scenario, scenarioId, projectId, workspaceId, view, prd, lens, workflowId, factId, cesItemId }: Props) {
  const [records, setRecords] = useState<FixtureRouteProjectRecord[] | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);
  useEffect(() => { fetch("/api/local-fixtures").then(async (response) => response.ok ? response.json() as Promise<Registry> : null).then((registry) => setRecords(registry?.modalProjects ?? [])).catch(() => setRecords([])); }, []);
  useEffect(() => { setSelectedWorkspaceId(workspaceId); }, [workspaceId]);
  if (records === null) return <main className="workflow-isolation-empty"><p>Loading fixture-owned workspace…</p></main>;
  const route = resolveFixtureProjectRoute(scenario, projectId, records);
  const workspaceRoute = route.workspace ? resolveFixtureWorkspaceRoute(projectId, selectedWorkspaceId, records) : undefined;
  const workspace = resolveFixtureWorkspaceContent(scenario, route, workspaceRoute?.selectedWorkspace?.workspaceId);
  if (!route.canOpenWorkspace || !workspace) return <main className="workflow-isolation-empty"><h1>Workspace unavailable</h1><p>This project has no completed fixture-owned Initial Draft.</p></main>;
  const projects: ProjectFixture[] = scenario.projects.some((project) => project.id === route.project?.id) ? scenario.projects : [...scenario.projects, route.project!];
  const initialLens = lensFromSearch(scenario.lens, prd, lens);
  const common = { initialLens, initialWorkspaceId: workspaceRoute?.selectedWorkspace?.workspaceId, projects, scenario: scenarioId, unavailableWorkspaceName: workspaceRoute?.unavailableWorkspace?.name, user: scenario.session, workspace };
  if (view === "workflow") return <WorkflowWorkspace {...common} fixtureRecords={records} initialWorkflowId={workflowId} onWorkspaceSelect={setSelectedWorkspaceId} />;
  if (view === "facts" || view === "changes") return <ProjectKnowledge {...common} fixtureRecords={records} initialFactId={factId} onWorkspaceSelect={setSelectedWorkspaceId} view={view} />;
  if (view === "ces") return <CesResult {...common} fixtureRecords={records} initialCesItemId={cesItemId} onWorkspaceSelect={setSelectedWorkspaceId} />;
  return <SourcesWorkspace {...common} />;
}
