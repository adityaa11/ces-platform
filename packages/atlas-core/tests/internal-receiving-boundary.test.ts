import assert from "node:assert/strict";
import test from "node:test";
import {
  createInternalReceivingBoundary,
  InternalReceivingUnauthorizedError,
} from "../src/index.ts";

const credential = "r".repeat(32);

test("receiving boundary rejects missing, wrong, and unequal-length credentials before parser or callback", async () => {
  let parserCalls = 0;
  let redeemCalls = 0;
  const boundary = createInternalReceivingBoundary({
    serviceCredential: credential,
    parseBody: (rawBody) => {
      parserCalls += 1;
      return rawBody;
    },
    redeem: async (input) => {
      redeemCalls += 1;
      return input;
    },
  });

  for (const presentedCredential of [undefined, "wrong", "r".repeat(31), "r".repeat(33)]) {
    await assert.rejects(boundary.receive(presentedCredential, "untrusted"), InternalReceivingUnauthorizedError);
  }
  assert.equal(parserCalls, 0);
  assert.equal(redeemCalls, 0);
});

test("receiving boundary fails fast for a short configured credential", () => {
  assert.throws(
    () => createInternalReceivingBoundary({ serviceCredential: "short", parseBody: () => "ignored", redeem: async () => "ignored" }),
    /at least 32 bytes/
  );
});

test("two domain-owned receivers use the same guard while retaining strict parsing and authorization", async () => {
  const audit: string[] = [];
  const planReceiver = createInternalReceivingBoundary({
    serviceCredential: credential,
    parseBody: (rawBody) => {
      audit.push("plan:parse");
      const value: unknown = JSON.parse(rawBody);
      if (!value || typeof value !== "object" || (value as { kind?: unknown }).kind !== "plan" || typeof (value as { planId?: unknown }).planId !== "string") {
        throw new Error("Invalid plan read request.");
      }
      return value as { readonly kind: "plan"; readonly planId: string };
    },
    redeem: async (input) => {
      audit.push("plan:redeem");
      if (input.planId !== "eligible-plan") throw new Error("Plan is not eligible.");
      return { readonlyPlan: input.planId };
    },
  });
  const reportReceiver = createInternalReceivingBoundary({
    serviceCredential: credential,
    parseBody: (rawBody) => {
      audit.push("report:parse");
      const value: unknown = JSON.parse(rawBody);
      if (!value || typeof value !== "object" || (value as { kind?: unknown }).kind !== "report" || typeof (value as { reportId?: unknown }).reportId !== "string") {
        throw new Error("Invalid report read request.");
      }
      return value as { readonly kind: "report"; readonly reportId: string };
    },
    redeem: async (input) => {
      audit.push("report:redeem");
      if (input.reportId !== "allowed-report") throw new Error("Report is not authorized.");
      return { readOnlyReport: input.reportId };
    },
  });

  assert.deepEqual(await planReceiver.receive(credential, '{"kind":"plan","planId":"eligible-plan"}'), { readonlyPlan: "eligible-plan" });
  assert.deepEqual(await reportReceiver.receive(credential, '{"kind":"report","reportId":"allowed-report"}'), { readOnlyReport: "allowed-report" });
  await assert.rejects(planReceiver.receive(credential, '{"kind":"plan","planId":"ineligible-plan"}'), /not eligible/);
  await assert.rejects(reportReceiver.receive(credential, '{"kind":"report","reportId":"protected-report"}'), /not authorized/);
  assert.deepEqual(audit, ["plan:parse", "plan:redeem", "report:parse", "report:redeem", "plan:parse", "plan:redeem", "report:parse", "report:redeem"]);
});

test("authorized reads may replay without boundary grants, tokens, or state", async () => {
  let parseCalls = 0;
  let redemptionCalls = 0;
  const boundary = createInternalReceivingBoundary({
    serviceCredential: credential,
    parseBody: (rawBody) => {
      parseCalls += 1;
      return JSON.parse(rawBody) as { readonly resource: string };
    },
    redeem: async (input) => {
      redemptionCalls += 1;
      return { protectedValue: `value:${input.resource}` };
    },
  });

  assert.deepEqual(await boundary.receive(credential, '{"resource":"accepted"}'), { protectedValue: "value:accepted" });
  assert.deepEqual(await boundary.receive(credential, '{"resource":"accepted"}'), { protectedValue: "value:accepted" });
  assert.equal(parseCalls, 2);
  assert.equal(redemptionCalls, 2);
});
