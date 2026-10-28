import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Block, BlockType, NodeRecord } from '../types';
import { emptyBlock } from '../utils/blocks';
import { objectTitle } from '../utils/nodeUtils';

interface BlockEditorProps {
  blocks: Block[];
  nodes: NodeRecord[];
  onChange: (blocks: Block[]) => void;
  onOpen: (id: string) => void;
}

const SLASH: { id: BlockType; level?: 1 | 2 | 3; labelKey: string }[] = [
  { id: 'paragraph', labelKey: 'blocks.paragraph' },
  { id: 'heading', level: 1, labelKey: 'blocks.heading1' },
  { id: 'heading', level: 2, labelKey: 'blocks.heading2' },
  { id: 'bullet', labelKey: 'blocks.bullet' },
  { id: 'todo', labelKey: 'blocks.todo' },
  { id: 'quote', labelKey: 'blocks.quote' },
];

export function BlockEditor({ blocks, nodes, onChange, onOpen }: BlockEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(blocks);
  const [slash, setSlash] = useState<number | null>(null);
  const [linkAt, setLinkAt] = useState<{ index: number; query: string } | null>(null);
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    setDraft(blocks);
  }, [blocks]);

  useEffect(() => {
    if (!focusId.current) return;
    const el = document.getElementById(`block-${focusId.current}`) as HTMLInputElement | null;
    el?.focus();
    focusId.current = null;
  }, [draft]);

  const linkHits = useMemo(() => {
    if (!linkAt) return [];
    const q = linkAt.query.toLowerCase();
    return nodes
      .filter((node) => {
        const title = objectTitle(node).toLowerCase();
        const alias = (node.aliases ?? []).some((item) => item.toLowerCase().includes(q));
        return !q || title.includes(q) || alias;
      })
      .slice(0, 8);
  }, [linkAt, nodes]);

  const commit = (next: Block[]) => {
    setDraft(next);
    onChange(next);
  };

  const updateText = (index: number, text: string) => {
    const next = draft.map((block, i) => (i === index ? { ...block, text } : block));
    setDraft(next);
    if (text.startsWith('/')) setSlash(index);
    else if (slash === index) setSlash(null);
    const mention = text.match(/(?:@|\[\[)([^\]\n]*)$/);
    if (mention) setLinkAt({ index, query: mention[1] ?? '' });
    else setLinkAt(null);
  };

  const applySlash = (index: number, type: BlockType, level?: 1 | 2 | 3) => {
    const next = draft.map((block, i) =>
      i === index ? { ...block, type, level, checked: type === 'todo' ? false : undefined, text: '' } : block,
    );
    setSlash(null);
    commit(next);
  };

  const insertLink = (index: number, node: NodeRecord) => {
    const current = draft[index];
    if (!current) return;
    const text = current.text.replace(/(?:@|\[\[)([^\]\n]*)$/, `[[${node.id}]] `);
    const next = draft.map((block, i) => (i === index ? { ...block, text } : block));
    setLinkAt(null);
    commit(next);
  };

  return (
    <div className="mt-6 space-y-1">
      {draft.map((block, index) => (
        <div key={block.id} className="group relative">
          <div
            className={[
              'flex items-start gap-2',
              block.type === 'quote' ? 'border-l-2 border-[var(--border)] pl-3' : '',
              block.type === 'bullet' ? 'pl-1' : '',
            ].join(' ')}
          >
            {block.type === 'todo' && (
              <input
                type="checkbox"
                checked={!!block.checked}
                className="mt-1.5 accent-[var(--accent)]"
                onChange={(event) => {
                  const next = draft.map((item, i) => (i === index ? { ...item, checked: event.target.checked } : item));
                  commit(next);
                }}
              />
            )}
            {block.type === 'bullet' && <span className="mt-1.5 text-[var(--muted)]">•</span>}
            <input
              id={`block-${block.id}`}
              value={block.text}
              placeholder={index === draft.length - 1 ? t('blocks.placeholder') : ''}
              onChange={(event) => updateText(index, event.target.value)}
              onBlur={() => {
                if (slash === null && linkAt === null) onChange(draft);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  const created = emptyBlock(block.type === 'todo' || block.type === 'bullet' ? block.type : 'paragraph');
                  const next = [...draft];
                  next.splice(index + 1, 0, created);
                  focusId.current = created.id;
                  setSlash(null);
                  commit(next);
                }
                if (event.key === 'Backspace' && block.text === '' && draft.length > 1) {
                  event.preventDefault();
                  const next = draft.filter((_, i) => i !== index);
                  focusId.current = next[Math.max(0, index - 1)]?.id ?? null;
                  commit(next);
                }
              }}
              className={`block-input ${block.type === 'heading' ? 'font-[var(--font-title)] text-xl' : ''} ${block.checked ? 'text-[var(--muted)] line-through' : ''}`}
            />
          </div>
          {block.text.includes('[[') && (
            <div className="pb-1 pl-6 text-sm text-[var(--muted)]">
              {renderLinkedText(block.text, nodes, onOpen)}
            </div>
          )}
          {slash === index && (
            <div className="absolute z-20 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--paper)] shadow-lg">
              {SLASH.map((item) => (
                <button
                  key={item.labelKey}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--surface-2)]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applySlash(index, item.id, item.level);
                  }}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          )}
          {linkAt?.index === index && linkHits.length > 0 && (
            <div className="absolute z-20 mt-1 w-64 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--paper)] shadow-lg">
              {linkHits.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--surface-2)]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertLink(index, node);
                  }}
                >
                  {objectTitle(node) || node.id.slice(0, 8)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function renderLinkedText(
  text: string,
  nodes: NodeRecord[],
  onOpen: (id: string) => void,
) {
  const parts = text.split(/(\[\[[0-9a-fA-F-]{8,}\]\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[\[([0-9a-fA-F-]{8,})\]\]$/);
    if (!match) return <span key={index}>{part}</span>;
    const node = nodes.find((item) => item.id === match[1]);
    const label = objectTitle(node) || match[1].slice(0, 8);
    return (
      <button
        key={index}
        type="button"
        className="mx-0.5 text-[var(--accent)] underline decoration-[var(--border)] underline-offset-2"
        onClick={() => onOpen(match[1])}
      >
        {label}
      </button>
    );
  });
}
