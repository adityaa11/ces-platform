import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import {
  ModelReviewWorkspaceSchema,
  type ModelReviewWorkspace,
} from "@company/ces-atlas-model-review-contracts";

const ProjectId = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;

export function atlasArtifactRoot(): string {
  return resolve(process.env.CES_ATLAS_ARTIFACT_ROOT
    ?? resolve(/* turbopackIgnore: true */ process.cwd(), "../../.ces/generated"));
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
