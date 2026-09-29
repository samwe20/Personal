/** A portable filename that can be moved between Windows, macOS and the web. */
export function safeNoteTitle(title: string): string {
  let safe = title.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ").slice(0, 120).replace(/[. ]+$/, "");
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) safe = `_${safe}`;
  return safe || "Bez názvu";
}
