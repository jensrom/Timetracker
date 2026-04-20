import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import type { Screen } from './components/Sidebar';
import TimeTracking from './screens/TimeTracking';
import TimeDashboard from './screens/TimeDashboard';
import OvertimeDashboard from './screens/OvertimeDashboard';
import Cases from './screens/Cases';
import Clients from './screens/Clients';
import Settings from './screens/Settings';
import Tasks from './screens/Tasks';
import Login from './screens/Login';
import CommandPalette from './components/CommandPalette';
import { useStore, useSession } from './store';

export default function App() {
  const session = useSession();
  const { logout } = useStore();
  const [screen, setScreen] = useState<Screen>('timetracking');
  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const pendingGRef = useRef(false);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // Cmd/Ctrl+K — always works
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(p => !p);
        return;
      }

      if (inInput) return;

      if (e.key === '?') { setShowShortcuts(p => !p); return; }
      if (e.key === 'Escape') { setShowPalette(false); setShowShortcuts(false); return; }

      if (e.key === 'n' || e.key === 'N') {
        document.dispatchEvent(new CustomEvent('app:new-item'));
        return;
      }

      // G + letter navigation
      if (e.key === 'g' || e.key === 'G') {
        pendingGRef.current = true;
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = setTimeout(() => { pendingGRef.current = false; }, 500);
        return;
      }

      if (pendingGRef.current) {
        pendingGRef.current = false;
        clearTimeout(pendingTimeoutRef.current);
        if (e.key === 'c') { setScreen('clients'); return; }
        if (e.key === 's') { setScreen('cases'); return; }
        if (e.key === 'o') { setScreen('tasks'); return; }
        if (e.key === 't') { setScreen('timetracking'); return; }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (!session) return <Login />;

  function renderScreen() {
    switch (screen) {
      case 'timetracking': return <TimeTracking />;
      case 'dashboard':    return <TimeDashboard />;
      case 'overtime':     return <OvertimeDashboard />;
      case 'cases':        return <Cases />;
      case 'clients':      return <Clients />;
      case 'tasks':        return <Tasks />;
      case 'settings':     return <Settings />;
    }
  }

  return (
    <>
      <Layout activeScreen={screen} onNavigate={setScreen} session={session} onLogout={handleLogout}>
        {renderScreen()}
      </Layout>
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onNavigate={setScreen}
      />
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tastaturgenveje</h2>
            </div>
            <div className="p-5 space-y-2 text-sm">
              {[
                ['Ctrl/Cmd + K', 'Åbn command palette'],
                ['N', 'Nyt element (kontekst-afhængig)'],
                ['G → C', 'Gå til Kunder'],
                ['G → S', 'Gå til Sager'],
                ['G → O', 'Gå til Opgaver'],
                ['G → T', 'Gå til Registrer tid'],
                ['Escape', 'Luk modal / palette'],
                ['?', 'Vis/skjul genveje'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-600">{desc}</span>
                  <kbd className="font-mono text-xs bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-700">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
