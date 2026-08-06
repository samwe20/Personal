import { open } from "@tauri-apps/plugin-dialog";
import { marked } from "marked";
import { createEditor, FolioEditor } from "./editor/setup";
import {
  createDemoLibrary,
  createNote,
  deleteNote,
  getDefaultLibraryPath,
  listNotes,
  readNote,
  renameNote,
  writeNote,
} from "./lib/fs";
import { NoteIndex } from "./lib/noteIndex";
import { loadSettings, saveSettings } from "./lib/settings";
import type { AppSettings, NoteMeta } from "./types";

marked.setOptions({ gfm: true, breaks: true });

export class FolioApp {
  private settings!: AppSettings;
  private notes: NoteMeta[] = [];
  private current: NoteMeta | null = null;
  private editor!: FolioEditor;
  private index = new NoteIndex();
  private saveTimer: number | null = null;
  private dirty = false;
  private suppressChange = false;
  private previewOn = false;
  private commandIndex = 0;
  private commandItems: NoteMeta[] = [];

  private els = {
    app: document.getElementById("app")!,
    sidebar: document.getElementById("sidebar")!,
    noteList: document.getElementById("note-list")!,
    libraryPath: document.getElementById("library-path")!,
    titleInput: document.getElementById("note-title") as HTMLInputElement,
    editorRoot: document.getElementById("editor-root")!,
    previewRoot: document.getElementById("preview-root")!,
    backlinksPane: document.getElementById("backlinks-pane")!,
    backlinksList: document.getElementById("backlinks-list")!,
    outgoingList: document.getElementById("outgoing-list")!,
    backlinksCount: document.getElementById("backlinks-count")!,
    statusWords: document.getElementById("status-words")!,
    statusChars: document.getElementById("status-chars")!,
    statusSave: document.getElementById("status-save")!,
    welcome: document.getElementById("welcome")!,
    commandPalette: document.getElementById("command-palette")!,
    commandInput: document.getElementById("command-input") as HTMLInputElement,
    commandResults: document.getElementById("command-results")!,
    btnFocus: document.getElementById("btn-focus")!,
    btnTypewriter: document.getElementById("btn-typewriter")!,
    btnPreview: document.getElementById("btn-preview")!,
    btnTheme: document.getElementById("btn-theme")!,
    btnBacklinks: document.getElementById("btn-backlinks")!,
  };

  async init() {
    this.settings = await loadSettings();
    this.applyTheme(this.settings.theme);

    this.editor = createEditor(
      this.els.editorRoot,
      this.index,
      {
        onChange: (text) => this.handleEditorChange(text),
        onOpenWiki: (title, createIfMissing) => void this.openWiki(title, createIfMissing),
      },
      this.settings.theme,
    );

    this.applyChrome();
    this.bindUi();
    this.bindShortcuts();

    if (this.settings.libraryPath) {
      await this.openLibrary(this.settings.libraryPath, this.settings.lastOpenPath);
    } else {
      this.showWelcome(true);
    }
  }

  private bindUi() {
    document.getElementById("btn-new-note")!.addEventListener("click", () => void this.newNote());
    document.getElementById("btn-open-library")!.addEventListener("click", () => void this.pickLibrary());
    document.getElementById("btn-refresh")!.addEventListener("click", () => void this.refreshLibrary());
    document.getElementById("btn-toggle-sidebar")!.addEventListener("click", () => {
      this.els.app.classList.toggle("sidebar-collapsed");
    });
    document.getElementById("welcome-open")!.addEventListener("click", () => void this.pickLibrary());
    document.getElementById("welcome-demo")!.addEventListener("click", () => void this.createDemo());

    this.els.btnFocus.addEventListener("click", () => {
      this.settings.focusMode = !this.settings.focusMode;
      this.editor.setFocusMode(this.settings.focusMode);
      this.syncChip(this.els.btnFocus, this.settings.focusMode);
      void saveSettings(this.settings);
    });

    this.els.btnTypewriter.addEventListener("click", () => {
      this.settings.typewriter = !this.settings.typewriter;
      this.editor.setTypewriter(this.settings.typewriter);
      this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
      void saveSettings(this.settings);
    });

    this.els.btnPreview.addEventListener("click", () => this.togglePreview());
    this.els.btnTheme.addEventListener("click", () => {
      const next = this.settings.theme === "light" ? "dark" : "light";
      this.settings.theme = next;
      this.applyTheme(next);
      this.editor.setTheme(next);
      this.els.btnTheme.textContent = next === "light" ? "Dark" : "Light";
      void saveSettings(this.settings);
    });

    this.els.btnBacklinks.addEventListener("click", () => {
      this.settings.showBacklinks = !this.settings.showBacklinks;
      this.applyChrome();
      void saveSettings(this.settings);
    });

    this.els.titleInput.addEventListener("change", () => void this.renameCurrent());
    this.els.titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.els.titleInput.blur();
        this.editor.focus();
      }
    });

    this.els.commandInput.addEventListener("input", () => this.renderCommandResults());
    this.els.commandInput.addEventListener("keydown", (e) => this.onCommandKey(e));
    this.els.commandPalette.addEventListener("click", (e) => {
      if (e.target === this.els.commandPalette) this.closeCommandPalette();
    });
  }

  private bindShortcuts() {
    window.addEventListener("keydown", (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void this.newNote();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void this.saveCurrent(true);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        this.els.btnFocus.click();
      } else if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        this.togglePreview();
      } else if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        this.openCommandPalette();
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        this.els.app.classList.toggle("sidebar-collapsed");
      } else if (e.key === "Escape") {
        this.closeCommandPalette();
      }
    });
  }

  private applyTheme(theme: "light" | "dark") {
    this.els.app.dataset.theme = theme;
    this.els.btnTheme.textContent = theme === "light" ? "Dark" : "Light";
    document.documentElement.style.colorScheme = theme;
  }

  private applyChrome() {
    this.syncChip(this.els.btnFocus, this.settings.focusMode);
    this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
    this.syncChip(this.els.btnBacklinks, this.settings.showBacklinks);
    this.els.app.classList.toggle("backlinks-hidden", !this.settings.showBacklinks);
    this.editor?.setFocusMode(this.settings.focusMode);
    this.editor?.setTypewriter(this.settings.typewriter);
  }

  private syncChip(el: HTMLElement, active: boolean) {
    el.dataset.active = String(active);
  }

  private showWelcome(show: boolean) {
    this.els.welcome.classList.toggle("hidden", !show);
    this.els.app.classList.toggle("welcome-open", show);
  }

  private async pickLibrary() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Vyberte složku knihovny Folio",
    });
    if (!selected || Array.isArray(selected)) return;
    await this.openLibrary(selected);
  }

  private async createDemo() {
    const path = await getDefaultLibraryPath();
    const first = await createDemoLibrary(path);
    await this.openLibrary(path, first);
  }

  private async openLibrary(path: string, openPath?: string | null) {
    this.settings.libraryPath = path;
    this.els.libraryPath.textContent = path;
    this.els.libraryPath.title = path;
    this.showWelcome(false);
    await this.refreshLibrary(openPath ?? this.settings.lastOpenPath);
    await saveSettings(this.settings);
  }

  private async refreshLibrary(preferredPath?: string | null) {
    if (!this.settings.libraryPath) return;
    this.notes = await listNotes(this.settings.libraryPath);
    this.index.setNotes(this.notes);

    // Index contents for backlinks
    await Promise.all(
      this.notes.map(async (note) => {
        try {
          const text = await readNote(note.path);
          this.index.setContent(note.path, text);
        } catch {
          /* ignore unreadable */
        }
      }),
    );

    this.renderNoteList();
    this.editor.reconfigureWiki();

    const target =
      this.notes.find((n) => n.path === preferredPath) ??
      this.notes[0] ??
      null;

    if (target) {
      await this.openNote(target);
    } else {
      this.current = null;
      this.els.titleInput.value = "";
      this.suppressChange = true;
      this.editor.setText("");
      this.suppressChange = false;
      this.renderLinks();
      this.updateStats("");
    }
  }

  private renderNoteList() {
    this.els.noteList.innerHTML = "";
    if (!this.notes.length) {
      const empty = document.createElement("div");
      empty.className = "note-empty";
      empty.textContent = "Zatím žádné poznámky";
      this.els.noteList.appendChild(empty);
      return;
    }

    for (const note of this.notes) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "note-item";
      if (this.current?.path === note.path) item.classList.add("active");

      const title = document.createElement("span");
      title.className = "note-item-title";
      title.textContent = note.title;

      const meta = document.createElement("span");
      meta.className = "note-item-meta";
      meta.textContent = note.relativePath.includes("/")
        ? note.relativePath.split("/").slice(0, -1).join("/")
        : "root";

      item.append(title, meta);
      item.addEventListener("click", () => void this.openNote(note));
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (confirm(`Smazat „${note.title}“?`)) void this.removeNote(note);
      });
      this.els.noteList.appendChild(item);
    }
  }

  private async openNote(note: NoteMeta) {
    if (this.dirty) await this.saveCurrent(true);
    const text = await readNote(note.path);
    this.current = note;
    this.settings.lastOpenPath = note.path;
    void saveSettings(this.settings);

    this.els.titleInput.value = note.title;
    this.suppressChange = true;
    this.editor.setText(text);
    this.suppressChange = false;
    this.index.setContent(note.path, text);
    this.dirty = false;
    this.els.statusSave.textContent = "Připraveno";
    this.renderNoteList();
    this.renderLinks();
    this.updateStats(text);
    if (this.previewOn) this.renderPreview(text);
    this.editor.focus();
  }

  private async openWiki(title: string, createIfMissing: boolean) {
    const existing = this.index.resolve(title);
    if (existing) {
      await this.openNote(existing);
      return;
    }
    if (!createIfMissing || !this.settings.libraryPath) return;
    if (!confirm(`Poznámka „${title}“ neexistuje. Vytvořit?`)) return;
    const path = await createNote(this.settings.libraryPath, title, `# ${title}\n\n`);
    await this.refreshLibrary(path);
  }

  private async newNote() {
    if (!this.settings.libraryPath) {
      await this.pickLibrary();
      if (!this.settings.libraryPath) return;
    }
    if (this.dirty) await this.saveCurrent(true);
    const path = await createNote(this.settings.libraryPath, "Bez názvu", "# Bez názvu\n\n");
    await this.refreshLibrary(path);
  }

  private async removeNote(note: NoteMeta) {
    await deleteNote(note.path);
    this.index.removeNote(note.path);
    if (this.current?.path === note.path) {
      this.current = null;
      this.settings.lastOpenPath = null;
    }
    await this.refreshLibrary();
  }

  private async renameCurrent() {
    if (!this.current) return;
    const nextTitle = this.els.titleInput.value.trim();
    if (!nextTitle || nextTitle === this.current.title) {
      this.els.titleInput.value = this.current.title;
      return;
    }
    if (this.dirty) await this.saveCurrent(true);
    const newPath = await renameNote(this.current.path, nextTitle);
    this.settings.lastOpenPath = newPath;
    await this.refreshLibrary(newPath);
  }

  private handleEditorChange(text: string) {
    if (this.suppressChange || !this.current) return;
    this.dirty = true;
    this.els.statusSave.textContent = "Neuloženo…";
    this.index.setContent(this.current.path, text);
    this.renderLinks();
    this.updateStats(text);
    if (this.previewOn) this.renderPreview(text);

    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.saveCurrent(false), 450);
  }

  private async saveCurrent(manual: boolean) {
    if (!this.current) return;
    const text = this.editor.getText();
    await writeNote(this.current.path, text);
    this.index.setContent(this.current.path, text);
    this.dirty = false;
    this.els.statusSave.textContent = manual ? "Uloženo" : "Automaticky uloženo";
    // Refresh mtime/title list lightly
    const note = this.notes.find((n) => n.path === this.current?.path);
    if (note) note.mtime = Date.now();
  }

  private renderLinks() {
    if (!this.current) {
      this.els.backlinksList.innerHTML = "";
      this.els.outgoingList.innerHTML = "";
      this.els.backlinksCount.textContent = "0";
      return;
    }

    const backlinks = this.index.getBacklinks(this.current.path);
    this.els.backlinksCount.textContent = String(backlinks.length);
    this.els.backlinksList.innerHTML = "";
    if (!backlinks.length) {
      const empty = document.createElement("div");
      empty.className = "link-empty";
      empty.textContent = "Zatím žádné backlinky";
      this.els.backlinksList.appendChild(empty);
    } else {
      for (const note of backlinks) {
        this.els.backlinksList.appendChild(this.linkButton(note.title, () => void this.openNote(note)));
      }
    }

    const outgoing = this.index.getOutgoing(this.current.path);
    this.els.outgoingList.innerHTML = "";
    if (!outgoing.length) {
      const empty = document.createElement("div");
      empty.className = "link-empty";
      empty.textContent = "Žádné odchozí [[odkazy]]";
      this.els.outgoingList.appendChild(empty);
    } else {
      for (const item of outgoing) {
        const label = item.note ? item.title : `${item.title} (chybí)`;
        this.els.outgoingList.appendChild(
          this.linkButton(label, () => void this.openWiki(item.title, true), !item.note),
        );
      }
    }
  }

  private linkButton(label: string, onClick: () => void, missing = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `link-item${missing ? " missing" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  private updateStats(text: string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.els.statusWords.textContent = `${words} ${words === 1 ? "slovo" : words > 1 && words < 5 ? "slova" : "slov"}`;
    this.els.statusChars.textContent = `${text.length} znaků`;
  }

  private togglePreview() {
    this.previewOn = !this.previewOn;
    this.syncChip(this.els.btnPreview, this.previewOn);
    this.els.editorRoot.classList.toggle("hidden", this.previewOn);
    this.els.previewRoot.classList.toggle("hidden", !this.previewOn);
    if (this.previewOn) this.renderPreview(this.editor.getText());
    else this.editor.focus();
  }

  private renderPreview(text: string) {
    const html = marked.parse(text) as string;
    this.els.previewRoot.innerHTML = html;
    this.els.previewRoot.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("[[") || href.includes(".md")) return;
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noreferrer");
    });
  }

  private openCommandPalette() {
    this.els.commandPalette.classList.remove("hidden");
    this.els.commandInput.value = "";
    this.commandIndex = 0;
    this.renderCommandResults();
    this.els.commandInput.focus();
  }

  private closeCommandPalette() {
    this.els.commandPalette.classList.add("hidden");
  }

  private renderCommandResults() {
    this.commandItems = this.index.search(this.els.commandInput.value, 10);
    this.els.commandResults.innerHTML = "";
    this.commandItems.forEach((note, i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `command-row${i === this.commandIndex ? " active" : ""}`;
      row.innerHTML = `<span>${escapeHtml(note.title)}</span><small>${escapeHtml(note.relativePath)}</small>`;
      row.addEventListener("click", () => {
        this.closeCommandPalette();
        void this.openNote(note);
      });
      this.els.commandResults.appendChild(row);
    });
  }

  private onCommandKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.commandIndex = Math.min(this.commandIndex + 1, Math.max(this.commandItems.length - 1, 0));
      this.renderCommandResults();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.commandIndex = Math.max(this.commandIndex - 1, 0);
      this.renderCommandResults();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const note = this.commandItems[this.commandIndex];
      if (note) {
        this.closeCommandPalette();
        void this.openNote(note);
      } else if (this.els.commandInput.value.trim()) {
        this.closeCommandPalette();
        void this.openWiki(this.els.commandInput.value.trim(), true);
      }
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
