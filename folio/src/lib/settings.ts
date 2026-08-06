import { LazyStore } from "@tauri-apps/plugin-store";
import { AppSettings, DEFAULT_SETTINGS } from "../types";

const store = new LazyStore("folio-settings.json");

export async function loadSettings(): Promise<AppSettings> {
  const saved = await store.get<Partial<AppSettings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await store.set("settings", settings);
  await store.save();
}
