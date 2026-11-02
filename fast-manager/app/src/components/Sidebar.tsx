import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { localToday } from '../utils/dateUtils';
import { getIcon } from '../utils/icons';

export function Sidebar() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const activeTypeId = useAppStore((s) => s.activeTypeId);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const objectTypes = useAppStore((s) => s.objectTypes);
  const nodes = useAppStore((s) => s.nodes);
  const openType = useAppStore((s) => s.openType);
  const openDaily = useAppStore((s) => s.openDaily);
  const setView = useAppStore((s) => s.setView);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncNow = useAppStore((s) => s.syncNow);
  const language = useAppStore((s) => s.settings?.language ?? 'cs');
  const updateSettings = useAppStore((s) => s.updateSettings);

  const today = localToday();
  const selected = nodes.find((node) => node.id === selectedNodeId);
  const onToday =
    activeView === 'object' &&
    selected?.typeId === 'dailyNote' &&
    String(selected.fieldValues.dailyNote?.date ?? '') === today;
  const types = objectTypes.filter((type) => type.id !== 'tag' && type.id !== 'folder' && type.id !== 'dailyNote');

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-3 py-3">
        <div className="text-sm font-semibold tracking-tight text-[var(--text)]">{t('app.shortName')}</div>
        <div className="text-[10px] leading-snug text-[var(--muted)]">{t('app.tagline')}</div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-2">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`ui-nav ${
              activeView === 'calendar'
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            {(() => {
              const Icon = getIcon('calendar');
              return <Icon size={14} strokeWidth={2} />;
            })()}
            {t('nav.calendar')}
          </button>
          <button
            type="button"
            onClick={() => void openDaily(today)}
            className={`ui-nav ${
              onToday
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            {(() => {
              const Icon = getIcon('calendar-days');
              return <Icon size={14} strokeWidth={2} />;
            })()}
            {t('nav.today')}
          </button>
        </div>

        <div>
          <div className="ui-section-title">{t('nav.types')}</div>
          <div className="mt-1 space-y-0.5">
            {types.map((type) => {
              const Icon = getIcon(type.icon);
              const count = nodes.filter((node) => node.typeId === type.id).length;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => openType(type.id)}
                  className={`ui-nav ${activeView === 'type' && activeTypeId === type.id ? 'bg-[var(--accent-soft)] text-[var(--text)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
                >
                  <Icon size={14} color={type.color} />
                  <span className="min-w-0 flex-1 truncate">{t(`supertags.${type.id}`, type.name)}</span>
                  <span className="text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-[var(--border)] p-2">
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('settings')}
            className={`ui-nav min-w-0 flex-1 ${
              activeView === 'settings'
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            {(() => {
              const Icon = getIcon('settings');
              return <Icon size={14} strokeWidth={2} />;
            })()}
            {t('nav.settings')}
          </button>
          <div className="flex shrink-0 overflow-hidden rounded-md border border-[var(--border)]">
            {(['cs', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                title={t('settings.language')}
                onClick={() => void updateSettings({ language: lang })}
                className={`px-1.5 py-1 text-[10px] font-semibold uppercase transition ${
                  language === lang
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
