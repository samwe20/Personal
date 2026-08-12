import type { NoteMeta } from "../types";
import { noteIdFromRelative, titleFromPath } from "./paths";
import { WEB_LIBRARY_PATH } from "./runtime";

const DB_NAME = "folio-notes";
const DB_VERSION = 1;
const STORE = "notes";

export interface WebNoteRecord {
  path: string;
  title: string;
  content: string;
  mtime: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "path" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB request failed"));
  });
}

function toMeta(record: WebNoteRecord): NoteMeta {
  return {
    id: noteIdFromRelative(record.path),
    title: record.title,
    path: `${WEB_LIBRARY_PATH}/${record.path}`,
    relativePath: record.path,
    mtime: record.mtime,
  };
}

function relativeOf(path: string): string {
  if (path.startsWith(`${WEB_LIBRARY_PATH}/`)) {
    return path.slice(WEB_LIBRARY_PATH.length + 1);
  }
  return path.replace(/^\/+/, "");
}

export async function getDefaultLibraryPath(): Promise<string> {
  return WEB_LIBRARY_PATH;
}

export async function listNotes(_libraryPath: string): Promise<NoteMeta[]> {
  const db = await openDb();
  const records = await reqToPromise(
    db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
  );
  return (records as WebNoteRecord[])
    .map(toMeta)
    .sort((a, b) => a.title.localeCompare(b.title, "cs", { sensitivity: "base" }));
}

export async function readNote(path: string): Promise<string> {
  const rel = relativeOf(path);
  const db = await openDb();
  const record = (await reqToPromise(
    db.transaction(STORE, "readonly").objectStore(STORE).get(rel),
  )) as WebNoteRecord | undefined;
  if (!record) throw new Error(`Note not found: ${rel}`);
  return record.content;
}

export async function writeNote(path: string, content: string): Promise<void> {
  const rel = relativeOf(path);
  const record: WebNoteRecord = {
    path: rel,
    title: titleFromPath(rel),
    content,
    mtime: Date.now(),
  };
  const db = await openDb();
  await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(record));
}

async function noteExists(rel: string): Promise<boolean> {
  const db = await openDb();
  const record = await reqToPromise(
    db.transaction(STORE, "readonly").objectStore(STORE).get(rel),
  );
  return Boolean(record);
}

export async function createNote(
  _libraryPath: string,
  title: string,
  content = "",
): Promise<string> {
  const safe =
    title
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 120) || "Bez názvu";

  let fileName = `${safe}.md`;
  let i = 2;
  while (await noteExists(fileName)) {
    fileName = `${safe} ${i}.md`;
    i += 1;
  }
  const path = `${WEB_LIBRARY_PATH}/${fileName}`;
  await writeNote(path, content);
  return path;
}

export async function renameNote(oldPath: string, newTitle: string): Promise<string> {
  const oldRel = relativeOf(oldPath);
  const content = await readNote(oldPath);
  const safe =
    newTitle
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 120) || "Bez názvu";

  let nextRel = `${safe}.md`;
  let i = 2;
  while ((await noteExists(nextRel)) && nextRel !== oldRel) {
    nextRel = `${safe} ${i}.md`;
    i += 1;
  }
  if (nextRel === oldRel) return oldPath;

  await writeNote(`${WEB_LIBRARY_PATH}/${nextRel}`, content);
  await deleteNote(oldPath);
  return `${WEB_LIBRARY_PATH}/${nextRel}`;
}

export async function deleteNote(path: string): Promise<void> {
  const rel = relativeOf(path);
  const db = await openDb();
  await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(rel));
}

export async function createDemoLibrary(_libraryPath: string): Promise<string> {
  const existing = await listNotes(WEB_LIBRARY_PATH);
  if (existing.length) {
    return (
      existing.find((n) => n.title === "Vítejte ve Folio")?.path ?? existing[0].path
    );
  }

  const welcome = `# Vítejte ve Folio

Folio web je soustředěný markdown editor inspirovaný **iA Writer** — s propojenými poznámkami jako v Obsidianu.

## Na iPhonu

1. Pište přímo tady v Safari
2. Přidejte Folio na plochu: **Sdílet → Přidat na plochu**
3. Propojte myšlenky přes wikilinky

Zkuste otevřít [[Jak psát wikilinky]] nebo [[Focus Mode]].

> Tip: na telefonu otevřete \`[[odkaz]]\` **dlouhým stiskem**.
`;

  const wiki = `# Jak psát wikilinky

Odkazy mezi poznámkami:

\`\`\`
[[Název poznámky]]
[[Název poznámky|zobrazený text]]
\`\`\`

- autocomplete po napsání \`[[\`
- dlouhý stisk otevře poznámku
- pokud cíl neexistuje, Folio ho nabídne vytvořit
- panel **Links** ukáže backlinky

Související: [[Vítejte ve Folio]], [[Backlinky]].
`;

  const focus = `# Focus Mode

Focus Mode zesvětlí vše kromě aktuální věty.

Zapnete ho tlačítkem **Focus** (na širší obrazovce).

Další tipy: [[Vítejte ve Folio]].
`;

  const backlinks = `# Backlinky

Když jiná poznámka odkazuje sem přes \`[[Backlinky]]\`, objeví se v panelu **Links**.

Tato poznámka je odkazovaná z [[Jak psát wikilinky]].
`;

  await writeNote(`${WEB_LIBRARY_PATH}/Vítejte ve Folio.md`, welcome);
  await writeNote(`${WEB_LIBRARY_PATH}/Jak psát wikilinky.md`, wiki);
  await writeNote(`${WEB_LIBRARY_PATH}/Focus Mode.md`, focus);
  await writeNote(`${WEB_LIBRARY_PATH}/Backlinky.md`, backlinks);
  return `${WEB_LIBRARY_PATH}/Vítejte ve Folio.md`;
}
