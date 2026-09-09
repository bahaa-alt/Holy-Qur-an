import type { NextConfig } from "next";

// Set only for the GitHub Pages build (a "project site" served under
// /<repo-name>/, not the domain root) via `pnpm build:ghpages`. Empty/unset
// for the primary target (Vercel or any root-domain static host), which is
// the default `pnpm build` and needs no base path at all.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
