import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const base = process.env.FOLIO_BASE || "./";

// https://vite.dev/config/
export default defineConfig(async () => ({
  base,
  plugins: [{
    name: "folio-offline",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", ...Object.keys(bundle)];
      const version = createHash("sha256").update(JSON.stringify(bundle)).digest("hex").slice(0, 16);
      const source = readFileSync(new URL("./service-worker.js", import.meta.url), "utf8")
        .replace("__PRECACHE__", JSON.stringify([...new Set(assets)]))
        .replace("__VERSION__", version);
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  }],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || true,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: "es2020",
  },
}));
