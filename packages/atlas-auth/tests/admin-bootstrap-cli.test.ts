import assert from "node:assert/strict";
import test from "node:test";
import { AtlasBootstrapError, type AtlasBootstrapCoordinator } from "../src/bootstrap-coordinator.ts";
import { runAtlasAdminCommand, type AtlasAdminCliDependencies } from "../src/admin-bootstrap-cli.ts";

const testPassword = "test-only-cli-password";

function harness(overrides: Partial<AtlasAdminCliDependencies> = {}) {
  const output: string[] = [];
  let provisionCalls = 0;
  let reconcileCalls = 0;
  const coordinator: AtlasBootstrapCoordinator = {
    async provision() { provisionCalls += 1; return { attemptId: "attempt-1", state: "SEALED" }; },
    async reconcile(input) { reconcileCalls += 1; return { attemptId: input.attemptId, state: "SEALED" }; },
  };
  const dependencies: AtlasAdminCliDependencies = {
    prompt: { async password() { return testPassword; } },
    write: (line) => output.push(line),
    createService: async () => ({ coordinator, baseURL: "http://localhost:3001", close: async () => undefined }),
    ...overrides,
  };
  return { dependencies, output, calls: () => ({ provisionCalls, reconcileCalls }) };
}

test("AA-004 native CLI delegates one successful bootstrap to the coordinator and redacts the password", async () => {
  const subject = harness();
  assert.equal(await runAtlasAdminCommand(["admin", "bootstrap", "--email", "admin@example.test", "--name", "Atlas Administrator"], subject.dependencies), 0);
  assert.deepEqual(subject.calls(), { provisionCalls: 1, reconcileCalls: 0 });
  const transcript = subject.output.join("\n");
  assert.match(transcript, /Bootstrap state sealed/);
  assert.match(transcript, /POST http:\/\/localhost:3001\/api\/auth\/sign-in\/email/);
  assert.doesNotMatch(transcript, new RegExp(testPassword));
  assert.doesNotMatch(transcript, /attempt-1/);
});

test("AA-004 rejects unsafe or incomplete input before privileged delegation", async () => {
  for (const args of [
    ["admin", "bootstrap", "--email", "not-an-email", "--name", "Atlas"],
    ["admin", "bootstrap", "--email", "admin@example.test", "--name", "Atlas", "--password", "forbidden"],
    ["admin", "bootstrap", "--email", "admin@example.test"],
  ]) {
    const subject = harness({ prompt: { async password() { return "mismatch"; } } });
    assert.equal(await runAtlasAdminCommand(args, subject.dependencies), 1);
    assert.deepEqual(subject.calls(), { provisionCalls: 0, reconcileCalls: 0 });
    assert.doesNotMatch(subject.output.join("\n"), /forbidden|mismatch/);
  }
});

test("AA-004 exposes only bounded coordinator outcomes and an attempt-ID-only reconciliation command", async () => {
  const subject = harness({
    createService: async () => ({
      coordinator: {
        async provision() { throw new AtlasBootstrapError("PROVISIONING_FAILED"); },
        async reconcile(input) { return { attemptId: input.attemptId, state: "SEALED" }; },
      },
      baseURL: "http://localhost:3001",
      close: async () => undefined,
    }),
  });
  assert.equal(await runAtlasAdminCommand(["admin", "bootstrap", "--email", "admin@example.test", "--name", "Atlas"], subject.dependencies), 1);
  assert.match(subject.output.join("\n"), /Better Auth password policy/);

  const recovery = harness();
  assert.equal(await runAtlasAdminCommand(["admin", "reconcile", "--attempt-id", "attempt-9"], recovery.dependencies), 0);
  assert.deepEqual(recovery.calls(), { provisionCalls: 0, reconcileCalls: 1 });
  assert.equal(await runAtlasAdminCommand(["admin", "reconcile", "--force", "--attempt-id", "attempt-9"], recovery.dependencies), 1);
  assert.deepEqual(recovery.calls(), { provisionCalls: 0, reconcileCalls: 1 });
});
