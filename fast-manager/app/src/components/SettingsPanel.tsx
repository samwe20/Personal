import { useTranslation } from 'react-i18next';
import { requestNotificationPermission } from '../services/reminderService';
import { useAppStore } from '../store/appStore';
import type { Language, Theme } from '../types';

export function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const syncNow = useAppStore((s) => s.syncNow);

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t('settings.openSource')}</p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold">{t('settings.theme')}</h2>
        <div className="flex flex-wrap gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => void updateSettings({ theme })}
              className={`rounded-lg px-4 py-2 text-sm ${
                settings.theme === theme
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {t(`settings.theme${theme[0].toUpperCase()}${theme.slice(1)}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {(['cs', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => void updateSettings({ language: lang })}
              className={`rounded-lg px-4 py-2 text-sm ${
                settings.language === lang
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {lang === 'cs' ? 'Čeština' : 'English'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">i18n: {i18n.language}</p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 text-sm font-semibold">{t('settings.syncUrl')}</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">{t('settings.syncUrlHint')}</p>
        <input
          type="url"
          value={settings.syncUrl}
          onChange={(e) => void updateSettings({ syncUrl: e.target.value })}
          placeholder="http://localhost:3847"
          className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <div className="text-[11px] uppercase text-[var(--muted)]">{t('settings.syncStatus')}</div>
            <div className={syncStatus.connected ? 'text-green-500' : 'text-amber-500'}>
              {syncStatus.connected ? t('settings.connected') : t('settings.disconnected')}
              {syncStatus.syncing && ` · ${t('settings.syncing')}`}
            </div>
          </div>
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <div className="text-[11px] uppercase text-[var(--muted)]">{t('settings.pending')}</div>
            <div>{syncStatus.pendingCount}</div>
          </div>
        </div>
        {syncStatus.error && (
          <p className="mt-3 text-sm text-red-400">
            {t('sync.error')}: {syncStatus.error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void syncNow()}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          {t('actions.sync')}
        </button>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 text-sm font-semibold">{t('reminders.title')}</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">{t('reminders.hint')}</p>
        <button
          type="button"
          onClick={() => void requestNotificationPermission()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]"
        >
          {t('reminders.enable')}
        </button>
      </section>
    </div>
  );
}
