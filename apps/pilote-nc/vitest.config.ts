import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "server-unit",
    environment: "node",
    include: ["src/server/**/*.unit.test.{ts,tsx}"],
    globals: true,
  },
});
