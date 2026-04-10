import { useState } from 'react';
import { useStore } from '../store';
import { ALL_CATEGORIES, type TimeCategory, CATEGORY_TAILWIND } from '../types';
import { CheckCircle2, Download, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<string | null>;
      exportData: (data: string, filename: string) => Promise<void>;
    };
  }
}

export default function Settings() {
  const { settings, entries, cases, clients, updateSettings } = useStore();
  const [saved, setSaved] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<TimeCategory, string>>(
    { ...settings.categoryNames }
  );
  const [weeklyHours, setWeeklyHours] = useState(settings.weeklyHours);
  const [exportStart, setExportStart] = useState(format(new Date(), 'yyyy-01-01'));
  const [exportEnd, setExportEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportMsg, setExportMsg] = useState('');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ categoryNames, weeklyHours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSelectFolder() {
    if (window.electronAPI?.selectFolder) {
      window.electronAPI.selectFolder().then(path => {
        if (path) updateSettings({ dbPath: path });
      });
    }
  }

  function handleExportCSV() {
    const filtered = entries.filter(e => e.date >= exportStart && e.date <= exportEnd);
    const rows = [
      ['Dato', 'Kunde', 'Sag', 'Kategori', 'Timer', 'Beskrivelse', 'On-site', 'On-site type', 'Faktureret'],
      ...filtered.map(e => {
        const c = cases.find(c => c.id === e.caseId);
        const client = c ? clients.find(cl => cl.id === c.clientId) : null;
        return [
          e.date,
          client?.name ?? '',
          c?.title ?? '',
          settings.categoryNames[e.category] ?? e.category,
          e.hours.toString(),
          e.description,
          e.onSite ? 'Ja' : 'Nej',
          e.onSiteType ?? '',
          e.invoiced ? 'Ja' : 'Nej',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker-${exportStart}-${exportEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg(`${filtered.length} registreringer eksporteret.`);
    setTimeout(() => setExportMsg(''), 3000);
  }

  function handleExportJSON() {
    const data = JSON.stringify({ clients, cases, entries }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('Data eksporteret som JSON.');
    setTimeout(() => setExportMsg(''), 3000);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Indstillinger</h1>
        <p className="text-gray-400 text-sm mt-1">Tilpas applikationen efter dine behov</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Normtid */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Normtid</h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Timer pr. uge</label>
              <input
                type="number"
                min="1"
                max="60"
                step="0.5"
                value={weeklyHours}
                onChange={e => setWeeklyHours(parseFloat(e.target.value))}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-400 mt-5">
              = {(weeklyHours / 5).toFixed(1)} timer pr. dag
            </div>
          </div>
        </div>

        {/* Kategorinavne */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Kategorinavne</h2>
          <p className="text-xs text-gray-500 mb-4">Omdøb kategorierne til din arbejdsgang</p>
          <div className="space-y-3">
            {ALL_CATEGORIES.map(cat => {
              const colors = CATEGORY_TAILWIND[cat];
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                  <span className="text-xs text-gray-500 w-28 shrink-0">{cat}</span>
                  <input
                    type="text"
                    value={categoryNames[cat]}
                    onChange={e => setCategoryNames(n => ({ ...n, [cat]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Database placering (Electron only) */}
        {window.electronAPI && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Database</h2>
            <p className="text-xs text-gray-500 mb-3">Vælg mappen hvor dine data gemmes</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 truncate">
                {settings.dbPath ?? 'Standard placering (brugerdata)'}
              </div>
              <button
                type="button"
                onClick={handleSelectFolder}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg text-sm transition-colors"
              >
                <FolderOpen size={14} /> Vælg mappe
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Gem indstillinger
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 size={16} /> Gemt!
            </span>
          )}
        </div>
      </form>

      {/* Export */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
        <h2 className="text-sm font-semibold text-white mb-1">Eksport</h2>
        <p className="text-xs text-gray-500 mb-4">Eksporter dine tidsregistreringer som CSV eller JSON</p>

        <div className="flex gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fra</label>
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Til</label>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            <Download size={14} /> Eksporter CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg text-sm transition-colors"
          >
            <Download size={14} /> Backup JSON
          </button>
        </div>

        {exportMsg && (
          <p className="mt-3 text-sm text-green-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {exportMsg}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
        <h2 className="text-sm font-semibold text-white mb-3">Database oversigt</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{clients.length}</p>
            <p className="text-xs text-gray-500">Kunder</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{cases.length}</p>
            <p className="text-xs text-gray-500">Sager</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{entries.length}</p>
            <p className="text-xs text-gray-500">Registreringer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
