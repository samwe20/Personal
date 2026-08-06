import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  placeholder,
} from "@codemirror/view";
import type { NoteIndex } from "../lib/noteIndex";
import { focusExtension, setFocusMode } from "./focusExtension";
import { createEditorTheme } from "./theme";
import { wikiExtension, WikiOpenHandler } from "./wikiExtension";

export interface EditorHooks {
  onChange: (text: string) => void;
  onOpenWiki: WikiOpenHandler;
}

export interface FolioEditor {
  view: EditorView;
  setText: (text: string) => void;
  getText: () => string;
  focus: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setFocusMode: (enabled: boolean) => void;
  setTypewriter: (enabled: boolean) => void;
  reconfigureWiki: () => void;
  destroy: () => void;
}

export function createEditor(
  parent: HTMLElement,
  index: NoteIndex,
  hooks: EditorHooks,
  theme: "light" | "dark" = "light",
): FolioEditor {
  let currentTheme = theme;
  let typewriterOn = false;
  let focusOn = false;

  const buildExtensions = () => [
    history(),
    drawSelection(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage }),
    placeholder("Začněte psát…  [[odkaz]] propojí poznámky"),
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
    createEditorTheme(currentTheme),
    focusExtension(),
    wikiExtension(index, hooks.onOpenWiki),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) hooks.onChange(update.state.doc.toString());
      if (!typewriterOn || !update.selectionSet) return;
      const head = update.state.selection.main.head;
      // Defer so we don't re-enter the current update cycle.
      requestAnimationFrame(() => {
        update.view.dispatch({
          effects: EditorView.scrollIntoView(head, { y: "center" }),
        });
      });
    }),
    EditorView.lineWrapping,
  ];

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: "",
      extensions: buildExtensions(),
    }),
  });

  const reconfigure = () => {
    const doc = view.state.doc;
    const selection = view.state.selection;
    view.setState(
      EditorState.create({
        doc,
        selection,
        extensions: buildExtensions(),
      }),
    );
    setFocusMode(view, focusOn);
  };

  return {
    view,
    setText(text) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    },
    getText() {
      return view.state.doc.toString();
    },
    focus() {
      view.focus();
    },
    setTheme(next) {
      currentTheme = next;
      reconfigure();
    },
    setFocusMode(enabled) {
      focusOn = enabled;
      setFocusMode(view, enabled);
    },
    setTypewriter(enabled) {
      typewriterOn = enabled;
    },
    reconfigureWiki() {
      reconfigure();
    },
    destroy() {
      view.destroy();
    },
  };
}
