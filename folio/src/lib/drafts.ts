// A synchronous recovery journal covers tab closure before the async save commits.
const PREFIX = "folio.draft.v1:";
export function rememberDraft(path: string, text: string): boolean {
  try { localStorage.setItem(PREFIX + path, text); return true; } catch { return false; }
}
export function readDraft(path: string): string | null {
  try { return localStorage.getItem(PREFIX + path); } catch { return null; }
}
export function forgetDraft(path: string, savedText?: string): void {
  try {
    if (savedText === undefined || readDraft(path) === savedText) localStorage.removeItem(PREFIX + path);
  } catch { /* The normal file/database save still remains available. */ }
}
