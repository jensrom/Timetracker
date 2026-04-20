import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { type TimeCategory, type TimeEntry, CATEGORY_TAILWIND, ALL_CATEGORIES } from '../types';
import { todayISO, formatHours, getWeekDates, getWeekdays } from '../utils/dateUtils';
import { getHolidayName } from '../utils/danishHolidays';
import { parseHoursInput } from '../utils/dashboardUtils';
import { v4 as uuidv4 } from 'uuid';
import {
  CheckCircle2, MapPin, Receipt, AlertTriangle, Clock,
  Pencil, Trash2, X, Search, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const HOURS_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

function HolidayBadge({ date }: { date: string }) {
  const name = getHolidayName(date);
  if (!name) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertTriangle size={11} />
      {name}
    </span>
  );
}

export default function TimeTracking() {
  const { clients, cases, entries, settings, addEntry, updateEntry, deleteEntry } = useStore();

  const [date, setDate] = useState(todayISO());
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState<TimeCategory | ''>('');
  const [hours, setHours] = useState<number | ''>('');
  const [hoursInput, setHoursInput] = useState('');
  const [description, setDescription] = useState('');
  const [onSite, setOnSite] = useState(false);
  const [onSiteType, setOnSiteType] = useState<TimeEntry['onSiteType']>('Undervisning');
  const [invoiced, setInvoiced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        clientInputRef.current && !clientInputRef.current.contains(e.target as Node) &&
        clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)
      ) {
        setShowClientDropdown(false);
        if (clientId) {
          const selected = clients.find(c => c.id === clientId);
          if (selected) setClientSearch(selected.name);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clientId, clients]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const clientCases = useMemo(
    () => cases.filter(c => c.clientId === clientId && (c.status === 'Aktiv' || c.status === 'Ny' || c.status === 'Under behandling')),
    [cases, clientId]
  );

  const today = todayISO();
  const { start: wStart, end: wEnd } = useMemo(() => getWeekDates(), []);
  const weekdays = useMemo(() => getWeekdays(wStart, wEnd), [wStart, wEnd]);

  const todayEntries = useMemo(
    () => entries.filter(e => e.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries, date]
  );
  const todayHours = useMemo(
    () => entries.filter(e => e.date === today).reduce((s, e) => s + e.hours, 0),
    [entries, today]
  );
  const weekHours = useMemo(
    () => entries.filter(e => weekdays.includes(e.date)).reduce((s, e) => s + e.hours, 0),
    [entries, weekdays]
  );

  function getCategoryLabel(cat: TimeCategory) {
    return settings.categoryNames[cat] ?? cat;
  }

  function selectClient(id: string, name: string) {
    setClientId(id);
    setClientSearch(name);
    setShowClientDropdown(false);
    setCaseId('');
  }

  function handleClientSearchChange(value: string) {
    setClientSearch(value);
    setClientId('');
    setCaseId('');
    setShowClientDropdown(true);
  }

  function selectHours(h: number) {
    setHours(h);
    setHoursInput(String(h).replace('.', ','));
  }

  function handleHoursInputChange(value: string) {
    setHoursInput(value);
    const parsed = parseHoursInput(value);
    setHours(parsed);
  }

  function handleHoursInputBlur() {
    if (hours !== '') setHoursInput(String(hours).replace('.', ','));
  }

  function resetForm() {
    setClientId(''); setClientSearch(''); setCaseId(''); setCategory('');
    setHours(''); setHoursInput(''); setDescription('');
    setOnSite(false); setOnSiteType('Undervisning'); setInvoiced(false); setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caseId || !category || !hours) return;
    const entryData: Omit<TimeEntry, 'id' | 'createdAt'> = {
      caseId, date, hours: Number(hours), category: category as TimeCategory,
      description: description.trim(), onSite,
      onSiteType: onSite ? onSiteType : undefined, invoiced,
    };
    if (editingId) {
      updateEntry(editingId, entryData);
    } else {
      addEntry({ id: uuidv4(), ...entryData, createdAt: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    resetForm();
  }

  function startEdit(entry: TimeEntry) {
    const c = cases.find(c => c.id === entry.caseId);
    if (c) {
      const client = clients.find(cl => cl.id === c.clientId);
      setClientId(c.clientId);
      setClientSearch(client?.name ?? '');
      setCaseId(entry.caseId);
    }
    setDate(entry.date);
    setCategory(entry.category);
    setHours(entry.hours);
    setHoursInput(String(entry.hours).replace('.', ','));
    setDescription(entry.description);
    setOnSite(entry.onSite);
    setOnSiteType(entry.onSiteType ?? 'Undervisning');
    setInvoiced(entry.invoiced);
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const holidayName = getHolidayName(date);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrer tid</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE d. MMMM yyyy', { locale: da })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4 shadow-sm">
        {/* Dato */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Dato</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={todayISO()}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />
            <HolidayBadge date={date} />
          </div>
        </div>

        {/* Kunde */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Kunde <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={clientInputRef}
              type="text"
              value={clientSearch}
              onChange={e => handleClientSearchChange(e.target.value)}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Søg efter kunde..."
              autoComplete="off"
              className={`w-full pl-9 pr-9 py-2 bg-white border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${
                clientId ? 'border-blue-500' : 'border-gray-300'
              }`}
            />
            {clientId && (
              <button
                type="button"
                onClick={() => { setClientId(''); setClientSearch(''); setCaseId(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={13} />
              </button>
            )}
            {!clientId && (
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            )}
            {showClientDropdown && (
              <div
                ref={clientDropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl z-20 shadow-xl overflow-hidden max-h-52 overflow-y-auto"
              >
                {filteredClients.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Ingen kunder fundet</p>
                ) : (
                  filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); selectClient(c.id, c.name); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        clientId === c.id ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sag */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Sag <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={caseId}
            onChange={e => setCaseId(e.target.value)}
            disabled={!clientId}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 disabled:opacity-40"
          >
            <option value="">{clientId ? 'Vælg sag...' : 'Vælg først en kunde'}</option>
            {clientCases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Kategori <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => {
              const colors = CATEGORY_TAILWIND[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? colors.dot : 'bg-gray-300'}`} />
                  {getCategoryLabel(cat)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Timer <span className="text-red-500">*</span>
            {hours !== '' && (
              <span className="ml-2 text-blue-600 font-semibold">{String(hours).replace('.', ',')}t valgt</span>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {HOURS_OPTIONS.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => selectHours(h)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  hours === h
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {String(h).replace('.', ',')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={hoursInput}
              onChange={e => handleHoursInputChange(e.target.value)}
              onBlur={handleHoursInputBlur}
              placeholder="Fx. 1,5 eller 2,25"
              className={`w-36 px-3 py-2 bg-white border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors ${
                hoursInput && hours === '' ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <span className="text-xs text-gray-400">Brug komma eller punktum</span>
          </div>
        </div>

        {/* Beskrivelse */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Beskrivelse</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Hvad arbejdede du med?"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setOnSite(!onSite)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
                onSite
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin size={14} />
              On-site besøg
            </button>
            {onSite && (
              <div className="flex gap-2 pl-1">
                {(['Undervisning', 'Installation', 'Salgsmøde'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOnSiteType(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                      onSiteType === t
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setInvoiced(!invoiced)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
              invoiced
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Receipt size={14} />
            Faktureret
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-1">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuller
            </button>
          )}
          <button
            type="submit"
            disabled={!caseId || !category || !hours}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {editingId
              ? <><Pencil size={14} /> Gem ændringer</>
              : <><Clock size={14} /> Gem registrering</>
            }
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={16} />
            Tidsregistrering gemt!
          </div>
        )}
      </form>

      {/* Entries for selected date */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-600">
            {date === todayISO() ? 'Dagens registreringer' : `Registreringer – ${date}`}
          </h2>
          {holidayName && <span className="text-xs text-red-600">{holidayName}</span>}
        </div>

        {todayEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Ingen registreringer for denne dag</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEntries.map(entry => {
              const c = cases.find(c => c.id === entry.caseId);
              const client = c ? clients.find(cl => cl.id === c.clientId) : null;
              const colors = CATEGORY_TAILWIND[entry.category];
              return (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-3.5 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {getCategoryLabel(entry.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{c?.title ?? 'Ukendt sag'}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{client?.name ?? '—'}</span>
                        {entry.onSite && (
                          <span className="flex items-center gap-1 text-xs text-orange-600">
                            <MapPin size={10} /> On-site{entry.onSiteType ? ` · ${entry.onSiteType}` : ''}
                          </span>
                        )}
                        {entry.invoiced && <span className="text-xs text-blue-600">Faktureret</span>}
                      </div>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold text-gray-900">{formatHours(entry.hours)}</span>
                      <button onClick={() => startEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Pencil size={12} />
                      </button>
                      {deleteConfirm === entry.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <X size={12} />
                          </button>
                          <button onClick={() => { deleteEntry(entry.id); setDeleteConfirm(null); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom widget */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl px-4 py-3 flex gap-6 shadow-lg">
        <div className="text-center">
          <p className="text-xs text-gray-400">I dag</p>
          <p className="text-sm font-bold text-gray-900">{formatHours(todayHours)}</p>
        </div>
        <div className="text-center border-l border-gray-200 pl-6">
          <p className="text-xs text-gray-400">Ugen</p>
          <p className="text-sm font-bold text-gray-900">{formatHours(weekHours)}</p>
        </div>
        <div className="text-center border-l border-gray-200 pl-6">
          <p className="text-xs text-gray-400">Normtid</p>
          <p className={`text-sm font-bold ${weekHours >= settings.weeklyHours ? 'text-green-600' : 'text-amber-500'}`}>
            {weekHours >= settings.weeklyHours ? '+' : ''}{formatHours(weekHours - settings.weeklyHours)}
          </p>
        </div>
      </div>
    </div>
  );
}
