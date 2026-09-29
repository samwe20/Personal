import DOMPurify from "dompurify";
import { Marked } from "marked";
import type { NoteIndex } from "./noteIndex";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderMarkdown(text: string, index: NoteIndex): string {
  // An inline tokenizer leaves fenced code, inline code and HTML attributes intact.
  const parser = new Marked({ gfm: true, breaks: true });
  parser.use({ extensions: [{
    name: "wikilink",
    level: "inline",
    start: (src) => src.indexOf("[["),
    tokenizer(src) {
      const match = /^\[\[([^\]|#\n]+)(?:\|([^\]\n]+))?\]\]/.exec(src);
      if (!match) return;
      return { type: "wikilink", raw: match[0], title: match[1].trim(), label: (match[2] ?? match[1]).trim() };
    },
    renderer(token) {
      const cls = index.resolve(token.title) ? "wiki-link" : "wiki-link missing";
      return `<a class="${cls}" href="#" data-wiki-title="${escape(token.title)}">${escape(token.label)}</a>`;
    },
  }] });
  return DOMPurify.sanitize(parser.parse(text) as string, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["style", "id", "name"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["data-wiki-title"],
  });
}
