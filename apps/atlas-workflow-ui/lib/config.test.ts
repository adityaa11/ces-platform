import { describe, expect, it } from "vitest";
import { atlasContentSecurityPolicy } from "../next.config";

describe("Atlas Content Security Policy", () => {
  it("allows React development evaluation without weakening production", () => {
    expect(atlasContentSecurityPolicy("development")).toContain("'unsafe-eval'");
    expect(atlasContentSecurityPolicy("production")).not.toContain("'unsafe-eval'");
  });

  it("keeps active embedded content and external connections denied", () => {
    const policy = atlasContentSecurityPolicy("production");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self'");
  });
});
