import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const pageSource = await readFile(new URL("../app/admin/dashboard/page.tsx", import.meta.url), "utf8");
const harnessRoot = new URL("./route-harness/", import.meta.url);
const reactJsxRuntime = await import.meta.resolve("react/jsx-runtime");
const moduleSubstitutions = new Map([
  ["react/jsx-runtime", reactJsxRuntime],
  ["next/headers", new URL("next-headers.mjs", harnessRoot)],
  ["next/navigation", new URL("next-navigation.mjs", harnessRoot)],
  ["@/lib/admin-guard", new URL("admin-guard.mjs", harnessRoot)],
  ["@/lib/auth-server", new URL("auth-server.mjs", harnessRoot)],
]);
const compiledPage = ts.transpileModule(pageSource, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText.replace(/from "([^"]+)"/g, (statement, specifier) => {
  const replacement = moduleSubstitutions.get(specifier);
  return replacement ? `from "${typeof replacement === "string" ? replacement : replacement.href}"` : statement;
});
const { default: AdminDashboardPage } = await import(`data:text/javascript,${encodeURIComponent(compiledPage)}`);

const identity = {
  id: "admin-user",
  email: "admin@example.test",
  name: "Atlas Admin",
  role: "admin",
};

function configure(outcome) {
  const service = {
    auth: { api: { getSession: async () => ({ user: { id: "admin-user" } }) } },
    db: {},
    closeCount: 0,
    async close() {
      this.closeCount += 1;
    },
  };
  const state = {
    outcome,
    identity,
    cookie: `better-auth.session_token=${outcome}`,
    headerReads: 0,
    service,
  };
  globalThis.__atlasDashboardRouteHarness = state;
  return state;
}

async function request(outcome) {
  const state = configure(outcome);
  try {
    const page = await AdminDashboardPage();
    return { kind: "render", html: renderToStaticMarkup(page), state };
  } catch (error) {
    if (error.routeAction) {
      return { kind: error.routeAction, location: error.location, html: null, state };
    }
    return { kind: "error", error, html: null, state };
  }
}

test("the dashboard page renders the authorized identity on direct GET and refresh", async () => {
  for (const navigation of ["direct GET", "refresh"]) {
    const result = await request("valid");
    assert.equal(result.kind, "render", navigation);
    assert.match(result.html, /Atlas Admin Console/);
    assert.match(result.html, /Welcome, Atlas Admin\./);
    assert.equal(result.state.headerReads, 1, `${navigation} reads request headers once`);
    assert.equal(result.state.service.closeCount, 1, `${navigation} closes the Worker auth service`);
  }
});

test("the dashboard page redirects every named session-denial condition without Admin output", async () => {
  for (const outcome of ["missing", "expired", "revoked", "failed-session"]) {
    const result = await request(outcome);
    assert.equal(result.kind, "redirect", outcome);
    assert.equal(result.location, "/admin/sign-in", outcome);
    assert.equal(result.html, null, `${outcome} has no protected render output`);
    assert.equal(result.state.service.closeCount, 1, `${outcome} closes the Worker auth service`);
  }
});

test("the dashboard page denies ordinary and unavailable authority without protected output", async () => {
  for (const outcome of ["ordinary", "unavailable"]) {
    const result = await request(outcome);
    assert.equal(result.kind, "forbidden", outcome);
    assert.equal(result.html, null, `${outcome} has no protected render output`);
    assert.equal(result.state.service.closeCount, 1, `${outcome} closes the Worker auth service`);
  }
});

test("the dashboard page fails closed on an unexpected authorization failure", async () => {
  const result = await request("database-failure");
  assert.equal(result.kind, "error");
  assert.match(result.error.message, /database unavailable/);
  assert.equal(result.html, null);
  assert.equal(result.state.service.closeCount, 1);
});
