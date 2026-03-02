import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "dist/", "generated/"],
    },
    // tests aren't in source but root folder
    include: ["**/*.spec.ts"],
    exclude: [
      "node_modules/**",
      "dist/**",
      "**/types/*.spec.ts", // Skip placeholder type tests
      "**/routes/*.spec.ts", // Skip placeholder route tests
      "**/controllers/*.spec.ts", // Skip placeholder controller tests
      "**/services/*.spec.ts", // Skip placeholder service tests
      "**/middleware/error.middleware.spec.ts", // Not yet implemented
      "**/config/db.spec.ts", // Not yet implemented
    ],
  },
});
