import type { AppSettings, NoteMeta } from "../types";

const collator = new Intl.Collator("cs", { sensitivity: "base", numeric: true });

export function sortNotes(notes: NoteMeta[], settings: Pick<AppSettings, "sortBy" | "sortDirection">): NoteMeta[] {
  const direction = settings.sortDirection === "desc" ? -1 : 1;
  return [...notes].sort((a, b) => {
    if (settings.sortBy === "createdAt") {
      // Unknown creation dates stay last in either direction.
      if (a.createdAt === null && b.createdAt !== null) return 1;
      if (b.createdAt === null && a.createdAt !== null) return -1;
      if (a.createdAt !== null && b.createdAt !== null && a.createdAt !== b.createdAt) {
        return (a.createdAt - b.createdAt) * direction;
      }
    }
    return (collator.compare(a.title, b.title) || collator.compare(a.relativePath, b.relativePath)) * direction;
  });
}
