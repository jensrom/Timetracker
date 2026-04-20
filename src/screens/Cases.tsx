import { useState } from 'react';
import { useStore } from '../store';
import { type Case, CASE_STATUS_COLORS, CATEGORY_TAILWIND, PRIORITY_COLORS, CATEGORY_COLOR_MAP } from '../types';
import { formatHours } from '../utils/dateUtils';
import { ICON_MAP } from '../utils/iconMap';
import { Plus, Search, Pencil, Trash2, X, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
type StatusFilter = Case['status'] | 'Alle';

export default function Cases() {
  const { clients, cases, entries, settings, users, caseCategories, addCase, updateCase, deleteCase } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Alle');
  const [clientFilter, setClientFilter] = useState('Alle');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Listen for new-item shortcut
  useState(() => {
    const handler = () => openCreate();
    document.addEventListener('app:new-item', handler as EventListener);
    return () => document.removeEventListener('app:new-item', handler as EventListener);
  });

  function emptyForm() {
    return {
      clientId: '', title: '', description: '',
      status: 'Ny' as Case['status'],
      priority: 'Medium' as Case['priority'],
      estimatedHours: undefined as number | undefined,
      assignedUserId: '' as string | undefined,
      categoryId: '' as string | undefined,
    };
  }

  const filtered = cases.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase());
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
      clientId: c.clientId, title: c.title, description: c.description,
      status: c.status, priority: c.priority ?? 'Medium',
      estimatedHours: c.estimatedHours, assignedUserId: c.assignedUserId ?? '',
      categoryId: c.categoryId ?? '',
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
      priority: form.priority,
      estimatedHours: form.estimatedHours ?? undefined,
      assignedUserId: form.assignedUserId || undefined,
      categoryId: form.categoryId || undefined,
    };
    if (editingId) {
      updateCase(editingId, data);
    } else {
      addCase(data);
    }
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sager</h1>
          <p className="text-gray-500 text-sm mt-1">{cases.length} sager i alt</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny sag <kbd className="ml-1 text-xs opacity-60 font-mono">N</kbd>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Søg på titel, beskrivelse eller sagsnummer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
        >
          <option value="Alle">Alle kunder</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['Alle', 'Ny', 'Under behandling', 'Afventer kunde', 'Afventer leverandør', 'Standby', 'Løst', 'Lukket', 'Faktureret'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cases list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
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
          const category = caseCategories.find(cat => cat.id === c.categoryId);
          const assignedUser = users.find(u => u.id === c.assignedUserId);
          const catColors = category ? CATEGORY_COLOR_MAP[category.color] : null;
          const CatIcon = category ? ICON_MAP[category.icon] : null;

          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      {CatIcon
                        ? <CatIcon size={16} className={catColors ? catColors.text : 'text-gray-400'} />
                        : <Briefcase size={16} className="text-gray-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Number + badges row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {c.caseNumber && (
                          <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {c.caseNumber}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CASE_STATUS_COLORS[c.status]}`}>
                          {c.status}
                        </span>
                        {c.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[c.priority]}`}>
                            {c.priority}
                          </span>
                        )}
                        {category && catColors && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                            {category.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {client && <p className="text-xs text-gray-500">{client.name}</p>}
                        {assignedUser && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {assignedUser.name[0]}
                            </span>
                            {assignedUser.name}
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                      )}

                      {/* Progress bar */}
                      {c.estimatedHours ? (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{formatHours(hours)} registreret</span>
                            <span>{formatHours(c.estimatedHours)} estimeret</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress! >= 100 ? 'bg-red-500' : progress! >= 80 ? 'bg-amber-400' : 'bg-green-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">{formatHours(hours)} registreret</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : c.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {deleteConfirm === c.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-red-600">Slet sagen og alle tilknyttede timer?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">Annuller</button>
                      <button onClick={() => { deleteCase(c.id); setDeleteConfirm(null); }} className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg">Slet</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded entries */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {caseEntries.length === 0 ? (
                    <p className="text-center py-4 text-sm text-gray-400">Ingen timer registreret på denne sag</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {caseEntries.map(entry => {
                        const colors = CATEGORY_TAILWIND[entry.category];
                        return (
                          <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-xs text-gray-400 w-20 shrink-0">{entry.date}</span>
                            <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {settings.categoryNames[entry.category] ?? entry.category}
                            </span>
                            <span className="text-sm text-gray-700 flex-1 truncate">{entry.description || '—'}</span>
                            <span className="text-sm font-medium text-gray-900 shrink-0">{formatHours(entry.hours)}</span>
                            {entry.invoiced && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Faktureret</span>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Rediger sag' : 'Ny sag'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Kunde */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kunde <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Vælg kunde...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Titel */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sagstitel <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Fx. ERP-implementering"
                />
              </div>

              {/* Beskrivelse */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Beskrivelse</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Kort beskrivelse..."
                />
              </div>

              {/* Status + Prioritet */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Case['status'] }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {(['Ny', 'Under behandling', 'Afventer kunde', 'Afventer leverandør', 'Standby', 'Løst', 'Lukket', 'Faktureret'] as Case['status'][]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Prioritet</label>
                  <select
                    value={form.priority ?? 'Medium'}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Case['priority'] }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    {['Kritisk', 'Høj', 'Medium', 'Lav'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Kategori + Ansvarlig */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori</label>
                  <select
                    value={form.categoryId ?? ''}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ingen kategori</option>
                    {caseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Ansvarlig</label>
                  <select
                    value={form.assignedUserId ?? ''}
                    onChange={e => setForm(f => ({ ...f, assignedUserId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ikke tildelt</option>
                    {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Estimerede timer */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Estimerede timer</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours ?? ''}
                  onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
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
