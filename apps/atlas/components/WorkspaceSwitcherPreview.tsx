"use client";

import { useState } from "react";
import { AppShell } from "./AppShell";
import { WorkspaceSwitcher, type WorkspaceSwitcherModel } from "./WorkspaceSwitcher";

export const workspaceSwitcherPreviewModel: WorkspaceSwitcherModel = { projectName: "Safara", selectedId: "increment-03", workspaces: [
  { id: "master", name: "Master", status: "Published", prdCount: 5, createdBy: "Atlas", createdAt: "27 Jul 2026, 09:14", modifiedBy: "Aditya", modifiedAt: "11 Sep 2026, 09:48", relative: "54 min ago" },
  { id: "increment-03", name: "Increment 03", status: "Review", prdCount: 3, base: "Master", createdBy: "Aditya", createdAt: "9 Sep 2026, 14:32", modifiedBy: "Raka", modifiedAt: "11 Sep 2026, 10:28", relative: "14 min ago" },
  { id: "payment", name: "Payment reconciliation correction", status: "Needs review", prdCount: 1, base: "Master", createdBy: "Raka", createdAt: "10 Sep 2026, 16:08", modifiedBy: "Sari", modifiedAt: "11 Sep 2026, 10:18", relative: "24 min ago" },
  { id: "document", name: "Document readiness addendum", status: "Draft", prdCount: 2, base: "Master", createdBy: "Sari", createdAt: "10 Sep 2026, 11:26", modifiedBy: "Sari", modifiedAt: "11 Sep 2026, 09:41", relative: "1h ago" },
  { id: "refund", name: "Refund rules PRD-04", status: "Processing", prdCount: 1, base: "Increment 03", createdBy: "Aditya", createdAt: "11 Sep 2026, 10:31", modifiedBy: "Aditya", modifiedAt: "11 Sep 2026, 10:41", relative: "Now", unavailableReason: "Extraction is still in progress; this workspace cannot be opened yet." },
] };
const previewProject = { id: "safara", name: "Safara", status: "ready" as const, prdCount: 3, collaborators: 4, lastActivity: "Active", isShared: false, repository: { state: "published" as const, summary: "", master: { state: "published" as const, summary: "", detail: "" }, metrics: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] as [{ value: string; label: string }, { value: string; label: string }, { value: string; label: string }], action: { label: "Open project", enabled: true } } };
export function WorkspaceSwitcherDemoHost({ projectName }: { projectName: string }) { const [selectedId, setSelectedId] = useState(workspaceSwitcherPreviewModel.selectedId); return <WorkspaceSwitcher model={{ ...workspaceSwitcherPreviewModel, projectName, selectedId }} onSelect={setSelectedId} />; }
export function WorkspaceSwitcherPreview() { return <AppShell active="workflow" projectNavigation projects={[previewProject]} selectedProjectId="safara" sidebarCollapsible={false} user={{ name: "Aditya", email: "aditya@example.com", role: "owner" }} workspaceSwitcher={<WorkspaceSwitcherDemoHost projectName="Safara" />}><section className="workspace-switcher-preview"><p className="eyebrow">Main workflow</p><h1>Safara operational model</h1><p>The workspace selector changes which accepted HEAD Atlas treats as current truth without replaying every source PRD.</p></section></AppShell>; }
