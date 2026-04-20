import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Client, type Case, type TimeEntry, type Settings,
  type TimeCategory, ALL_CATEGORIES,
  type AppUser, type AuthSession,
  type CaseCategory,
  type ChecklistTemplate,
  type Task, type TaskItem,
} from '../types';
import { mockClients, mockCases, mockEntries } from '../utils/mockData';
import { generateCaseNumber, generateTaskNumber, verifyPassword, DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/numberUtils';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CASE_CATEGORIES: CaseCategory[] = [
  { id: 'cat-1', name: 'Installation',  icon: 'Wrench',        color: 'blue',   createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Support',       icon: 'Headphones',    color: 'orange', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Onboarding',    icon: 'UserCheck',     color: 'green',  createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Fejlmelding',   icon: 'AlertTriangle', color: 'red',    createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'Opdatering',    icon: 'RefreshCw',     color: 'purple', createdAt: new Date().toISOString() },
];

const DEFAULT_ADMIN: AppUser = {
  id: 'user-admin-default',
  email: 'admin@timetracker.dk',
  passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
  name: 'Administrator',
  role: 'admin',
  createdAt: new Date().toISOString(),
  isActive: true,
};

const defaultSettings: Settings = {
  weeklyHours: 37,
  categoryNames: {
    'Salgsmøde': 'Salgsmøde',
    'Support': 'Support',
    'Grønne timer': 'Grønne timer',
    'Intern timer': 'Intern timer',
    'Site Manager': 'Site Manager',
  } as Record<TimeCategory, string>,
  caseNumberCounter: 0,
  taskNumberCounter: 0,
};

interface AppState {
  // ─── Core Data ──────────────────────────────────────────────────────────────
  clients: Client[];
  cases: Case[];
  entries: TimeEntry[];
  settings: Settings;

  // ─── Auth ───────────────────────────────────────────────────────────────────
  users: AppUser[];
  session: AuthSession | null;

  // ─── New Collections ────────────────────────────────────────────────────────
  caseCategories: CaseCategory[];
  templates: ChecklistTemplate[];
  tasks: Task[];

  // ─── Client Actions ─────────────────────────────────────────────────────────
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // ─── Case Actions ───────────────────────────────────────────────────────────
  addCase: (data: Omit<Case, 'id' | 'createdAt' | 'caseNumber'>) => void;
  updateCase: (id: string, data: Partial<Case>) => void;
  deleteCase: (id: string) => void;

  // ─── Entry Actions ──────────────────────────────────────────────────────────
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: string, data: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;

  // ─── Settings Actions ───────────────────────────────────────────────────────
  updateSettings: (data: Partial<Settings>) => void;

  // ─── Auth Actions ───────────────────────────────────────────────────────────
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: AppUser) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  // ─── Category Actions ───────────────────────────────────────────────────────
  addCaseCategory: (cat: CaseCategory) => void;
  updateCaseCategory: (id: string, data: Partial<CaseCategory>) => void;
  deleteCaseCategory: (id: string) => void;

  // ─── Template Actions ───────────────────────────────────────────────────────
  addTemplate: (t: ChecklistTemplate) => void;
  updateTemplate: (id: string, data: Partial<ChecklistTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // ─── Task Actions ────────────────────────────────────────────────────────────
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'taskNumber'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskItem: (taskId: string, itemId: string, data: Partial<TaskItem>) => void;
  reorderTaskItems: (taskId: string, items: TaskItem[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: mockClients,
      cases: mockCases,
      entries: mockEntries,
      settings: defaultSettings,
      users: [DEFAULT_ADMIN],
      session: null,
      caseCategories: DEFAULT_CASE_CATEGORIES,
      templates: [],
      tasks: [],

      // ─── Clients ──────────────────────────────────────────────────────────
      addClient: (client) => set(s => ({ clients: [...s.clients, client] })),
      updateClient: (id, data) => set(s => ({
        clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteClient: (id) => set(s => ({
        clients: s.clients.filter(c => c.id !== id),
        cases: s.cases.filter(c => c.clientId !== id),
        tasks: s.tasks.filter(t => t.clientId !== id),
      })),

      // ─── Cases ────────────────────────────────────────────────────────────
      addCase: (data) => set(s => {
        const counter = (s.settings.caseNumberCounter ?? 0) + 1;
        const caseNumber = generateCaseNumber(counter);
        return {
          cases: [...s.cases, { id: uuidv4(), caseNumber, ...data, createdAt: new Date().toISOString() }],
          settings: { ...s.settings, caseNumberCounter: counter },
        };
      }),
      updateCase: (id, data) => set(s => ({
        cases: s.cases.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteCase: (id) => set(s => ({
        cases: s.cases.filter(c => c.id !== id),
        entries: s.entries.filter(e => e.caseId !== id),
        tasks: s.tasks.filter(t => t.caseId !== id),
      })),

      // ─── Entries ──────────────────────────────────────────────────────────
      addEntry: (entry) => set(s => ({ entries: [...s.entries, entry] })),
      updateEntry: (id, data) => set(s => ({
        entries: s.entries.map(e => e.id === id ? { ...e, ...data } : e),
      })),
      deleteEntry: (id) => set(s => ({
        entries: s.entries.filter(e => e.id !== id),
      })),

      // ─── Settings ─────────────────────────────────────────────────────────
      updateSettings: (data) => set(s => ({
        settings: { ...s.settings, ...data },
      })),

      // ─── Auth ─────────────────────────────────────────────────────────────
      login: async (email, password) => {
        const users = get().users;
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
        if (!user) return false;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return false;
        set({ session: { userId: user.id, email: user.email, name: user.name, role: user.role } });
        return true;
      },
      logout: () => set({ session: null }),
      addUser: (user) => set(s => ({ users: [...s.users, user] })),
      updateUser: (id, data) => set(s => ({
        users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
      })),
      deleteUser: (id) => set(s => ({
        users: s.users.filter(u => u.id !== id),
      })),

      // ─── Categories ───────────────────────────────────────────────────────
      addCaseCategory: (cat) => set(s => ({ caseCategories: [...s.caseCategories, cat] })),
      updateCaseCategory: (id, data) => set(s => ({
        caseCategories: s.caseCategories.map(c => c.id === id ? { ...c, ...data } : c),
      })),
      deleteCaseCategory: (id) => set(s => ({
        caseCategories: s.caseCategories.filter(c => c.id !== id),
      })),

      // ─── Templates ────────────────────────────────────────────────────────
      addTemplate: (t) => set(s => ({ templates: [...s.templates, t] })),
      updateTemplate: (id, data) => set(s => ({
        templates: s.templates.map(t => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTemplate: (id) => set(s => ({
        templates: s.templates.filter(t => t.id !== id),
      })),

      // ─── Tasks ────────────────────────────────────────────────────────────
      addTask: (data) => set(s => {
        const counter = (s.settings.taskNumberCounter ?? 0) + 1;
        const taskNumber = generateTaskNumber(counter);
        return {
          tasks: [...s.tasks, { id: uuidv4(), taskNumber, ...data, createdAt: new Date().toISOString() }],
          settings: { ...s.settings, taskNumberCounter: counter },
        };
      }),
      updateTask: (id, data) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id),
      })),
      updateTaskItem: (taskId, itemId, data) => set(s => ({
        tasks: s.tasks.map(t =>
          t.id === taskId
            ? { ...t, items: t.items.map(i => i.id === itemId ? { ...i, ...data } : i) }
            : t
        ),
      })),
      reorderTaskItems: (taskId, items) => set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, items } : t),
      })),
    }),
    { name: 'timetracker-storage' }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useClients = () => useStore(s => s.clients);
export const useCases = () => useStore(s => s.cases);
export const useEntries = () => useStore(s => s.entries);
export const useSettings = () => useStore(s => s.settings);
export const useUsers = () => useStore(s => s.users);
export const useSession = () => useStore(s => s.session);
export const useCaseCategories = () => useStore(s => s.caseCategories);
export const useTemplates = () => useStore(s => s.templates);
export const useTasks = () => useStore(s => s.tasks);

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
