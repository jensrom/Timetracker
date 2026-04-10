export interface Client {
  id: string;
  name: string;
  cvr?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface Case {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'Aktiv' | 'På pause' | 'Lukket' | 'Faktureret';
  estimatedHours?: number;
  createdAt: string;
}

export type TimeCategory =
  | 'Salgsmøde'
  | 'Support'
  | 'Grønne timer'
  | 'Intern timer'
  | 'Site Manager';

export interface TimeEntry {
  id: string;
  caseId: string;
  date: string; // ISO date (YYYY-MM-DD)
  hours: number;
  category: TimeCategory;
  description: string;
  onSite: boolean;
  onSiteType?: 'Undervisning' | 'Installation' | 'Salgsmøde';
  invoiced: boolean;
  createdAt: string;
}

export interface Settings {
  weeklyHours: number;
  categoryNames: Record<TimeCategory, string>;
  dbPath?: string;
}

export const DEFAULT_CATEGORY_COLORS: Record<TimeCategory, string> = {
  'Salgsmøde': 'blue',
  'Support': 'orange',
  'Grønne timer': 'green',
  'Intern timer': 'purple',
  'Site Manager': 'indigo',
};

export const CATEGORY_TAILWIND: Record<TimeCategory, { bg: string; text: string; border: string; dot: string }> = {
  'Salgsmøde':    { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/40',   dot: 'bg-blue-500' },
  'Support':      { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', dot: 'bg-orange-500' },
  'Grønne timer': { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/40',  dot: 'bg-green-500' },
  'Intern timer': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', dot: 'bg-purple-500' },
  'Site Manager': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', dot: 'bg-indigo-500' },
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

export const CASE_STATUS_COLORS: Record<Case['status'], string> = {
  'Aktiv':      'text-green-400 bg-green-500/20 border-green-500/40',
  'På pause':   'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
  'Lukket':     'text-gray-400 bg-gray-500/20 border-gray-500/40',
  'Faktureret': 'text-blue-400 bg-blue-500/20 border-blue-500/40',
};
