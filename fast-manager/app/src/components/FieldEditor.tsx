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
      <label className="flex items-center gap-1.5 text-xs">
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
        <label className="ui-label">{label}</label>
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="ui-input flex items-center justify-between text-left"
        >
          <span className={selectedId ? '' : 'text-[var(--muted)]'}>
            {selectedId ? resolveNodeTitle(selectedId) : t('reference.pick')}
          </span>
          <span className="text-[var(--muted)]">▾</span>
        </button>
        {pickerOpen && (
          <div className="absolute z-20 mt-0.5 max-h-40 w-full overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <button
              type="button"
              className="block w-full px-2 py-1.5 text-left text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
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
                className={`block w-full px-2 py-1.5 text-left text-xs hover:bg-[var(--surface-2)] ${selectedId === node.id ? 'bg-[var(--accent-soft)]' : ''}`}
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
        <label className="ui-label">{label}</label>
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="ui-input">
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
        <label className="ui-label">{label}</label>
        <input
          type="datetime-local"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="ui-input"
        />
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="ui-label">{label}</label>
        <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="ui-input" />
      </div>
    );
  }

  return (
    <div>
      <label className="ui-label">{label}</label>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        className="ui-input"
      />
    </div>
  );
}
