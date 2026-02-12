import { defineConfig } from "vitest/config";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "dist/**"],
    },
    ...(isCi
      ? {
          reporters: ["default", "junit", "json"],
          outputFile: {
            junit: "./coverage/junit.xml",
            json: "./coverage/vitest-report.json",
          },
        }
      : {}),
  },
});
