import { readFile, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { AtlasKnowledgeBundleSchema, knowledgeBreadcrumb } from "@company/ces-atlas-knowledge-contracts";

const Id = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
export function atlasArtifactRoot(): string {
  return resolve(process.env.CES_ATLAS_ARTIFACT_ROOT
    ?? resolve(/* turbopackIgnore: true */ process.cwd(), "../../.ces/generated"));
}
export function assertAtlasId(value: string, label: string): void {
  if (!Id.test(value)) throw new Error(`Invalid Atlas ${label}`);
}
export function v2ProjectRoot(root: string, projectId: string): string {
  assertAtlasId(projectId, "project identifier");
  const base = resolve(root); const project = resolve(base, projectId);
  if (relative(base, project).startsWith("..")) throw new Error("Unsafe Atlas project path");
  return project;
}
export async function readKnowledgeBundle(input: { root: string; projectId: string;
  revision: number; lifecycle?: "proposed" | "approved" }) {
  const project = v2ProjectRoot(input.root, input.projectId);
  const lifecycle = input.lifecycle ?? "proposed";
  const file = lifecycle === "approved" ? "atlas-approved-knowledge.json" : "atlas-knowledge.json";
  const bundle = AtlasKnowledgeBundleSchema.parse(JSON.parse(await readFile(resolve(project, file), "utf8")));
  if (bundle.project_id !== input.projectId) throw new Error("Atlas project identity mismatch");
  if (bundle.revision !== input.revision) throw new Error("Atlas knowledge revision is stale");
  if (bundle.authority.lifecycle !== lifecycle) throw new Error("Atlas lifecycle mismatch");
  return bundle;
}
export async function readKnowledgeOverview(input: Parameters<typeof readKnowledgeBundle>[0]) {
  const bundle = await readKnowledgeBundle(input);
  const root = bundle.knowledge_nodes.find(({ knowledge_id }) => knowledge_id === bundle.root_knowledge_id)!;
  return { schema_version: bundle.schema_version, project_id: bundle.project_id,
    revision: bundle.revision, authority: bundle.authority, root,
    children: root.child_ids.map((id) => summarize(bundle, id)) };
}
export async function readKnowledgeNode(input: Parameters<typeof readKnowledgeBundle>[0] & { knowledgeId: string }) {
  assertAtlasId(input.knowledgeId, "knowledge identifier");
  const bundle = await readKnowledgeBundle(input);
  const node = bundle.knowledge_nodes.find(({ knowledge_id }) => knowledge_id === input.knowledgeId);
  if (!node) throw new Error("Atlas knowledge is unavailable");
  return { schema_version: bundle.schema_version, project_id: bundle.project_id,
    revision: bundle.revision, authority: bundle.authority, node,
    parent: node.parent_id ? summarize(bundle, node.parent_id) : null,
    breadcrumb: knowledgeBreadcrumb(bundle, node.knowledge_id).map((id) => summarize(bundle, id)),
    children: node.child_ids.map((id) => summarize(bundle, id)) };
}
export async function readKnowledgeEvidence(input: Parameters<typeof readKnowledgeBundle>[0] &
  { knowledgeId: string; evidenceId?: string }) {
  const detail = await readKnowledgeNode(input); const bundle = await readKnowledgeBundle(input);
  const ids = new Set(detail.node.evidence_ids);
  const evidence = bundle.evidence.filter(({ evidence_id }) => ids.has(evidence_id)
    && (!input.evidenceId || evidence_id === input.evidenceId));
  if (!evidence.length) throw new Error("Atlas evidence is unavailable");
  return { schema_version: bundle.schema_version, project_id: bundle.project_id,
    revision: bundle.revision, knowledge_id: input.knowledgeId, evidence };
}
function summarize(bundle: Awaited<ReturnType<typeof readKnowledgeBundle>>, id: string) {
  const node = bundle.knowledge_nodes.find(({ knowledge_id }) => knowledge_id === id);
  if (!node) throw new Error(`Broken Atlas hierarchy at ${id}`);
  return { knowledge_id: node.knowledge_id, kind: node.kind, display_name: node.display_name,
    support_status: node.support_status, child_count: node.child_ids.length };
}
export function authorizeAtlasRequest(header: string | null, configured = process.env.CES_ATLAS_UI_TOKEN): void {
  if (configured && header !== `Bearer ${configured}`) throw new Error("Atlas authorization required");
}
export async function resolvePdfDocument(input: { artifactRoot: string; pdfRoot?: string;
  projectId: string; documentId: string; revision: number }) {
  assertAtlasId(input.documentId, "document identifier");
  const bundle = await readKnowledgeBundle({ root: input.artifactRoot, projectId: input.projectId,
    revision: input.revision, lifecycle: "proposed" });
  const document = bundle.documents.find(({ document_id }) => document_id === input.documentId);
  if (!document || document.revision !== input.revision || document.media_type !== "application/pdf")
    throw new Error("Atlas PDF revision is unavailable");
  const configured = input.pdfRoot ?? process.env.CES_ATLAS_PDF_ROOT;
  if (!configured) throw new Error("Atlas PDF storage is unavailable");
  const base = resolve(configured); const project = resolve(base, input.projectId);
  const path = resolve(project, basename(document.original_name));
  if (relative(base, path).startsWith("..") || relative(project, path).startsWith(".."))
    throw new Error("Unsafe Atlas PDF path");
  return { path, size: (await stat(path)).size, contentHash: document.content_hash };
}
export function parseByteRange(value: string | null, size: number): { start: number; end: number } | null {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(value);
  if (!match || (!match[1] && !match[2])) throw new Error("Invalid PDF byte range");
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[2] && match[1] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size)
    throw new Error("Unsatisfiable PDF byte range");
  end = Math.min(end, size - 1); return { start, end };
}
