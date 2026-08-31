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
    <div className="mx-auto max-w-2xl space-y-4 p-5">
      <div>
        <h1 className="text-lg font-semibold">{t('settings.title')}</h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{t('settings.openSource')}</p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
        <h2 className="mb-3 text-xs font-semibold">{t('settings.theme')}</h2>
        <div className="flex flex-wrap gap-1.5">
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => void updateSettings({ theme })}
              className={`rounded-md px-3 py-1.5 text-xs ${
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

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
        <h2 className="mb-3 text-xs font-semibold">{t('settings.language')}</h2>
        <div className="flex gap-1.5">
          {(['cs', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => void updateSettings({ language: lang })}
              className={`rounded-md px-3 py-1.5 text-xs ${
                settings.language === lang
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              {lang === 'cs' ? 'Čeština' : 'English'}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">i18n: {i18n.language}</p>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
        <h2 className="mb-1.5 text-xs font-semibold">{t('settings.syncSection')}</h2>
        <p className="mb-3 text-[11px] text-[var(--muted)]">{t('settings.localModeHint')}</p>

        <label className="mb-3 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={settings.syncEnabled}
            onChange={(e) => void updateSettings({ syncEnabled: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          {t('settings.syncEnabled')}
        </label>

        {!settings.syncEnabled ? (
          <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--accent)]">
            {t('settings.localMode')}
          </div>
        ) : (
          <>
            <label className="ui-label">{t('settings.syncUrl')}</label>
            <input
              type="url"
              value={settings.syncUrl}
              onChange={(e) => void updateSettings({ syncUrl: e.target.value })}
              placeholder="http://localhost:3847"
              className="ui-input mb-2"
            />
            <p className="mb-2 text-[11px] text-[var(--muted)]">{t('settings.syncUrlHint')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-[var(--surface-2)] p-2">
                <div className="text-[10px] uppercase text-[var(--muted)]">{t('settings.syncStatus')}</div>
                <div className={syncStatus.connected ? 'text-green-500' : 'text-amber-500'}>
                  {syncStatus.connected ? t('settings.connected') : t('settings.disconnected')}
                  {syncStatus.syncing && ` · ${t('settings.syncing')}`}
                </div>
              </div>
              <div className="rounded-md bg-[var(--surface-2)] p-2">
                <div className="text-[10px] uppercase text-[var(--muted)]">{t('settings.pending')}</div>
                <div>{syncStatus.pendingCount}</div>
              </div>
            </div>
            {syncStatus.error && (
              <p className="mt-2 text-xs text-red-400">
                {t('sync.error')}: {syncStatus.error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void syncNow()}
              className="mt-3 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
            >
              {t('actions.sync')}
            </button>
          </>
        )}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
        <h2 className="mb-1.5 text-xs font-semibold">{t('reminders.title')}</h2>
        <p className="mb-2 text-[11px] text-[var(--muted)]">{t('reminders.hint')}</p>
        <button
          type="button"
          onClick={() => void requestNotificationPermission()}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-2)]"
        >
          {t('reminders.enable')}
        </button>
      </section>
    </div>
  );
}
