import { describe, expect, it, vi } from "vitest";
import type { AtlasWorkspacePayload } from "./contracts.js";
import { fetchDetail, WorkspaceInteractionController } from "./interaction.js";

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
});
