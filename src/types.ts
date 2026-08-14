export type Role = 'admin' | 'manager' | 'member';
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'one-time';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  authProvider: 'local' | 'google' | 'both';
  googleId?: string;
}

export interface CustomFieldDef {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'url';
  required?: boolean;
  options?: string[];
}

export interface TaskChecklistItem {
  id: string;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
  department: string;
  assignedTo: string[]; // User IDs or ['*'] for all
  dueTime?: string; // e.g. "17:00"
  targetDayOfWeek?: number; // 0=Sun, 1=Mon... for weekly
  targetDayOfMonth?: number; // 1-31 for monthly
  dueDate?: string; // YYYY-MM-DD for one-time
  checklist: TaskChecklistItem[];
  requiresNotes?: boolean;
  requiresProofUrl?: boolean;
  requiresTimeSpent?: boolean;
  customFields?: CustomFieldDef[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  frequency: TaskFrequency;
  cycleId: string; // "2026-08-14" (daily), "2026-W33" (weekly), "2026-08" (monthly), "one-time"
  completedAt: string;
  notes: string;
  proofUrl?: string;
  timeSpentMinutes?: number;
  status: 'verified' | 'submitted' | 'flagged';
  subtasksCompleted: string[];
  customResponses?: Record<string, any>;
  adminFeedback?: string;
}

export interface GoogleSheetConfig {
  sheetId: string;
  serviceAccountEmail?: string;
  serviceAccountKey?: string;
  appsScriptUrl?: string;
  autoSync: boolean;
  sheetTabs: {
    usersTab: string;
    tasksTab: string;
    completionsTab: string;
    settingsTab: string;
  };
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncMessage?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeTasks: number;
  completionsToday: number;
  completionRate: number;
  frequencyBreakdown: Record<TaskFrequency, { total: number; completed: number }>;
  departmentStats: { department: string; memberCount: number; completionRate: number }[];
  recentCompletions: TaskCompletion[];
  pendingTasksCount: number;
}
