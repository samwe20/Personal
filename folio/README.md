# Folio

Distraction-free markdown writing app inspired by **iA Writer**, with Obsidian-style `[[wiki links]]` and live **backlinks**.

Built with [Tauri 2](https://tauri.app/) as a **native Windows** app, plus:

- **PWA / web** version for iPhone Safari (no Mac needed) — see [`PWA.md`](./PWA.md)
- **iOS native** target (Mac + Xcode) — see [`IOS.md`](./IOS.md)

## Features

- Clean, typography-first writing surface
- Focus Mode + Typewriter scrolling
- Markdown syntax highlighting + Preview
- Local library of `.md` files
- `[[Wiki links]]` with autocomplete
  - Desktop: double-click to open
  - iPhone: long-press to open
- Backlinks + outgoing links
- Autosave, quick open (`Ctrl+P` / `Cmd+P`), light/dark theme
- Mobile UI: library drawer + links bottom sheet + safe areas

## Windows

### Requirements

- Windows 10/11
- Node.js 20+
- Rust
- WebView2
- Visual Studio Build Tools with C++ (`link.exe`)
  - Run from **Developer PowerShell for VS**

### Run

```bash
cd folio
npm install
npm run desktop:dev
```

### Installer

```bash
npm run desktop:build
```

Artifacts:

- `src-tauri/target/release/bundle/nsis/`
- `src-tauri/target/release/bundle/msi/`

## PWA (iPhone bez Macu)

```bash
cd folio
npm install
npm run web:dev        # vývoj
# nebo
npm run web:build && npm run web:preview
```

Na iPhonu: Safari → **Sdílet → Přidat na plochu**.  
Details: [`PWA.md`](./PWA.md)

## iOS native

> Apple allows native iOS builds only on **macOS + Xcode**.  
> Full step-by-step guide: [`IOS.md`](./IOS.md)

```bash
cd folio
npm install
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
brew install cocoapods

npm run ios:init   # once — generates Xcode project
npm run ios:dev    # simulator / device
npm run ios:build  # release / IPA
```

On iPhone, Folio stores the library under the app Documents folder and opens with a mobile-first layout.

## Shortcuts (desktop)

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd+N` | New note |
| `Ctrl/Cmd+S` | Save |
| `Ctrl/Cmd+D` | Focus Mode |
| `Ctrl/Cmd+E` | Preview |
| `Ctrl/Cmd+P` | Quick open |
| `Ctrl/Cmd+B` | Toggle library |

## Project layout

```
folio/
  src/                 # UI + editor
  src-tauri/           # Native shell (Tauri / Rust)
  IOS.md               # iOS build instructions
```
