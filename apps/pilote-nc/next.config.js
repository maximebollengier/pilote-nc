/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopackFileSystemCacheForBuild: process.env.CI !== "true",
  },
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  bundlePagesRouterDependencies: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  allowedDevOrigins: ["*.pilote.nc.localhost", "pilote.nc.localhost"],
  turbopack: {
    resolveAlias: {
      "react-hook-form": "react-hook-form/dist/index.esm.mjs",
    },
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/acme-challenge/:token",
        destination: "/api/acme-challenge/:token",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
