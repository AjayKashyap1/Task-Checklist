import fs from 'fs';
import path from 'path';
import { User, Task, TaskCompletion, GoogleSheetConfig, DashboardStats, TaskFrequency } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

export interface AppData {
  users: User[];
  tasks: Task[];
  completions: TaskCompletion[];
  sheetConfig: GoogleSheetConfig;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Ajay Sharma',
    email: 'ajay741900@gmail.com',
    password: 'admin',
    role: 'admin',
    department: 'Management',
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    authProvider: 'both',
  },
  {
    id: 'usr_admin_2',
    name: 'System Admin',
    email: 'admin@company.com',
    password: 'admin',
    role: 'admin',
    department: 'Operations',
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    authProvider: 'local',
  },
  {
    id: 'usr_mem_1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    password: 'password123',
    role: 'member',
    department: 'Engineering',
    isActive: true,
    createdAt: '2026-08-02T10:00:00Z',
    authProvider: 'local',
  },
  {
    id: 'usr_mem_2',
    name: 'David Miller',
    email: 'david.miller@company.com',
    password: 'password123',
    role: 'member',
    department: 'Customer Support',
    isActive: true,
    createdAt: '2026-08-03T11:00:00Z',
    authProvider: 'local',
  },
  {
    id: 'usr_mem_3',
    name: 'Priya Patel',
    email: 'priya.patel@company.com',
    password: 'password123',
    role: 'member',
    department: 'Marketing',
    isActive: true,
    createdAt: '2026-08-04T12:00:00Z',
    authProvider: 'local',
  },
  {
    id: 'usr_mem_4',
    name: 'Alex Rivera',
    email: 'alex.rivera@company.com',
    password: 'password123',
    role: 'member',
    department: 'Product & QA',
    isActive: true,
    createdAt: '2026-08-05T08:30:00Z',
    authProvider: 'local',
  }
];

const DEFAULT_TASKS: Task[] = [
  // DAILY TASKS
  {
    id: 'tsk_daily_1',
    title: 'Daily Standup & Goal Submission',
    description: 'Post today\'s top 3 priorities, ongoing deliverables, and any blockers for team alignment.',
    frequency: 'daily',
    priority: 'high',
    department: 'All',
    assignedTo: ['*'],
    dueTime: '10:30',
    checklist: [
      { id: 'c1', text: 'Reviewed yesterday\'s closed tickets' },
      { id: 'c2', text: 'Declared today\'s focus items' },
      { id: 'c3', text: 'Flagged any dependency blockers' }
    ],
    requiresNotes: true,
    requiresProofUrl: false,
    requiresTimeSpent: false,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },
  {
    id: 'tsk_daily_2',
    title: 'Customer Ticket Queue Zero Check',
    description: 'Review unassigned incoming customer tickets and triage unresolved tier-1 tickets before end of shift.',
    frequency: 'daily',
    priority: 'high',
    department: 'Customer Support',
    assignedTo: ['usr_mem_2'],
    dueTime: '17:00',
    checklist: [
      { id: 'c1', text: 'Check Zendesk/Intercom inbox' },
      { id: 'c2', text: 'Ensure first response SLA < 15 mins' },
      { id: 'c3', text: 'Escalate open bugs to engineering' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },
  {
    id: 'tsk_daily_3',
    title: 'Production Logs & Health Verification',
    description: 'Verify error rates on Datadog/CloudWatch and inspect database CPU utilization spikes.',
    frequency: 'daily',
    priority: 'urgent',
    department: 'Engineering',
    assignedTo: ['usr_mem_1'],
    dueTime: '09:00',
    checklist: [
      { id: 'c1', text: 'Verify 5xx error rate is under 0.05%' },
      { id: 'c2', text: 'Check Redis memory cache eviction rates' },
      { id: 'c3', text: 'Confirm automated backup completed successfully' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },

  // WEEKLY TASKS
  {
    id: 'tsk_weekly_1',
    title: 'Weekly Sprint Backlog Grooming & Pointing',
    description: 'Refine user stories for the upcoming sprint, ensure acceptance criteria are defined.',
    frequency: 'weekly',
    priority: 'high',
    department: 'Engineering',
    assignedTo: ['usr_mem_1', 'usr_mem_4'],
    targetDayOfWeek: 1, // Monday
    dueTime: '16:00',
    checklist: [
      { id: 'c1', text: 'Review top 10 ranked tickets in JIRA' },
      { id: 'c2', text: 'Assign story points estimation' },
      { id: 'c3', text: 'Confirm design assets are linked in Figma' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },
  {
    id: 'tsk_weekly_2',
    title: 'Weekly Marketing Campaign Analytics Digest',
    description: 'Aggregate weekly ad spend, conversion rates, CAC, and lead generation figures.',
    frequency: 'weekly',
    priority: 'medium',
    department: 'Marketing',
    assignedTo: ['usr_mem_3'],
    targetDayOfWeek: 5, // Friday
    dueTime: '15:00',
    checklist: [
      { id: 'c1', text: 'Export Google Ads & Meta campaign KPIs' },
      { id: 'c2', text: 'Calculate weekly blended CAC' },
      { id: 'c3', text: 'Share executive summary on Slack channel' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },

  // MONTHLY TASKS
  {
    id: 'tsk_monthly_1',
    title: 'Monthly Cloud Infrastructure Cost & License Audit',
    description: 'Audit idle Cloud instances, unused staging clusters, and third-party SaaS seats.',
    frequency: 'monthly',
    priority: 'medium',
    department: 'Engineering',
    assignedTo: ['usr_mem_1'],
    targetDayOfMonth: 1,
    dueTime: '18:00',
    checklist: [
      { id: 'c1', text: 'Review GCP/AWS monthly billing breakdown' },
      { id: 'c2', text: 'Terminate unattached storage volumes & orphaned IPs' },
      { id: 'c3', text: 'Decommission seats for departed contractor accounts' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },
  {
    id: 'tsk_monthly_2',
    title: 'Monthly Team Satisfaction & Retention Check-in',
    description: 'Conduct 1-on-1 feedback sessions with team members to review quarterly goals and morale.',
    frequency: 'monthly',
    priority: 'high',
    department: 'Management',
    assignedTo: ['usr_admin_1', 'usr_admin_2'],
    targetDayOfMonth: 28,
    dueTime: '17:00',
    checklist: [
      { id: 'c1', text: 'Schedule 30-min 1-on-1s with each direct report' },
      { id: 'c2', text: 'Document career progression milestones' },
      { id: 'c3', text: 'Address tooling & workflow bottlenecks' }
    ],
    requiresNotes: true,
    requiresProofUrl: false,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    createdBy: 'usr_admin_1'
  },

  // ONE-TIME TASKS
  {
    id: 'tsk_onetime_1',
    title: 'SOC-2 Type II Compliance Evidence Submission',
    description: 'Collect screenshots of MFA enforcement, access control logs, and encrypted backup policies for auditor.',
    frequency: 'one-time',
    priority: 'urgent',
    department: 'Engineering',
    assignedTo: ['usr_mem_1', 'usr_mem_4'],
    dueDate: '2026-08-25',
    checklist: [
      { id: 'c1', text: 'Export Okta/Google Workspace MFA compliance report' },
      { id: 'c2', text: 'Provide snapshot of production DB encryption at rest' },
      { id: 'c3', text: 'Upload policy sign-off acknowledgements' }
    ],
    requiresNotes: true,
    requiresProofUrl: true,
    requiresTimeSpent: true,
    isActive: true,
    createdAt: '2026-08-10T11:00:00Z',
    createdBy: 'usr_admin_1'
  }
];

const DEFAULT_COMPLETIONS: TaskCompletion[] = [
  {
    id: 'cmp_1',
    taskId: 'tsk_daily_1',
    taskTitle: 'Daily Standup & Goal Submission',
    userId: 'usr_mem_1',
    userName: 'Sarah Chen',
    userEmail: 'sarah.chen@company.com',
    frequency: 'daily',
    cycleId: '2026-08-14',
    completedAt: '2026-08-14T09:15:00Z',
    notes: 'Working on authentication edge cases and Google Sheets auto-sync retry queue today.',
    proofUrl: 'https://github.com/org/repo/pull/42',
    timeSpentMinutes: 15,
    status: 'verified',
    subtasksCompleted: ['c1', 'c2', 'c3']
  },
  {
    id: 'cmp_2',
    taskId: 'tsk_daily_3',
    taskTitle: 'Production Logs & Health Verification',
    userId: 'usr_mem_1',
    userName: 'Sarah Chen',
    userEmail: 'sarah.chen@company.com',
    frequency: 'daily',
    cycleId: '2026-08-14',
    completedAt: '2026-08-14T09:05:00Z',
    notes: 'All health checks green. P99 latency is 42ms. Zero 5xx errors recorded in last 24h.',
    proofUrl: 'https://app.datadoghq.com/dashboard/prod-health',
    timeSpentMinutes: 20,
    status: 'verified',
    subtasksCompleted: ['c1', 'c2', 'c3']
  },
  {
    id: 'cmp_3',
    taskId: 'tsk_daily_1',
    taskTitle: 'Daily Standup & Goal Submission',
    userId: 'usr_mem_2',
    userName: 'David Miller',
    userEmail: 'david.miller@company.com',
    frequency: 'daily',
    cycleId: '2026-08-14',
    completedAt: '2026-08-14T09:45:00Z',
    notes: 'Clearing 14 new customer tickets regarding SSO configuration. All within SLA.',
    proofUrl: 'https://zendesk.com/agent/tickets/all',
    timeSpentMinutes: 10,
    status: 'verified',
    subtasksCompleted: ['c1', 'c2', 'c3']
  },
  {
    id: 'cmp_4',
    taskId: 'tsk_weekly_1',
    taskTitle: 'Weekly Sprint Backlog Grooming & Pointing',
    userId: 'usr_mem_4',
    userName: 'Alex Rivera',
    userEmail: 'alex.rivera@company.com',
    frequency: 'weekly',
    cycleId: '2026-W33',
    completedAt: '2026-08-11T16:30:00Z',
    notes: 'Groomed 12 user stories for Sprint 48. Acceptance criteria validated with product team.',
    proofUrl: 'https://jira.company.com/sprints/48',
    timeSpentMinutes: 45,
    status: 'verified',
    subtasksCompleted: ['c1', 'c2', 'c3']
  }
];

const DEFAULT_SHEET_CONFIG: GoogleSheetConfig = {
  sheetId: process.env.GOOGLE_SHEET_ID || '',
  serviceAccountEmail: '',
  serviceAccountKey: '',
  appsScriptUrl: '',
  autoSync: true,
  sheetTabs: {
    usersTab: 'Users',
    tasksTab: 'Tasks',
    completionsTab: 'Completions',
    settingsTab: 'Settings'
  },
  lastSyncStatus: 'idle'
};

class DataStore {
  private data: AppData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): AppData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || DEFAULT_USERS,
          tasks: parsed.tasks || DEFAULT_TASKS,
          completions: parsed.completions || DEFAULT_COMPLETIONS,
          sheetConfig: {
            ...DEFAULT_SHEET_CONFIG,
            ...(parsed.sheetConfig || {})
          }
        };
      }
    } catch (err) {
      console.warn('Could not read persistent file, using memory state:', err);
    }

    const initial: AppData = {
      users: DEFAULT_USERS,
      tasks: DEFAULT_TASKS,
      completions: DEFAULT_COMPLETIONS,
      sheetConfig: DEFAULT_SHEET_CONFIG
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: AppData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write persistent file:', err);
    }
  }

  public getData(): AppData {
    return this.data;
  }

  public persist() {
    this.saveData(this.data);
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Tasks
  public getTasks(): Task[] {
    return this.data.tasks;
  }

  public getTaskById(id: string): Task | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  public addTask(task: Task): Task {
    this.data.tasks.push(task);
    this.persist();
    return task;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates };
    this.persist();
    return this.data.tasks[idx];
  }

  public deleteTask(id: string): boolean {
    const initLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    if (this.data.tasks.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Completions
  public getCompletions(): TaskCompletion[] {
    return this.data.completions;
  }

  public addCompletion(completion: TaskCompletion): TaskCompletion {
    // Check if completion for this task and cycle already exists by this user - if so replace or update
    const existingIdx = this.data.completions.findIndex(
      c => c.taskId === completion.taskId && c.userId === completion.userId && c.cycleId === completion.cycleId
    );
    if (existingIdx >= 0) {
      this.data.completions[existingIdx] = completion;
    } else {
      this.data.completions.unshift(completion);
    }
    this.persist();
    return completion;
  }

  public deleteCompletion(id: string): boolean {
    const initLen = this.data.completions.length;
    this.data.completions = this.data.completions.filter(c => c.id !== id);
    if (this.data.completions.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Sheet Config
  public getSheetConfig(): GoogleSheetConfig {
    return this.data.sheetConfig;
  }

  public updateSheetConfig(config: Partial<GoogleSheetConfig>): GoogleSheetConfig {
    this.data.sheetConfig = {
      ...this.data.sheetConfig,
      ...config
    };
    this.persist();
    return this.data.sheetConfig;
  }

  // Stats calculation
  public getDashboardStats(): DashboardStats {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeTasks = this.data.tasks.filter(t => t.isActive);
    const activeUsers = this.data.users.filter(u => u.isActive && u.role !== 'admin');
    
    // Completions today
    const completionsToday = this.data.completions.filter(c => c.completedAt.startsWith(todayStr));
    
    // Frequency breakdown
    const frequencyBreakdown: Record<TaskFrequency, { total: number; completed: number }> = {
      daily: { total: 0, completed: 0 },
      weekly: { total: 0, completed: 0 },
      monthly: { total: 0, completed: 0 },
      'one-time': { total: 0, completed: 0 }
    };

    activeTasks.forEach(task => {
      frequencyBreakdown[task.frequency].total += 1;
    });

    this.data.completions.forEach(comp => {
      if (frequencyBreakdown[comp.frequency]) {
        frequencyBreakdown[comp.frequency].completed += 1;
      }
    });

    // Department stats
    const depts = Array.from(new Set(this.data.users.map(u => u.department).filter(Boolean)));
    const departmentStats = depts.map(dept => {
      const deptMembers = this.data.users.filter(u => u.department === dept);
      const deptMemberIds = new Set(deptMembers.map(u => u.id));
      const deptCompletions = this.data.completions.filter(c => deptMemberIds.has(c.userId));
      const completionRate = deptMembers.length > 0 ? Math.min(100, Math.round((deptCompletions.length / (deptMembers.length * 3)) * 100)) : 0;
      return {
        department: dept,
        memberCount: deptMembers.length,
        completionRate
      };
    });

    // Overall Completion rate for active tasks today
    const totalPotentialDaily = activeTasks.filter(t => t.frequency === 'daily').length * Math.max(1, activeUsers.length);
    const completedDailyToday = completionsToday.filter(c => c.frequency === 'daily').length;
    const completionRate = totalPotentialDaily > 0 
      ? Math.min(100, Math.round((completedDailyToday / totalPotentialDaily) * 100)) 
      : 85;

    return {
      totalMembers: this.data.users.filter(u => u.isActive).length,
      activeTasks: activeTasks.length,
      completionsToday: completionsToday.length,
      completionRate,
      frequencyBreakdown,
      departmentStats,
      recentCompletions: this.data.completions.slice(0, 8),
      pendingTasksCount: Math.max(0, activeTasks.length - completionsToday.length)
    };
  }
}

export const db = new DataStore();
