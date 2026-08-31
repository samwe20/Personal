import { useTranslation } from 'react-i18next';
import { BUILTIN_SUPERTAGS, useAppStore } from '../store/appStore';
import { getIcon } from '../utils/icons';
import { SupertagPill } from './SupertagPill';

export function Sidebar() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const activeQueryId = useAppStore((s) => s.activeQueryId);
  const queries = useAppStore((s) => s.queries);
  const setView = useAppStore((s) => s.setView);
  const addRootNode = useAppStore((s) => s.addRootNode);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncNow = useAppStore((s) => s.syncNow);

  const navItem = (view: 'inbox' | 'today' | 'settings', label: string, icon: string) => (
    <button
      type="button"
      onClick={() => setView(view)}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
        activeView === view ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      }`}
    >
      {(() => {
        const Icon = getIcon(icon);
        return <Icon size={16} />;
      })()}
      {label}
    </button>
  );

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="text-lg font-bold text-[var(--accent)]">{t('app.shortName')}</div>
        <div className="text-[11px] text-[var(--muted)]">{t('app.tagline')}</div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-3">
        <div className="space-y-1">
          {navItem('inbox', t('nav.inbox'), 'inbox')}
          {navItem('today', t('nav.today'), 'calendar')}
        </div>

        <div>
          <div className="mb-2 px-3 text-[11px] uppercase tracking-wide text-[var(--muted)]">{t('nav.queries')}</div>
          <div className="space-y-1">
            {queries.map((q) => {
              const Icon = getIcon(q.icon);
              const queryLabels: Record<string, string> = {
                'q-tasks': t('queries.myTasks'),
                'q-questions': t('queries.openQuestions'),
                'q-overdue': t('queries.overdue'),
              };
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setView('query', q.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeView === 'query' && activeQueryId === q.id
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon size={16} />
                  {queryLabels[q.id] ?? q.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 px-3 text-[11px] uppercase tracking-wide text-[var(--muted)]">{t('nav.supertags')}</div>
          <div className="flex flex-wrap gap-2 px-2">
            {BUILTIN_SUPERTAGS.slice(0, 6).map((tag) => (
              <SupertagPill key={tag.id} tagId={tag.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--border)] p-3">
        <button
          type="button"
          onClick={() => void addRootNode()}
          className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + {t('actions.addNode')}
        </button>
        <button
          type="button"
          onClick={() => void syncNow()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
        >
          {(() => {
            const Icon = getIcon('refresh');
            return <Icon size={14} className={syncStatus.syncing ? 'animate-spin' : ''} />;
          })()}
          {syncStatus.connected ? t('settings.connected') : t('settings.disconnected')}
        </button>
        {navItem('settings', t('nav.settings'), 'settings')}
      </div>
    </aside>
  );
}
