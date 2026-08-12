import type { NoteMeta } from "../types";
import * as web from "./fs-web";
import { isTauri } from "./runtime";

export { titleFromPath, noteIdFromRelative } from "./paths";
export { WEB_LIBRARY_PATH } from "./runtime";

async function tauri() {
  return import("./fs-tauri");
}

export async function getDefaultLibraryPath(): Promise<string> {
  if (!isTauri()) return web.getDefaultLibraryPath();
  return (await tauri()).getDefaultLibraryPath();
}

export async function listNotes(libraryPath: string): Promise<NoteMeta[]> {
  if (!isTauri()) return web.listNotes(libraryPath);
  return (await tauri()).listNotes(libraryPath);
}

export async function readNote(path: string): Promise<string> {
  if (!isTauri()) return web.readNote(path);
  return (await tauri()).readNote(path);
}

export async function writeNote(path: string, content: string): Promise<void> {
  if (!isTauri()) return web.writeNote(path, content);
  return (await tauri()).writeNote(path, content);
}

export async function createNote(
  libraryPath: string,
  title: string,
  content = "",
): Promise<string> {
  if (!isTauri()) return web.createNote(libraryPath, title, content);
  return (await tauri()).createNote(libraryPath, title, content);
}

export async function renameNote(oldPath: string, newTitle: string): Promise<string> {
  if (!isTauri()) return web.renameNote(oldPath, newTitle);
  return (await tauri()).renameNote(oldPath, newTitle);
}

export async function deleteNote(path: string): Promise<void> {
  if (!isTauri()) return web.deleteNote(path);
  return (await tauri()).deleteNote(path);
}

export async function createDemoLibrary(libraryPath: string): Promise<string> {
  if (!isTauri()) return web.createDemoLibrary(libraryPath);
  return (await tauri()).createDemoLibrary(libraryPath);
}

export async function join(...parts: string[]): Promise<string> {
  if (!isTauri()) return parts.join("/").replace(/\/+/g, "/");
  return (await tauri()).join(...parts);
}
