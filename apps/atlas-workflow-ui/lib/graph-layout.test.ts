import { describe, expect, it } from "vitest";
import { layeredGraphLayout } from "./graph-layout";

describe("Atlas layered graph layout", () => {
  it("places forward workflow stages in ordered columns and parallel roots in one column", () => {
    const layout = layeredGraphLayout(["package", "pilgrim", "registration", "payment"], [
      { source: "package", target: "registration" },
      { source: "pilgrim", target: "registration" },
      { source: "registration", target: "payment" },
    ]);
    expect(layout.get("package")?.x).toBe(0);
    expect(layout.get("pilgrim")?.x).toBe(0);
    expect(layout.get("registration")?.x).toBe(300);
    expect(layout.get("payment")?.x).toBe(600);
    expect(layout.get("package")?.y).not.toBe(layout.get("pilgrim")?.y);
  });

  it("ignores backward cycle edges when assigning finite ranks", () => {
    const layout = layeredGraphLayout(["one", "two", "three"], [
      { source: "one", target: "two" }, { source: "two", target: "three" },
      { source: "three", target: "one" },
    ]);
    expect([...layout.values()].every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)))
      .toBe(true);
    expect(layout.get("three")?.x).toBeGreaterThan(layout.get("two")!.x);
  });
});
