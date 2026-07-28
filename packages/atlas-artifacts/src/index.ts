import { createHash } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

export const ATLAS_ARTIFACT_VERSION = "1.0.0" as const;
const Id = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u);
const Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const Text = z.string().trim().min(1);
const FileName = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/u);

export const AtlasRunManifestSchema = z.object({
  schema_version: z.literal(ATLAS_ARTIFACT_VERSION),
  atlas_version: Text,
  contract_version: Text,
  provider_id: Text,
  model_id: Text,
  input_document_hashes: z.array(Hash),
  configuration_hash: Hash,
  proposal_revision: z.number().int().positive(),
  run_started_at: z.string().datetime({ offset: true }),
}).strict();

export const AtlasArtifactBundleSchema = z.object({
  schema_version: z.literal(ATLAS_ARTIFACT_VERSION),
  id: Id,
  project_id: Id,
  model_hash: Hash,
  semantic_artifacts: z.array(z.object({
    name: FileName,
    content_hash: Hash,
    canonical_json: z.string(),
  }).strict()).min(1),
  semantic_bundle_hash: Hash,
  run_manifest: AtlasRunManifestSchema,
}).strict();

export function createAtlasArtifactBundle(input: {
  readonly project_id: string;
  readonly model_hash: string;
  readonly semantic_artifacts: Readonly<Record<string, unknown>>;
  readonly run_manifest: z.input<typeof AtlasRunManifestSchema>;
}): z.infer<typeof AtlasArtifactBundleSchema> {
  const projectId = Id.parse(input.project_id);
  const modelHash = Hash.parse(input.model_hash);
  const artifacts = Object.entries(input.semantic_artifacts).map(([name, value]) => {
    FileName.parse(name);
    assertNoRunMetadata(value, name);
    const canonicalJson = `${JSON.stringify(canonical(value), null, 2)}\n`;
    return { name, content_hash: digest(canonicalJson), canonical_json: canonicalJson };
  }).sort((a, b) => compare(a.name, b.name));
  const names = artifacts.map(({ name }) => name);
  if (new Set(names).size !== names.length) throw new Error("Duplicate artifact name");
  const semanticBundleHash = digest(JSON.stringify(artifacts.map(({ name, content_hash }) =>
    ({ name, content_hash }))));
  const manifest = AtlasRunManifestSchema.parse({
    ...input.run_manifest,
    input_document_hashes: [...input.run_manifest.input_document_hashes].sort(compare),
  });
  return freeze(AtlasArtifactBundleSchema.parse({
    schema_version: ATLAS_ARTIFACT_VERSION,
    id: `${projectId}.atlas-artifacts.${semanticBundleHash.slice(7, 19)}`,
    project_id: projectId,
    model_hash: modelHash,
    semantic_artifacts: artifacts,
    semantic_bundle_hash: semanticBundleHash,
    run_manifest: manifest,
  }));
}

export async function publishAtlasArtifactBundle(
  outputDirectory: string,
  bundleValue: z.input<typeof AtlasArtifactBundleSchema>,
): Promise<string> {
  const bundle = AtlasArtifactBundleSchema.parse(bundleValue);
  const finalDirectory = join(outputDirectory, bundle.id);
  const staging = `${finalDirectory}.staging`;
  await mkdir(staging, { recursive: false });
  try {
    for (const artifact of bundle.semantic_artifacts) {
      await writeFile(join(staging, artifact.name), artifact.canonical_json, "utf8");
    }
    await writeFile(join(staging, "run-manifest.json"),
      `${JSON.stringify(canonical(bundle.run_manifest), null, 2)}\n`, "utf8");
    await rename(staging, finalDirectory);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  return finalDirectory;
}

function assertNoRunMetadata(value: unknown, artifact: string): void {
  if (Array.isArray(value)) {
    value.forEach((child) => assertNoRunMetadata(child, artifact));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (["generated_at", "run_started_at", "current_timestamp"].includes(key)) {
        throw new Error(`Run metadata cannot enter semantic artifact ${artifact}: ${key}`);
      }
      assertNoRunMetadata(child, artifact);
    }
  }
}
function digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort()
      .map((key) => [key, canonical(record[key])]));
  }
  return value;
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
