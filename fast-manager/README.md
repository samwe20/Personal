# F.A.S.T Manager

**F**inally **A**wesome and **S**imple **T**ask Manager

Open-source task manager with Tana-inspired **supertags** — outliner UI, structured fields, live queries, real-time sync. Available as **Web (PWA)** and **Windows desktop (Tauri)** from a single codebase.

## Features

- Hierarchical outliner for tasks, notes, and knowledge
- **10 built-in supertags:** Task, Question, Inform, Person, Project, DailyNote, Meeting, Decision, Idea, Note
- Dynamic field panel per supertag (dates, selects, references, checkboxes)
- Live saved queries (My Tasks, Open Questions, Overdue)
- **Real-time sync** via included sync server (REST + WebSocket)
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

### Development

```bash
cd fast-manager
npm install
npm --prefix sync-server install
npm --prefix app install

# Start sync server + web app together
npm install concurrently --prefix .
npm run dev
```

- Web app: http://localhost:5173
- Sync server: http://localhost:3847

### Windows desktop (Tauri)

```bash
cd fast-manager/app
npm run tauri:dev      # development
npm run tauri:build    # production .exe / installer
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

## Sync

The sync server stores an append-only change log in SQLite. Clients push local changes and pull updates since `lastSyncAt`. WebSocket broadcasts changes to connected clients.

Configure a custom sync URL in **Settings**, or leave empty to use the Vite dev proxy (`/api` → `localhost:3847`).

## License

MIT — see [LICENSE](./LICENSE).
