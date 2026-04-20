import { Plus, ArrowUp, ArrowDown, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { TaskItem } from '../../types';

interface Props {
  items: TaskItem[];
  onChange: (items: TaskItem[]) => void;
}

export default function TaskItemList({ items, onChange }: Props) {
  function addItem() {
    onChange([...items, { id: uuidv4(), text: '', completed: false, order: items.length }]);
  }

  function removeItem(id: string) {
    onChange(items.filter(i => i.id !== id));
  }

  function updateText(id: string, text: string) {
    onChange(items.map(i => i.id === id ? { ...i, text } : i));
  }

  function moveItem(index: number, dir: -1 | 1) {
    const next = [...items];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= next.length) return;
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    onChange(next.map((it, i) => ({ ...it, order: i })));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-600">Tjekliste elementer</label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <Plus size={12} /> Tilføj
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}.</span>
            <input
              type="text"
              value={item.text}
              onChange={e => updateText(item.id, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder={`Element ${idx + 1}`}
            />
            <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
              <ArrowUp size={12} />
            </button>
            <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
              <ArrowDown size={12} />
            </button>
            <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600">
              <X size={12} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">Ingen elementer endnu — klik "Tilføj"</p>
        )}
      </div>
    </div>
  );
}
