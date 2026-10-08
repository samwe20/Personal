# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

This is a personal monorepo with three independent parts and no root package manager.

- **Folio** (`folio/`): distraction-free markdown editor. Web dev server is Vite on port **1420** (`npm run web:dev`). Requires Node.js **22.13+**. Checks: `npm run check`, `npm test`, `npm run build`, `npm run test:offline`, and `npm run test:e2e` (Playwright Chromium, installed by `.cursor/install.sh`). Windows and iOS Tauri shells are outside the Cloud Agent loop.
- **F.A.S.T Manager** (`fast-manager/`): React outliner. Web app on port **5173**. Sync server on port **3847** (`GET /api/health`). The Vite dev server proxies `/api` and `/ws` to that server. `better-sqlite3` is native and is built by `npm ci` in `sync-server`. There is no test script; typecheck and bundle with `npm --prefix app run build`, and lint with `npx oxlint` from `fast-manager/app`.
- **Prázdné domy scrapers** (root `scrape_*.py` and `requirements.txt`): one-off Python scripts that download from databaze.prazdnedomy.cz. They are not a service. `.cursor/install.sh` installs their dependencies with `python3 -m pip install --user -r requirements.txt`.

### Running the app (dev)

`.cursor/install.sh` installs dependencies. `.cursor/start.sh` runs on every boot, is safe to rerun, and opens tmux sessions `folio`, `fast-web`, and `fast-sync` only when those sessions are absent. It waits until all three ports respond.

- Folio: http://127.0.0.1:1420
- FAST Manager: http://127.0.0.1:5173
- Sync health: http://127.0.0.1:3847/api/health

### Non-obvious gotchas

- Folio's Vite config sets `strictPort: true` on 1420. FAST Manager's Vite config sets `host: false` and `strictPort: true` on 5173, so it listens on localhost only. `start.sh` passes `--host 127.0.0.1` so the app is reachable on this machine.
- FAST Manager sync stays off until it is enabled in Settings. The sync server can still be health-checked on its own.
- Do not run the Windows Tauri installer jobs in this environment. GitHub Actions builds those on `windows-latest`.
