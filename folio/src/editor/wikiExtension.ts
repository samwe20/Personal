import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { NoteIndex, stripCodeForLinks } from "../lib/noteIndex";
import { isTouchPrimary } from "../lib/platform";

export type WikiOpenHandler = (title: string, createIfMissing: boolean) => void;

const WIKI_RE = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;
const LONG_PRESS_MS = 420;

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

function selectionTouches(from: number, to: number, selFrom: number, selTo: number) {
  return selFrom <= to && selTo >= from;
}

function buildWikiDecorations(view: EditorView, index: NoteIndex): DecorationSet {
  const touch = isTouchPrimary();
  const builder = new RangeSetBuilder<Decoration>();
  const sel = view.state.selection.main;
  const action = touch ? "Dlouhý stisk" : "Dvojklik";

  for (const { from, to } of view.visibleRanges) {
    const raw = view.state.doc.sliceString(from, to);
    const text = stripCodeForLinks(raw);
    WIKI_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKI_RE.exec(text))) {
      const title = match[1].trim();
      const alias = match[2]?.trim();
      const start = from + match.index;
      const end = start + match[0].length;
      const missing = !index.resolve(title);
      const editing = selectionTouches(start, end, sel.from, sel.to);
      const tip = missing
        ? `${action}: vytvořit „${title}“`
        : `${action}: otevřít „${title}“`;

      if (editing) {
        // While editing, show raw [[...]] but keep link coloring.
        builder.add(
          start,
          end,
          Decoration.mark({
            class: `cm-wiki-link editing${missing ? " missing" : ""}`,
            attributes: { "data-wiki-title": title, title: tip },
          }),
        );
        continue;
      }

      // Hide [[ brackets
      builder.add(start, start + 2, Decoration.replace({}));

      if (alias) {
        // [[title|alias]] → hide title + pipe, show alias only
        const pipeAt = match[0].indexOf("|");
        builder.add(start + 2, start + pipeAt + 1, Decoration.replace({}));
        builder.add(
          start + pipeAt + 1,
          end - 2,
          Decoration.mark({
            class: `cm-wiki-link${missing ? " missing" : ""}`,
            attributes: { "data-wiki-title": title, title: tip },
          }),
        );
      } else {
        builder.add(
          start + 2,
          end - 2,
          Decoration.mark({
            class: `cm-wiki-link${missing ? " missing" : ""}`,
            attributes: { "data-wiki-title": title, title: tip },
          }),
        );
      }

      // Hide ]] brackets
      builder.add(end - 2, end, Decoration.replace({}));
    }
  }
  return builder.finish();
}

function linkAt(view: EditorView, pos: number): { title: string; from: number; to: number } | null {
  const line = view.state.doc.lineAt(pos);
  const text = stripCodeForLinks(line.text);
  WIKI_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKI_RE.exec(text))) {
    const from = line.from + match.index;
    const to = from + match[0].length;
    if (pos >= from && pos <= to) {
      return { title: match[1].trim(), from, to };
    }
  }
  return null;
}

export function wikiExtension(index: NoteIndex, onOpen: WikiOpenHandler): Extension {
  let pressTimer: number | null = null;
  let pressTitle: string | null = null;

  const clearPress = () => {
    if (pressTimer != null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
    pressTitle = null;
  };

  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildWikiDecorations(view, index);
      }
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          update.transactions.some((tr) => tr.reconfigured)
        ) {
          this.decorations = buildWikiDecorations(update.view, index);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        dblclick(event, view) {
          if (isTouchPrimary()) return false;
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos == null) return false;
          const link = linkAt(view, pos);
          if (!link) return false;
          event.preventDefault();
          onOpen(link.title, true);
          return true;
        },
        touchstart(event, view) {
          if (!isTouchPrimary()) return false;
          const touch = event.changedTouches[0];
          if (!touch) return false;
          const pos = view.posAtCoords({ x: touch.clientX, y: touch.clientY });
          if (pos == null) return false;
          const link = linkAt(view, pos);
          if (!link) return false;
          pressTitle = link.title;
          pressTimer = window.setTimeout(() => {
            if (pressTitle) {
              onOpen(pressTitle, true);
              pressTitle = null;
            }
            pressTimer = null;
          }, LONG_PRESS_MS);
          return false;
        },
        touchmove() {
          clearPress();
          return false;
        },
        touchend() {
          clearPress();
          return false;
        },
        touchcancel() {
          clearPress();
          return false;
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
