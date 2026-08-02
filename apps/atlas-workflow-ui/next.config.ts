import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@company/ces-atlas-model-review-contracts"],
  experimental: { useTypeScriptCli: true },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
    ] }];
  },
};

export default config;
