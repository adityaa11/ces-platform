import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let renderId = 0;
async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${renderId++}`);
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
  assert.match(layout, /localStorage\.getItem\('atlas-theme'\)/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(demo, /from "@atlas\/fixtures"/);
  assert.match(fixturePackage, /Safara operations platform/);
  assert.match(packageJson, /"@atlas\/fixtures": "workspace:\*"/);
  assert.doesNotMatch(page, /react-loading-skeleton|SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /next\/font\/google/);
});

test("renders each account entry state and the accessible signed-in shell", async () => {
  const signIn = await render("/sign-in");
  const signUp = await render("/sign-up");
  const reset = await render("/reset-password");
  const demo = await render("/demo");
  const workflow = await render("/demo?projectId=safara&view=workflow");
  const facts = await render("/demo?projectId=safara&view=facts&prd=safara-increment-02&lens=isolate");
  const changes = await render("/demo?projectId=safara&view=changes&prd=safara-increment-02&lens=isolate");
  const editorDemo = await render("/demo?scenario=editor-ready");
  const viewerDemo = await render("/demo?scenario=viewer-ready");
  const processingStates = await Promise.all(["uploading", "extracting", "modeling", "ready", "needs-attention", "failed"].map((stage) => render(`/demo?scenario=processing-${stage}`)));
  const approvedDemo = await render("/demo?scenario=approved-result&projectId=safara&view=ces");
  for (const response of [signIn, signUp, reset, demo, workflow, facts, changes, editorDemo, viewerDemo, approvedDemo, ...processingStates]) assert.equal(response.status, 200);
  const signInHtml = await signIn.text();
  const signUpHtml = await signUp.text();
  assert.match(signInHtml, /Welcome back|Forgot password/);
  assert.match(signInHtml, /href="\/"/);
  assert.match(signUpHtml, /Create your Atlas account/);
  assert.doesNotMatch(signInHtml, /Account actions/);
  assert.doesNotMatch(signUpHtml, /Account actions/);
  assert.match(await reset.text(), /Reset your password/);
  const demoHtml = await demo.text();
  assert.match(demoHtml, /Select a project/);
  assert.doesNotMatch(demoHtml, /<nav aria-label="Project navigation">/);
  assert.match(demoHtml, /Nadia Hartono/);
  assert.match(demoHtml, /aria-expanded="false"/);
  const appShell = await readFile(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
  const globals = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const projectLibrary = await readFile(new URL("../components/ProjectLibrary.tsx", import.meta.url), "utf8");
  const workflowWorkspace = await readFile(new URL("../components/WorkflowWorkspace.tsx", import.meta.url), "utf8");
  assert.match(appShell, /import \{ TopBar \} from "\.\/TopBar"/);
  assert.match(appShell, /<TopBar className="app-header" variant="workspace">/);
  assert.match(appShell, /import \{ ProfileMenu \} from "\.\/ProfileMenu"/);
  assert.doesNotMatch(appShell, /libraryProjects|id:"selected"/);
  assert.match(appShell, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(appShell, /params\.set\("view", view\)/);
  assert.match(appShell, /aria-controls="app-navigation"/);
  assert.match(appShell, /navigation \$\{collapsed \? "navigation-open" : ""\}/);
  assert.match(globals, /\.navigation-open \{ transform: translateX\(0\); \}/);
  assert.match(appShell, /nav-section-label/);
  assert.match(appShell, /Open navigation menu/);
  assert.match(appShell, /Close navigation menu/);
  assert.match(appShell, /drawer-backdrop/);
  assert.match(projectLibrary, /Only people invited by email can access this private project/);
  assert.match(projectLibrary, /Invite/);
  assert.match(projectLibrary, /Confirm change/);
  assert.match(projectLibrary, /Access removed/);
  assert.match(projectLibrary, /`\/demo\?projectId=\$\{project\.id\}&view=workflow`/);
  assert.match(demoHtml, /href="\/demo\?projectId=safara&amp;view=workflow"/);
  const workflowHtml = await workflow.text();
  assert.match(workflowHtml, /Current project/);
  assert.match(workflowHtml, /Safara operations platform/);
  assert.match(workflowHtml, /Main Workflow/);
  assert.match(workflowHtml, /14 May 2026/);
  const factsHtml = await facts.text();
  const changesHtml = await changes.text();
  assert.match(factsHtml, /Project Facts|People and responsibilities/);
  assert.match(changesHtml, /Changes Done|Finance review responsibility/);
  assert.match(changesHtml, /href="\/demo\?projectId=safara&amp;view=workflow&amp;prd=safara-increment-02&amp;lens=isolate"/);
  assert.match(workflowWorkspace, /Previous affected workflow page/);
  assert.match(workflowWorkspace, /No selected contribution on this page/);
  const editorHtml = await editorDemo.text();
  const viewerHtml = await viewerDemo.text();
  assert.match(editorHtml, /Raka Pratama/);
  assert.doesNotMatch(editorHtml, />Share</);
  assert.match(viewerHtml, /Sari Utami/);
  assert.doesNotMatch(viewerHtml, /\+ New project|>Share</);
  for (const response of processingStates) assert.match(await response.text(), /Processing|Ready to review|Needs attention|Unable to process/);
  assert.match(await approvedDemo.text(), /Atlas understanding[\s\S]*Approved/);
});
