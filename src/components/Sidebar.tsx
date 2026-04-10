import { Clock, LayoutDashboard, Briefcase, Users, Settings, TrendingUp } from 'lucide-react';

export type Screen =
  | 'timetracking'
  | 'dashboard'
  | 'overtime'
  | 'cases'
  | 'clients'
  | 'settings';

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'timetracking', label: 'Registrer tid', icon: Clock },
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'overtime',     label: 'Normtid',         icon: TrendingUp },
  { id: 'cases',        label: 'Sager',           icon: Briefcase },
  { id: 'clients',      label: 'Kunder',          icon: Users },
  { id: 'settings',     label: 'Indstillinger',   icon: Settings },
];

interface SidebarProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm">Timetracker</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(item => {
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
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }
              `}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-gray-500'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Version */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">v1.0.0</p>
      </div>
    </aside>
  );
}
