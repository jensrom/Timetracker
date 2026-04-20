import { useState } from 'react';
import { useStore } from '../../store';
import { ALL_CATEGORIES, type TimeCategory, CATEGORY_TAILWIND } from '../../types';
import { CheckCircle2 } from 'lucide-react';

export default function SettingsGenerelt() {
  const { settings, updateSettings } = useStore();
  const [saved, setSaved] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<TimeCategory, string>>({ ...settings.categoryNames });
  const [weeklyHours, setWeeklyHours] = useState(settings.weeklyHours);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ categoryNames, weeklyHours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Normtid */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Normtid</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">Timer pr. uge</label>
            <input
              type="number"
              min="1"
              max="60"
              step="0.5"
              value={weeklyHours}
              onChange={e => setWeeklyHours(parseFloat(e.target.value))}
              className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500 mt-5">
            = {(weeklyHours / 5).toFixed(1)} timer pr. dag
          </div>
        </div>
      </div>

      {/* Kategorivis tidskategorier */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Tids-kategorinavne</h3>
        <p className="text-xs text-gray-500 mb-4">Omdøb tidskategorierne til din arbejdsgang</p>
        <div className="space-y-3">
          {ALL_CATEGORIES.map(cat => {
            const colors = CATEGORY_TAILWIND[cat];
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                <span className="text-xs text-gray-500 w-28 shrink-0">{cat}</span>
                <input
                  type="text"
                  value={categoryNames[cat]}
                  onChange={e => setCategoryNames(n => ({ ...n, [cat]: e.target.value }))}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Gem indstillinger
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 size={16} /> Gemt!
          </span>
        )}
      </div>
    </form>
  );
}
