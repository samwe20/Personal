import { useTranslation } from 'react-i18next';
import type { KeyboardEvent } from 'react';
import type { NodeRecord, ObjectTypeRecord } from '../types';
import { useMediaSrc } from '../hooks/useMediaSrc';
import { getIcon } from '../utils/icons';
import { displayTitle } from '../utils/nodeUtils';

interface ObjectCardProps {
  blockId: string;
  node: NodeRecord | undefined;
  targetId: string;
  objectTypes: ObjectTypeRecord[];
  nodes: NodeRecord[];
  onOpen: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function ObjectCard({ blockId, node, targetId, objectTypes, nodes, onOpen, onKeyDown }: ObjectCardProps) {
  const { t } = useTranslation();
  const type = objectTypes.find((item) => item.id === node?.typeId);
  const fields = node?.typeId ? node.fieldValues[node.typeId] ?? {} : {};
  const src = typeof fields.src === 'string' ? fields.src : undefined;
  const mediaSrc = useMediaSrc(node && (node.typeId === 'image' || node.typeId === 'file') ? src : undefined);
  const Icon = getIcon(type?.icon ?? 'file-text');
  const title = node ? displayTitle(nodes, node) || t('object.untitled') : t('blocks.unknown');
  const url = node?.typeId === 'weblink' && typeof fields.url === 'string' ? fields.url : '';
  const fileName = typeof fields.fileName === 'string' && fields.fileName ? fields.fileName : title;

  return (
    <div
      id={`block-${blockId}`}
      className="embed-card"
      tabIndex={0}
      data-embed={targetId}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => {
          if (node && !node.deleted) onOpen(node.id);
        }}
      >
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: type?.color ?? 'var(--muted)' }}>
          <Icon size={13} />
          {node ? t(`supertags.${node.typeId}`, type?.name ?? node.typeId ?? '') : t('blocks.unknown')}
        </span>
        <span className="mt-0.5 block text-sm text-[var(--text)]">{node ? title : targetId.slice(0, 8)}</span>
        {node?.typeId === 'image' && mediaSrc && (
          <img src={mediaSrc} alt={title} className="mt-2 max-h-48 rounded-md bg-[var(--surface-2)] object-contain" />
        )}
        {node?.typeId === 'image' && !mediaSrc && (
          <span className="mt-2 block h-16 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-2)]" />
        )}
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs text-[var(--muted)] underline decoration-[var(--border)]"
          onClick={(event) => event.stopPropagation()}
        >
          {url}
        </a>
      )}
      {node?.typeId === 'file' && (
        <span className="mt-1 block text-xs text-[var(--muted)]">
          {mediaSrc ? (
            <a href={mediaSrc} download={fileName} onClick={(event) => event.stopPropagation()}>
              {fileName}
            </a>
          ) : (
            fileName
          )}
        </span>
      )}
    </div>
  );
}
