import { useTranslation } from 'react-i18next';
import { SUPERTAG_MAP } from '../data/supertags';
import type { FieldDef } from '../types';

interface SupertagPillProps {
  tagId: string;
  onRemove?: () => void;
}

export function SupertagPill({ tagId, onRemove }: SupertagPillProps) {
  const { t } = useTranslation();
  const tag = SUPERTAG_MAP[tagId];
  if (!tag) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `${tag.color}22`, color: tag.color }}
    >
      #{t(`supertags.${tagId}`, tag.name)}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 opacity-70 hover:opacity-100"
          aria-label={t('panel.removeSupertag')}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface FieldEditorProps {
  field: FieldDef;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

export function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const { t } = useTranslation();
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
