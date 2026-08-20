import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the public Atlas landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Atlas workspace<\/title>/i);
  assert.match(html, /Project understanding, made visible/);
  assert.match(html, /Sign in/);
  assert.match(html, /Sign up/);
  assert.match(html, /Explore demo/);
  assert.doesNotMatch(html, /Fixture-powered prototype|Nadia Hartono/);
});

test("keeps Atlas source data outside the app components", async () => {
  const [page, demo, layout, packageJson, fixturePackage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../../../packages/atlas-fixtures/src/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Explore demo/);
  assert.match(demo, /from "@atlas\/fixtures"/);
  assert.match(fixturePackage, /Safara operations platform/);
  assert.match(packageJson, /"@atlas\/fixtures": "workspace:\*"/);
  assert.doesNotMatch(page, /react-loading-skeleton|SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /next\/font\/google/);
});
