import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useStore } from '../store';
import {
  todayISO, formatHours, getWeekDates, getWeekdays, formatWeekDay, formatDate,
} from '../utils/dateUtils';
import { countHolidaysInRange } from '../utils/danishHolidays';
import {
  startOfMonth, endOfMonth, subMonths, endOfWeek,
  eachWeekOfInterval, format, eachDayOfInterval,
} from 'date-fns';
import { da } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

type Period = '1uge' | '1mdr' | '3mdr' | '6mdr' | '12mdr' | 'custom';

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

function getPeriodRange(period: Period, customStart: string, customEnd: string) {
  const today = new Date();
  switch (period) {
    case '1uge': return getWeekDates(today);
    case '1mdr': return { start: toISO(startOfMonth(today)), end: toISO(endOfMonth(today)) };
    case '3mdr': return { start: toISO(startOfMonth(subMonths(today, 2))), end: toISO(endOfMonth(today)) };
    case '6mdr': return { start: toISO(startOfMonth(subMonths(today, 5))), end: toISO(endOfMonth(today)) };
    case '12mdr': return { start: toISO(startOfMonth(subMonths(today, 11))), end: toISO(endOfMonth(today)) };
    case 'custom': return { start: customStart, end: customEnd };
  }
}

const PERIODS: { id: Period; label: string }[] = [
  { id: '1uge', label: '1 uge' },
  { id: '1mdr', label: '1 mdr' },
  { id: '3mdr', label: '3 mdr' },
  { id: '6mdr', label: '6 mdr' },
  { id: '12mdr', label: '12 mdr' },
  { id: 'custom', label: 'Tilpasset' },
];

const CustomTooltip = ({ active, payload, label, dailyNorm }: any) => {
  if (!active || !payload?.length) return null;
  const hours = payload[0]?.value ?? 0;
  const diff = hours - dailyNorm;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-100 mb-1">{label}</p>
      <p className="text-gray-300">Registreret: <span className="text-white font-medium">{formatHours(hours)}</span></p>
      <p className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
        Balance: {diff >= 0 ? '+' : ''}{formatHours(diff)}
      </p>
    </div>
  );
};

export default function OvertimeDashboard() {
  const { entries, settings } = useStore();
  const [period, setPeriod] = useState<Period>('1uge');
  const [customStart, setCustomStart] = useState(toISO(startOfMonth(new Date())));
  const [customEnd, setCustomEnd] = useState(todayISO());

  const { start, end } = getPeriodRange(period, customStart, customEnd);
  const weeklyHours = settings.weeklyHours;
  const dailyNorm = weeklyHours / 5;

  // Working days in range (Mon-Fri, excl. holidays)
  const holidaysInRange = useMemo(() => countHolidaysInRange(start, end), [start, end]);
  const holidayDates = new Set(holidaysInRange.map(h => h.date));

  const workingDaysInRange = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(start), end: new Date(end) });
    return days.filter(d => {
      const dow = d.getDay();
      const iso = toISO(d);
      return dow !== 0 && dow !== 6 && !holidayDates.has(iso);
    }).length;
  }, [start, end, holidayDates]);

  const normHours = workingDaysInRange * dailyNorm;

  const filteredEntries = useMemo(
    () => entries.filter(e => e.date >= start && e.date <= end),
    [entries, start, end]
  );
  const totalRegistered = filteredEntries.reduce((s, e) => s + e.hours, 0);
  const balance = totalRegistered - normHours;

  // Current week stats
  const { start: wStart, end: wEnd } = getWeekDates();
  const weekEntries = useMemo(
    () => entries.filter(e => e.date >= wStart && e.date <= wEnd),
    [entries, wStart, wEnd]
  );
  const weekRegistered = weekEntries.reduce((s, e) => s + e.hours, 0);
  const weekHolidays = countHolidaysInRange(wStart, wEnd);
  const weekHolidayCount = weekHolidays.length;
  const weekNorm = weeklyHours - weekHolidayCount * dailyNorm;
  const weekBalance = weekRegistered - weekNorm;

  type DayRow = { name: string; hours: number; holiday: boolean; norm?: number; balance?: number };

  // Chart data
  const chartData = useMemo((): DayRow[] => {
    if (period === '1uge') {
      const days = getWeekdays(start, end);
      return days.map(day => {
        const h = entries.filter(e => e.date === day).reduce((s, e) => s + e.hours, 0);
        const isHoliday = holidayDates.has(day);
        return { name: formatWeekDay(day), hours: isHoliday ? 0 : h, holiday: isHoliday };
      });
    } else {
      // Weekly aggregation
      const weeks = eachWeekOfInterval(
        { start: new Date(start), end: new Date(end) },
        { weekStartsOn: 1 }
      );
      return weeks.map(ws => {
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const wsISO = toISO(ws);
        const weISO = toISO(we);
        const weekH = entries.filter(e => e.date >= wsISO && e.date <= weISO).reduce((s, e) => s + e.hours, 0);
        const hols = countHolidaysInRange(wsISO, weISO);
        const wNorm = weeklyHours - hols.length * dailyNorm;
        return {
          name: `Uge ${format(ws, 'w', { locale: da })}`,
          hours: weekH,
          holiday: false,
          norm: wNorm,
          balance: weekH - wNorm,
        };
      });
    }
  }, [entries, period, start, end, holidayDates, weeklyHours, dailyNorm]);

  const BalanceIcon = balance > 0 ? TrendingUp : balance < 0 ? TrendingDown : Minus;
  const balanceColor = balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-gray-400';
  const weekBalanceColor = weekBalance > 0 ? 'text-green-400' : weekBalance < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Normtid & Afspadsering</h1>
          <p className="text-gray-400 text-sm mt-1">
            Baseret på {weeklyHours} timers uge · {dailyNorm.toFixed(1)}t/dag
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex gap-3 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fra</label>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Til</label>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      )}

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Current week balance */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Denne uge</p>
          <p className={`text-2xl font-bold ${weekBalanceColor}`}>
            {weekBalance >= 0 ? '+' : ''}{formatHours(weekBalance)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatHours(weekRegistered)} / {formatHours(weekNorm)}
            {weekHolidayCount > 0 && ` (${weekHolidayCount} helligdag)`}
          </p>
        </div>

        {/* Period balance */}
        <div className={`bg-gray-900 border rounded-xl p-4 col-span-2 lg:col-span-1 ${
          balance > 0 ? 'border-green-500/30' : balance < 0 ? 'border-red-500/30' : 'border-gray-800'
        }`}>
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <BalanceIcon size={11} /> Samlet saldo
          </p>
          <p className={`text-2xl font-bold ${balanceColor}`}>
            {balance >= 0 ? '+' : ''}{formatHours(balance)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{formatDate(start)} – {formatDate(end)}</p>
        </div>

        {/* Registered */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Registreret</p>
          <p className="text-2xl font-bold text-white">{formatHours(totalRegistered)}</p>
          <p className="text-xs text-gray-600 mt-1">i perioden</p>
        </div>

        {/* Norm */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Normtid</p>
          <p className="text-2xl font-bold text-white">{formatHours(normHours)}</p>
          <p className="text-xs text-gray-600 mt-1">{workingDaysInRange} arbejdsdage</p>
        </div>
      </div>

      {/* Holidays in range */}
      {holidaysInRange.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-red-400" />
            <span className="text-sm font-medium text-gray-300">
              Helligdage i perioden ({holidaysInRange.length} dage = -{formatHours(holidaysInRange.length * dailyNorm)} normtid)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {holidaysInRange.map(h => (
              <span key={h.date} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                {h.name} · {h.date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-300">Timer pr. {period === '1uge' ? 'dag' : 'uge'}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />
              Normtid ({period === '1uge' ? `${dailyNorm}t/dag` : `${weeklyHours}t/uge`})
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={(props: any) => <CustomTooltip {...props} dailyNorm={period === '1uge' ? dailyNorm : weeklyHours} />} />
            <ReferenceLine
              y={period === '1uge' ? dailyNorm : weeklyHours}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, i) => {
                const norm = period === '1uge' ? dailyNorm : weeklyHours;
                const isOver = entry.hours >= norm;
                const isHoliday = entry.holiday;
                return (
                  <Cell
                    key={i}
                    fill={isHoliday ? '#374151' : isOver ? '#22c55e' : entry.hours > 0 ? '#f97316' : '#374151'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Opfyldt/overarbejde</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" /> Under normtid</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-700 inline-block" /> Helligdag/ingen timer</span>
        </div>
      </div>

      {/* Week-by-week breakdown (only for multi-week periods) */}
      {period !== '1uge' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Ugeoversigt</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {chartData.map((week: any) => {
              const bal = week.balance ?? (week.hours - weeklyHours);
              const balColor = bal > 0 ? 'text-green-400' : bal < 0 ? 'text-red-400' : 'text-gray-400';
              return (
                <div key={week.name} className="flex items-center gap-4 px-4 py-3">
                  <span className="text-sm text-gray-400 w-16 shrink-0">{week.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bal >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min((week.hours / (week.norm ?? weeklyHours)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-16 text-right">{formatHours(week.hours)}</span>
                  <span className={`text-sm font-medium w-16 text-right ${balColor}`}>
                    {bal >= 0 ? '+' : ''}{formatHours(bal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
