import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/arcana-navigator/",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
