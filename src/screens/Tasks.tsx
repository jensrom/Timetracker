import { useState, useEffect } from 'react';
import { Plus, Search, CheckSquare } from 'lucide-react';
import { useStore } from '../store';
import type { Task, TaskStatus, CasePriority } from '../types';
import TaskCard from './tasks/TaskCard';
import TaskForm from './tasks/TaskForm';

const ALL_STATUSES: TaskStatus[] = ['Åben', 'I gang', 'Afventer kunde', 'Afventer leverandør', 'Standby', 'Løst', 'Lukket'];
const ALL_PRIORITIES: CasePriority[] = ['Kritisk', 'Høj', 'Medium', 'Lav'];

export default function Tasks() {
  const { tasks, clients, cases, users } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'Alle'>('Alle');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | 'Alle'>('Alle');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    function onNewItem() { setShowForm(true); }
    document.addEventListener('app:new-item', onNewItem);
    return () => document.removeEventListener('app:new-item', onNewItem);
  }, []);

  const filtered = tasks
    .filter(t => {
      if (statusFilter !== 'Alle' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'Alle' && t.priority !== priorityFilter) return false;
      if (userFilter && t.assignedUserId !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const client = clients.find(c => c.id === t.clientId);
        const cas = cases.find(c => c.id === t.caseId);
        return (
          t.heading.toLowerCase().includes(q) ||
          t.taskNumber.toLowerCase().includes(q) ||
          client?.name.toLowerCase().includes(q) ||
          cas?.title.toLowerCase().includes(q) ||
          cas?.caseNumber?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  function openEdit(task: Task) {
    setEditingTask(task);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(undefined);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opgaver</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} opgave{tasks.length !== 1 ? 'r' : ''} i alt</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Ny opgave
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Søg på opgave, sagsnummer, kunde..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter('Alle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === 'Alle' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Alle ({tasks.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = tasks.filter(t => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>

        {/* Priority + User filters */}
        <div className="flex gap-3">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as CasePriority | 'Alle')}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="Alle">Alle prioriteter</option>
            {ALL_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle brugere</option>
            {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Ingen opgaver fundet</p>
          <p className="text-xs mt-1">Opret en ny opgave med knappen ovenfor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && <TaskForm onClose={closeForm} editingTask={editingTask} />}
    </div>
  );
}
