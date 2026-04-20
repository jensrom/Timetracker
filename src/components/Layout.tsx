import type { ReactNode } from 'react';
import Sidebar, { type Screen } from './Sidebar';
import type { AuthSession } from '../types';

interface LayoutProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  session: AuthSession;
  onLogout: () => void;
  children: ReactNode;
}

export default function Layout({ activeScreen, onNavigate, session, onLogout, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar active={activeScreen} onNavigate={onNavigate} session={session} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
