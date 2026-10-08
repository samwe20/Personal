import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { AppSettings, NodeRecord, SavedQueryRecord, SyncChange, WorkspaceRecord } from '../types';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return uuidv4();
}

export class FastDatabase extends Dexie {
  nodes!: Table<NodeRecord, string>;
  workspaces!: Table<WorkspaceRecord, string>;
  queries!: Table<SavedQueryRecord, string>;
  syncQueue!: Table<SyncChange, string>;
  settings!: Table<AppSettings & { id: string }, string>;

  constructor() {
    super('fast-manager');
    this.version(1).stores({
      nodes: 'id, workspaceId, parentId, updatedAt, deleted',
      workspaces: 'id, order, updatedAt, deleted',
      queries: 'id, order, updatedAt, deleted',
      syncQueue: 'id, updatedAt',
      settings: 'id',
    });
  }
}

export const db = new FastDatabase();

export async function loadSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('main');
  if (existing) {
    const { id: _id, ...settings } = existing;
    return { ...settings, syncEnabled: settings.syncEnabled ?? false };
  }

  const defaults: AppSettings & { id: string } = {
    id: 'main',
    theme: 'system',
    language: 'cs',
    syncEnabled: false,
    syncUrl: '',
    workspaceId: 'default',
    lastSyncAt: null,
    clientId: newId(),
    onboardingDone: false,
  };
  await db.settings.put(defaults);
  const { id: _id, ...settings } = defaults;
  return settings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ id: 'main', ...settings });
}
