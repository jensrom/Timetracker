import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { useStore } from '../../store';
import type { Task } from '../../types';
import { PRIORITY_COLORS, TASK_STATUS_COLORS } from '../../types';
import { format } from 'date-fns';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: Props) {
  const { clients, cases, users, updateTaskItem, deleteTask } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const client = clients.find(c => c.id === task.clientId);
  const caseItem = cases.find(c => c.id === task.caseId);
  const assignedUser = users.find(u => u.id === task.assignedUserId);
  const completedCount = task.items.filter(i => i.completed).length;
  const totalCount = task.items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isOverdue = task.dueDate && task.dueDate < format(new Date(), 'yyyy-MM-dd') && task.status !== 'Løst' && task.status !== 'Lukket';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{task.taskNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${TASK_STATUS_COLORS[task.status]}`}>{task.status}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{task.heading}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {client?.name ?? '—'} · {caseItem?.title ?? '—'}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {totalCount > 0 && (
              <button onClick={() => setExpanded(x => !x)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
            <button onClick={() => setDeleteConfirm(true)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {assignedUser && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <User size={11} /> {assignedUser.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              <Calendar size={11} /> {task.dueDate}
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-xs text-gray-500">{completedCount}/{totalCount} afsluttet</span>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-red-600 flex-1">Slet opgave?</span>
            <button onClick={() => setDeleteConfirm(false)} className="px-2 py-1 text-xs bg-gray-100 rounded">Nej</button>
            <button onClick={() => deleteTask(task.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Ja, slet</button>
          </div>
        )}
      </div>

      {/* Expanded checklist */}
      {expanded && task.items.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
          {[...task.items].sort((a, b) => a.order - b.order).map(item => (
            <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={e => updateTaskItem(task.id, item.id, { completed: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
