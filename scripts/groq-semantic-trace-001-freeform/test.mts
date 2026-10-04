import assert from "node:assert/strict";
import { createValidatedFixture, userMessage } from "./fixture.mts";
import { FREEFORM_SYSTEM_INSTRUCTION } from "./groq-client.mts";

assert.equal(createValidatedFixture().pages[0].textBlocks.length, 4);
assert.equal(userMessage, `S1: The customer submits an order.

S2: Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.

S3: 3.2 Purchase Rules

S4: Approval may be required before processing.`);
assert.equal(FREEFORM_SYSTEM_INSTRUCTION.includes("Respond only with ordinary natural-language explanations for the supplied sources."), true);
assert.equal(FREEFORM_SYSTEM_INSTRUCTION.includes("JSON Schema"), false);
console.log("SEMTRACE-001 free-form fixture, perception parser, verbatim instruction, and data-only user boundary: PASS");
