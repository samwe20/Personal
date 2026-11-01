import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { addDaysIso, localToday, weekDates } from '../utils/dateUtils';
import { displayTitle } from '../utils/nodeUtils';

function monthMatrix(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  const weekday = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function CalendarView() {
  const { t, i18n } = useTranslation();
  const nodes = useAppStore((s) => s.nodes);
  const openDaily = useAppStore((s) => s.openDaily);
  const openObject = useAppStore((s) => s.openObject);
  const today = localToday();
  const initial = new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const week = weekDates(selected);

  const days = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const label = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    new Date(cursor.year, cursor.month, 1),
  );

  const move = (delta: number) => {
    if (mode === 'week') {
      const next = addDaysIso(selected, delta * 7);
      const [year, month] = next.split('-').map(Number);
      setSelected(next);
      setCursor({ year, month: month - 1 });
      return;
    }
    setCursor((current) => shift(current, delta));
  };

  const dated = nodes.filter((node) => nodeTouchesDay(node, selected));
  const created = nodes.filter((node) => node.createdAt.slice(0, 10) === selected && !dated.includes(node));

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.8fr]">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-[var(--font-title)] text-3xl capitalize">{label}</h1>
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => move(-1)} aria-label={t('calendar.previous')}>←</button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCursor({ year: now.getFullYear(), month: now.getMonth() });
                setSelected(today);
              }}
            >
              {t('calendar.today')}
            </button>
            <button type="button" onClick={() => move(1)} aria-label={t('calendar.next')}>→</button>
            <button
              type="button"
              className={mode === 'month' ? 'text-[var(--text)]' : 'text-[var(--muted)]'}
              onClick={() => setMode('month')}
            >
              {t('calendar.month')}
            </button>
            <button
              type="button"
              className={mode === 'week' ? 'text-[var(--text)]' : 'text-[var(--muted)]'}
              onClick={() => setMode('week')}
            >
              {t('calendar.week')}
            </button>
          </div>
        </div>
        {mode === 'week' && (
          <div className="mt-1 grid grid-cols-7 gap-2">
            {week.map((key) => {
              const day = new Date(`${key}T12:00:00`);
              const count = nodes.filter((node) => nodeTouchesDay(node, key)).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`min-h-28 rounded-lg px-2 py-2 text-left text-sm ${key === selected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--paper)]'}`}
                >
                  <span className="block text-xs opacity-80">
                    {new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(day)}
                  </span>
                  <span className="mt-1 block text-lg">{day.getDate()}</span>
                  {count > 0 && <span className="mt-3 block text-xs">{count}</span>}
                </button>
              );
            })}
          </div>
        )}
        {mode === 'month' && (
        <>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
          {Array.from({ length: 7 }, (_, index) =>
            new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(2024, 0, 1 + index)),
          ).map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = iso(day);
            const note = nodes.find((node) => node.typeId === 'dailyNote' && node.fieldValues.dailyNote?.date === key);
            const inMonth = day.getMonth() === cursor.month;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={[
                  'h-16 rounded-lg text-left text-sm',
                  key === selected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--paper)]',
                  inMonth ? '' : 'opacity-40',
                ].join(' ')}
              >
                <span className="block px-2 pt-1">{day.getDate()}</span>
                {note && (
                  <span className={`mx-2 mt-2 block h-1.5 rounded-full ${note.reviewed ? 'bg-emerald-600' : 'bg-[var(--muted)]'}`} />
                )}
              </button>
            );
          })}
        </div>
        </>
        )}
      </section>
      <aside>
        <h2 className="font-[var(--font-title)] text-2xl">{selected}</h2>
        <button type="button" className="mt-3 text-sm underline" onClick={() => void openDaily(selected)}>
          {t('calendar.openNote')}
        </button>
        <h3 className="mt-6 text-xs uppercase tracking-wide text-[var(--muted)]">{t('calendar.dated')}</h3>
        <div className="mt-2 space-y-1">
          {dated.map((node) => (
            <button key={node.id} type="button" className="block text-sm" onClick={() => openObject(node.id)}>
              {displayTitle(nodes, node)}
            </button>
          ))}
        </div>
        <h3 className="mt-6 text-xs uppercase tracking-wide text-[var(--muted)]">{t('calendar.created')}</h3>
        <div className="mt-2 space-y-1">
          {created.map((node) => (
            <button key={node.id} type="button" className="block text-sm" onClick={() => openObject(node.id)}>
              {displayTitle(nodes, node)}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function nodeTouchesDay(node: { typeId?: string; fieldValues: Record<string, Record<string, string | number | boolean>> }, day: string): boolean {
  const bag = node.typeId ? node.fieldValues[node.typeId] ?? {} : {};
  return Object.values(bag).some((value) => typeof value === 'string' && value.slice(0, 10) === day);
}

function shift(cursor: { year: number; month: number }, delta: number) {
  const date = new Date(cursor.year, cursor.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
