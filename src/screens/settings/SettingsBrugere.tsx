import { useState } from 'react';
import { useStore } from '../../store';
import type { AppUser } from '../../types';
import { Plus, Pencil, Trash2, X, Shield, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../../utils/numberUtils';

export default function SettingsBrugere() {
  const { users, session, addUser, updateUser, deleteUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as AppUser['role'] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function openCreate() {
    setForm({ name: '', email: '', password: '', role: 'user' });
    setEditingId(null); setShowForm(true);
  }

  function openEdit(u: AppUser) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingId(u.id); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId) {
      const update: Partial<AppUser> = { name: form.name.trim(), email: form.email.trim(), role: form.role };
      if (form.password) update.passwordHash = await hashPassword(form.password);
      updateUser(editingId, update);
    } else {
      if (!form.password) return;
      const passwordHash = await hashPassword(form.password);
      addUser({
        id: uuidv4(),
        name: form.name.trim(),
        email: form.email.trim(),
        passwordHash,
        role: form.role,
        createdAt: new Date().toISOString(),
        isActive: true,
      });
    }
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Administrer adgang og brugerroller</p>
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 size={14} /> Gemt!</span>}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Ny bruger
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-700 text-sm font-bold">{u.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                {u.role === 'admin' && (
                  <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                    <Shield size={10} /> Admin
                  </span>
                )}
                {!u.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Inaktiv</span>}
                {u.id === session?.userId && <span className="text-xs text-blue-600">(dig)</span>}
              </div>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} disabled={u.id === session?.userId}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors disabled:opacity-30 ${
                  u.isActive ? 'text-gray-500 bg-gray-100 hover:bg-gray-200' : 'text-green-600 bg-green-50 hover:bg-green-100'
                }`}
              >
                {u.isActive ? 'Deaktiver' : 'Aktiver'}
              </button>
              <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
              <button onClick={() => setDeleteConfirm(u.id)} disabled={u.id === session?.userId}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 size={14} /></button>
            </div>
            {deleteConfirm === u.id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Slet bruger?</span>
                <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 rounded">Nej</button>
                <button onClick={() => { deleteUser(u.id); setDeleteConfirm(null); }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Ja</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Rediger bruger' : 'Ny bruger'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Navn <span className="text-red-500">*</span></label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="Fuldt navn" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail <span className="text-red-500">*</span></label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="email@firma.dk" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Adgangskode {editingId && <span className="text-gray-400">(lad stå tom for uændret)</span>}
                  {!editingId && <span className="text-red-500"> *</span>}
                </label>
                <input type="password" required={!editingId} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="Adgangskode" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rolle</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AppUser['role'] }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500">
                  <option value="user">Bruger</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Annuller</button>
                <button type="submit" className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  {editingId ? 'Gem' : 'Opret bruger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
