import { useState } from 'react';
import { useStore } from '../../store';
import type { CaseCategory } from '../../types';
import { CATEGORY_COLOR_MAP } from '../../types';
import { ICON_MAP, ICON_OPTIONS } from '../../utils/iconMap';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const COLOR_OPTIONS = ['blue', 'green', 'red', 'orange', 'purple', 'yellow', 'indigo', 'pink', 'teal', 'gray'];

const COLOR_DOTS: Record<string, string> = {
  blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500', orange: 'bg-orange-500',
  purple: 'bg-purple-500', yellow: 'bg-yellow-500', indigo: 'bg-indigo-500',
  pink: 'bg-pink-500', teal: 'bg-teal-500', gray: 'bg-gray-400',
};

function emptyForm(): Omit<CaseCategory, 'id' | 'createdAt'> {
  return { name: '', icon: 'Briefcase', color: 'blue' };
}

export default function SettingsKategorier() {
  const { caseCategories, addCaseCategory, updateCaseCategory, deleteCaseCategory } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openCreate() { setForm(emptyForm()); setEditingId(null); setShowForm(true); }
  function openEdit(c: CaseCategory) {
    setForm({ name: c.name, icon: c.icon, color: c.color });
    setEditingId(c.id); setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateCaseCategory(editingId, { name: form.name.trim(), icon: form.icon, color: form.color });
    } else {
      addCaseCategory({ id: uuidv4(), name: form.name.trim(), icon: form.icon, color: form.color, createdAt: new Date().toISOString() });
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Kategorier bruges til at klassificere sager og opgaver</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny kategori
        </button>
      </div>

      <div className="space-y-2">
        {caseCategories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Tag size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Ingen kategorier endnu</p>
          </div>
        )}
        {caseCategories.map(cat => {
          const Icon = ICON_MAP[cat.icon] ?? ICON_MAP['Briefcase'];
          const colors = CATEGORY_COLOR_MAP[cat.color] ?? CATEGORY_COLOR_MAP['blue'];
          return (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                <Icon size={16} className={colors.text} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.icon} · {cat.color}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${COLOR_DOTS[cat.color] ?? 'bg-gray-400'}`} />
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteConfirm(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {deleteConfirm === cat.id && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Slet?</span>
                  <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 rounded">Nej</button>
                  <button onClick={() => { deleteCaseCategory(cat.id); setDeleteConfirm(null); }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Ja</button>
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
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Rediger kategori' : 'Ny kategori'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Navn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Fx. Installation"
                />
              </div>

              {/* Ikon-vælger */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Ikon</label>
                <div className="grid grid-cols-10 gap-1.5">
                  {ICON_OPTIONS.map(iconName => {
                    const Icon = ICON_MAP[iconName];
                    const isSelected = form.icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        title={iconName}
                        onClick={() => setForm(f => ({ ...f, icon: iconName }))}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Farve-vælger */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Farve</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className={`w-7 h-7 rounded-full transition-all ${COLOR_DOTS[color]} ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-blue-400 scale-110' : 'hover:scale-105'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Annuller</button>
                <button type="submit" className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  {editingId ? 'Gem' : 'Opret'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
