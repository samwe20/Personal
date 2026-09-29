# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

This is **Galactic Empire**, a Stellaris-inspired 4X space strategy game written in **pure vanilla JavaScript** (no framework). It runs entirely client-side in the browser. The UI is in Czech.

- Entry point: `index.html`
- Game engine: `game.js` (defines `class Game`)
- UI/rendering (canvas): `ui.js` (defines `class UI`)
- Styling: `styles.css`
- The top-level `*.md` files (e.g. `README.md`, `AI-*.md`, `Jak-Vyuzit-Claude-Code.md`) are documentation only.

There is **no package manager, build step, test suite, or lint config** — no `package.json`, no lockfile, nothing to compile. Do not look for `npm`/`pnpm` scripts; there are none.

### Running the app (dev)

Serve the static files from the repo root and open the page in a browser:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. `python3` is preinstalled and needs no dependencies. (Opening `index.html` via `file://` also works, but a local HTTP server is the cleaner dev workflow.)

### Non-obvious gotcha: the game does not auto-boot on page load

The committed code has an initialization wiring bug: `game.js` assigns a lexically-scoped `let game` (never `window.game`) and never calls `game.startGameLoop()`, while `ui.js` waits for `window.game` on `DOMContentLoaded`. As a result, on a clean load the canvas stays black, resources show `0`, and the year counter is frozen at `2200` (console logs `Game initialized with 50 systems` then `Game not initialized!`).

To actually run/test gameplay in the browser, run this once in the DevTools console after the page loads:

```js
window.game = game; game.startGameLoop(); ui = new UI(window.game);
```

After that the galaxy renders, resources tick, the year advances, and ship construction / system selection all work. Treat this only as a runtime/testing workaround — do **not** commit a source fix for it unless the task explicitly asks you to change application code.

### Lint / test / build

None exist. There is nothing to lint, no automated tests to run, and no build to produce. "Building" the app just means serving the static files as above.
