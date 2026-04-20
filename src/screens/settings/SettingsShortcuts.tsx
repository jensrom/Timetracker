import { Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Åbn command palette' },
      { keys: ['G', 'T'], description: 'Gå til Registrer tid' },
      { keys: ['G', 'C'], description: 'Gå til Kunder' },
      { keys: ['G', 'S'], description: 'Gå til Sager' },
      { keys: ['G', 'O'], description: 'Gå til Opgaver' },
    ],
  },
  {
    title: 'Handlinger',
    shortcuts: [
      { keys: ['N'], description: 'Nyt element (kontekst-afhængig)' },
      { keys: ['Enter'], description: 'Bekræft / Gem formular' },
      { keys: ['Escape'], description: 'Luk modal / palette' },
      { keys: ['?'], description: 'Vis/skjul genveje' },
    ],
  },
  {
    title: 'Opgaver & Tjeklister',
    shortcuts: [
      { keys: ['J'], description: 'Næste element i liste' },
      { keys: ['K'], description: 'Forrige element i liste' },
      { keys: ['Space'], description: 'Slå afkrydsning til/fra' },
    ],
  },
];

function KbdKey({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 font-mono text-xs bg-gray-100 border border-gray-300 border-b-2 rounded text-gray-700 shadow-sm">
      {label}
    </kbd>
  );
}

export default function SettingsShortcuts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Keyboard size={16} />
        <span>Alle tastaturgenveje i systemet</span>
      </div>

      {SHORTCUT_GROUPS.map(group => (
        <div key={group.title} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{group.title}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {group.shortcuts.map(({ keys, description }) => (
              <div key={description} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">{description}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-xs text-gray-400 mx-0.5">›</span>}
                      <KbdKey label={k} />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-400">
        Genveje er ikke aktive mens du skriver i et inputfelt. Tryk Escape for at forlade et felt.
      </p>
    </div>
  );
}
