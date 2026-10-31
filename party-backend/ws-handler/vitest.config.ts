import { defineConfig } from "vitest/config";

// Explicit config so vitest does not climb to the Vite app's vite.config.js at the repo root.
export default defineConfig({ test: { environment: "node" } });
