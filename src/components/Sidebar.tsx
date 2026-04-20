import { Clock, LayoutDashboard, Briefcase, Users, Settings, TrendingUp, CheckSquare, LogOut } from 'lucide-react';
import type { AuthSession } from '../types';

export type Screen =
  | 'timetracking'
  | 'dashboard'
  | 'overtime'
  | 'cases'
  | 'clients'
  | 'tasks'
  | 'settings';

interface NavItem { id: Screen; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const NAV_GROUPS: NavItem[][] = [
  [
    { id: 'timetracking', label: 'Registrer tid', icon: Clock },
    { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'overtime',     label: 'Normtid',        icon: TrendingUp },
  ],
  [
    { id: 'clients', label: 'Kunder',    icon: Users },
    { id: 'cases',   label: 'Sager',     icon: Briefcase },
    { id: 'tasks',   label: 'Opgaver',   icon: CheckSquare },
  ],
  [
    { id: 'settings', label: 'Indstillinger', icon: Settings },
  ],
];

interface SidebarProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
  session: AuthSession;
  onLogout: () => void;
}

export default function Sidebar({ active, onNavigate, session, onLogout }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Timetracker</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-1 border-t border-gray-100" />}
            <div className="space-y-0.5">
              {group.map(item => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-100 text-left
                      ${isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {session.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{session.name}</p>
            <p className="text-xs text-gray-400">{session.role === 'admin' ? 'Admin' : 'Bruger'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Log ud"
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-300 pl-2 mt-0.5">v1.0.0</p>
      </div>
    </aside>
  );
}
