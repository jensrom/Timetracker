import { useState } from 'react';
import { useStore } from '../../store';
import { CheckCircle2, Download, FolderOpen, Database } from 'lucide-react';
import { format } from 'date-fns';

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<string | null>;
    };
  }
}

export default function SettingsDatabase() {
  const { settings, entries, cases, clients, tasks, templates, caseCategories, users, updateSettings } = useStore();
  const [exportStart, setExportStart] = useState(format(new Date(), 'yyyy-01-01'));
  const [exportEnd, setExportEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportMsg, setExportMsg] = useState('');

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
      ['Dato', 'Kunde', 'Sag', 'Sagsnummer', 'Kategori', 'Timer', 'Beskrivelse', 'On-site', 'On-site type', 'Faktureret'],
      ...filtered.map(e => {
        const c = cases.find(c => c.id === e.caseId);
        const client = c ? clients.find(cl => cl.id === c.clientId) : null;
        return [
          e.date, client?.name ?? '', c?.title ?? '', c?.caseNumber ?? '',
          settings.categoryNames[e.category] ?? e.category,
          e.hours.toString(), e.description,
          e.onSite ? 'Ja' : 'Nej', e.onSiteType ?? '', e.invoiced ? 'Ja' : 'Nej',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `timetracker-${exportStart}-${exportEnd}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportMsg(`${filtered.length} registreringer eksporteret.`);
    setTimeout(() => setExportMsg(''), 3000);
  }

  function handleExportJSON() {
    const data = JSON.stringify({ clients, cases, entries, tasks, templates, caseCategories, users: users.map(u => ({ ...u, passwordHash: '***' })) }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `timetracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`; a.click();
    URL.revokeObjectURL(url);
    setExportMsg('Data eksporteret som JSON.');
    setTimeout(() => setExportMsg(''), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database size={16} className="text-gray-400" /> Database oversigt
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          {[
            { label: 'Kunder', val: clients.length },
            { label: 'Sager', val: cases.length },
            { label: 'Opgaver', val: tasks.length },
            { label: 'Timer', val: entries.length },
            { label: 'Skabeloner', val: templates.length },
            { label: 'Brugere', val: users.length },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Electron DB path */}
      {window.electronAPI && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Database placering</h3>
          <p className="text-xs text-gray-500 mb-3">Vælg mappen hvor dine data gemmes</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 truncate">
              {settings.dbPath ?? 'Standard placering (brugerdata)'}
            </div>
            <button
              type="button"
              onClick={handleSelectFolder}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <FolderOpen size={14} /> Vælg mappe
            </button>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Eksport</h3>
        <p className="text-xs text-gray-500 mb-4">Eksporter dine tidsregistreringer som CSV eller fuld JSON backup</p>

        <div className="flex gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fra</label>
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Til</label>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Download size={14} /> Eksporter CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            <Download size={14} /> Backup JSON
          </button>
        </div>

        {exportMsg && (
          <p className="mt-3 text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {exportMsg}
          </p>
        )}
      </div>
    </div>
  );
}
