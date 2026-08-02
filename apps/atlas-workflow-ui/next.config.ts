import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@company/ces-atlas-model-review-contracts"],
  experimental: { useTypeScriptCli: true },
};

export default config;
