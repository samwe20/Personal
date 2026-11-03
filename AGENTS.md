# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

**Personal** is one repository with five projects. A project is a directory. A branch is a task, and it is never a way to switch projects.

| Project | Directory | Open |
| --- | --- | --- |
| Folio | `folio/` | `Folio.code-workspace` |
| FAST | `fast-manager/` | `FAST.code-workspace` |
| Deníky (Schneller diary) | `deniky/` | `Deniky.code-workspace` |
| Other (empty-houses scrape, notes) | `ostatni/` | `Ostatni.code-workspace` |
| Pošta (mail) | `posta/` | `Posta.code-workspace` |

The only long-lived branch is `main`. It contains all five. `feat/…` and `fix/…` are unfinished changes and are deleted after they merge. Branches named `cursor/…` or `claude/…` are old tasks. Do not treat them as Folio, FAST, or the diaries.

`./project` prints the branch and the five projects. `./project folio` (or `fast`, `deniky`, `ostatni`, `posta`) prints the directory for that one project.

There is no Galactic Empire game in this repository. Do not look for `game.js`, `ui.js`, or a root `index.html`.

### Cloud Agent boot

`.cursor/install.sh` installs dependencies. `.cursor/start.sh` runs on every boot, is safe to rerun, and opens tmux sessions `folio`, `fast-web`, `fast-sync`, and `posta` only when those sessions are absent. It waits until those four ports respond. Deníky are text and scripts, not a server, so boot does not start them.

- Folio: http://127.0.0.1:1420
- FAST Manager: http://127.0.0.1:5173
- Sync health: http://127.0.0.1:3847/api/health
- Pošta: http://127.0.0.1:1430

### Running Folio

From the repository root:

```bash
cd folio && npm ci && npm run web:dev
```

The Vite server listens on http://localhost:1420. Requires Node.js 22.13+. Checks: `npm run check`, `npm test`, `npm run build`, `npm run test:offline`, and `npm run test:e2e` (Playwright Chromium, installed by `.cursor/install.sh`). Windows and iOS Tauri shells are outside the Cloud Agent loop.

### Running FAST

```bash
cd fast-manager && npm ci && npm run dev
```

The web app lives in `fast-manager/app` and listens on port 5173. The sync server listens on port 3847 (`GET /api/health`). `better-sqlite3` is native and is built by `npm ci` in `sync-server`. There is no test script; typecheck and bundle with `npm --prefix app run build`, and lint with `npx oxlint` from `fast-manager/app`. Desktop builds use `npm run tauri:dev` from `fast-manager`.

### Deníky

Czech revision of the Schneller diary is in `deniky/schneller-tagebuch-cs/`. Scripts in `deniky/scripts/` resolve the diary relative to `deniky/`. Run them from `deniky/`:

```bash
cd deniky
python3 scripts/revise_schneller_translation.py status
```

### Other

Scrape scripts and their JSON live in `ostatni/`. Run them from that directory (`python3 -m pip install --user -r requirements.txt`, then `python3 scrape_prazdnedomy.py`). `.cursor/install.sh` installs `ostatni/requirements.txt`.

### Running Pošta

```bash
cd posta && npm ci && npm start
```

The mail app listens on http://localhost:1430. `npm test` runs the mailbox tests. The local mailbox works without a password. `posta/data/mailbox.json` stays out of git because it can hold a Gmail app password and messages. Do not put that password in the environment.

### Checks

Folio: `cd folio && npm test` and `npm run check`. Pošta: `cd posta && npm test`. FAST has its own Windows workflow in `.github/workflows/fast-manager.yml`. There is no root package manager.

### Non-obvious gotchas

- Folio's Vite config sets `strictPort: true` on 1420. FAST Manager's Vite config sets `host: false` and `strictPort: true` on 5173, so it listens on localhost only. `start.sh` passes `--host 127.0.0.1` so the app is reachable on this machine.
- FAST Manager sync stays off until it is enabled in Settings. The sync server can still be health-checked on its own.
- Do not run the Windows Tauri installer jobs in this environment. GitHub Actions builds those on `windows-latest`.
