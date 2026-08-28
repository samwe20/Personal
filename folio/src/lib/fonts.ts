export type EditorFontId =
  | "literata"
  | "jakarta"
  | "georgia"
  | "segoe"
  | "mono";

export interface EditorFontOption {
  id: EditorFontId;
  label: string;
  css: string;
}

export const EDITOR_FONTS: EditorFontOption[] = [
  {
    id: "literata",
    label: "Literata",
    css: '"Literata Variable", Literata, "Iowan Old Style", Georgia, serif',
  },
  {
    id: "jakarta",
    label: "Plus Jakarta",
    css: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", "Segoe UI", sans-serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    css: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    id: "segoe",
    label: "Segoe UI",
    css: '"Segoe UI", system-ui, -apple-system, sans-serif',
  },
  {
    id: "mono",
    label: "JetBrains Mono",
    css: '"JetBrains Mono", "Cascadia Mono", Consolas, monospace',
  },
];

export function fontCss(id: EditorFontId): string {
  return EDITOR_FONTS.find((f) => f.id === id)?.css ?? EDITOR_FONTS[0].css;
}
