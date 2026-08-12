import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  stat,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, dirname, documentDir, join } from "@tauri-apps/api/path";
import type { NoteMeta } from "../types";

const MD_EXT = /\.md$/i;

export function titleFromPath(path: string): string {
  const name = path.split(/[/\\]/).pop() ?? path;
  return name.replace(MD_EXT, "");
}

export function noteIdFromRelative(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(MD_EXT, "").toLowerCase();
}

export async function ensureDir(path: string): Promise<void> {
  if (!(await exists(path))) {
    await mkdir(path, { recursive: true });
  }
}

export async function getDefaultLibraryPath(): Promise<string> {
  // Prefer Documents so the library is visible in the iOS Files app / user folders.
  try {
    const docs = await documentDir();
    if (docs) return await join(docs, "Folio", "Library");
  } catch {
    /* fall through */
  }
  const root = await appDataDir();
  return await join(root, "Folio", "Library");
}

async function walkMarkdown(
  root: string,
  current: string,
  acc: NoteMeta[],
): Promise<void> {
  const entries = await readDir(current);
  for (const entry of entries) {
    const full = await join(current, entry.name);
    if (entry.isDirectory) {
      if (entry.name.startsWith(".")) continue;
      await walkMarkdown(root, full, acc);
      continue;
    }
    if (!MD_EXT.test(entry.name)) continue;
    const info = await stat(full);
    const relativePath = full
      .slice(root.length)
      .replace(/^[/\\]/, "")
      .replace(/\\/g, "/");
    acc.push({
      id: noteIdFromRelative(relativePath),
      title: titleFromPath(entry.name),
      path: full,
      relativePath,
      mtime: info.mtime ? Number(info.mtime) : Date.now(),
    });
  }
}

export async function listNotes(libraryPath: string): Promise<NoteMeta[]> {
  if (!(await exists(libraryPath))) return [];
  const notes: NoteMeta[] = [];
  await walkMarkdown(libraryPath, libraryPath, notes);
  notes.sort((a, b) => a.title.localeCompare(b.title, "cs", { sensitivity: "base" }));
  return notes;
}

export async function readNote(path: string): Promise<string> {
  return await readTextFile(path);
}

export async function writeNote(path: string, content: string): Promise<void> {
  const parent = await dirname(path);
  await ensureDir(parent);
  await writeTextFile(path, content);
}

export async function createNote(
  libraryPath: string,
  title: string,
  content = "",
): Promise<string> {
  const safe = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120) || "Bez názvu";

  let fileName = `${safe}.md`;
  let path = await join(libraryPath, fileName);
  let i = 2;
  while (await exists(path)) {
    fileName = `${safe} ${i}.md`;
    path = await join(libraryPath, fileName);
    i += 1;
  }
  await writeNote(path, content);
  return path;
}

export async function renameNote(oldPath: string, newTitle: string): Promise<string> {
  const dir = await dirname(oldPath);
  const safe = newTitle
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120) || "Bez názvu";
  let next = await join(dir, `${safe}.md`);
  if (next === oldPath) return oldPath;

  let i = 2;
  while ((await exists(next)) && next !== oldPath) {
    next = await join(dir, `${safe} ${i}.md`);
    i += 1;
  }
  await rename(oldPath, next);
  return next;
}

export async function deleteNote(path: string): Promise<void> {
  await remove(path);
}

export async function createDemoLibrary(libraryPath: string): Promise<string> {
  await ensureDir(libraryPath);

  const welcome = `---
title: Vítejte ve Folio
---

# Vítejte ve Folio

Folio je soustředěný markdown editor inspirovaný **iA Writer** — s propojenými poznámkami jako v Obsidianu.

## Začněte tady

1. Pište v čistém markdownu
2. Zapněte **Focus** a nechte zbytek textu ustoupit
3. Propojte myšlenky přes wikilinky

Zkuste otevřít [[Jak psát wikilinky]] nebo [[Focus Mode]].

> Tip: stiskněte \`Ctrl+P\` pro rychlé otevření poznámky.
`;

  const wiki = `# Jak psát wikilinky

Odkazy mezi poznámkami píšete stejně jako v Obsidianu:

\`\`\`
[[Název poznámky]]
[[Název poznámky|zobrazený text]]
\`\`\`

## Co Folio umí

- autocomplete po napsání \`[[\`
- kliknutím otevřete existující poznámku
- pokud cíl neexistuje, Folio ho nabídne vytvořit
- panel **Backlinky** ukáže, kdo odkazuje sem

Související: [[Vítejte ve Folio]], [[Backlinky]].
`;

  const focus = `# Focus Mode

Focus Mode zesvětlí vše kromě aktuální věty. Je to stejná logika jako u iA Writeru — pomáhá držet pozornost při dlouhém psaní.

Zapnete ho tlačítkem **Focus** nebo zkratkou \`Ctrl+D\`.

Typewriter scrolling drží kurzor uprostřed plochy — hodí se při delších textech.

Další tipy najdete v [[Vítejte ve Folio]].
`;

  const backlinks = `# Backlinky

Backlink je zpětný odkaz: když poznámka A obsahuje odkaz na tuto stránku, Folio ho sem vypíše automaticky.

Folio indexuje celou knihovnu a panel vpravo živě aktualizuje:

- **Backlinky** — kdo odkazuje na aktuální poznámku
- **Odchozí odkazy** — kam odkazujete vy

Tato poznámka je odkazovaná z [[Jak psát wikilinky]].
`;

  await writeNote(await join(libraryPath, "Vítejte ve Folio.md"), welcome);
  await writeNote(await join(libraryPath, "Jak psát wikilinky.md"), wiki);
  await writeNote(await join(libraryPath, "Focus Mode.md"), focus);
  await writeNote(await join(libraryPath, "Backlinky.md"), backlinks);

  return await join(libraryPath, "Vítejte ve Folio.md");
}

export { join };
