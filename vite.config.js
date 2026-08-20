import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "build", // CRA's default build output
  },
  test: {
    environment: "happy-dom",
    setupFiles: "./src/setupTests.js",
    globals: true,
    pool: "threads",
    exclude: ["e2e/**", "node_modules/**"],
  },
});
