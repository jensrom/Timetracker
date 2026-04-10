import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Client, type Case, type TimeEntry, type Settings, type TimeCategory, ALL_CATEGORIES } from '../types';
import { mockClients, mockCases, mockEntries } from '../utils/mockData';

interface AppState {
  clients: Client[];
  cases: Case[];
  entries: TimeEntry[];
  settings: Settings;

  // Clients
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Cases
  addCase: (c: Case) => void;
  updateCase: (id: string, data: Partial<Case>) => void;
  deleteCase: (id: string) => void;

  // Entries
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: string, data: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;

  // Settings
  updateSettings: (data: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  weeklyHours: 37,
  categoryNames: {
    'Salgsmøde': 'Salgsmøde',
    'Support': 'Support',
    'Grønne timer': 'Grønne timer',
    'Intern timer': 'Intern timer',
    'Site Manager': 'Site Manager',
  } as Record<TimeCategory, string>,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      clients: mockClients,
      cases: mockCases,
      entries: mockEntries,
      settings: defaultSettings,

      addClient: (client) => set(s => ({ clients: [...s.clients, client] })),
      updateClient: (id, data) => set(s => ({
        clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteClient: (id) => set(s => ({
        clients: s.clients.filter(c => c.id !== id),
        cases: s.cases.filter(c => c.clientId !== id),
      })),

      addCase: (c) => set(s => ({ cases: [...s.cases, c] })),
      updateCase: (id, data) => set(s => ({
        cases: s.cases.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteCase: (id) => set(s => ({
        cases: s.cases.filter(c => c.id !== id),
        entries: s.entries.filter(e => e.caseId !== id),
      })),

      addEntry: (entry) => set(s => ({ entries: [...s.entries, entry] })),
      updateEntry: (id, data) => set(s => ({
        entries: s.entries.map(e => e.id === id ? { ...e, ...data } : e),
      })),
      deleteEntry: (id) => set(s => ({
        entries: s.entries.filter(e => e.id !== id),
      })),

      updateSettings: (data) => set(s => ({
        settings: { ...s.settings, ...data },
      })),
    }),
    {
      name: 'timetracker-storage',
    }
  )
);

// Selectors
export const useClients = () => useStore(s => s.clients);
export const useCases = () => useStore(s => s.cases);
export const useEntries = () => useStore(s => s.entries);
export const useSettings = () => useStore(s => s.settings);

export function getCategoryDisplayName(category: TimeCategory, settings: Settings): string {
  return settings.categoryNames[category] ?? category;
}

export function getAllCategoryDisplayNames(settings: Settings): Record<TimeCategory, string> {
  const result = {} as Record<TimeCategory, string>;
  ALL_CATEGORIES.forEach(cat => {
    result[cat] = getCategoryDisplayName(cat, settings);
  });
  return result;
}
