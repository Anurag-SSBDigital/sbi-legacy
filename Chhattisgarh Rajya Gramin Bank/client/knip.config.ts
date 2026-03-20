import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/main.tsx",
    "src/routeTree.gen.ts",
    "vite.config.ts",
    "eslint.config.js",
  ],
  project: ["src/**/*.{ts,tsx}", "src/**/*.d.ts", "src/**/*.css"],
  exclude: ["exports", "types", "duplicates"],
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
};

export default config;
