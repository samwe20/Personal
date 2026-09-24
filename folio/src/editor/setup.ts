import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorState } from "@codemirror/state";
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
  setReadOnly: (enabled: boolean) => void;
  getText: () => string;
  focus: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setFocusMode: (enabled: boolean) => void;
  setTypewriter: (enabled: boolean) => void;
  reconfigureWiki: () => void;
  destroy: () => void;
}

function centerCursor(view: EditorView) {
  // CodeMirror measures and scrolls after layout, keeping its cursor layer aligned.
  view.dispatch({ effects: EditorView.scrollIntoView(view.state.selection.main.head, { y: "center" }) });
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
  let centering = false;
  let centerFrame: number | null = null;
  let readOnly = false;
  const cancelCenter = () => {
    if (centerFrame !== null) cancelAnimationFrame(centerFrame);
    centerFrame = null;
  };
  const scheduleCenter = (view: EditorView) => {
    if (centerFrame !== null || centering) return;
    centerFrame = requestAnimationFrame(() => {
      centerFrame = null;
      if (!typewriterOn) return;
      centering = true;
      try {
        centerCursor(view);
      } finally {
        centering = false;
      }
    });
  };
  const themeConfig = new Compartment();
  const wikiConfig = new Compartment();
  const editableConfig = new Compartment();
  const editable = () => [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];

  const buildExtensions = () => [
    history(),
    drawSelection(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage }),
    placeholder("Začněte psát…  [[odkaz]] propojí poznámky"),
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
    themeConfig.of(createEditorTheme(currentTheme)),
    editableConfig.of(editable()),
    focusExtension(),
    wikiConfig.of(wikiExtension(index, hooks.onOpenWiki)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) hooks.onChange(update.state.doc.toString());
      if (!typewriterOn || centering) return;
      if (!update.selectionSet && !update.docChanged && !update.geometryChanged) return;

      scheduleCenter(update.view);
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

  return {
    view,
    setText(text) {
      // Loading a document must never be an undoable edit to another document.
      view.setState(EditorState.create({ doc: text, extensions: buildExtensions() }));
      setFocusMode(view, focusOn);
      view.scrollDOM.scrollTop = 0;
    },
    setReadOnly(enabled) {
      readOnly = enabled;
      view.dispatch({ effects: editableConfig.reconfigure(editable()) });
    },
    getText() {
      return view.state.doc.toString();
    },
    focus() {
      view.focus();
    },
    setTheme(next) {
      currentTheme = next;
      view.dispatch({ effects: themeConfig.reconfigure(createEditorTheme(next)) });
    },
    setFocusMode(enabled) {
      focusOn = enabled;
      setFocusMode(view, enabled);
    },
    setTypewriter(enabled) {
      typewriterOn = enabled;
      document.getElementById("app")?.classList.toggle("typewriter-on", enabled);
      if (enabled) {
        scheduleCenter(view);
      } else {
        cancelCenter();
      }
    },
    reconfigureWiki() {
      view.dispatch({ effects: wikiConfig.reconfigure(wikiExtension(index, hooks.onOpenWiki)) });
    },
    destroy() {
      cancelCenter();
      view.destroy();
    },
  };
}
