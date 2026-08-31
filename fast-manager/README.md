# F.A.S.T Manager

**F**inally **A**wesome and **S**imple **T**ask Manager

Open-source task manager with Tana-inspired **supertags** — outliner UI, structured fields, live queries, real-time sync. Available as **Web (PWA)** and **Windows desktop (Tauri)** from a single codebase.

## Features

- Hierarchical outliner for tasks, notes, and knowledge
- **10 built-in supertags:** Task, Question, Inform, Person, Project, DailyNote, Meeting, Decision, Idea, Note
- Dynamic field panel per supertag (dates, selects, references, checkboxes)
- Live saved queries (My Tasks, Open Questions, Overdue)
- **Real-time sync** via included sync server (REST + WebSocket)
- **Quick capture** (Ctrl+Shift+Space) with supertag, due date, reminder
- **Command palette** (Ctrl+K) and full keyboard shortcuts
- **Full-text search** across nodes and fields
- **Reference picker** + backlinks between nodes
- **Recurring tasks** (daily / weekly / monthly)
- **Reminders** via browser notifications
- **Undo / redo** (Ctrl+Z / Ctrl+Y)
- **Drag & drop** reordering in outliner
- **Checklists** in node content (`- [ ]` / Tab to add)
- **Onboarding** tour for new users
- **Czech + English** UI (i18next)
- **Light / Dark / System** theme
- Local-first storage (IndexedDB) with offline support
- MIT licensed — open source

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+

For Windows desktop builds additionally:

- Rust (stable)
- Platform-specific Tauri dependencies ([docs](https://v2.tauri.app/start/prerequisites/))

### Development (local-only, no server)

```bash
cd fast-manager
npm install
npm --prefix app install

# Web app only — no sync server needed
npm run dev
```

- Web app: http://localhost:5173
- Data stored locally in browser (IndexedDB)

### Development with sync server (optional)

```bash
npm --prefix sync-server install
npm run dev:sync
```

- Sync server: http://localhost:3847
- Enable in app: **Settings → Zapnout synchronizaci**

### Windows desktop (Tauri)

```bash
cd fast-manager/app
npm run tauri:dev      # development (otevre okno automaticky)
npm run tauri:build    # production .exe / installer (nespousti aplikaci!)
npm run tauri:run      # spusti posledni build
npm run tauri:build:run  # build + spusteni najednou
```

Po `tauri:build` spustte aplikaci rucne:

```powershell
npm run tauri:run
# nebo
.\src-tauri\target\release\fast-manager.exe
```

## Architecture

```
app/              React + TypeScript + Vite + Tailwind (Web + Tauri shell)
sync-server/      Express + SQLite + WebSocket sync
```

| Layer | Web | Windows |
|---|---|---|
| UI | React PWA | Same React in Tauri WebView |
| Storage | IndexedDB (Dexie) | IndexedDB (Dexie) |
| Sync | REST + WS → sync-server | Same |

## Supertags

| Supertag | Purpose | Key fields |
|---|---|---|
| `#Task` | Action items | due date, priority, status, assignee, project |
| `#Question` | Open questions | status, answer, asked-to, due date |
| `#Inform` | Facts to remember | category, source, importance, verified |
| `#Person` | Contacts | email, phone, organization, role |
| `#Project` | Initiatives | status, deadline, owner |
| `#DailyNote` | Journal | date |
| `#Meeting` | Meetings | date/time, location, status |
| `#Decision` | Decisions | status, outcome, rationale |
| `#Idea` | Ideas | status, potential |
| `#Note` | Plain notes | — |

Type `#Task` at the end of a node line to attach a supertag, or use the field panel.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Shift+Space | Quick capture |
| Ctrl+K | Command palette |
| Ctrl+F | Search |
| Ctrl+N | New node |
| Ctrl+Enter | Complete task |
| Ctrl+Z / Ctrl+Y | Undo / redo |
| Tab (in node) | Insert checklist line |

## Sync

The sync server stores an append-only change log in SQLite. Clients push local changes and pull updates since `lastSyncAt`. WebSocket broadcasts changes to connected clients.

Configure sync in **Settings** (off by default). When enabled, set sync server URL or leave empty to use the Vite dev proxy (`/api` → `localhost:3847`).

## License

MIT — see [LICENSE](./LICENSE).
