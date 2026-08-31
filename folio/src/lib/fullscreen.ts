import { isTauri } from "./runtime";

/** Enter OS / browser fullscreen when available. */
export async function enterFullscreen(): Promise<void> {
  try {
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(true);
      return;
    }
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen();
    }
  } catch {
    // User gesture / permission may block fullscreen; chrome hide still works.
  }
}

/** Leave fullscreen if Folio currently owns it. */
export async function exitFullscreen(): Promise<void> {
  try {
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(false);
      return;
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // Ignore — window may already be windowed.
  }
}
