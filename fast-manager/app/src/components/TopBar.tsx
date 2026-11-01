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
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const activeTypeId = useAppStore((s) => s.activeTypeId);
  const activeCollectionId = useAppStore((s) => s.activeCollectionId);
  const objectTypes = useAppStore((s) => s.objectTypes);
  const collections = useAppStore((s) => s.collections);
  const resolveFolderTitle = useAppStore((s) => s.resolveFolderTitle);
  const resolveNodeTitle = useAppStore((s) => s.resolveNodeTitle);
  const historyTick = useAppStore((s) => s.historyTick);
  const typeName = objectTypes.find((type) => type.id === activeTypeId);
  const collectionName = collections.find((collection) => collection.id === activeCollectionId)?.name;

  const viewTitle =
    activeView === 'object' && selectedNodeId
      ? resolveNodeTitle(selectedNodeId)
      : activeView === 'folder' && activeFolderId
        ? resolveFolderTitle(activeFolderId)
        : activeView === 'today'
          ? t('nav.today')
          : activeView === 'planned'
            ? t('nav.planned')
            : activeView === 'search'
              ? t('search.title')
              : activeView === 'query'
                ? t('nav.queries')
                : activeView === 'calendar'
                  ? t('nav.calendar')
                  : activeView === 'studio'
                    ? t('studio.title')
                    : activeView === 'type' && typeName
                      ? t(`supertags.${typeName.id}`, typeName.name)
                      : activeView === 'collection'
                        ? collectionName ?? t('nav.collections')
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
      className={`rounded-md p-1.5 transition ${accent ? 'bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90' : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'} disabled:opacity-30`}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}
