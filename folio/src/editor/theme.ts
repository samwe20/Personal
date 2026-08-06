import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export function createEditorTheme(theme: "light" | "dark") {
  const isDark = theme === "dark";
  const ink = isDark ? "#EDEDEB" : "#1C1C1A";
  const muted = isDark ? "rgba(237,237,235,0.34)" : "rgba(28,28,26,0.32)";
  const faint = isDark ? "rgba(237,237,235,0.18)" : "rgba(28,28,26,0.16)";
  const accent = isDark ? "#8AB4FF" : "#2F62D6";
  const selection = isDark ? "rgba(138,180,255,0.28)" : "rgba(47,98,214,0.16)";
  const codeBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(28,28,26,0.04)";

  const baseTheme = EditorView.theme(
    {
      "&": {
        backgroundColor: "transparent",
        color: ink,
        fontSize: "19px",
        height: "100%",
      },
      ".cm-scroller": {
        fontFamily: "var(--font-body)",
        lineHeight: "1.75",
        fontWeight: "400",
        letterSpacing: "0.005em",
        padding: "2.5rem 0 8rem",
        transition: "padding 180ms ease",
      },
      ".cm-content": {
        maxWidth: "42rem",
        margin: "0 auto",
        padding: "0 1.5rem",
        caretColor: accent,
      },
      ".cm-line": {
        padding: "0",
      },
      "&.cm-focused": {
        outline: "none",
      },
      ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
        background: selection,
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: accent,
        borderLeftWidth: "2px",
      },
      ".cm-activeLine": {
        backgroundColor: "transparent",
      },
      ".cm-gutters": {
        display: "none",
      },
      ".cm-tooltip": {
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: "var(--ink)",
        borderRadius: "12px",
        boxShadow: "var(--shadow)",
        fontFamily: "var(--font-ui)",
        fontSize: "13px",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        padding: "6px 10px",
        borderRadius: "8px",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
        background: selection,
        color: ink,
      },
      ".cm-md-mark": {
        color: muted,
      },
      ".cm-wiki-link": {
        color: accent,
        textDecoration: "underline",
        textDecorationColor: isDark ? "rgba(138,180,255,0.45)" : "rgba(47,98,214,0.35)",
        textUnderlineOffset: "0.18em",
        cursor: "pointer",
      },
      ".cm-wiki-link.missing": {
        color: isDark ? "#F0B27A" : "#B86B2B",
        textDecorationStyle: "dotted",
      },
      ".cm-focus-dim": {
        color: faint,
        transition: "color 120ms ease",
      },
      ".cm-inline-code": {
        fontFamily: "var(--font-mono)",
        fontSize: "0.9em",
        background: codeBg,
        borderRadius: "5px",
        padding: "0.08em 0.28em",
      },
    },
    { dark: isDark },
  );

  const highlight = HighlightStyle.define([
    { tag: tags.heading1, fontWeight: "650", fontSize: "1.7em", fontFamily: "var(--font-ui)" },
    { tag: tags.heading2, fontWeight: "650", fontSize: "1.35em", fontFamily: "var(--font-ui)" },
    { tag: tags.heading3, fontWeight: "600", fontSize: "1.15em", fontFamily: "var(--font-ui)" },
    { tag: tags.heading4, fontWeight: "600", fontFamily: "var(--font-ui)" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "700" },
    { tag: tags.strikethrough, textDecoration: "line-through", color: muted },
    { tag: tags.link, color: accent },
    { tag: tags.url, color: muted },
    { tag: tags.monospace, fontFamily: "var(--font-mono)", fontSize: "0.92em" },
    { tag: tags.quote, color: muted, fontStyle: "italic" },
    { tag: tags.meta, color: muted },
    { tag: tags.processingInstruction, color: muted },
    { tag: tags.punctuation, color: muted },
    { tag: tags.contentSeparator, color: muted },
  ]);

  return [baseTheme, syntaxHighlighting(highlight)];
}
