import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUILTIN_SUPERTAGS, useAppStore } from '../store/appStore';

export function QuickCapture() {
  const { t } = useTranslation();
  const open = useAppStore((s) => s.quickCaptureOpen);
  const closeQuickCapture = useAppStore((s) => s.closeQuickCapture);
  const quickCapture = useAppStore((s) => s.quickCapture);
  const inputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [tagId, setTagId] = useState('task');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (open) {
      setContent('');
      setDueDate('');
      setReminderTime('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    void quickCapture({ content, supertagId: tagId, dueDate: dueDate || undefined, reminderTime: reminderTime || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm" onClick={closeQuickCapture}>
      <div
        className="w-full max-w-lg animate-[fadeIn_0.15s_ease] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">{t('capture.title')}</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">{t('capture.hint')}</p>

        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') closeQuickCapture();
          }}
          placeholder={t('capture.placeholder')}
          className="mb-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-base outline-none ring-[var(--accent)] focus:ring-2"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase text-[var(--muted)]">{t('capture.supertag')}</label>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              {BUILTIN_SUPERTAGS.slice(0, 6).map((tag) => (
                <option key={tag.id} value={tag.id}>
                  #{t(`supertags.${tag.id}`, tag.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase text-[var(--muted)]">{t('fields.dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-[11px] uppercase text-[var(--muted)]">{t('fields.reminderTime')}</label>
          <input
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={closeQuickCapture} className="rounded-lg px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]">
            {t('capture.cancel')}
          </button>
          <button type="button" onClick={submit} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {t('capture.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
