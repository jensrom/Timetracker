import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import type { Task, TaskItem, CasePriority, TaskStatus } from '../../types';
import TaskItemList from './TaskItemList';

interface Props {
  onClose: () => void;
  editingTask?: Task;
}

export default function TaskForm({ onClose, editingTask }: Props) {
  const { clients, cases, templates, users, session, addTask, updateTask } = useStore();

  const [form, setForm] = useState({
    clientId: editingTask?.clientId ?? '',
    caseId: editingTask?.caseId ?? '',
    heading: editingTask?.heading ?? '',
    priority: (editingTask?.priority ?? 'Medium') as CasePriority,
    status: (editingTask?.status ?? 'Åben') as TaskStatus,
    assignedUserId: editingTask?.assignedUserId ?? session?.userId ?? '',
    dueDate: editingTask?.dueDate ?? '',
    items: editingTask?.items ? [...editingTask.items] : [] as TaskItem[],
  });

  const clientCases = cases.filter(c => c.clientId === form.clientId);

  function applyTemplate(templateId: string) {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const items: TaskItem[] = tpl.items.map(i => ({
      id: uuidv4(),
      text: i.text,
      completed: false,
      order: i.order,
    }));
    setForm(f => ({ ...f, items }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.heading.trim() || !form.caseId) return;
    const data = {
      caseId: form.caseId,
      clientId: form.clientId,
      heading: form.heading.trim(),
      priority: form.priority,
      status: form.status,
      assignedUserId: form.assignedUserId || undefined,
      dueDate: form.dueDate || undefined,
      items: form.items.filter(i => i.text.trim()),
    };
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{editingTask ? 'Rediger opgave' : 'Ny opgave'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Template picker */}
            {!editingTask && templates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <FileText size={12} className="inline mr-1" />Opret fra skabelon
                </label>
                <select
                  onChange={e => e.target.value && applyTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">Vælg skabelon...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {/* Client + Case */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kunde <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.clientId}
                  onChange={e => setForm(f => ({ ...f, clientId: e.target.value, caseId: '' }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Vælg kunde...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sag <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.caseId}
                  onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))}
                  disabled={!form.clientId}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">Vælg sag...</option>
                  {clientCases.map(c => <option key={c.id} value={c.id}>{c.caseNumber} – {c.title}</option>)}
                </select>
              </div>
            </div>

            {/* Heading */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Overskrift <span className="text-red-500">*</span></label>
              <input
                type="text" required value={form.heading}
                onChange={e => setForm(f => ({ ...f, heading: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Fx. Installation af Office 365"
              />
            </div>

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prioritet</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as CasePriority }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  {(['Kritisk', 'Høj', 'Medium', 'Lav'] as CasePriority[]).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  {(['Åben', 'I gang', 'Afventer kunde', 'Afventer leverandør', 'Standby', 'Løst', 'Lukket'] as TaskStatus[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assigned user + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ansvarlig</label>
                <select
                  value={form.assignedUserId}
                  onChange={e => setForm(f => ({ ...f, assignedUserId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Ikke tildelt</option>
                  {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Forfaldsdato</label>
                <input
                  type="date" value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Items */}
            <TaskItemList items={form.items} onChange={items => setForm(f => ({ ...f, items }))} />
          </div>

          <div className="flex gap-3 p-5 border-t border-gray-200 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Annuller</button>
            <button type="submit" className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
              {editingTask ? 'Gem' : 'Opret opgave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
