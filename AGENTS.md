# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

**Personal** is one repository with four projects. A project is a directory. A branch is a task, and it is never a way to switch projects.

| Project | Directory | Open |
| --- | --- | --- |
| Folio | `folio/` | `Folio.code-workspace` |
| FAST | `fast-manager/` | `FAST.code-workspace` |
| Deníky (Schneller diary) | `deniky/` | `Deniky.code-workspace` |
| Other (empty-houses scrape, notes) | `ostatni/` | `Ostatni.code-workspace` |

The only long-lived branch is `main`. It contains all four. `feat/…` and `fix/…` are unfinished changes and are deleted after they merge. Branches named `cursor/…` or `claude/…` are old tasks. Do not treat them as Folio, FAST, or the diaries.

`./project` prints the branch and the four projects. `./project folio` (or `fast`, `deniky`, `ostatni`) prints the directory for that one project.

There is no Galactic Empire game in this repository. Do not look for `game.js`, `ui.js`, or a root `index.html`.

### Running Folio

From the repository root:

```bash
cd folio && npm ci && npm run web:dev
```

The Vite server listens on http://localhost:1420. The cloud environment in `.cursor/environment.json` starts this for you.

### Running FAST

```bash
cd fast-manager && npm ci && npm run dev
```

The web app lives in `fast-manager/app`. Desktop builds use `npm run tauri:dev` from `fast-manager`.

### Deníky

Czech revision of the Schneller diary is in `deniky/schneller-tagebuch-cs/`. Scripts in `deniky/scripts/` resolve the diary relative to `deniky/`. Run them from `deniky/`.

### Other

Scrape scripts and their JSON live in `ostatni/`. Run them from that directory (`pip install -r requirements.txt`, then `python3 scrape_prazdnedomy.py`).

### Checks

Folio: `cd folio && npm test` and `npm run check`. FAST has its own Windows workflow in `.github/workflows/fast-manager.yml`. There is no root package manager.
