import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { getIcon } from '../utils/icons';

export function TopBar() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setView = useAppStore((s) => s.setView);
  const openQuickCapture = useAppStore((s) => s.openQuickCapture);
  const openCommandPalette = useAppStore((s) => s.openCommandPalette);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndoAction = useAppStore((s) => s.canUndoAction);
  const canRedoAction = useAppStore((s) => s.canRedoAction);
  const toggleMobilePanel = useAppStore((s) => s.toggleMobilePanel);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const resolveFolderTitle = useAppStore((s) => s.resolveFolderTitle);
  const historyTick = useAppStore((s) => s.historyTick);

  const viewTitle =
    activeView === 'folder' && activeFolderId
      ? resolveFolderTitle(activeFolderId)
      : activeView === 'today'
        ? t('nav.today')
        : activeView === 'search'
          ? t('search.title')
          : activeView === 'query'
            ? t('nav.queries')
            : activeView === 'settings'
              ? t('nav.settings')
              : t('nav.inbox');

  void historyTick;

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
      <h1 className="hidden text-xs font-semibold text-[var(--text)] sm:block">{viewTitle}</h1>

      <div className="relative min-w-0 flex-1">
        {(() => {
          const SearchIcon = getIcon('search');
          return <SearchIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />;
        })()}
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) setView('search');
          }}
          onFocus={() => {
            if (searchQuery) setView('search');
          }}
          placeholder={t('actions.search')}
          className="ui-input pl-8"
        />
      </div>

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon="undo"
          label={t('commands.undo')}
          disabled={!canUndoAction()}
          onClick={() => void undo()}
        />
        <ToolbarButton
          icon="redo"
          label={t('commands.redo')}
          disabled={!canRedoAction()}
          onClick={() => void redo()}
        />
        <ToolbarButton icon="zap" label={t('capture.title')} onClick={openQuickCapture} accent />
        <ToolbarButton icon="command" label={t('commands.title')} onClick={openCommandPalette} />
        {selectedNodeId && (
          <button
            type="button"
            onClick={toggleMobilePanel}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] lg:hidden"
          >
            {t('panel.fields')}
          </button>
        )}
      </div>
    </header>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  const Icon = getIcon(icon);
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-1.5 transition ${accent ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'} disabled:opacity-30`}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}
