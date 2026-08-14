import { User, Task, TaskCompletion, GoogleSheetConfig, DashboardStats } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(data.token);
    return data;
  },

  async loginWithGoogle(email: string, name?: string, avatar?: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name, avatar })
    });
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User; token: string }> {
    return request<{ user: User; token: string }>('/auth/me');
  },

  logout() {
    setAuthToken(null);
  },

  // Users
  async getUsers(): Promise<User[]> {
    const data = await request<{ users: User[] }>('/users');
    return data.users;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const data = await request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data.user;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const data = await request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  async deleteUser(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    const data = await request<{ tasks: Task[] }>('/tasks');
    return data.tasks;
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const data = await request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return data.task;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const data = await request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  // Completions
  async getCompletions(): Promise<TaskCompletion[]> {
    const data = await request<{ completions: TaskCompletion[] }>('/completions');
    return data.completions;
  },

  async submitCompletion(submission: {
    taskId: string;
    notes: string;
    proofUrl?: string;
    timeSpentMinutes?: number;
    subtasksCompleted: string[];
    cycleId: string;
    customResponses?: Record<string, any>;
  }): Promise<TaskCompletion> {
    const data = await request<{ completion: TaskCompletion }>('/completions', {
      method: 'POST',
      body: JSON.stringify(submission)
    });
    return data.completion;
  },

  async deleteCompletion(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/completions/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats');
  },

  // Google Sheets Config
  async getSheetConfig(): Promise<GoogleSheetConfig> {
    const data = await request<{ config: GoogleSheetConfig }>('/sheets/config');
    return data.config;
  },

  async updateSheetConfig(config: Partial<GoogleSheetConfig>): Promise<GoogleSheetConfig> {
    const data = await request<{ config: GoogleSheetConfig }>('/sheets/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return data.config;
  },

  async testSheetConnection(config?: Partial<GoogleSheetConfig>): Promise<{ success: boolean; message: string; title?: string }> {
    return request<{ success: boolean; message: string; title?: string }>('/sheets/test', {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  },

  async pushAllToSheets(config?: Partial<GoogleSheetConfig>): Promise<{ success: boolean; message: string; details?: any }> {
    return request<{ success: boolean; message: string; details?: any }>('/sheets/sync-push', {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  },

  async getAppsScriptTemplate(): Promise<string> {
    const data = await request<{ template: string }>('/sheets/script-template');
    return data.template;
  }
};
