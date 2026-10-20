import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components keeps old routes alive inside <Activity> instead of
  // unmounting them, which fights AnimatePresence exits and useGSAP cleanup.
  cacheComponents: false,
  turbopack: {
    // Pin the workspace root: a stray lockfile higher up would otherwise be picked.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
