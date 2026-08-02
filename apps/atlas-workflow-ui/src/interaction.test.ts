import { describe, expect, it, vi } from "vitest";
import type { AtlasWorkspacePayload } from "./contracts.js";
import { fetchDetail, renderDetail, WorkspaceInteractionController } from "./interaction.js";

const payload = {
  revision: 3,
  detail_index: [{ subject_id: "project.workflow.one", revision: 3,
    href: "/detail/one" }],
} as unknown as AtlasWorkspacePayload;

describe("ATLAS-UI-002 persistent overview and detail", () => {
  it("keeps selection while overview and detail are minimized and restored", () => {
    const controller = new WorkspaceInteractionController();
    controller.select("project.workflow.one");
    controller.toggleOverview();
    controller.toggleDetail();
    expect(controller.snapshot()).toEqual({ selectedSubjectId: "project.workflow.one",
      overviewMinimized: true, detailState: "minimized" });
    controller.toggleOverview();
    controller.toggleDetail();
    expect(controller.snapshot()).toEqual({ selectedSubjectId: "project.workflow.one",
      overviewMinimized: false, detailState: "open" });
    controller.closeDetail();
    expect(controller.snapshot().detailState).toBe("closed");
    expect(controller.snapshot().selectedSubjectId).toBe("project.workflow.one");
  });

  it("progressively fetches only the selected revision-pinned projection", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      schema_version: "1.0.0", subject_id: "project.workflow.one", revision: 3,
      label: "Workflow one", nodes: [], edges: [],
      tabs: [],
    }), { status: 200 }));
    await expect(fetchDetail({ payload, subjectId: "project.workflow.one", fetcher }))
      .resolves.toMatchObject({ revision: 3 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith("/detail/one", expect.objectContaining({
      headers: expect.objectContaining({ "If-Match": "3" }),
    }));
  });

  it("fails closed for missing and stale detail indexes", async () => {
    await expect(fetchDetail({ payload, subjectId: "project.workflow.missing" }))
      .rejects.toThrow("unavailable");
    await expect(fetchDetail({ payload: { ...payload, detail_index: [{
      subject_id: "project.workflow.one", revision: 2, href: "/detail/one",
    }] }, subjectId: "project.workflow.one" })).rejects.toThrow("stale");
  });

  it("renders only explicitly non-empty focused tabs and labels pending equivalence", () => {
    const html = renderDetail({
      schema_version: "1.0.0", subject_id: "project.workflow.one", revision: 3,
      label: "Workflow one", nodes: [], edges: [], tabs: [{ tab: "flow",
        explicitly_empty: true, items: [] }, { tab: "rules", explicitly_empty: false,
        items: [{ item_id: "project.item.one", canonical_concept_id: "project.concept.one",
          label: "Exact rule", evidence_id: "project.evidence.one",
          equivalence_status: "pending_review", representation_count: 1 }] },
      { tab: "permissions", explicitly_empty: true, items: [] }],
    });
    expect(html).toContain("Rules");
    expect(html).toContain("Possible equivalence — human review pending");
    expect(html).not.toContain("<h3>Flow</h3>");
    expect(html).not.toContain("Permissions");
  });
});
