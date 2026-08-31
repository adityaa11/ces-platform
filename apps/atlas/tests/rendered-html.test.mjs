import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let renderId = 0;
async function render(pathname = "/", headers = { accept: "text/html" }, envOverrides = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${renderId++}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      ...envOverrides,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function getNonce(policy) {
  return policy.match(/script-src[^;]*'nonce-([^']+)'/)?.[1];
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

test("adds a fresh CSP nonce before Vinext renders and prevents HTML caching", async () => {
  const firstResponse = await render();
  const secondResponse = await render();
  const firstPolicy = firstResponse.headers.get("content-security-policy");
  const secondPolicy = secondResponse.headers.get("content-security-policy");
  const firstNonce = getNonce(firstPolicy ?? "");
  const secondNonce = getNonce(secondPolicy ?? "");

  assert.ok(firstNonce);
  assert.ok(secondNonce);
  assert.notEqual(firstNonce, secondNonce);
  assert.match(firstPolicy ?? "", /^default-src 'self'; script-src 'self' 'nonce-[^']+' 'strict-dynamic';/);
  assert.doesNotMatch(firstPolicy ?? "", /'unsafe-(?:inline|eval)'/);
  assert.match(firstResponse.headers.get("cache-control") ?? "", /no-store/i);

  const firstHtml = await firstResponse.text();
  const scripts = [...firstHtml.matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(scripts.length > 0);
  const vinextScripts = scripts.filter(([, attributes]) => /\bsrc=|\bid="_R_"/.test(attributes));
  assert.ok(vinextScripts.length > 0);
  for (const [, attributes] of vinextScripts) assert.ok(attributes.includes(`nonce="${firstNonce}"`));

  const notFoundResponse = await render("/does-not-exist");
  assert.equal(notFoundResponse.status, 404);
  assert.match(notFoundResponse.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(notFoundResponse.headers.get("cache-control") ?? "", /no-store/i);
  assert.ok(getNonce(notFoundResponse.headers.get("content-security-policy") ?? ""));

  const rscResponse = await render("/demo", { accept: "text/x-component", rsc: "1" });
  assert.ok(getNonce(rscResponse.headers.get("content-security-policy") ?? ""));
  assert.equal(rscResponse.headers.get("content-security-policy-report-only"), null);

  const reportOnlyResponse = await render("/", { accept: "text/html" }, { CSP_REPORT_ONLY: "true" });
  assert.equal(reportOnlyResponse.headers.get("content-security-policy"), null);
  assert.ok(getNonce(reportOnlyResponse.headers.get("content-security-policy-report-only") ?? ""));
});

test("keeps Atlas source data outside the app components and CSP-safe", async () => {
  const [page, demo, layout, packageJson, fixturePackage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../../../packages/atlas-fixtures/src/index.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Explore demo/);
  assert.doesNotMatch(layout, /dangerouslySetInnerHTML|suppressHydrationWarning|<script/);
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
  const workflow = await render("/demo?projectId=safara&view=workflow&prd=safara-increment-02&lens=isolate");
  const facts = await render("/demo?projectId=safara&view=facts&prd=safara-increment-02&lens=isolate");
  const changes = await render("/demo?projectId=safara&view=changes&prd=safara-increment-02&lens=isolate");
  const sources = await render("/demo?projectId=safara&view=sources");
  const editorDemo = await render("/demo?scenario=editor-ready");
  const viewerDemo = await render("/demo?scenario=viewer-ready");
  const processingStates = await Promise.all(["uploading", "extracting", "modeling", "ready", "needs-attention", "failed"].map((stage) => render(`/demo?scenario=processing-${stage}`)));
  const approvedDemo = await render("/demo?scenario=approved-result&projectId=safara&view=ces");
  for (const response of [signIn, signUp, reset, demo, workflow, facts, changes, sources, editorDemo, viewerDemo, approvedDemo, ...processingStates]) assert.equal(response.status, 200);
  const signInHtml = await signIn.text();
  const signUpHtml = await signUp.text();
  assert.match(signInHtml, /Welcome back|Forgot password/);
  assert.match(signInHtml, /href="\/"/);
  assert.match(signUpHtml, /Create your Atlas account/);
  assert.doesNotMatch(signInHtml, /Account actions/);
  assert.doesNotMatch(signUpHtml, /Account actions/);
  assert.match(await reset.text(), /Reset your password/);
  const demoHtml = await demo.text();
  assert.match(demoHtml, /No project selected/);
  assert.match(demoHtml, /<nav aria-label="Project navigation">/);
  assert.match(demoHtml, /Sources|Members|Settings/);
  assert.match(demoHtml, /class="nav-disabled"/);
  assert.match(demoHtml, /Nadia Hartono/);
  assert.match(demoHtml, /aria-expanded="false"/);
  const appShell = await readFile(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
  const globals = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const projectLibrary = await readFile(new URL("../components/ProjectLibrary.tsx", import.meta.url), "utf8");
  const profileMenu = await readFile(new URL("../components/ProfileMenu.tsx", import.meta.url), "utf8");
  const workflowWorkspace = await readFile(new URL("../components/WorkflowWorkspace.tsx", import.meta.url), "utf8");
  const sourcesWorkspace = await readFile(new URL("../components/SourcesWorkspace.tsx", import.meta.url), "utf8");
  assert.match(appShell, /import \{ TopBar \} from "\.\/TopBar"/);
  assert.match(appShell, /<TopBar className=\{`app-header \$\{fullWidthSearch \? "app-header-full-search" : ""\}`\.trim\(\)\} variant="workspace">/);
  assert.match(appShell, /import \{ ProfileMenu \} from "\.\/ProfileMenu"/);
  assert.doesNotMatch(appShell, /libraryProjects|id:"selected"/);
  assert.match(appShell, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(appShell, /params\.set\("projectId", current\.id\)/);
  assert.match(appShell, /params\.set\("view", view\)/);
  assert.doesNotMatch(appShell, /MutationObserver|data\.fullLabel/);
  assert.match(appShell, /aria-controls="app-navigation"/);
  assert.match(appShell, /navigation \$\{collapsed \? "navigation-open" : ""\}/);
  assert.match(globals, /\.navigation-open \{ transform: translateX\(0\); \}/);
  assert.match(appShell, /nav-section-label/);
  assert.match(appShell, /Open navigation menu/);
  assert.match(appShell, /Close navigation menu/);
  assert.match(appShell, /d=\{collapsed \? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"\}/);
  assert.match(appShell, /drawer-backdrop/);
  assert.match(appShell, /matchMedia\("\(max-width: 960px\)"\)/);
  assert.match(appShell, /inert=\{compact && !collapsed/);
  assert.match(appShell, /document\.body\.classList\.add\("navigation-locked"\)/);
  assert.match(appShell, /document\.body\.classList\.remove\("navigation-locked"\)/);
  assert.doesNotMatch(appShell, /document\.body\.style\.|\.style\.(?:width|height)/);
  assert.match(globals, /body\.navigation-locked \{ overflow: hidden; \}/);
  assert.match(globals, /@media \(prefers-color-scheme: light\)/);
  assert.match(globals, /:root:not\(\[data-theme\]\)/);
  assert.doesNotMatch(sourcesWorkspace, /\.style\.(?:width|height)/);
  assert.match(sourcesWorkspace, /element\.width = Math\.floor\(viewport\.width\)/);
  assert.match(sourcesWorkspace, /element\.height = Math\.floor\(viewport\.height\)/);
  assert.match(profileMenu, /matchMedia\("\(max-width: 960px\)"\)/);
  assert.match(profileMenu, /className="profile-copy"/);
  assert.match(profileMenu, /className="profile-chevron"/);
  assert.match(globals, /@media \(max-width: 960px\)/);
  assert.match(globals, /repeat\(auto-fill, minmax\(min\(100%, 18\.75rem\), 1fr\)\)/);
  assert.match(globals, /\.app-content:has\(> \.workflow-page\)/);
  assert.match(globals, /\.semantic-nodes \{ align-items: stretch; flex-direction: column; overflow: visible; \}/);
  assert.match(globals, /\.auth-page > \.auth-card \{ align-self: start; grid-column: 1;/);
  assert.match(globals, /\.landing-theme-selector \{ display: none; \}/);
  assert.match(globals, /\.source-accounting-modal \.accounting-summary \{ grid-template-columns: 1fr; \}/);
  assert.match(projectLibrary, /Only people invited by email can access this private project/);
  assert.match(projectLibrary, /contentClassName="project-library-content"/);
  assert.match(projectLibrary, /Open project →/);
  assert.match(projectLibrary, /Invite/);
  assert.match(projectLibrary, /Confirm change/);
  assert.match(projectLibrary, /Access removed/);
  assert.match(projectLibrary, /demoHref\(\{ projectId: project\.id, view: "workflow" \}\)/);
  assert.match(projectLibrary, /selectedFiles/);
  assert.match(projectLibrary, /membersByProject/);
  assert.match(demoHtml, /href="\/demo\?projectId=safara&amp;view=workflow"/);
  const workflowHtml = await workflow.text();
  assert.match(workflowHtml, /3 PRDs · Active/);
  assert.match(appShell, /project-switcher-copy/);
  assert.match(appShell, /project-switcher-chevron/);
  assert.match(workflowHtml, /Safara operations platform/);
  assert.match(workflowHtml, /Main Workflow/);
  assert.match(workflowHtml, /27 July 2026/);
  const factsHtml = await facts.text();
  const changesHtml = await changes.text();
  const sourcesHtml = await sources.text();
  assert.match(factsHtml, /Project Facts|People and responsibilities/);
  assert.match(changesHtml, /Changes Done|Tanggung jawab Finance dan Operations/);
  assert.match(sourcesHtml, /Workspace library|Sources|Search PDFs|PDF controls|Open original/);
  assert.match(sourcesHtml, /Pembayaran, Dokumen, dan Kesiapan Keberangkatan/);
  assert.match(sourcesHtml, /source-pdfs\/Safara\/Safara_Incremental_PRD_02_Payment_Documents_Readiness\.pdf/);
  assert.match(sourcesHtml, /href="\/demo\?projectId=safara&amp;view=sources"/);
  assert.match(changesHtml, /href="\/demo\?projectId=safara&amp;view=workflow&amp;prd=safara-increment-02&amp;lens=isolate/);
  for (const html of [workflowHtml, factsHtml, changesHtml]) assert.match(html, /href="\/demo\?projectId=safara&amp;prd=safara-increment-02&amp;lens=isolate&amp;view=(workflow|facts|ces|changes)"/);
  assert.match(workflowWorkspace, /Previous affected workflow page/);
  assert.match(workflowWorkspace, /No selected contribution on this page/);
  const editorHtml = await editorDemo.text();
  const viewerHtml = await viewerDemo.text();
  assert.match(editorHtml, /Raka Pratama/);
  assert.doesNotMatch(editorHtml, />Share</);
  assert.match(viewerHtml, /Sari Utami/);
  assert.doesNotMatch(viewerHtml, /\+ New project|>Share</);
  for (const response of processingStates) assert.match(await response.text(), /Processing|Ready to review|Needs attention|Unable to process/);
  assert.match(await approvedDemo.text(), /CES baseline[\s\S]*Approved|Approved[\s\S]*CES baseline/);
});
