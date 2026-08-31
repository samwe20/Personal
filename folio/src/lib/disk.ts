import { strToU8, zipSync } from "fflate";
import { listNotes, readNote, writeNote } from "./fs";
import { WEB_LIBRARY_PATH } from "./runtime";

export async function buildLibraryZip(libraryPath: string): Promise<Blob> {
  const notes = await listNotes(libraryPath);
  const files: Record<string, Uint8Array> = {};

  for (const note of notes) {
    const content = await readNote(note.path);
    const name = note.relativePath.replace(/\\/g, "/");
    files[name.endsWith(".md") ? name : `${name}.md`] = strToU8(content);
  }

  if (!Object.keys(files).length) {
    files["README.md"] = strToU8("# Folio\n\nKnihovna je zatím prázdná.\n");
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportLibraryToDisk(libraryPath: string): Promise<"shared" | "downloaded"> {
  const blob = await buildLibraryZip(libraryPath);
  const filename = `folio-library-${new Date().toISOString().slice(0, 10)}.zip`;
  const file = new File([blob], filename, { type: "application/zip" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "Folio knihovna",
        text: "Export poznámek z Folio",
      });
      return "shared";
    } catch (error) {
      // User cancelled share sheet — don't also force a download.
      if ((error as DOMException)?.name === "AbortError") throw error;
    }
  }

  triggerDownload(blob, filename);
  return "downloaded";
}

export async function exportNoteToDisk(path: string, title: string): Promise<"shared" | "downloaded"> {
  const content = await readNote(path);
  const filename = `${title || "poznamka"}.md`;
  const file = new File([content], filename, { type: "text/markdown" });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return "shared";
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") throw error;
    }
  }

  triggerDownload(new Blob([content], { type: "text/markdown" }), filename);
  return "downloaded";
}

export async function importMarkdownFiles(
  fileList: FileList | File[],
  libraryPath = WEB_LIBRARY_PATH,
): Promise<string[]> {
  const imported: string[] = [];
  const files = Array.from(fileList).filter((f) => /\.md$/i.test(f.name) || f.type.startsWith("text/"));

  for (const file of files) {
    const text = await file.text();
    const safeName = file.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "import.md";
    const path = `${libraryPath}/${safeName.endsWith(".md") ? safeName : `${safeName}.md`}`;
    await writeNote(path, text);
    imported.push(path);
  }
  return imported;
}

export function canUseDirectoryPicker(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function saveLibraryToDirectory(libraryPath: string): Promise<number> {
  if (!canUseDirectoryPicker()) {
    throw new Error("Tento prohlížeč neumí přímý zápis do složky.");
  }

  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  const dir = await picker({ mode: "readwrite" });

  const notes = await listNotes(libraryPath);
  let count = 0;
  for (const note of notes) {
    const content = await readNote(note.path);
    const name = (note.relativePath.split("/").pop() || `${note.title}.md`).replace(/[\\/]/g, "-");
    const handle = await dir.getFileHandle(name.endsWith(".md") ? name : `${name}.md`, {
      create: true,
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    count += 1;
  }
  return count;
}
