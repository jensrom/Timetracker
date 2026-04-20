import { useState } from 'react';
import { useStore } from '../store';
import type { Client } from '../types';
import { Plus, Search, Pencil, Trash2, X, User, Building2, Mail, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const emptyForm = (): Omit<Client, 'id' | 'createdAt'> => ({
  name: '',
  cvr: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
});

export default function Clients() {
  const { clients, cases, entries, addClient, updateClient, deleteClient } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactPerson ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.cvr ?? '').includes(search)
  );

  function openCreate() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setForm({
      name: client.name,
      cvr: client.cvr ?? '',
      contactPerson: client.contactPerson ?? '',
      contactEmail: client.contactEmail ?? '',
      contactPhone: client.contactPhone ?? '',
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateClient(editingId, {
        name: form.name.trim(),
        cvr: form.cvr?.trim() || undefined,
        contactPerson: form.contactPerson?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
      });
    } else {
      addClient({
        id: uuidv4(),
        name: form.name.trim(),
        cvr: form.cvr?.trim() || undefined,
        contactPerson: form.contactPerson?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setShowForm(false);
  }

  function getClientStats(clientId: string) {
    const clientCases = cases.filter(c => c.clientId === clientId);
    const activeCases = clientCases.filter(c => c.status === 'Aktiv' || c.status === 'Under behandling' || c.status === 'Ny').length;
    const totalHours = entries
      .filter(e => clientCases.some(c => c.id === e.caseId))
      .reduce((sum, e) => sum + e.hours, 0);
    return { totalCases: clientCases.length, activeCases, totalHours };
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} kunder registreret</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny kunde
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Søg efter navn, kontaktperson eller CVR..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Ingen kunder fundet</p>
          </div>
        )}
        {filtered.map(client => {
          const stats = getClientStats(client.id);
          return (
            <div
              key={client.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                    {client.cvr && <p className="text-xs text-gray-500 mt-0.5">CVR: {client.cvr}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {client.contactPerson && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User size={12} className="text-gray-400" />
                          {client.contactPerson}
                        </span>
                      )}
                      {client.contactEmail && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail size={12} className="text-gray-400" />
                          {client.contactEmail}
                        </span>
                      )}
                      {client.contactPhone && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone size={12} className="text-gray-400" />
                          {client.contactPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="hidden sm:flex items-center gap-4 text-right">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.totalHours.toFixed(1)}t</p>
                      <p className="text-xs text-gray-400">Total timer</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.activeCases}</p>
                      <p className="text-xs text-gray-400">Aktive sager</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(client.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {deleteConfirm === client.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-red-600">Slet kunden og alle tilknyttede sager og timer?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Annuller
                    </button>
                    <button
                      onClick={() => { deleteClient(client.id); setDeleteConfirm(null); }}
                      className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Slet
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Rediger kunde' : 'Ny kunde'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Firmanavn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Virksomhedsnavn"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">CVR-nummer</label>
                <input
                  type="text"
                  value={form.cvr}
                  onChange={e => setForm(f => ({ ...f, cvr: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kontaktperson</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Navn"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="email@firma.dk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  {editingId ? 'Gem ændringer' : 'Opret kunde'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
