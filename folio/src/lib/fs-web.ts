import type { NoteMeta } from "../types";
import { noteIdFromRelative, titleFromPath } from "./paths";
import { safeNoteTitle } from "./names";
import { WEB_LIBRARY_PATH } from "./runtime";

const DB_NAME = "folio-notes";
const STORE = "notes";
let connection: Promise<IDBDatabase> | undefined;
export interface WebNoteRecord { path: string; title: string; content: string; mtime: number; }

function openDb(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "path" });
      req.onsuccess = () => {
        req.result.onversionchange = () => { req.result.close(); connection = undefined; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
      req.onblocked = () => reject(new Error("Zavřete ostatní okna Folia a zkuste to znovu."));
    }).catch(error => { connection = undefined; throw error; });
  }
  return connection;
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let value: T;
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(tx.error ?? new Error("Uložení bylo přerušeno."));
    tx.onerror = () => { /* onabort reports failure after rollback */ };
    try { operation(tx.objectStore(STORE), result => { value = result; }); }
    catch (error) { tx.abort(); reject(error); }
  });
}

function relativeOf(path: string) {
  return path.startsWith(WEB_LIBRARY_PATH + "/") ? path.slice(WEB_LIBRARY_PATH.length + 1) : path.replace(/^\/+/, "");
}
function record(path: string, content: string): WebNoteRecord {
  return { path, title: titleFromPath(path), content, mtime: Date.now() };
}
function freeName(store: IDBObjectStore, safe: string, use: (name: string) => void, oldPath?: string) {
  const req = store.getAllKeys();
  req.onsuccess = () => {
    const taken = new Set(req.result.filter(key => key !== oldPath).map(key => String(key).toLowerCase()));
    let candidate = safe + ".md";
    let suffix = 2;
    while (taken.has(candidate.toLowerCase())) candidate = safe + " " + suffix++ + ".md";
    use(candidate);
  };
}
export async function getDefaultLibraryPath() { return WEB_LIBRARY_PATH; }
export async function listNotes(_libraryPath: string): Promise<NoteMeta[]> {
  const records = await transaction<WebNoteRecord[]>("readonly", (store, done) => {
    const req = store.getAll(); req.onsuccess = () => done(req.result);
  });
  return records.map(r => ({ id: noteIdFromRelative(r.path), title: r.title, path: WEB_LIBRARY_PATH + "/" + r.path, relativePath: r.path, mtime: r.mtime }))
    .sort((a,b) => a.title.localeCompare(b.title, "cs", { sensitivity: "base" }));
}
export async function readNote(path: string): Promise<string> {
  const found = await transaction<WebNoteRecord | undefined>("readonly", (store, done) => {
    const req = store.get(relativeOf(path)); req.onsuccess = () => done(req.result);
  });
  if (!found) throw new Error("Note not found: " + path);
  return found.content;
}
export async function writeNote(path: string, content: string): Promise<void> {
  await transaction<void>("readwrite", store => { store.put(record(relativeOf(path), content)); });
}
export async function createNote(_libraryPath: string, title: string, content = ""): Promise<string> {
  return transaction<string>("readwrite", (store, done) => {
    freeName(store, safeNoteTitle(title), name => { store.add(record(name, content)); done(WEB_LIBRARY_PATH + "/" + name); });
  });
}
export async function renameNote(oldPath: string, newTitle: string): Promise<string> {
  const oldRel = relativeOf(oldPath);
  return transaction<string>("readwrite", (store, done) => {
    const req = store.get(oldRel);
    req.onsuccess = () => {
      if (!req.result) { store.transaction.abort(); return; }
      const parent = oldRel.includes("/") ? oldRel.slice(0, oldRel.lastIndexOf("/") + 1) : "";
      freeName(store, parent + safeNoteTitle(newTitle), name => {
        if (name !== oldRel) {
          store.add(record(name, req.result.content));
          store.delete(oldRel);
        }
        done(WEB_LIBRARY_PATH + "/" + name);
      }, oldRel);
    };
  });
}
export async function deleteNote(path: string): Promise<void> {
  await transaction<void>("readwrite", store => { store.delete(relativeOf(path)); });
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

Focus Mode spustí immersivní psaní:
- zachová vaše nastavení Typewriteru
- fullscreen
- skryje UI (zůstane **Opustit Focus**)

Zapnete ho tlačítkem **Focus** (na širší obrazovce) nebo \`Ctrl+D\`. Esc režim ukončí.

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
