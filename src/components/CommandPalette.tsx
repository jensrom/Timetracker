import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import type { Screen } from './Sidebar';
import { Search, Briefcase, Users, CheckSquare, Clock, LayoutDashboard, Settings } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
}

interface PaletteItem {
  id: string;
  type: 'nav' | 'case' | 'client' | 'task';
  label: string;
  sublabel?: string;
  screen: Screen;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const { clients, cases, tasks } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navItems: PaletteItem[] = [
    { id: 'nav-time',     type: 'nav', label: 'Registrer tid',   screen: 'timetracking', icon: Clock },
    { id: 'nav-dash',     type: 'nav', label: 'Dashboard',        screen: 'dashboard',    icon: LayoutDashboard },
    { id: 'nav-clients',  type: 'nav', label: 'Kunder',           screen: 'clients',      icon: Users },
    { id: 'nav-cases',    type: 'nav', label: 'Sager',            screen: 'cases',        icon: Briefcase },
    { id: 'nav-tasks',    type: 'nav', label: 'Opgaver',          screen: 'tasks',        icon: CheckSquare },
    { id: 'nav-settings', type: 'nav', label: 'Indstillinger',    screen: 'settings',     icon: Settings },
  ];

  const items = useMemo((): PaletteItem[] => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase();
    const results: PaletteItem[] = [];

    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(q)) results.push(item);
    });

    clients.forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({ id: `client-${c.id}`, type: 'client', label: c.name, sublabel: c.cvr ? `CVR: ${c.cvr}` : undefined, screen: 'clients', icon: Users });
      }
    });

    cases.forEach(c => {
      const client = clients.find(cl => cl.id === c.clientId);
      if (c.title.toLowerCase().includes(q) || (c.caseNumber ?? '').toLowerCase().includes(q)) {
        results.push({ id: `case-${c.id}`, type: 'case', label: c.title, sublabel: `${c.caseNumber ?? ''} · ${client?.name ?? ''}`, screen: 'cases', icon: Briefcase });
      }
    });

    tasks.forEach(t => {
      const c = cases.find(c => c.id === t.caseId);
      if (t.heading.toLowerCase().includes(q) || t.taskNumber.toLowerCase().includes(q)) {
        results.push({ id: `task-${t.id}`, type: 'task', label: t.heading, sublabel: `${t.taskNumber} · ${c?.title ?? ''}`, screen: 'tasks', icon: CheckSquare });
      }
    });

    return results.slice(0, 10);
  }, [query, clients, cases, tasks]);

  useEffect(() => { setSelectedIndex(0); }, [items]);

  function handleSelect(item: PaletteItem) {
    onNavigate(item.screen);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (items[selectedIndex]) handleSelect(items[selectedIndex]); }
    if (e.key === 'Escape')    { onClose(); }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-20 px-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Søg eller naviger..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          <kbd className="text-xs font-mono bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-400">Ingen resultater for "{query}"</p>
          ) : (
            items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    i === selectedIndex ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon size={14} className={i === selectedIndex ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${i === selectedIndex ? 'text-blue-600' : 'text-gray-800'}`}>{item.label}</p>
                    {item.sublabel && <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>}
                  </div>
                  {item.type === 'nav' && (
                    <span className="ml-auto text-xs text-gray-400">Naviger</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono bg-gray-100 border border-gray-200 rounded px-1 py-0.5">↑↓</kbd> naviger</span>
          <span><kbd className="font-mono bg-gray-100 border border-gray-200 rounded px-1 py-0.5">Enter</kbd> vælg</span>
        </div>
      </div>
    </div>
  );
}
