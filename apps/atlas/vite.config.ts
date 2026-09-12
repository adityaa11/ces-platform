import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig, type Plugin } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const workspaceRoot = resolve(import.meta.dirname, "../..");
const localFixturePath = resolve(workspaceRoot, "packages/atlas-fixtures/generated/local-projects.json");
const safeSegment = (value: string) => /^[a-z0-9][a-z0-9-]{2,47}$/.test(value);

const localFixtureStore: Plugin = {
  name: "atlas-local-fixture-store",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== "/api/local-fixtures") return next();
      let stagingSourceDir: string | undefined;
      let publishedSourceDir: string | undefined;
      try {
        if (request.method === "GET") {
          const records = JSON.parse(await readFile(localFixturePath, "utf8"));
          const sanitized = await Promise.all(records.map(async ({ files: _files, ...record }: { files?: unknown; project: { id: string }; initialDraftWorkspace: { workspaceId: string; prdFiles: Array<{ name: string; type: "application/pdf"; size: number }> }; sourceFiles?: unknown }) => {
            if (record.sourceFiles) return record;
            const sourceDir = resolve(workspaceRoot, "docs/PRD", record.project.id, record.initialDraftWorkspace.workspaceId);
            const sourceFiles = await Promise.all(record.initialDraftWorkspace.prdFiles.map(async (file) => { const bytes = await readFile(resolve(sourceDir, file.name)); return { ...file, relativePath: `docs/PRD/${record.project.id}/${record.initialDraftWorkspace.workspaceId}/${file.name}`, sha256: createHash("sha256").update(bytes).digest("hex") }; }));
            return { ...record, sourceFiles };
          }));
          if (JSON.stringify(records) !== JSON.stringify(sanitized)) { const tempPath = `${localFixturePath}.tmp`; await writeFile(tempPath, JSON.stringify(sanitized, null, 2)); await rename(tempPath, localFixturePath); }
          response.setHeader("content-type", "application/json"); response.end(JSON.stringify(sanitized)); return;
        }
        if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
        const chunks: Uint8Array[] = []; for await (const chunk of request) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!safeSegment(body.project?.id) || !safeSegment(body.initialDraftWorkspace?.workspaceId)) throw new Error("Invalid fixture identity.");
        const records = JSON.parse(await readFile(localFixturePath, "utf8").catch(() => "[]"));
        if (records.some((item: { project: { id: string } }) => item.project.id === body.project.id)) throw new Error("That project ID is already in use.");
        const sourceDir = resolve(workspaceRoot, "docs/PRD", body.project.id, body.initialDraftWorkspace.workspaceId);
        if (!sourceDir.startsWith(resolve(workspaceRoot, "docs/PRD"))) throw new Error("Invalid source path.");
        try { await access(sourceDir); throw new Error("That workspace destination already exists."); } catch (error) { if (error instanceof Error && error.message === "That workspace destination already exists.") throw error; }
        if (!Array.isArray(body.files) || body.files.length !== body.project.prdCount) throw new Error("PDF bytes are required for every selected file.");
        if (new Set(body.files.map((file: { name?: unknown }) => file.name)).size !== body.files.length) throw new Error("PDF filenames must be unique.");
        const sourceFiles = [];
        stagingSourceDir = `${sourceDir}.staging-${crypto.randomUUID()}`;
        await mkdir(stagingSourceDir, { recursive: true });
        for (const file of body.files) {
          if (typeof file.name !== "string" || !/^[^\\/:*?"<>|]+\.pdf$/i.test(file.name) || typeof file.base64 !== "string") throw new Error("Invalid PDF file.");
          const bytes = Buffer.from(file.base64, "base64"); const metadata = body.project.prdFiles.find((item: { name: string }) => item.name === file.name); if (!metadata || metadata.size !== bytes.length) throw new Error("PDF metadata does not match its selected bytes.");
          const target = resolve(stagingSourceDir, file.name); const temporary = `${target}.tmp`; await writeFile(temporary, bytes); await rename(temporary, target); sourceFiles.push({ ...metadata, relativePath: `docs/PRD/${body.project.id}/${body.initialDraftWorkspace.workspaceId}/${file.name}`, sha256: createHash("sha256").update(bytes).digest("hex") });
        }
        await rename(stagingSourceDir, sourceDir); stagingSourceDir = undefined; publishedSourceDir = sourceDir;
        if (body.injectRegistryWriteFailure === true) throw new Error("Injected registry write failure.");
        await mkdir(dirname(localFixturePath), { recursive: true });
        const { files: _files, ...record } = body; record.sourceFiles = sourceFiles;
        const tempPath = `${localFixturePath}.tmp`; await writeFile(tempPath, JSON.stringify([...records, record], null, 2)); await rename(tempPath, localFixturePath);
        publishedSourceDir = undefined; response.setHeader("content-type", "application/json"); response.statusCode = 201; response.end(JSON.stringify(record));
      } catch (error) { if (stagingSourceDir) await rm(stagingSourceDir, { force: true, recursive: true }); if (publishedSourceDir) await rm(publishedSourceDir, { force: true, recursive: true }); response.statusCode = 400; response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Fixture could not be saved." })); }
    });
  },
};

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      localFixtureStore,
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
