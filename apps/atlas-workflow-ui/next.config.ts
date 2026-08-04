import type { NextConfig } from "next";

export function atlasContentSecurityPolicy(environment = process.env.NODE_ENV): string {
  const scripts = environment === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scripts,
    "connect-src 'self'",
  ].join("; ");
}

const config: NextConfig = {
  transpilePackages: ["@company/ces-atlas-model-review-contracts"],
  experimental: { useTypeScriptCli: true },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: atlasContentSecurityPolicy() },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
    ] }];
  },
};

export default config;
