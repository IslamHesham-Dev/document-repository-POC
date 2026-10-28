import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind's CSS loader is registered with the same Turbopack builder used by
  // both development and the production build.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
