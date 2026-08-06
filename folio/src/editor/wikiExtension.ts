import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import type { NoteIndex } from "../lib/noteIndex";

export type WikiOpenHandler = (title: string, createIfMissing: boolean) => void;

const WIKI_RE = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;

function wikiCompletions(index: NoteIndex) {
  return (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\[\[([^\]]*)/);
    if (!match) return null;
    if (match.from === match.to && !context.explicit) return null;

    const query = match.text.slice(2);
    const options = index.suggestTitles(query).map((title) => ({
      label: title,
      type: "text" as const,
      apply: `${title}]]`,
    }));

    if (!options.length && query.trim()) {
      options.push({
        label: `Vytvořit „${query.trim()}“`,
        type: "text",
        apply: `${query.trim()}]]`,
      });
    }

    return {
      from: match.from + 2,
      options,
      validFor: /^[^[\]]*$/,
    };
  };
}

function buildWikiDecorations(view: EditorView, index: NoteIndex): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    WIKI_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKI_RE.exec(text))) {
      const title = match[1].trim();
      const start = from + match.index;
      const end = start + match[0].length;
      const missing = !index.resolve(title);
      builder.add(
        start,
        end,
        Decoration.mark({
          class: `cm-wiki-link${missing ? " missing" : ""}`,
          attributes: {
            "data-wiki-title": title,
            title: missing ? `Vytvořit „${title}“` : `Otevřít „${title}“`,
          },
        }),
      );
    }
  }
  return builder.finish();
}

function linkAt(view: EditorView, pos: number): { title: string; from: number; to: number } | null {
  const line = view.state.doc.lineAt(pos);
  WIKI_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKI_RE.exec(line.text))) {
    const from = line.from + match.index;
    const to = from + match[0].length;
    if (pos >= from && pos <= to) {
      return { title: match[1].trim(), from, to };
    }
  }
  return null;
}

export function wikiExtension(index: NoteIndex, onOpen: WikiOpenHandler): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildWikiDecorations(view, index);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildWikiDecorations(update.view, index);
        } else {
          // Refresh when index may have changed via external reconfigure
          this.decorations = buildWikiDecorations(update.view, index);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        click(event, view) {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos == null) return false;
          const link = linkAt(view, pos);
          if (!link) return false;
          // Click on wiki link opens; Alt+click forces create prompt path
          event.preventDefault();
          onOpen(link.title, true);
          return true;
        },
      },
    },
  );

  return [
    plugin,
    autocompletion({
      override: [wikiCompletions(index)],
      activateOnTyping: true,
      defaultKeymap: true,
    }),
  ];
}

export function refreshWikiDecorations(view: EditorView) {
  view.dispatch({});
}
