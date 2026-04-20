import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useStore } from '../store';
import { todayISO, formatHours, getWeekDates, getWeekdays, formatWeekDay, formatDate } from '../utils/dateUtils';
import { countHolidaysInRange } from '../utils/danishHolidays';
import { type Period, getPeriodRange } from '../utils/dashboardUtils';
import PeriodSelector from '../components/PeriodSelector';
import { startOfMonth, endOfWeek, eachWeekOfInterval, format, eachDayOfInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

function toISO(d: Date) { return format(d, 'yyyy-MM-dd'); }

const CustomTooltip = ({ active, payload, label, dailyNorm }: any) => {
  if (!active || !payload?.length) return null;
  const hours = payload[0]?.value ?? 0;
  const diff = hours - dailyNorm;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-gray-600">Registreret: <span className="text-gray-900 font-medium">{formatHours(hours)}</span></p>
      <p className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
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

  const holidaysInRange = useMemo(() => countHolidaysInRange(start, end), [start, end]);
  const holidayDates = new Set(holidaysInRange.map(h => h.date));

  const workingDaysInRange = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(start), end: new Date(end) });
    return days.filter(d => {
      const dow = d.getDay();
      return dow !== 0 && dow !== 6 && !holidayDates.has(toISO(d));
    }).length;
  }, [start, end, holidayDates]);

  const normHours = workingDaysInRange * dailyNorm;

  const filteredEntries = useMemo(
    () => entries.filter(e => e.date >= start && e.date <= end),
    [entries, start, end]
  );
  const totalRegistered = filteredEntries.reduce((s, e) => s + e.hours, 0);
  const balance = totalRegistered - normHours;

  const { start: wStart, end: wEnd } = getWeekDates();
  const weekEntries = useMemo(
    () => entries.filter(e => e.date >= wStart && e.date <= wEnd),
    [entries, wStart, wEnd]
  );
  const weekRegistered = weekEntries.reduce((s, e) => s + e.hours, 0);
  const weekHolidays = countHolidaysInRange(wStart, wEnd);
  const weekNorm = weeklyHours - weekHolidays.length * dailyNorm;
  const weekBalance = weekRegistered - weekNorm;

  type DayRow = { name: string; hours: number; holiday: boolean; norm?: number; balance?: number };

  const chartData = useMemo((): DayRow[] => {
    if (period === '1uge') {
      const days = getWeekdays(start, end);
      return days.map(day => {
        const h = entries.filter(e => e.date === day).reduce((s, e) => s + e.hours, 0);
        return { name: formatWeekDay(day), hours: holidayDates.has(day) ? 0 : h, holiday: holidayDates.has(day) };
      });
    } else {
      const weeks = eachWeekOfInterval({ start: new Date(start), end: new Date(end) }, { weekStartsOn: 1 });
      return weeks.map(ws => {
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const wsISO = toISO(ws); const weISO = toISO(we);
        const weekH = entries.filter(e => e.date >= wsISO && e.date <= weISO).reduce((s, e) => s + e.hours, 0);
        const hols = countHolidaysInRange(wsISO, weISO);
        const wNorm = weeklyHours - hols.length * dailyNorm;
        return { name: `Uge ${format(ws, 'w', { locale: da })}`, hours: weekH, holiday: false, norm: wNorm, balance: weekH - wNorm };
      });
    }
  }, [entries, period, start, end, holidayDates, weeklyHours, dailyNorm]);

  const BalanceIcon = balance > 0 ? TrendingUp : balance < 0 ? TrendingDown : Minus;
  const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';
  const weekBalanceColor = weekBalance > 0 ? 'text-green-600' : weekBalance < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Normtid & Afspadsering</h1>
          <p className="text-gray-500 text-sm mt-1">Baseret på {weeklyHours} timers uge · {dailyNorm.toFixed(1)}t/dag</p>
        </div>
        <PeriodSelector
          value={period} onChange={setPeriod}
          customStart={customStart} customEnd={customEnd}
          onCustomStartChange={setCustomStart} onCustomEndChange={setCustomEnd}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Denne uge</p>
          <p className={`text-2xl font-bold ${weekBalanceColor}`}>
            {weekBalance >= 0 ? '+' : ''}{formatHours(weekBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatHours(weekRegistered)} / {formatHours(weekNorm)}
            {weekHolidays.length > 0 && ` (${weekHolidays.length} helligdag)`}
          </p>
        </div>

        <div className={`bg-white border rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1 ${
          balance > 0 ? 'border-green-200' : balance < 0 ? 'border-red-200' : 'border-gray-200'
        }`}>
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <BalanceIcon size={11} /> Samlet saldo
          </p>
          <p className={`text-2xl font-bold ${balanceColor}`}>
            {balance >= 0 ? '+' : ''}{formatHours(balance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatDate(start)} – {formatDate(end)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Registreret</p>
          <p className="text-2xl font-bold text-gray-900">{formatHours(totalRegistered)}</p>
          <p className="text-xs text-gray-400 mt-1">i perioden</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Normtid</p>
          <p className="text-2xl font-bold text-gray-900">{formatHours(normHours)}</p>
          <p className="text-xs text-gray-400 mt-1">{workingDaysInRange} arbejdsdage</p>
        </div>
      </div>

      {/* Holidays */}
      {holidaysInRange.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-red-500" />
            <span className="text-sm font-medium text-gray-700">
              Helligdage i perioden ({holidaysInRange.length} dage = -{formatHours(holidaysInRange.length * dailyNorm)} normtid)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {holidaysInRange.map(h => (
              <span key={h.date} className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                {h.name} · {h.date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Timer pr. {period === '1uge' ? 'dag' : 'uge'}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />
              Normtid ({period === '1uge' ? `${dailyNorm}t/dag` : `${weeklyHours}t/uge`})
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={(props: any) => <CustomTooltip {...props} dailyNorm={period === '1uge' ? dailyNorm : weeklyHours} />} />
            <ReferenceLine y={period === '1uge' ? dailyNorm : weeklyHours} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.5} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, i) => {
                const norm = period === '1uge' ? dailyNorm : weeklyHours;
                return (
                  <Cell
                    key={i}
                    fill={entry.holiday ? '#e5e7eb' : entry.hours >= norm ? '#22c55e' : entry.hours > 0 ? '#f97316' : '#e5e7eb'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Opfyldt/overarbejde</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" /> Under normtid</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" /> Helligdag/ingen timer</span>
        </div>
      </div>

      {/* Week-by-week table */}
      {period !== '1uge' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-700">Ugeoversigt</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {chartData.map((week: any) => {
              const bal = week.balance ?? (week.hours - weeklyHours);
              const balColor = bal > 0 ? 'text-green-600' : bal < 0 ? 'text-red-600' : 'text-gray-400';
              return (
                <div key={week.name} className="flex items-center gap-4 px-4 py-3">
                  <span className="text-sm text-gray-600 w-16 shrink-0">{week.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bal >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min((week.hours / (week.norm ?? weeklyHours)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-900 w-16 text-right">{formatHours(week.hours)}</span>
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
