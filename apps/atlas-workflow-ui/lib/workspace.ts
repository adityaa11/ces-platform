import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import {
  ModelReviewWorkspaceSchema,
  ModelReviewDetailIndexSchema,
  ModelReviewDetailSchema,
  type ModelReviewWorkspace,
  type ModelReviewDetail,
} from "@company/ces-atlas-model-review-contracts";

const ProjectId = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;

export function atlasArtifactRoot(): string {
  return resolve(process.env.CES_ATLAS_ARTIFACT_ROOT
    ?? resolve(/* turbopackIgnore: true */ process.cwd(), "../../.ces/generated"));
}

export async function readModelDetail(input: {
  projectId: string;
  artifactProjectId?: string;
  subjectId: string;
  revision: number;
  lifecycle?: "proposed" | "approved";
  root?: string;
}): Promise<ModelReviewDetail> {
  const artifactProjectId = input.artifactProjectId ?? input.projectId;
  if (!ProjectId.test(input.projectId) || !ProjectId.test(artifactProjectId)
    || !ProjectId.test(input.subjectId)) {
    throw new Error("Invalid Atlas detail identifier");
  }
  const root = resolve(input.root ?? atlasArtifactRoot());
  const projectRoot = resolve(root, artifactProjectId);
  if (relative(root, projectRoot).startsWith("..")) throw new Error("Unsafe Atlas project path");
  const prefix = input.lifecycle === "approved" ? "approved" : "proposed";
  const indexPath = resolve(projectRoot, `${prefix}-model-review-detail-index.json`);
  const index = ModelReviewDetailIndexSchema.parse(JSON.parse(await readFile(indexPath, "utf8")));
  if (index.revision !== input.revision) throw new Error("Atlas detail index revision is stale");
  const entry = index.entries.find(({ subject_id }) => subject_id === input.subjectId);
  if (!entry) throw new Error("Atlas detail is unavailable for this subject");
  const detailPath = resolve(projectRoot, entry.detail_path);
  if (relative(projectRoot, detailPath).startsWith("..")) throw new Error("Unsafe Atlas detail path");
  const detail = ModelReviewDetailSchema.parse(JSON.parse(await readFile(detailPath, "utf8")));
  if (detail.project_id !== input.projectId || detail.revision !== input.revision
    || detail.subject.subject_id !== input.subjectId
    || detail.authority.lifecycle !== index.authority.lifecycle
    || detail.authority.authority !== index.authority.authority) {
    throw new Error("Atlas detail does not match its revision-pinned index");
  }
  return detail;
}

type FocusedSliceItem = { record_id: string; semantic_kind_id: string;
  statement: string; source_unit_ids: string[] };
function focusedSliceItems(value: unknown): FocusedSliceItem[] {
  if (!value || typeof value !== "object" || !("items" in value) || !Array.isArray(value.items)) {
    throw new Error("Invalid Atlas focused slice");
  }
  return value.items.map((item) => {
    if (!item || typeof item !== "object" || !("record_id" in item)
      || !("semantic_kind_id" in item) || !("statement" in item) || !("source_unit_ids" in item)
      || typeof item.record_id !== "string" || typeof item.semantic_kind_id !== "string"
      || typeof item.statement !== "string" || !Array.isArray(item.source_unit_ids)
      || !item.source_unit_ids.every((id: unknown) => typeof id === "string")) {
      throw new Error("Invalid Atlas focused slice item");
    }
    return item as FocusedSliceItem;
  });
}

export async function readModelDetailTab(input: {
  projectId: string;
  artifactProjectId?: string;
  subjectId: string;
  revision: number;
  lifecycle?: "proposed" | "approved";
  root?: string;
  tab: "rules" | "validations" | "permissions" | "states";
}): Promise<{ tab: string; revision: number; items: Array<{
  record_id: string; semantic_kind_id: string; statement: string; source_unit_ids: string[];
}> }> {
  const detail = await readModelDetail(input);
  const descriptor = detail.tabs.find(({ tab }) => tab === input.tab);
  if (!descriptor || descriptor.availability !== "available" || !descriptor.artifact_path) {
    throw new Error(`Atlas ${input.tab} detail is not available`);
  }
  const root = resolve(input.root ?? atlasArtifactRoot());
  const projectRoot = resolve(root, input.artifactProjectId ?? input.projectId);
  const artifactPath = resolve(projectRoot, descriptor.artifact_path);
  if (relative(projectRoot, artifactPath).startsWith("..")) throw new Error("Unsafe Atlas tab path");
  const items = focusedSliceItems(JSON.parse(await readFile(artifactPath, "utf8")));
  const needle = input.tab === "rules" ? undefined : input.tab.replace(/s$/u, "");
  return { tab: input.tab, revision: detail.revision,
    items: needle ? items.filter(({ semantic_kind_id }) => semantic_kind_id.includes(needle)) : items };
}

export async function readWorkspace(input: {
  projectId: string;
  lifecycle?: "proposed" | "approved";
  root?: string;
}): Promise<ModelReviewWorkspace> {
  if (!ProjectId.test(input.projectId)) throw new Error("Invalid Atlas project identifier");
  const root = resolve(input.root ?? atlasArtifactRoot());
  const fileName = input.lifecycle === "approved"
    ? "approved-model-review-workspace.json"
    : "proposed-model-review-workspace.json";
  const path = resolve(root, input.projectId, fileName);
  if (relative(root, path).startsWith("..")) throw new Error("Unsafe Atlas artifact path");
  return ModelReviewWorkspaceSchema.parse(JSON.parse(await readFile(path, "utf8")));
}
