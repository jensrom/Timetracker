import { useState } from 'react';
import { useSession } from '../store';
import SettingsGenerelt from './settings/SettingsGenerelt';
import SettingsKategorier from './settings/SettingsKategorier';
import SettingsSkabeloner from './settings/SettingsSkabeloner';
import SettingsBrugere from './settings/SettingsBrugere';
import SettingsShortcuts from './settings/SettingsShortcuts';
import SettingsDatabase from './settings/SettingsDatabase';

type SettingsTab = 'generelt' | 'kategorier' | 'skabeloner' | 'brugere' | 'genveje' | 'database';

export default function Settings() {
  const session = useSession();
  const [tab, setTab] = useState<SettingsTab>('generelt');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'generelt',    label: 'Generelt' },
    { id: 'kategorier',  label: 'Kategorier' },
    { id: 'skabeloner',  label: 'Skabeloner' },
    ...(session?.role === 'admin' ? [{ id: 'brugere' as SettingsTab, label: 'Brugere' }] : []),
    { id: 'genveje',     label: 'Tastaturgenveje' },
    { id: 'database',    label: 'Database & Eksport' },
  ];

  function renderTab() {
    switch (tab) {
      case 'generelt':   return <SettingsGenerelt />;
      case 'kategorier': return <SettingsKategorier />;
      case 'skabeloner': return <SettingsSkabeloner />;
      case 'brugere':    return <SettingsBrugere />;
      case 'genveje':    return <SettingsShortcuts />;
      case 'database':   return <SettingsDatabase />;
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Indstillinger</h1>
        <p className="text-gray-500 text-sm mt-1">Tilpas systemet efter dine behov</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {renderTab()}
    </div>
  );
}
