import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { getReferenceCandidates } from '../utils/nodeUtils';
import type { FieldDef } from '../types';

interface FieldEditorProps {
  field: FieldDef;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

export function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const { t } = useTranslation();
  const nodes = useAppStore((s) => s.nodes);
  const resolveNodeTitle = useAppStore((s) => s.resolveNodeTitle);
  const [pickerOpen, setPickerOpen] = useState(false);
  const label = t(`fields.${field.key}`, field.key);

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        {label}
      </label>
    );
  }

  if (field.type === 'reference') {
    const candidates = getReferenceCandidates(nodes, field.referenceSupertag);
    const selectedId = String(value ?? '');

    return (
      <div className="relative">
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</label>
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm"
        >
          <span className={selectedId ? '' : 'text-[var(--muted)]'}>
            {selectedId ? resolveNodeTitle(selectedId) : t('reference.pick')}
          </span>
          <span className="text-[var(--muted)]">▾</span>
        </button>
        {pickerOpen && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
              onClick={() => {
                onChange('');
                setPickerOpen(false);
              }}
            >
              —
            </button>
            {candidates.map((node) => (
              <button
                key={node.id}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] ${selectedId === node.id ? 'bg-[var(--accent-soft)]' : ''}`}
                onClick={() => {
                  onChange(node.id);
                  setPickerOpen(false);
                }}
              >
                {node.content.trim() || node.id.slice(0, 8)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</label>
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {t(`status.${opt}`, opt)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'datetime') {
    return (
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</label>
        <input
          type="datetime-local"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        />
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</label>
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</label>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
      />
    </div>
  );
}
