import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { objectTitle } from '../utils/nodeUtils';
import { getIcon } from '../utils/icons';
import { FolderActions, FolderTree } from './FolderTree';

export function Sidebar() {
  const { t } = useTranslation();
  const activeView = useAppStore((s) => s.activeView);
  const activeQueryId = useAppStore((s) => s.activeQueryId);
  const activeTypeId = useAppStore((s) => s.activeTypeId);
  const activeCollectionId = useAppStore((s) => s.activeCollectionId);
  const queries = useAppStore((s) => s.queries);
  const objectTypes = useAppStore((s) => s.objectTypes);
  const collections = useAppStore((s) => s.collections);
  const nodes = useAppStore((s) => s.nodes);
  const setView = useAppStore((s) => s.setView);
  const openType = useAppStore((s) => s.openType);
  const openCollection = useAppStore((s) => s.openCollection);
  const openObject = useAppStore((s) => s.openObject);
  const addFolder = useAppStore((s) => s.addFolder);
  const addCollection = useAppStore((s) => s.addCollection);
  const createTag = useAppStore((s) => s.createTag);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncNow = useAppStore((s) => s.syncNow);
  const language = useAppStore((s) => s.settings?.language ?? 'cs');
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [collectionName, setCollectionName] = useState('');
  const [tagName, setTagName] = useState('');

  const types = objectTypes.filter((type) => type.id !== 'tag' && type.id !== 'folder');
  const tags = nodes.filter((node) => node.typeId === 'tag');

  const navItem = (view: 'inbox' | 'today' | 'planned' | 'calendar' | 'settings' | 'studio', label: string, icon: string) => (
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
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-3 py-3">
        <div className="text-sm font-semibold tracking-tight text-[var(--text)]">{t('app.shortName')}</div>
        <div className="text-[10px] leading-snug text-[var(--muted)]">{t('app.tagline')}</div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-2">
        <div className="space-y-0.5">
          {navItem('calendar', t('nav.calendar'), 'calendar')}
          {navItem('today', t('nav.today'), 'calendar-days')}
          {navItem('inbox', t('nav.inbox'), 'inbox')}
          {navItem('planned', t('nav.planned'), 'check-square')}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div className="ui-section-title mb-0">{t('nav.types')}</div>
            <button type="button" className="px-1 text-xs text-[var(--muted)]" onClick={() => setView('studio')}>
              +
            </button>
          </div>
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

        <div>
          <div className="ui-section-title">{t('nav.tags')}</div>
          <div className="space-y-0.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => openObject(tag.id)}
                className="ui-nav text-[var(--muted)] hover:bg-[var(--surface-2)]"
              >
                #{objectTitle(tag)}
              </button>
            ))}
          </div>
          <form
            className="mt-1 px-1"
            onSubmit={(event) => {
              event.preventDefault();
              if (!tagName.trim()) return;
              void createTag(tagName.trim());
              setTagName('');
            }}
          >
            <input
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder={t('object.newTag')}
              className="ui-input"
            />
          </form>
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
          <div className="ui-section-title">{t('nav.collections')}</div>
          <div className="space-y-0.5">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => openCollection(collection.id)}
                className={`ui-nav ${activeView === 'collection' && activeCollectionId === collection.id ? 'bg-[var(--accent-soft)]' : 'text-[var(--muted)]'}`}
              >
                {collection.name}
              </button>
            ))}
          </div>
          <form
            className="mt-1 flex gap-1 px-1"
            onSubmit={(event) => {
              event.preventDefault();
              if (!collectionName.trim()) return;
              void addCollection(collectionName.trim(), activeTypeId || 'note');
              setCollectionName('');
            }}
          >
            <input
              value={collectionName}
              onChange={(event) => setCollectionName(event.target.value)}
              placeholder={t('collection.new')}
              className="ui-input"
            />
          </form>
        </div>

        <div>
          <div className="flex items-center justify-between gap-1">
            <div className="ui-section-title mb-0 flex-1">{t('nav.folders')}</div>
            <button
              type="button"
              title={t('folders.newFolder')}
              onClick={() => void addFolder(null)}
              className="shrink-0 rounded px-1 text-xs leading-none text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              +
            </button>
          </div>
          <FolderTree parentId={null} />
          <div className="mt-1.5 px-1">
            <FolderActions />
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-[var(--border)] p-2">
        <button
          type="button"
          onClick={() => useAppStore.getState().openQuickCapture()}
          className="w-full rounded-full bg-[var(--accent)] px-2 py-1.5 text-xs font-medium text-[var(--on-accent)] hover:opacity-90"
        >
          {t('capture.title')}
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
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">{navItem('settings', t('nav.settings'), 'settings')}</div>
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
