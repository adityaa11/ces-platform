import { describe, expect, it } from "vitest";

describe("workspace foundation", () => {
  it("uses the pinned Node major version", () => {
    expect(process.versions.node).toMatch(/^24\./u);
  });

  it("runs tests as native ES modules", () => {
    expect(import.meta.url).toMatch(/^file:/u);
  });
});
