import { useEffect, useRef } from 'react';
import { parseChecklistLines, toggleChecklistLine } from '../utils/contentUtils';

interface NodeContentProps {
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  onTagTrigger: (tag: string) => void;
}

export function NodeContent({ value, selected, onChange, onTagTrigger }: NodeContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { hasChecklist } = parseChecklistLines(value);

  useEffect(() => {
    if (selected && ref.current && !hasChecklist && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selected, hasChecklist]);

  if (hasChecklist && !selected) {
    const lines = value.split('\n');
    return (
      <div className="space-y-0.5 text-sm">
        {lines.map((line, i) => {
          const match = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
          if (!match) return <div key={i}>{line || '\u00A0'}</div>;
          const checked = match[2].toLowerCase() === 'x';
          return (
            <label key={i} className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleChecklistLine(value, i))}
                className="mt-1 accent-[var(--accent)]"
              />
              <span className={checked ? 'text-[var(--muted)] line-through' : ''}>{match[3] || '—'}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      contentEditable={selected}
      suppressContentEditableWarning
      className="min-h-[1.5rem] whitespace-pre-wrap text-sm outline-none"
      onBlur={(e) => {
        const text = e.currentTarget.textContent ?? '';
        if (text !== value) onChange(text);
        const match = text.match(/#(\w+)\s*$/);
        if (match) onTagTrigger(match[1]);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const text = (e.target as HTMLElement).textContent ?? '';
          onChange(`${text}\n- [ ] `);
        }
      }}
    >
      {value}
    </div>
  );
}
