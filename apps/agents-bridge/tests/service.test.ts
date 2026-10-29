import assert from "node:assert/strict";
import test from "node:test";
import { createBridgeApp } from "../src/app.ts";
import { loadBridgeConfig } from "../src/config.ts";

test("health and readiness are available without the Atlas UI", async () => {
  const app = createBridgeApp({ version: "test" });
  try {
    assert.deepEqual(JSON.parse((await app.inject({ method: "GET", url: "/healthz" })).body), { status: "ok" });
    assert.deepEqual(JSON.parse((await app.inject({ method: "GET", url: "/readyz" })).body), { status: "ready", version: "test" });
  } finally { await app.close(); }
});
test("a live profile without qualified routes fails readiness while process health remains available", async () => {
  const app = createBridgeApp({ version: "test", ready: () => false });
  try {
    assert.equal((await app.inject({ method: "GET", url: "/healthz" })).statusCode, 200);
    const readiness = await app.inject({ method: "GET", url: "/readyz" });
    assert.equal(readiness.statusCode, 503);
    assert.deepEqual(JSON.parse(readiness.body), { status: "not_ready", version: "test" });
  } finally { await app.close(); }
});
