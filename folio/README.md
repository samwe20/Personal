# Folio

Distraction-free markdown writing app inspired by **iA Writer**, with Obsidian-style `[[wiki links]]` and live **backlinks**.

Built as a **native Windows desktop app** with [Tauri 2](https://tauri.app/) (Rust + WebView2).

## Features

- Clean, typography-first writing surface
- Focus Mode (current sentence stays sharp)
- Typewriter scrolling
- Markdown syntax highlighting + Preview
- Local library of `.md` files
- `[[Wiki links]]` with autocomplete
- Click-to-open / create missing notes
- Backlinks + outgoing links panel
- Autosave, quick open (`Ctrl+P`), light/dark theme
- Demo library for first launch

## Windows build

### Requirements

- Windows 10/11
- [Node.js 20+](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- WebView2 (preinstalled on modern Windows)
- Visual Studio Build Tools with C++ workload (for Rust MSVC target)

### Install & run

```bash
cd folio
npm install
npm run desktop:dev
```

### Production installer

```bash
cd folio
npm install
npm run desktop:build
```

Artifacts:

- `src-tauri/target/release/bundle/nsis/Folio_*_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/Folio_*_x64_en-US.msi`

## Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New note |
| `Ctrl+S` | Save |
| `Ctrl+D` | Focus Mode |
| `Ctrl+E` | Preview |
| `Ctrl+P` | Quick open |
| `Ctrl+B` | Toggle library |
| `[[` | Wiki-link autocomplete |

## Design notes

Folio aims for iA Writer’s calm writing feel: centered measure, expressive serif body (`Literata`), quiet UI chrome, and no dashboard clutter. Linked notes are the one intentional “Obsidian” addition.

## Project layout

```
folio/
  src/                 # UI + editor (TypeScript)
  src-tauri/           # Native Windows shell (Rust/Tauri)
```
