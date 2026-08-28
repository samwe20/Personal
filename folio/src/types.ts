import type { EditorFontId } from "./lib/fonts";

export interface NoteMeta {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  mtime: number;
}

export interface AppSettings {
  libraryPath: string | null;
  theme: "light" | "dark";
  focusMode: boolean;
  typewriter: boolean;
  showBacklinks: boolean;
  lastOpenPath: string | null;
  editorFont: EditorFontId;
}

export interface WikiTarget {
  raw: string;
  title: string;
  alias?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  libraryPath: null,
  theme: "light",
  focusMode: false,
  typewriter: false,
  showBacklinks: true,
  lastOpenPath: null,
  editorFont: "literata",
};
