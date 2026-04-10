import { useState } from 'react';
import Layout from './components/Layout';
import type { Screen } from './components/Sidebar';
import TimeTracking from './screens/TimeTracking';
import TimeDashboard from './screens/TimeDashboard';
import OvertimeDashboard from './screens/OvertimeDashboard';
import Cases from './screens/Cases';
import Clients from './screens/Clients';
import Settings from './screens/Settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('timetracking');

  function renderScreen() {
    switch (screen) {
      case 'timetracking': return <TimeTracking />;
      case 'dashboard':    return <TimeDashboard />;
      case 'overtime':     return <OvertimeDashboard />;
      case 'cases':        return <Cases />;
      case 'clients':      return <Clients />;
      case 'settings':     return <Settings />;
    }
  }

  return (
    <Layout activeScreen={screen} onNavigate={setScreen}>
      {renderScreen()}
    </Layout>
  );
}
