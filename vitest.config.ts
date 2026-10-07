import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname)
    }
  },
  test: {
    setupFiles: ['./tests/server-only.setup.ts'],
    environment: "node"
  }
});
