// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  cvr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

// ─── Case Categories ──────────────────────────────────────────────────────────

export interface CaseCategory {
  id: string;
  name: string;
  icon: string;   // lucide icon name, e.g. 'Wrench'
  color: string;  // tailwind color key, e.g. 'blue'
  createdAt: string;
}

export const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200' },
};

// ─── Cases ────────────────────────────────────────────────────────────────────

export type CasePriority = 'Kritisk' | 'Høj' | 'Medium' | 'Lav';

export type CaseStatus =
  | 'Ny'
  | 'Under behandling'
  | 'Afventer kunde'
  | 'Afventer leverandør'
  | 'Standby'
  | 'Løst'
  | 'Aktiv'       // kept for backwards compat
  | 'På pause'    // kept for backwards compat
  | 'Lukket'
  | 'Faktureret';

export interface Case {
  id: string;
  clientId: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority?: CasePriority;
  estimatedHours?: number;
  assignedUserId?: string;
  categoryId?: string;
  createdAt: string;
}

export const PRIORITY_COLORS: Record<CasePriority, string> = {
  'Kritisk': 'bg-red-100 text-red-700 border-red-200',
  'Høj':     'bg-orange-100 text-orange-700 border-orange-200',
  'Medium':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Lav':     'bg-green-100 text-green-700 border-green-200',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  'Ny':                  'text-blue-700 bg-blue-100 border-blue-200',
  'Under behandling':    'text-indigo-700 bg-indigo-100 border-indigo-200',
  'Afventer kunde':      'text-amber-700 bg-amber-100 border-amber-200',
  'Afventer leverandør': 'text-orange-700 bg-orange-100 border-orange-200',
  'Standby':             'text-gray-600 bg-gray-100 border-gray-200',
  'Løst':                'text-green-700 bg-green-100 border-green-200',
  'Aktiv':               'text-green-700 bg-green-100 border-green-200',
  'På pause':            'text-yellow-700 bg-yellow-100 border-yellow-200',
  'Lukket':              'text-gray-500 bg-gray-100 border-gray-200',
  'Faktureret':          'text-blue-700 bg-blue-100 border-blue-200',
};

// ─── Time Entries ─────────────────────────────────────────────────────────────

export type TimeCategory =
  | 'Salgsmøde'
  | 'Support'
  | 'Grønne timer'
  | 'Intern timer'
  | 'Site Manager';

export interface TimeEntry {
  id: string;
  caseId: string;
  date: string;
  hours: number;
  category: TimeCategory;
  description: string;
  onSite: boolean;
  onSiteType?: 'Undervisning' | 'Installation' | 'Salgsmøde';
  invoiced: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORY_COLORS: Record<TimeCategory, string> = {
  'Salgsmøde':    'blue',
  'Support':      'orange',
  'Grønne timer': 'green',
  'Intern timer': 'purple',
  'Site Manager': 'indigo',
};

export const CATEGORY_TAILWIND: Record<TimeCategory, { bg: string; text: string; border: string; dot: string }> = {
  'Salgsmøde':    { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  'Support':      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  'Grønne timer': { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  'Intern timer': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Site Manager': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
};

export const CATEGORY_HEX: Record<TimeCategory, string> = {
  'Salgsmøde':    '#3b82f6',
  'Support':      '#f97316',
  'Grønne timer': '#22c55e',
  'Intern timer': '#a855f7',
  'Site Manager': '#6366f1',
};

export const ALL_CATEGORIES: TimeCategory[] = [
  'Salgsmøde',
  'Support',
  'Grønne timer',
  'Intern timer',
  'Site Manager',
];

// ─── Checklist Templates ──────────────────────────────────────────────────────

export interface ChecklistTemplateItem {
  id: string;
  text: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  categoryId?: string;
  items: ChecklistTemplateItem[];
  createdAt: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'Åben'
  | 'I gang'
  | 'Afventer kunde'
  | 'Afventer leverandør'
  | 'Standby'
  | 'Løst'
  | 'Lukket';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  notes?: string;
}

export interface Task {
  id: string;
  taskNumber: string;
  caseId: string;
  clientId: string;
  heading: string;
  templateId?: string;
  priority: CasePriority;
  status: TaskStatus;
  assignedUserId?: string;
  dueDate?: string;
  items: TaskItem[];
  createdAt: string;
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'Åben':                'text-blue-700 bg-blue-100 border-blue-200',
  'I gang':              'text-indigo-700 bg-indigo-100 border-indigo-200',
  'Afventer kunde':      'text-amber-700 bg-amber-100 border-amber-200',
  'Afventer leverandør': 'text-orange-700 bg-orange-100 border-orange-200',
  'Standby':             'text-gray-600 bg-gray-100 border-gray-200',
  'Løst':                'text-green-700 bg-green-100 border-green-200',
  'Lukket':              'text-gray-500 bg-gray-100 border-gray-200',
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  weeklyHours: number;
  categoryNames: Record<TimeCategory, string>;
  dbPath?: string;
  caseNumberCounter: number;
  taskNumberCounter: number;
}
