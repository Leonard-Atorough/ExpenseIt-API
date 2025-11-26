import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: true,
      exclude: ["node_modules/", "tests/", "dist/", "generated/"],
    },
    include: ["src/**/*.spec.ts"],
  },
});
