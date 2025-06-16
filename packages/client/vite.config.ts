import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mud } from "vite-plugin-mud";

export default defineConfig({
  base: "/",
  plugins: [react(), mud({ worldsFile: "../contracts/worlds.json" })],
  build: {
    target: "es2022",
    minify: true,
    sourcemap: true,
  },
});
