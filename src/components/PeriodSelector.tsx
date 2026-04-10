import { PERIODS, type Period } from '../utils/dashboardUtils';

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
  customStart?: string;
  customEnd?: string;
  onCustomStartChange?: (v: string) => void;
  onCustomEndChange?: (v: string) => void;
}

export default function PeriodSelector({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodSelectorProps) {
  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === p.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && onCustomStartChange && onCustomEndChange && (
        <div className="flex gap-3 mt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fra</label>
            <input
              type="date"
              value={customStart}
              onChange={e => onCustomStartChange(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Til</label>
            <input
              type="date"
              value={customEnd}
              onChange={e => onCustomEndChange(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </>
  );
}
