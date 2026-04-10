import { useState } from 'react';
import { useStore } from '../store';
import { type Case, CASE_STATUS_COLORS, CATEGORY_TAILWIND } from '../types';
import { formatHours } from '../utils/dateUtils';
import { Plus, Search, Pencil, Trash2, X, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type StatusFilter = Case['status'] | 'Alle';

const emptyForm = (): Omit<Case, 'id' | 'createdAt'> => ({
  clientId: '',
  title: '',
  description: '',
  status: 'Aktiv',
  estimatedHours: undefined,
});

export default function Cases() {
  const { clients, cases, entries, addCase, updateCase, deleteCase } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Alle');
  const [clientFilter, setClientFilter] = useState<string>('Alle');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const statuses: StatusFilter[] = ['Alle', 'Aktiv', 'På pause', 'Lukket', 'Faktureret'];

  const filtered = cases.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Alle' || c.status === statusFilter;
    const matchClient = clientFilter === 'Alle' || c.clientId === clientFilter;
    return matchSearch && matchStatus && matchClient;
  });

  function getCaseHours(caseId: string) {
    return entries.filter(e => e.caseId === caseId).reduce((sum, e) => sum + e.hours, 0);
  }

  function getCaseEntries(caseId: string) {
    return entries.filter(e => e.caseId === caseId).sort((a, b) => b.date.localeCompare(a.date));
  }

  function openCreate() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: Case) {
    setForm({
      clientId: c.clientId,
      title: c.title,
      description: c.description,
      status: c.status,
      estimatedHours: c.estimatedHours,
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.clientId) return;
    const data = {
      clientId: form.clientId,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      estimatedHours: form.estimatedHours ?? undefined,
    };
    if (editingId) {
      updateCase(editingId, data);
    } else {
      addCase({ id: uuidv4(), ...data, createdAt: new Date().toISOString() });
    }
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sager</h1>
          <p className="text-gray-400 text-sm mt-1">{cases.length} sager i alt</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny sag
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Søg i sager..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="Alle">Alle kunder</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cases list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p>Ingen sager fundet</p>
          </div>
        )}

        {filtered.map(c => {
          const client = clients.find(cl => cl.id === c.clientId);
          const hours = getCaseHours(c.id);
          const progress = c.estimatedHours ? Math.min((hours / c.estimatedHours) * 100, 100) : null;
          const isExpanded = expanded === c.id;
          const caseEntries = getCaseEntries(c.id);

          return (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase size={16} className="text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{c.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CASE_STATUS_COLORS[c.status]}`}>
                          {c.status}
                        </span>
                      </div>
                      {client && (
                        <p className="text-xs text-gray-500 mt-0.5">{client.name}</p>
                      )}
                      {c.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.description}</p>
                      )}

                      {/* Progress bar */}
                      {c.estimatedHours && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{formatHours(hours)} registreret</span>
                            <span>{formatHours(c.estimatedHours)} estimeret</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress! >= 100 ? 'bg-red-500' :
                                progress! >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {!c.estimatedHours && (
                        <p className="text-xs text-gray-500 mt-1">{formatHours(hours)} registreret</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : c.id)}
                      className="p-2 text-gray-500 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Vis tidsregistreringer"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {deleteConfirm === c.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                    <p className="text-sm text-red-400">Slet sagen og alle tilknyttede timer?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg">
                        Annuller
                      </button>
                      <button onClick={() => { deleteCase(c.id); setDeleteConfirm(null); }} className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg">
                        Slet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded entries */}
              {isExpanded && (
                <div className="border-t border-gray-800 bg-gray-950">
                  {caseEntries.length === 0 ? (
                    <p className="text-center py-4 text-sm text-gray-600">Ingen timer registreret på denne sag</p>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {caseEntries.map(entry => {
                        const colors = CATEGORY_TAILWIND[entry.category];
                        return (
                          <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-xs text-gray-500 w-20 shrink-0">{entry.date}</span>
                            <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {entry.category}
                            </span>
                            <span className="text-sm text-gray-300 flex-1 truncate">{entry.description || '—'}</span>
                            <span className="text-sm font-medium text-white shrink-0">{formatHours(entry.hours)}</span>
                            {entry.invoiced && (
                              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Faktureret</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Rediger sag' : 'Ny sag'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-500 hover:text-gray-100 hover:bg-gray-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Kunde <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Vælg kunde...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Sagstitel <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Fx. Hjemmeside redesign"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Beskrivelse</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Kort beskrivelse af sagen..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Case['status'] }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Aktiv">Aktiv</option>
                    <option value="På pause">På pause</option>
                    <option value="Lukket">Lukket</option>
                    <option value="Faktureret">Faktureret</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Estimerede timer</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimatedHours ?? ''}
                    onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  Annuller
                </button>
                <button type="submit" className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium">
                  {editingId ? 'Gem ændringer' : 'Opret sag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
