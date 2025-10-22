import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build", // CRA's default build output
  },
  server: {
    proxy: {
      // any path you choose (e.g. /sudoku-api) will be proxied to the target
      "/sudoku-api": {
        target: "https://youdosudoku.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sudoku-api/, "/api"),
      },
    },
  },
});
