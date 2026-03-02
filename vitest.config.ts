import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@src": `${__dirname}/src`,
    },
  },
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
    // tests aren't in source but root folder
    include: ["**/*.spec.ts"],
  },
});
