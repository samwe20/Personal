import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CommandPalette } from './components/CommandPalette';
import { FieldPanel, Outliner } from './components/Outliner';
import { Onboarding } from './components/Onboarding';
import { QuickCapture } from './components/QuickCapture';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './store/appStore';

export default function App() {
  const { t } = useTranslation();
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const activeView = useAppStore((s) => s.activeView);
  const showMobilePanel = useAppStore((s) => s.showMobilePanel);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);

  useKeyboardShortcuts();

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--muted)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <span>{t('app.shortName')}…</span>
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
          <>
            <TopBar />
            <div className="relative flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 overflow-auto">
                <Outliner />
              </div>
              <aside
                className={[
                  'border-l border-[var(--border)] bg-[var(--surface)]',
                  showMobilePanel && selectedNodeId
                    ? 'fixed inset-y-0 right-0 z-40 w-full max-w-sm shadow-2xl lg:relative lg:block lg:w-80 lg:shrink-0 lg:shadow-none'
                    : 'hidden lg:block lg:w-80 lg:shrink-0',
                  !selectedNodeId && 'lg:block',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <FieldPanel />
              </aside>
            </div>
          </>
        )}
      </main>

      <QuickCapture />
      <CommandPalette />
      <Onboarding />
    </div>
  );
}
