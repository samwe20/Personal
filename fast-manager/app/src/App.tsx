import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldPanel, Outliner } from './components/Outliner';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { useAppStore } from './store/appStore';

export default function App() {
  const { t } = useTranslation();
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const activeView = useAppStore((s) => s.activeView);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--muted)]">
        {t('app.shortName')}…
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
        {activeView === 'settings' ? (
          <SettingsPanel />
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-auto border-r border-[var(--border)]">
              <Outliner />
            </div>
            <aside className="hidden w-80 shrink-0 bg-[var(--surface)] lg:block">
              <FieldPanel />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
