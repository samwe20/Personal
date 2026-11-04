# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

**Personal** is one repository with three projects. A project is a directory. A branch is a task, and it is never a way to switch projects.

| Project | Directory | Open |
| --- | --- | --- |
| Deníky (Schneller diary) | `deniky/` | `Deniky.code-workspace` |
| Other (empty-houses scrape, notes) | `ostatni/` | `Ostatni.code-workspace` |
| Pošta (mail) | `posta/` | `Posta.code-workspace` |

**Folio** and **F.A.S.T. Manager** moved to separate repositories:

- Folio: https://github.com/samwe20/Folio
- F.A.S.T. Manager: https://github.com/samwe20/F.A.S.T.-Manager

The only long-lived branch is `main`. It contains all three. `feat/…` and `fix/…` are unfinished changes and are deleted after they merge. Branches named `cursor/…` or `claude/…` are old tasks. Do not treat them as the diaries or other projects.

`./project` prints the branch and the three projects. `./project deniky` (or `ostatni`, `posta`) prints the directory for that one project.

There is no Galactic Empire game in this repository. Do not look for `game.js`, `ui.js`, or a root `index.html`.

### Cloud Agent boot

`.cursor/install.sh` installs dependencies. `.cursor/start.sh` runs on every boot, is safe to rerun, and opens a tmux session `posta` only when that session is absent. It waits until port 1430 responds. Deníky are text and scripts, not a server, so boot does not start them.

- Pošta: http://127.0.0.1:1430

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

Pošta: `cd posta && npm test`. There is no root package manager.

### Non-obvious gotchas

- Do not look for Folio or FAST Manager in this repo; use the separate GitHub repositories linked above.
