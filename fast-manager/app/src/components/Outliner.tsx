import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPERTAG_MAP } from '../data/supertags';
import { BUILTIN_SUPERTAGS, useAppStore } from '../store/appStore';
import { SupertagPill } from './SupertagPill';
import { FieldEditor } from './SupertagPill';

export function Outliner() {
  const { t } = useTranslation();
  const nodes = useAppStore((s) => s.getVisibleNodes());
  const allNodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectNode = useAppStore((s) => s.selectNode);
  const editNodeContent = useAppStore((s) => s.editNodeContent);
  const addChildNode = useAppStore((s) => s.addChildNode);
  const removeNode = useAppStore((s) => s.removeNode);
  const attachTag = useAppStore((s) => s.attachTag);
  const activeView = useAppStore((s) => s.activeView);

  const renderNode = (node: (typeof nodes)[0], depth = 0) => {
    const children = allNodes.filter((n) => n.parentId === node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 ${isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-2)]'}`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => selectNode(node.id)}
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted)]" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap gap-1">
              {node.supertagIds.map((tagId) => (
                <SupertagPill key={tagId} tagId={tagId} />
              ))}
            </div>
            <EditableContent
              value={node.content}
              selected={isSelected}
              onChange={(v) => editNodeContent(node.id, v)}
              onTagTrigger={(tagName) => {
                const tag = BUILTIN_SUPERTAGS.find(
                  (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.id.toLowerCase() === tagName.toLowerCase(),
                );
                if (tag) void attachTag(node.id, tag.id);
              }}
            />
          </div>
          {isSelected && (
            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)]"
                onClick={(e) => {
                  e.stopPropagation();
                  void addChildNode(node.id);
                }}
              >
                +
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-red-400 hover:bg-[var(--surface)]"
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

  if (activeView === 'query') {
    return <QueryResults />;
  }

  return (
    <div className="space-y-1 p-4">
      {nodes.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{t('queries.noResults')}</p>
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

  if (results.length === 0) {
    return <p className="p-4 text-sm text-[var(--muted)]">{t('queries.noResults')}</p>;
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
          </tr>
        </thead>
        <tbody>
          {results.map((node) => {
            const primaryTag = node.supertagIds[0];
            const fields = primaryTag ? node.fieldValues[primaryTag] ?? {} : {};
            return (
              <tr
                key={node.id}
                className={`cursor-pointer border-b border-[var(--border)] hover:bg-[var(--surface-2)] ${selectedNodeId === node.id ? 'bg-[var(--accent-soft)]' : ''}`}
                onClick={() => selectNode(node.id)}
              >
                <td className="px-3 py-2">
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditableContent({
  value,
  selected,
  onChange,
  onTagTrigger,
}: {
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  onTagTrigger: (tag: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selected]);

  return (
    <div
      ref={ref}
      contentEditable={selected}
      suppressContentEditableWarning
      className="min-h-[1.5rem] outline-none"
      onBlur={(e) => {
        const text = e.currentTarget.textContent ?? '';
        if (text !== value) onChange(text);
        const match = text.match(/#(\w+)\s*$/);
        if (match) onTagTrigger(match[1]);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    >
      {value}
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

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--muted)]">
        {t('panel.noSelection')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <h2 className="mb-1 text-base font-semibold">{node.content.trim() || '—'}</h2>
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
    </div>
  );
}
