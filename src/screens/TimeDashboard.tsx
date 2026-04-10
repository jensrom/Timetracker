import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useStore } from '../store';
import { ALL_CATEGORIES, type TimeCategory, CATEGORY_HEX } from '../types';
import { todayISO, formatHours, getWeekdays, formatWeekDay, formatDate } from '../utils/dateUtils';
import { type Period, getPeriodRange } from '../utils/dashboardUtils';
import PeriodSelector from '../components/PeriodSelector';
import { startOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { da } from 'date-fns/locale';
import { MapPin, Receipt } from 'lucide-react';

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-100 mb-2">{label} · {formatHours(total)}</p>
      {payload.map((p: any) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-gray-300">{p.name}</span>
          <span className="ml-auto text-gray-100 font-medium pl-4">{formatHours(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function TimeDashboard() {
  const { entries, cases, clients, settings } = useStore();
  const [period, setPeriod] = useState<Period>('1uge');
  const [customStart, setCustomStart] = useState(toISO(startOfMonth(new Date())));
  const [customEnd, setCustomEnd] = useState(todayISO());

  const { start, end } = getPeriodRange(period, customStart, customEnd);

  const filtered = useMemo(
    () => entries.filter(e => e.date >= start && e.date <= end),
    [entries, start, end]
  );

  // KPI per category
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<TimeCategory, number>> = {};
    filtered.forEach(e => {
      totals[e.category] = (totals[e.category] ?? 0) + e.hours;
    });
    return totals;
  }, [filtered]);

  const totalHours = filtered.reduce((s, e) => s + e.hours, 0);
  const invoicedHours = filtered.filter(e => e.invoiced).reduce((s, e) => s + e.hours, 0);
  const onSiteHours = filtered.filter(e => e.onSite).reduce((s, e) => s + e.hours, 0);

  // Chart data
  const chartData = useMemo(() => {
    if (period === '1uge') {
      // Daily breakdown Mon-Fri
      const days = getWeekdays(start, end);
      return days.map(day => {
        const dayEntries = filtered.filter(e => e.date === day);
        const row: any = { name: formatWeekDay(day) };
        ALL_CATEGORIES.forEach(cat => {
          row[cat] = dayEntries.filter(e => e.category === cat).reduce((s, e) => s + e.hours, 0);
        });
        return row;
      });
    } else {
      // Weekly breakdown
      const startDate = new Date(start);
      const endDate = new Date(end);
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const ws = toISO(weekStart);
        const we = toISO(wEnd);
        const weekEntries = filtered.filter(e => e.date >= ws && e.date <= we);
        const row: any = { name: `Uge ${format(weekStart, 'w', { locale: da })}` };
        ALL_CATEGORIES.forEach(cat => {
          row[cat] = weekEntries.filter(e => e.category === cat).reduce((s, e) => s + e.hours, 0);
        });
        return row;
      });
    }
  }, [filtered, period, start, end]);

  const getCategoryLabel = (cat: TimeCategory) => settings.categoryNames[cat] ?? cat;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {formatDate(start)} – {formatDate(end)}
          </p>
        </div>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total timer</p>
          <p className="text-2xl font-bold text-white">{formatHours(totalHours)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Receipt size={11} /> Fakturerede</p>
          <p className="text-2xl font-bold text-blue-400">{formatHours(invoicedHours)}</p>
          {totalHours > 0 && <p className="text-xs text-gray-600 mt-0.5">{Math.round((invoicedHours / totalHours) * 100)}% af total</p>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={11} /> On-site</p>
          <p className="text-2xl font-bold text-orange-400">{formatHours(onSiteHours)}</p>
          {totalHours > 0 && <p className="text-xs text-gray-600 mt-0.5">{Math.round((onSiteHours / totalHours) * 100)}% af total</p>}
        </div>
      </div>

      {/* Category KPIs */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {ALL_CATEGORIES.map(cat => {
          const h = categoryTotals[cat] ?? 0;
          const pct = totalHours > 0 ? Math.round((h / totalHours) * 100) : 0;
          const color = CATEGORY_HEX[cat];
          return (
            <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs text-gray-400 truncate">{getCategoryLabel(cat)}</span>
              </div>
              <p className="text-xl font-bold text-white">{formatHours(h)}</p>
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
              <p className="text-xs text-gray-600 mt-1">{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Timer pr. {period === '1uge' ? 'dag' : 'uge'}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{getCategoryLabel(value as TimeCategory)}</span>}
            />
            {ALL_CATEGORIES.map(cat => (
              <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CATEGORY_HEX[cat]} radius={cat === 'Site Manager' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent entries table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Seneste registreringer</h2>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-600">Ingen registreringer i perioden</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(entry => {
              const c = cases.find(c => c.id === entry.caseId);
              const client = c ? clients.find(cl => cl.id === c.clientId) : null;
              const color = CATEGORY_HEX[entry.category];
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800/50">
                  <span className="text-gray-500 w-22 shrink-0 text-xs">{entry.date}</span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-gray-400 text-xs shrink-0">{getCategoryLabel(entry.category)}</span>
                  <span className="text-gray-300 flex-1 truncate">
                    {c?.title ?? '—'} <span className="text-gray-600">· {client?.name ?? '—'}</span>
                  </span>
                  {entry.description && (
                    <span className="text-gray-500 text-xs truncate max-w-[200px]">{entry.description}</span>
                  )}
                  <span className="font-semibold text-white shrink-0">{formatHours(entry.hours)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
