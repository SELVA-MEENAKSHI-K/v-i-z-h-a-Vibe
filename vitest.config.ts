import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Run in a single forked process. This machine is memory-constrained and the
    // auth tests exercise scrypt (a memory-hard KDF); the default multi-worker
    // pool can exhaust RAM and crash with "JavaScript heap out of memory".
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
