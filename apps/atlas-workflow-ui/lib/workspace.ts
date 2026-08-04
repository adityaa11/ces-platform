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
  subjectId: string;
  revision: number;
  lifecycle?: "proposed" | "approved";
  root?: string;
}): Promise<ModelReviewDetail> {
  if (!ProjectId.test(input.projectId) || !ProjectId.test(input.subjectId)) {
    throw new Error("Invalid Atlas detail identifier");
  }
  const root = resolve(input.root ?? atlasArtifactRoot());
  const projectRoot = resolve(root, input.projectId);
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
