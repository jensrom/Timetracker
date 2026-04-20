import { useState } from 'react';
import { useStore } from '../../store';
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../types';
import { Plus, Pencil, Trash2, X, FileText, ChevronDown, ChevronUp, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SettingsSkabeloner() {
  const { templates, caseCategories, addTemplate, updateTemplate, deleteTemplate } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; categoryId: string; items: ChecklistTemplateItem[] }>({
    name: '', description: '', categoryId: '', items: [],
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openCreate() {
    setForm({ name: '', description: '', categoryId: '', items: [] });
    setEditingId(null); setShowForm(true);
  }

  function openEdit(t: ChecklistTemplate) {
    setForm({ name: t.name, description: t.description, categoryId: t.categoryId ?? '', items: [...t.items] });
    setEditingId(t.id); setShowForm(true);
  }

  function addItem() {
    setForm(f => ({
      ...f,
      items: [...f.items, { id: uuidv4(), text: '', order: f.items.length }],
    }));
  }

  function removeItem(id: string) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  }

  function updateItemText(id: string, text: string) {
    setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, text } : i) }));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const items = [...form.items];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[index], items[newIdx]] = [items[newIdx], items[index]];
    setForm(f => ({ ...f, items: items.map((it, i) => ({ ...it, order: i })) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const data: Omit<ChecklistTemplate, 'id' | 'createdAt'> = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId || undefined,
      items: form.items.filter(i => i.text.trim()),
    };
    if (editingId) {
      updateTemplate(editingId, data);
    } else {
      addTemplate({ id: uuidv4(), ...data, createdAt: new Date().toISOString() });
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Skabeloner er foruddefinerede tjeklister du kan sætte på opgaver</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny skabelon
        </button>
      </div>

      <div className="space-y-2">
        {templates.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Ingen skabeloner endnu</p>
          </div>
        )}
        {templates.map(t => {
          const cat = caseCategories.find(c => c.id === t.categoryId);
          const isExpanded = expanded === t.id;
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.items.length} elementer{cat ? ` · ${cat.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpanded(isExpanded ? null : t.id)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteConfirm(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                {deleteConfirm === t.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Slet?</span>
                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 rounded">Nej</button>
                    <button onClick={() => { deleteTemplate(t.id); setDeleteConfirm(null); }} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Ja</button>
                  </div>
                )}
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                  {t.items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                      <GripVertical size={14} className="text-gray-300 shrink-0" />
                      <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Rediger skabelon' : 'Ny skabelon'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Navn <span className="text-red-500">*</span></label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Fx. Software Installation"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Beskrivelse</label>
                  <input
                    type="text" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Kort beskrivelse..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ingen kategori</option>
                    {caseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Elementer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Tjekliste elementer</label>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                      <Plus size={12} /> Tilføj
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={e => updateItemText(item.id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                          placeholder={`Element ${idx + 1}`}
                        />
                        <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ArrowUp size={12} />
                        </button>
                        <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === form.items.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ArrowDown size={12} />
                        </button>
                        <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {form.items.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Ingen elementer endnu — klik "Tilføj"</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-gray-200 shrink-0">
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
