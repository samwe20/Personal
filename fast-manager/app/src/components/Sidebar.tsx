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
      className={`ui-nav ${
        activeView === view ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      }`}
    >
      {(() => {
        const Icon = getIcon(icon);
        return <Icon size={14} strokeWidth={2} />;
      })()}
      {label}
    </button>
  );

  return (
    <aside className="flex h-full w-[11.5rem] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <div className="text-sm font-semibold tracking-tight text-[var(--accent)]">{t('app.shortName')}</div>
        <div className="text-[10px] leading-snug text-[var(--muted)]">{t('app.tagline')}</div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-2">
        <div className="space-y-0.5">
          {navItem('inbox', t('nav.inbox'), 'inbox')}
          {navItem('today', t('nav.today'), 'calendar')}
        </div>

        <div>
          <div className="ui-section-title">{t('nav.queries')}</div>
          <div className="space-y-0.5">
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
                  className={`ui-nav ${
                    activeView === 'query' && activeQueryId === q.id
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
                  {queryLabels[q.id] ?? q.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="ui-section-title">{t('nav.supertags')}</div>
          <div className="flex flex-wrap gap-1 px-1">
            {BUILTIN_SUPERTAGS.slice(0, 6).map((tag) => (
              <SupertagPill key={tag.id} tagId={tag.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-[var(--border)] p-2">
        <button
          type="button"
          onClick={() => useAppStore.getState().openQuickCapture()}
          className="w-full rounded-md bg-[var(--accent)] px-2 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          ⚡ {t('capture.title')}
        </button>
        <button
          type="button"
          onClick={() => void addRootNode()}
          className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
        >
          + {t('actions.addNode')}
        </button>
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={!syncStatus.enabled}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-2 py-1.5 text-[11px] text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
        >
          {(() => {
            const Icon = getIcon('refresh');
            return <Icon size={12} className={syncStatus.syncing ? 'animate-spin' : ''} />;
          })()}
          {!syncStatus.enabled
            ? t('settings.localMode')
            : syncStatus.connected
              ? t('settings.connected')
              : t('settings.disconnected')}
        </button>
        {navItem('settings', t('nav.settings'), 'settings')}
      </div>
    </aside>
  );
}
