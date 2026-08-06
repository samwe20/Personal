import type { NoteMeta, WikiTarget } from "../types";

const WIKI_RE = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;

export function parseWikiTargets(text: string): WikiTarget[] {
  const out: WikiTarget[] = [];
  for (const match of text.matchAll(WIKI_RE)) {
    const title = match[1]?.trim();
    if (!title) continue;
    out.push({
      raw: match[0],
      title,
      alias: match[2]?.trim(),
    });
  }
  return out;
}

export function normalizeTitle(title: string): string {
  return title.trim().replace(/\\/g, "/").replace(/\.md$/i, "").toLowerCase();
}

export class NoteIndex {
  private notes: NoteMeta[] = [];
  private byId = new Map<string, NoteMeta>();
  private byTitle = new Map<string, NoteMeta>();
  private content = new Map<string, string>();
  private outgoing = new Map<string, Set<string>>();
  private incoming = new Map<string, Set<string>>();

  setNotes(notes: NoteMeta[]) {
    this.notes = notes;
    this.byId.clear();
    this.byTitle.clear();
    for (const note of notes) {
      this.byId.set(note.id, note);
      this.byTitle.set(normalizeTitle(note.title), note);
      this.byTitle.set(normalizeTitle(note.relativePath), note);
    }
  }

  getNotes() {
    return this.notes;
  }

  getNoteByPath(path: string) {
    return this.notes.find((n) => n.path === path) ?? null;
  }

  resolve(title: string): NoteMeta | null {
    const key = normalizeTitle(title);
    return this.byTitle.get(key) ?? this.byId.get(key) ?? null;
  }

  setContent(path: string, text: string) {
    const note = this.getNoteByPath(path);
    if (!note) return;
    this.content.set(note.id, text);
    this.recomputeLinksFor(note.id, text);
  }

  removeNote(path: string) {
    const note = this.getNoteByPath(path);
    if (!note) return;
    this.content.delete(note.id);
    this.outgoing.delete(note.id);
    for (const [, set] of this.incoming) set.delete(note.id);
    this.incoming.delete(note.id);
  }

  private recomputeLinksFor(noteId: string, text: string) {
    const prev = this.outgoing.get(noteId) ?? new Set();
    for (const target of prev) {
      this.incoming.get(target)?.delete(noteId);
    }

    const next = new Set<string>();
    for (const link of parseWikiTargets(text)) {
      const targetId = normalizeTitle(link.title);
      next.add(targetId);
      if (!this.incoming.has(targetId)) this.incoming.set(targetId, new Set());
      this.incoming.get(targetId)!.add(noteId);
    }
    this.outgoing.set(noteId, next);
  }

  getBacklinks(path: string): NoteMeta[] {
    const note = this.getNoteByPath(path);
    if (!note) return [];
    const keys = new Set([note.id, normalizeTitle(note.title), normalizeTitle(note.relativePath)]);
    const ids = new Set<string>();
    for (const key of keys) {
      for (const id of this.incoming.get(key) ?? []) ids.add(id);
    }
    return [...ids]
      .map((id) => this.byId.get(id))
      .filter((n): n is NoteMeta => Boolean(n))
      .sort((a, b) => a.title.localeCompare(b.title, "cs"));
  }

  getOutgoing(path: string): { title: string; note: NoteMeta | null }[] {
    const note = this.getNoteByPath(path);
    if (!note) return [];
    const text = this.content.get(note.id) ?? "";
    const seen = new Set<string>();
    const out: { title: string; note: NoteMeta | null }[] = [];
    for (const link of parseWikiTargets(text)) {
      const key = normalizeTitle(link.title);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ title: link.title, note: this.resolve(link.title) });
    }
    return out;
  }

  search(query: string, limit = 12): NoteMeta[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.notes.slice(0, limit);
    return this.notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.relativePath.toLowerCase().includes(q))
      .slice(0, limit);
  }

  suggestTitles(query: string, limit = 8): string[] {
    const q = query.trim().toLowerCase();
    const titles = this.notes.map((n) => n.title);
    if (!q) return titles.slice(0, limit);
    return titles.filter((t) => t.toLowerCase().includes(q)).slice(0, limit);
  }
}
