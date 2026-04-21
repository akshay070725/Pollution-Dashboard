import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Match API port to server/.env PORT so dev proxy stays in sync. */
function readServerEnvPort() {
  const envFile = path.join(__dirname, "../server/.env");
  if (!existsSync(envFile)) return "3001";
  const text = readFileSync(envFile, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*PORT\s*=\s*(\d+)\s*(?:#.*)?$/);
    if (m) return m[1];
  }
  return "3001";
}

const apiPort = process.env.API_PROXY_PORT || readServerEnvPort();
const apiProxy = {
  "/api": {
    target: `http://127.0.0.1:${apiPort}`,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
