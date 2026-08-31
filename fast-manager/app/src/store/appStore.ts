import { create } from 'zustand';
import { BUILTIN_SUPERTAGS, getDefaultFieldValues } from '../data/supertags';
import {
  addSupertagToNode,
  completeTask as completeTaskNode,
  createNode,
  deleteNode,
  evaluateQuery,
  getAllNodes,
  getQueries,
  getWorkspaces,
  loadSettings,
  moveNode,
  removeSupertagFromNode,
  restoreNodesSnapshot,
  saveSettings,
  seedIfEmpty,
  updateNode,
  updateNodeField,
} from '../services/dataService';
import {
  canRedo,
  canUndo,
  clearHistory,
  popRedo,
  popUndo,
  pushHistory,
} from '../services/historyService';
import { requestNotificationPermission, startReminderChecker } from '../services/reminderService';
import { SyncClient, type SyncStatus } from '../sync/syncClient';
import type {
  AppSettings,
  NodeRecord,
  QuickCaptureInput,
  SavedQueryRecord,
  Theme,
  WorkspaceRecord,
} from '../types';
import { getBacklinks, resolveNodeTitle, searchNodes } from '../utils/nodeUtils';

export type ViewMode = 'inbox' | 'today' | 'query' | 'settings' | 'search';

interface AppState {
  ready: boolean;
  initError: string | null;
  settings: AppSettings | null;
  workspaces: WorkspaceRecord[];
  nodes: NodeRecord[];
  queries: SavedQueryRecord[];
  selectedNodeId: string | null;
  activeView: ViewMode;
  activeQueryId: string | null;
  searchQuery: string;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  showMobilePanel: boolean;
  syncStatus: SyncStatus;
  syncClient: SyncClient | null;
  historyTick: number;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  withHistory: <T>(fn: () => Promise<T>) => Promise<T>;
  selectNode: (id: string | null) => void;
  setView: (view: ViewMode, queryId?: string | null) => void;
  setSearchQuery: (q: string) => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleMobilePanel: () => void;
  addRootNode: (content?: string) => Promise<void>;
  addChildNode: (parentId: string) => Promise<void>;
  quickCapture: (input: QuickCaptureInput) => Promise<void>;
  editNodeContent: (id: string, content: string) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  attachTag: (nodeId: string, tagId: string) => Promise<void>;
  detachTag: (nodeId: string, tagId: string) => Promise<void>;
  setField: (nodeId: string, tagId: string, key: string, value: string | number | boolean) => Promise<void>;
  completeTask: (nodeId: string) => Promise<void>;
  moveNodeTo: (nodeId: string, parentId: string | null, order: number) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  markOnboardingDone: () => Promise<void>;
  applyTheme: (theme: Theme) => void;
  syncNow: () => Promise<void>;
  getVisibleNodes: () => NodeRecord[];
  getQueryResults: () => NodeRecord[];
  getSearchResults: () => NodeRecord[];
  getNodeBacklinks: (nodeId: string) => NodeRecord[];
  resolveNodeTitle: (nodeId: string) => string;
  canUndoAction: () => boolean;
  canRedoAction: () => boolean;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  initError: null,
  settings: null,
  workspaces: [],
  nodes: [],
  queries: [],
  selectedNodeId: null,
  activeView: 'inbox',
  activeQueryId: 'q-tasks',
  searchQuery: '',
  commandPaletteOpen: false,
  quickCaptureOpen: false,
  showMobilePanel: false,
  syncStatus: {
    enabled: false,
    connected: false,
    syncing: false,
    lastSyncAt: null,
    error: null,
    pendingCount: 0,
  },
  syncClient: null,
  historyTick: 0,

  init: async () => {
    try {
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
      void requestNotificationPermission();

      const syncClient = new SyncClient(settings);
      syncClient.subscribe((status) => set({ syncStatus: status }));
      if (settings.syncEnabled) void syncClient.connect();

      startReminderChecker(
        () => get().nodes,
        () => get().settings?.language ?? 'cs',
      );

      clearHistory();
      set({
        ready: true,
        initError: null,
        settings: { ...settings, workspaceId: wsId, onboardingDone: settings.onboardingDone ?? false, syncEnabled: settings.syncEnabled ?? false },
        workspaces,
        nodes,
        queries,
        selectedNodeId: nodes[0]?.id ?? null,
        syncClient,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('FAST init failed:', err);
      set({ ready: false, initError: message });
    }
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

  withHistory: async (fn) => {
    pushHistory(get().nodes);
    const result = await fn();
    set((s) => ({ historyTick: s.historyTick + 1 }));
    void get().syncClient?.syncNow();
    return result;
  },

  selectNode: (id) => set({ selectedNodeId: id, showMobilePanel: !!id }),

  setView: (view, queryId = null) =>
    set({ activeView: view, activeQueryId: queryId ?? get().activeQueryId, searchQuery: view === 'search' ? get().searchQuery : '' }),

  setSearchQuery: (q) => set({ searchQuery: q, activeView: q ? 'search' : get().activeView === 'search' ? 'inbox' : get().activeView }),

  openQuickCapture: () => set({ quickCaptureOpen: true }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleMobilePanel: () => set((s) => ({ showMobilePanel: !s.showMobilePanel })),

  addRootNode: async (content = '') => {
    await get().withHistory(async () => {
      const { settings } = get();
      if (!settings) return;
      const node = await createNode({ workspaceId: settings.workspaceId, parentId: null, content: content || ' ' });
      await get().refresh();
      set({ selectedNodeId: node.id });
    });
  },

  addChildNode: async (parentId) => {
    await get().withHistory(async () => {
      const { settings } = get();
      if (!settings) return;
      const node = await createNode({ workspaceId: settings.workspaceId, parentId, content: ' ' });
      await get().refresh();
      set({ selectedNodeId: node.id });
    });
  },

  quickCapture: async (input) => {
    await get().withHistory(async () => {
      const { settings } = get();
      if (!settings || !input.content.trim()) return;

      const tagId = input.supertagId ?? 'task';
      const tag = BUILTIN_SUPERTAGS.find((t) => t.id === tagId);
      const fieldValues: NodeRecord['fieldValues'] = {};
      if (tag) {
        fieldValues[tagId] = {
          ...getDefaultFieldValues(tag),
          ...(input.dueDate ? { dueDate: input.dueDate } : {}),
          ...(input.reminderTime ? { reminderTime: input.reminderTime } : {}),
        };
      }

      const node = await createNode({
        workspaceId: settings.workspaceId,
        parentId: null,
        content: input.content.trim(),
        supertagIds: [tagId],
        fieldValues,
      });
      await get().refresh();
      set({ selectedNodeId: node.id, activeView: 'inbox', quickCaptureOpen: false });
    });
  },

  editNodeContent: async (id, content) => {
    await get().withHistory(async () => {
      await updateNode(id, { content });
      await get().refresh();
    });
  },

  removeNode: async (id) => {
    await get().withHistory(async () => {
      await deleteNode(id);
      await get().refresh();
      if (get().selectedNodeId === id) set({ selectedNodeId: null });
    });
  },

  attachTag: async (nodeId, tagId) => {
    await get().withHistory(async () => {
      await addSupertagToNode(nodeId, tagId);
      await get().refresh();
    });
  },

  detachTag: async (nodeId, tagId) => {
    await get().withHistory(async () => {
      await removeSupertagFromNode(nodeId, tagId);
      await get().refresh();
    });
  },

  setField: async (nodeId, tagId, key, value) => {
    await get().withHistory(async () => {
      await updateNodeField(nodeId, tagId, key, value);
      await get().refresh();
    });
  },

  completeTask: async (nodeId) => {
    await get().withHistory(async () => {
      await completeTaskNode(nodeId);
      await get().refresh();
    });
  },

  moveNodeTo: async (nodeId, parentId, order) => {
    await get().withHistory(async () => {
      await moveNode(nodeId, parentId, order);
      await get().refresh();
    });
  },

  undo: async () => {
    const snapshot = popUndo(get().nodes);
    if (!snapshot) return;
    await restoreNodesSnapshot(snapshot);
    await get().refresh();
    set((s) => ({ historyTick: s.historyTick + 1 }));
    void get().syncClient?.syncNow();
  },

  redo: async () => {
    const snapshot = popRedo(get().nodes);
    if (!snapshot) return;
    await restoreNodesSnapshot(snapshot);
    await get().refresh();
    set((s) => ({ historyTick: s.historyTick + 1 }));
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
    if (patch.theme || patch.language || patch.syncUrl || patch.syncEnabled) {
      get().syncClient?.updateSettings(next);
    }
    set({ settings: next });
  },

  markOnboardingDone: async () => {
    await get().updateSettings({ onboardingDone: true });
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
          (n.supertagIds.includes('dailyNote') && n.fieldValues.dailyNote?.date === today) ||
          (n.supertagIds.includes('task') &&
            n.fieldValues.task?.dueDate === today &&
            n.fieldValues.task?.status !== 'done'),
      );
    }
    if (activeView === 'search') return get().getSearchResults();
    return nodes.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order);
  },

  getQueryResults: () => {
    const { nodes, queries, activeQueryId } = get();
    const query = queries.find((q) => q.id === activeQueryId);
    if (!query) return [];
    return evaluateQuery(nodes, query.expression);
  },

  getSearchResults: () => {
    const { nodes, searchQuery } = get();
    return searchNodes(nodes, searchQuery);
  },

  getNodeBacklinks: (nodeId) => getBacklinks(get().nodes, nodeId),

  resolveNodeTitle: (nodeId) => resolveNodeTitle(get().nodes, nodeId),

  canUndoAction: () => canUndo(),
  canRedoAction: () => canRedo(),
}));

export { BUILTIN_SUPERTAGS };
