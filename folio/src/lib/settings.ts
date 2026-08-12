import { AppSettings, DEFAULT_SETTINGS } from "../types";
import { isTauri } from "./runtime";

const WEB_KEY = "folio.settings.v1";

async function loadTauri(): Promise<AppSettings> {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  const store = new LazyStore("folio-settings.json");
  const saved = await store.get<Partial<AppSettings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}

async function saveTauri(settings: AppSettings): Promise<void> {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  const store = new LazyStore("folio-settings.json");
  await store.set("settings", settings);
  await store.save();
}

function loadWeb(): AppSettings {
  try {
    const raw = localStorage.getItem(WEB_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveWeb(settings: AppSettings): void {
  localStorage.setItem(WEB_KEY, JSON.stringify(settings));
}

export async function loadSettings(): Promise<AppSettings> {
  if (!isTauri()) return loadWeb();
  try {
    return await loadTauri();
  } catch {
    return loadWeb();
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isTauri()) {
    saveWeb(settings);
    return;
  }
  try {
    await saveTauri(settings);
  } catch {
    saveWeb(settings);
  }
}
