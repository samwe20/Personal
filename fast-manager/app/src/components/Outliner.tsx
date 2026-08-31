import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPERTAG_MAP } from '../data/supertags';
import { BUILTIN_SUPERTAGS, useAppStore } from '../store/appStore';
import { FieldEditor } from './FieldEditor';
import { NodeContent } from './NodeContent';
import { SupertagPill } from './SupertagPill';

export function Outliner() {
  const { t } = useTranslation();
  const nodes = useAppStore((s) => s.getVisibleNodes());
  const allNodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const activeView = useAppStore((s) => s.activeView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectNode = useAppStore((s) => s.selectNode);
  const editNodeContent = useAppStore((s) => s.editNodeContent);
  const addChildNode = useAppStore((s) => s.addChildNode);
  const removeNode = useAppStore((s) => s.removeNode);
  const attachTag = useAppStore((s) => s.attachTag);
  const completeTask = useAppStore((s) => s.completeTask);
  const moveNodeTo = useAppStore((s) => s.moveNodeTo);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragNodeId = useRef<string | null>(null);

  const handleDrop = (targetId: string, position: 'before' | 'inside') => {
    const draggedId = dragNodeId.current;
    if (!draggedId || draggedId === targetId) return;
    const target = allNodes.find((n) => n.id === targetId);
    if (!target) return;

    const parentId = position === 'inside' ? targetId : target.parentId;
    const siblings = allNodes.filter((n) => n.parentId === parentId && n.id !== draggedId).sort((a, b) => a.order - b.order);
    const targetIndex = siblings.findIndex((n) => n.id === targetId);
    const insertIndex = position === 'inside' ? 0 : targetIndex + (position === 'before' ? 0 : 1);

    void moveNodeTo(draggedId, parentId, insertIndex);
    dragNodeId.current = null;
    setDragOverId(null);
  };

  const renderNode = (node: (typeof nodes)[0], depth = 0) => {
    const children = allNodes.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);
    const isSelected = selectedNodeId === node.id;
    const isTask = node.supertagIds.includes('task');
    const isDone = node.fieldValues.task?.status === 'done';

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={() => {
            dragNodeId.current = node.id;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverId(node.id);
          }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(node.id, e.shiftKey ? 'inside' : 'before');
          }}
          className={`group flex items-start gap-2 rounded-xl border border-transparent px-2 py-2 transition ${isSelected ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)]' : 'hover:border-[var(--border)] hover:bg-[var(--surface-2)]'} ${dragOverId === node.id ? 'ring-2 ring-[var(--accent)]' : ''} ${isDone ? 'opacity-60' : ''}`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => selectNode(node.id)}
        >
          {isTask ? (
            <button
              type="button"
              className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)]"
              onClick={(e) => {
                e.stopPropagation();
                void completeTask(node.id);
              }}
            >
              {isDone ? '✓' : ''}
            </button>
          ) : (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted)]" />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap gap-1">
              {node.supertagIds.map((tagId) => (
                <SupertagPill key={tagId} tagId={tagId} />
              ))}
            </div>
            <NodeContent
              value={node.content}
              selected={isSelected}
              onChange={(v) => editNodeContent(node.id, v)}
              onTagTrigger={(tagName) => {
                const tag = BUILTIN_SUPERTAGS.find(
                  (tg) => tg.name.toLowerCase() === tagName.toLowerCase() || tg.id.toLowerCase() === tagName.toLowerCase(),
                );
                if (tag) void attachTag(node.id, tag.id);
              }}
            />
          </div>
          {isSelected && (
            <div className="flex shrink-0 gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)]"
                onClick={(e) => {
                  e.stopPropagation();
                  void addChildNode(node.id);
                }}
              >
                +
              </button>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-[var(--surface)]"
                onClick={(e) => {
                  e.stopPropagation();
                  void removeNode(node.id);
                }}
              >
                {t('actions.delete')}
              </button>
            </div>
          )}
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (activeView === 'query') return <QueryResults />;

  return (
    <div className="space-y-1 p-4">
      {activeView === 'search' && searchQuery && (
        <p className="mb-3 text-xs text-[var(--muted)]">
          {t('search.results', { count: nodes.length, query: searchQuery })}
        </p>
      )}
      {nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">{t('queries.noResults')}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{t('capture.hint')}</p>
        </div>
      ) : (
        nodes.map((node) => renderNode(node))
      )}
    </div>
  );
}

function QueryResults() {
  const { t } = useTranslation();
  const results = useAppStore((s) => s.getQueryResults());
  const selectNode = useAppStore((s) => s.selectNode);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const completeTask = useAppStore((s) => s.completeTask);

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[var(--muted)]">{t('queries.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">{t('fields.status')}</th>
            <th className="px-3 py-2">{t('fields.dueDate')}</th>
            <th className="px-3 py-2">{t('fields.priority')}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {results.map((node) => {
            const primaryTag = node.supertagIds[0];
            const fields = primaryTag ? node.fieldValues[primaryTag] ?? {} : {};
            return (
              <tr
                key={node.id}
                className={`border-b border-[var(--border)] transition hover:bg-[var(--surface-2)] ${selectedNodeId === node.id ? 'bg-[var(--accent-soft)]' : ''}`}
              >
                <td className="cursor-pointer px-3 py-2" onClick={() => selectNode(node.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    {node.supertagIds.map((id) => (
                      <SupertagPill key={id} tagId={id} />
                    ))}
                    <span>{node.content}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{t(`status.${fields.status}`, String(fields.status ?? ''))}</td>
                <td className="px-3 py-2">{String(fields.dueDate ?? fields.date ?? '')}</td>
                <td className="px-3 py-2">{t(`status.${fields.priority}`, String(fields.priority ?? ''))}</td>
                <td className="px-3 py-2">
                  {node.supertagIds.includes('task') && fields.status !== 'done' && (
                    <button
                      type="button"
                      onClick={() => void completeTask(node.id)}
                      className="rounded-lg bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]"
                    >
                      ✓
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FieldPanel() {
  const { t } = useTranslation();
  const nodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setField = useAppStore((s) => s.setField);
  const attachTag = useAppStore((s) => s.attachTag);
  const detachTag = useAppStore((s) => s.detachTag);
  const selectNode = useAppStore((s) => s.selectNode);
  const getNodeBacklinks = useAppStore((s) => s.getNodeBacklinks);
  const resolveNodeTitle = useAppStore((s) => s.resolveNodeTitle);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--muted)]">
        {t('panel.noSelection')}
      </div>
    );
  }

  const backlinks = getNodeBacklinks(node.id);

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <h2 className="mb-1 line-clamp-2 text-base font-semibold">{node.content.trim() || '—'}</h2>
      <p className="mb-4 text-xs text-[var(--muted)]">{t('panel.fields')}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {node.supertagIds.map((tagId) => (
          <SupertagPill key={tagId} tagId={tagId} onRemove={() => void detachTag(node.id, tagId)} />
        ))}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[11px] uppercase tracking-wide text-[var(--muted)]">
          {t('panel.addSupertag')}
        </label>
        <div className="flex flex-wrap gap-2">
          {BUILTIN_SUPERTAGS.filter((tag) => !node.supertagIds.includes(tag.id)).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => void attachTag(node.id, tag.id)}
              className="rounded-full px-2 py-1 text-[11px] font-semibold transition hover:opacity-80"
              style={{ background: `${tag.color}22`, color: tag.color }}
            >
              + #{t(`supertags.${tag.id}`, tag.name)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {node.supertagIds.map((tagId) => {
          const tag = SUPERTAG_MAP[tagId];
          if (!tag) return null;
          return (
            <div key={tagId} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="mb-3 text-xs font-semibold" style={{ color: tag.color }}>
                #{t(`supertags.${tagId}`, tag.name)}
              </div>
              <div className="space-y-3">
                {tag.fields.map((field) => (
                  <FieldEditor
                    key={field.key}
                    field={field}
                    value={node.fieldValues[tagId]?.[field.key]}
                    onChange={(v) => void setField(node.id, tagId, field.key, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {backlinks.length > 0 && (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">{t('reference.backlinks')}</h3>
          <ul className="space-y-1">
            {backlinks.map((bl) => (
              <li key={bl.id}>
                <button
                  type="button"
                  onClick={() => selectNode(bl.id)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-2)]"
                >
                  {resolveNodeTitle(bl.id)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
