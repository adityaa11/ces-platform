"use client";

import { useState } from "react";
import { AppShell } from "./AppShell";
import { WorkspaceSwitcher, workspaceLifecycleLabel, type WorkspaceSwitcherModel } from "./WorkspaceSwitcher";

const previewModel: WorkspaceSwitcherModel = { selectedId: "increment-03", workspaces: [
  { id: "master", name: "Master", lifecycle: "published", lifecycleLabel: workspaceLifecycleLabel("published"), prdCount: 3, createdBy: "Atlas", modifiedAt: "11 Sep 2026", relativeModifiedAt: "54 min ago", head: "rev-safara-master-002", executionProvenance: "codex" },
  { id: "increment-03", name: "Increment 03", lifecycle: "review", lifecycleLabel: workspaceLifecycleLabel("review"), prdCount: 3, baseWorkspace: "Master", createdBy: "Aditya", modifiedAt: "11 Sep 2026", relativeModifiedAt: "14 min ago", head: "rev-safara-increment-003", executionProvenance: "codex" },
  { id: "refund-rules", name: "Refund rules PRD-04", lifecycle: "extracting", lifecycleLabel: workspaceLifecycleLabel("extracting"), prdCount: 1, baseWorkspace: "Increment 03", createdBy: "Aditya", modifiedAt: "11 Sep 2026", relativeModifiedAt: "Now", unavailableReason: "Extraction is still in progress; this workspace cannot be opened yet." },
] };

export function WorkspaceSwitcherPreview() {
  const [selectedId, setSelectedId] = useState(previewModel.selectedId);
  const [newWorkspaceNotice, setNewWorkspaceNotice] = useState("");
  const model = { ...previewModel, selectedId };
  return <AppShell active="workflow" projectNavigation projects={[]} selectedProjectId={undefined} sidebarCollapsible={false} user={{ name: "Aditya", email: "aditya@example.com", role: "owner" }} workspaceSwitcher={<WorkspaceSwitcher model={model} onNewWorkspace={() => setNewWorkspaceNotice("New workspace creation is the next handoff (GLF-005-02).") } onSelect={setSelectedId} />}><section className="workspace-switcher-preview"><p className="eyebrow">Component preview</p><h1>Workspace selector</h1><p>This reusable selector receives its workspace view model and callback from its host. It does not load or persist workspace truth.</p>{newWorkspaceNotice && <p aria-live="polite" className="workspace-switcher-preview-notice">{newWorkspaceNotice}</p>}</section></AppShell>;
}
