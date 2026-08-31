import { Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

const setFocusEnabled = StateEffect.define<boolean>();

export const focusEnabledField = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setFocusEnabled)) return effect.value;
    }
    return value;
  },
});

export function setFocusMode(view: EditorView, enabled: boolean) {
  view.dispatch({ effects: setFocusEnabled.of(enabled) });
}

function sentenceRanges(text: string, lineFrom: number): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      const end = i + 1;
      if (end > start) ranges.push({ from: lineFrom + start, to: lineFrom + end });
      start = end;
    }
  }
  if (start < text.length) ranges.push({ from: lineFrom + start, to: lineFrom + text.length });
  if (!ranges.length) ranges.push({ from: lineFrom, to: lineFrom + text.length });
  return ranges;
}

function buildFocusDecorations(view: EditorView): DecorationSet {
  if (!view.state.field(focusEnabledField)) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const head = view.state.selection.main.head;
  const dim = Decoration.mark({ class: "cm-focus-dim" });

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const ranges = sentenceRanges(line.text, line.from);
      let active = ranges.find((r) => head >= r.from && head <= r.to) ?? null;
      if (!active && head >= line.from && head <= line.to) {
        active = { from: line.from, to: line.to };
      }

      for (const range of ranges) {
        if (!active || range.from !== active.from || range.to !== active.to) {
          if (range.to > range.from) builder.add(range.from, range.to, dim);
        }
      }

      pos = line.to + 1;
      if (line.to >= view.state.doc.length) break;
    }
  }

  return builder.finish();
}

const focusPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildFocusDecorations(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        update.transactions.some((tr) => tr.effects.some((e) => e.is(setFocusEnabled)))
      ) {
        this.decorations = buildFocusDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

export function focusExtension(): Extension {
  return [focusEnabledField, focusPlugin];
}
