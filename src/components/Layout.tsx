import type { ReactNode } from 'react';
import Sidebar, { type Screen } from './Sidebar';

interface LayoutProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
}

export default function Layout({ activeScreen, onNavigate, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar active={activeScreen} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
