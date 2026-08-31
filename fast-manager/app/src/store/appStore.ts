import { create } from 'zustand';
import { BUILTIN_SUPERTAGS } from '../data/supertags';
import {
  addSupertagToNode,
  createNode,
  deleteNode,
  evaluateQuery,
  getAllNodes,
  getQueries,
  getWorkspaces,
  loadSettings,
  removeSupertagFromNode,
  saveSettings,
  seedIfEmpty,
  updateNode,
  updateNodeField,
} from '../services/dataService';
import { SyncClient, type SyncStatus } from '../sync/syncClient';
import type { AppSettings, NodeRecord, SavedQueryRecord, Theme, WorkspaceRecord } from '../types';

export type ViewMode = 'inbox' | 'today' | 'query' | 'settings';

interface AppState {
  ready: boolean;
  settings: AppSettings | null;
  workspaces: WorkspaceRecord[];
  nodes: NodeRecord[];
  queries: SavedQueryRecord[];
  selectedNodeId: string | null;
  activeView: ViewMode;
  activeQueryId: string | null;
  syncStatus: SyncStatus;
  syncClient: SyncClient | null;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  selectNode: (id: string | null) => void;
  setView: (view: ViewMode, queryId?: string | null) => void;
  addRootNode: (content?: string) => Promise<void>;
  addChildNode: (parentId: string) => Promise<void>;
  editNodeContent: (id: string, content: string) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  attachTag: (nodeId: string, tagId: string) => Promise<void>;
  detachTag: (nodeId: string, tagId: string) => Promise<void>;
  setField: (nodeId: string, tagId: string, key: string, value: string | number | boolean) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  applyTheme: (theme: Theme) => void;
  syncNow: () => Promise<void>;
  getVisibleNodes: () => NodeRecord[];
  getQueryResults: () => NodeRecord[];
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  settings: null,
  workspaces: [],
  nodes: [],
  queries: [],
  selectedNodeId: null,
  activeView: 'inbox',
  activeQueryId: 'q-tasks',
  syncStatus: {
    connected: false,
    syncing: false,
    lastSyncAt: null,
    error: null,
    pendingCount: 0,
  },
  syncClient: null,

  init: async () => {
    await seedIfEmpty();
    const settings = await loadSettings();
    const [workspaces, queries] = await Promise.all([getWorkspaces(), getQueries()]);
    const wsId = settings.workspaceId || workspaces[0]?.id || 'default';
    const nodes = await getAllNodes(wsId);

    document.documentElement.lang = settings.language;
    if (settings.language) {
      const { default: i18n } = await import('../i18n');
      await i18n.changeLanguage(settings.language);
    }
    get().applyTheme(settings.theme);

    const syncClient = new SyncClient(settings);
    syncClient.subscribe((status) => set({ syncStatus: status }));
    void syncClient.connect();

    set({
      ready: true,
      settings: { ...settings, workspaceId: wsId },
      workspaces,
      nodes,
      queries,
      selectedNodeId: nodes[0]?.id ?? null,
      syncClient,
    });
  },

  refresh: async () => {
    const { settings } = get();
    if (!settings) return;
    const [nodes, queries, workspaces] = await Promise.all([
      getAllNodes(settings.workspaceId),
      getQueries(),
      getWorkspaces(),
    ]);
    set({ nodes, queries, workspaces });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setView: (view, queryId = null) =>
    set({ activeView: view, activeQueryId: queryId ?? get().activeQueryId }),

  addRootNode: async (content = '') => {
    const { settings } = get();
    if (!settings) return;
    const node = await createNode({ workspaceId: settings.workspaceId, parentId: null, content: content || ' ' });
    await get().refresh();
    set({ selectedNodeId: node.id });
    void get().syncClient?.syncNow();
  },

  addChildNode: async (parentId) => {
    const { settings } = get();
    if (!settings) return;
    const node = await createNode({ workspaceId: settings.workspaceId, parentId, content: ' ' });
    await get().refresh();
    set({ selectedNodeId: node.id });
    void get().syncClient?.syncNow();
  },

  editNodeContent: async (id, content) => {
    await updateNode(id, { content });
    await get().refresh();
    void get().syncClient?.syncNow();
  },

  removeNode: async (id) => {
    await deleteNode(id);
    await get().refresh();
    if (get().selectedNodeId === id) set({ selectedNodeId: null });
    void get().syncClient?.syncNow();
  },

  attachTag: async (nodeId, tagId) => {
    await addSupertagToNode(nodeId, tagId);
    await get().refresh();
    void get().syncClient?.syncNow();
  },

  detachTag: async (nodeId, tagId) => {
    await removeSupertagFromNode(nodeId, tagId);
    await get().refresh();
    void get().syncClient?.syncNow();
  },

  setField: async (nodeId, tagId, key, value) => {
    await updateNodeField(nodeId, tagId, key, value);
    await get().refresh();
    void get().syncClient?.syncNow();
  },

  updateSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const next = { ...current, ...patch };
    await saveSettings(next);
    if (patch.theme) get().applyTheme(patch.theme);
    if (patch.language) {
      document.documentElement.lang = patch.language;
      const { default: i18n } = await import('../i18n');
      await i18n.changeLanguage(patch.language);
    }
    if (patch.theme || patch.language || patch.syncUrl) {
      get().syncClient?.updateSettings(next);
    }
    set({ settings: next });
  },

  applyTheme: (theme) => {
    const resolved = resolveTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  },

  syncNow: async () => {
    await get().syncClient?.syncNow();
    const settings = get().settings;
    if (settings) {
      const next = { ...settings, lastSyncAt: new Date().toISOString() };
      await saveSettings(next);
      set({ settings: next });
    }
    await get().refresh();
  },

  getVisibleNodes: () => {
    const { nodes, activeView } = get();
    const today = new Date().toISOString().slice(0, 10);
    if (activeView === 'today') {
      return nodes.filter(
        (n) =>
          n.supertagIds.includes('dailyNote') &&
          n.fieldValues.dailyNote?.date === today,
      );
    }
    return nodes.filter((n) => n.parentId === null);
  },

  getQueryResults: () => {
    const { nodes, queries, activeQueryId } = get();
    const query = queries.find((q) => q.id === activeQueryId);
    if (!query) return [];
    return evaluateQuery(nodes, query.expression);
  },
}));

export { BUILTIN_SUPERTAGS };
