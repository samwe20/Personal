import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { getIcon } from '../utils/icons';
import { isFolderNode } from '../utils/folderUtils';

interface FolderTreeProps {
  parentId: string | null;
  depth?: number;
}

export function FolderTree({ parentId, depth = 0 }: FolderTreeProps) {
  const { t } = useTranslation();
  const folders = useAppStore((s) => s.getFolderNodes(parentId));
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const activeView = useAppStore((s) => s.activeView);
  const openFolder = useAppStore((s) => s.openFolder);

  if (folders.length === 0 && depth === 0) {
    return <p className="px-2 py-1 text-[10px] text-[var(--muted)]">{t('folders.empty')}</p>;
  }

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => {
        const Icon = getIcon('folder-open');
        const active = activeView === 'folder' && activeFolderId === folder.id;
        return (
          <div key={folder.id}>
            <button
              type="button"
              onClick={() => openFolder(folder.id)}
              className={`ui-nav ${active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
              style={{ paddingLeft: `${8 + depth * 10}px` }}
            >
              <Icon size={13} strokeWidth={2} />
              <span className="truncate">{folder.content.trim() || t('folders.unnamed')}</span>
            </button>
            <FolderTree parentId={folder.id} depth={depth + 1} />
          </div>
        );
      })}
    </div>
  );
}

export function FolderActions() {
  const { t } = useTranslation();
  const addFolder = useAppStore((s) => s.addFolder);
  const addDocument = useAppStore((s) => s.addDocument);
  const activeView = useAppStore((s) => s.activeView);
  const activeFolderId = useAppStore((s) => s.activeFolderId);

  const inFolder = activeView === 'folder' && activeFolderId;

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => void addFolder(inFolder ? activeFolderId : null)}
        className="flex-1 rounded-md border border-[var(--border)] px-1.5 py-1 text-[10px] text-[var(--muted)] hover:bg-[var(--surface-2)]"
      >
        + {t('folders.newFolder')}
      </button>
      <button
        type="button"
        onClick={() => void addDocument(inFolder ? activeFolderId : null)}
        className="flex-1 rounded-md border border-[var(--border)] px-1.5 py-1 text-[10px] text-[var(--muted)] hover:bg-[var(--surface-2)]"
      >
        + {t('folders.newDocument')}
      </button>
    </div>
  );
}

export { isFolderNode };
