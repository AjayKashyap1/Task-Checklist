import React, { useState } from 'react';
import { User, Task, TaskCompletion, DashboardStats, TaskFrequency } from '../types';
import { api } from '../services/api';
import { formatFrequencyLabel, getFrequencyColor, formatTimestamp } from '../utils/dateUtils';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Download,
  Check,
  X,
  UserPlus
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  tasks: Task[];
  users: User[];
  completions: TaskCompletion[];
  onOpenCreateTask: (taskToEdit?: Task) => void;
  onOpenCreateUser: () => void;
  onRefreshData: () => void;
  onNavigateToSheets: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  tasks,
  users,
  completions,
  onOpenCreateTask,
  onOpenCreateUser,
  onRefreshData,
  onNavigateToSheets
}) => {
  const [adminView, setAdminView] = useState<'overview' | 'tasks' | 'team' | 'submissions'>('overview');
  const [taskFreqFilter, setTaskFreqFilter] = useState<TaskFrequency | 'all'>('all');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task cadence?')) return;
    setDeletingId(id);
    try {
      await api.deleteTask(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member account?')) return;
    try {
      await api.deleteUser(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (taskFreqFilter !== 'all' && t.frequency !== taskFreqFilter) return false;
    return true;
  });

  const filteredCompletions = completions.filter(c => {
    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase();
      return (
        c.taskTitle.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Admin Operations & Progress Dashboard
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
              Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor team completion rates, delegate task cadences, manage accounts, and audit submissions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            id="admin-create-user-btn"
            onClick={onOpenCreateUser}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member Account</span>
          </button>

          <button
            id="admin-create-task-btn"
            onClick={() => onOpenCreateTask()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task Cadence</span>
          </button>
        </div>
      </div>

      {/* Admin Subview Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setAdminView('overview')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            adminView === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Analytics Overview</span>
        </button>

        <button
          onClick={() => setAdminView('tasks')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            adminView === 'tasks'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Task Cadence Manager ({tasks.length})</span>
        </button>

        <button
          onClick={() => setAdminView('team')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            adminView === 'team'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setAdminView('submissions')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            adminView === 'submissions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Submission Log & Audit ({completions.length})</span>
        </button>
      </div>

      {/* VIEW 1: OVERVIEW & REAL-TIME ANALYTICS */}
      {adminView === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Completion Rate</span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats?.completionRate || 85}%
                </span>
                <span className="text-xs text-emerald-500 font-semibold flex items-center">
                  +4% vs last week
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats?.completionRate || 85}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completions Today</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats?.completionsToday || 0}
                </span>
                <span className="text-xs text-slate-500">
                  submissions recorded
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-syncing to Google Sheets
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Task Cadences</span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {tasks.length}
                </span>
                <span className="text-xs text-slate-500">
                  across 4 frequencies
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Daily, Weekly, Monthly & One-time
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Team Members</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {users.length}
                </span>
                <span className="text-xs text-slate-500">
                  registered accounts
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Email/Password & Google OAuth
              </p>
            </div>

          </div>

          {/* Frequency Cadence Breakdown & Department Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Frequency Cadence Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Task Cadence Breakdown</span>
                <span className="text-xs font-medium text-slate-400">Frequencies</span>
              </h3>

              <div className="space-y-4">
                {(['daily', 'weekly', 'monthly', 'one-time'] as const).map(freq => {
                  const count = tasks.filter(t => t.frequency === freq).length;
                  const comps = completions.filter(c => c.frequency === freq).length;
                  const styles = getFrequencyColor(freq);

                  return (
                    <div key={freq} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="capitalize flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            freq === 'daily' ? 'bg-blue-500' : freq === 'weekly' ? 'bg-emerald-500' : freq === 'monthly' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                          {formatFrequencyLabel(freq)} Tasks
                        </span>
                        <span className="text-slate-500">
                          {count} Active Tasks • {comps} Total Submissions
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            freq === 'daily' ? 'bg-blue-500' : freq === 'weekly' ? 'bg-emerald-500' : freq === 'monthly' ? 'bg-purple-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (count / Math.max(1, tasks.length)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Leaderboard & Compliance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Department Workload & Compliance</span>
                <span className="text-xs font-medium text-slate-400">Team Health</span>
              </h3>

              <div className="space-y-3">
                {stats?.departmentStats && stats.departmentStats.length > 0 ? (
                  stats.departmentStats.map(d => (
                    <div key={d.department} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{d.department}</p>
                        <p className="text-[11px] text-slate-500">{d.memberCount} team members</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{d.completionRate}%</span>
                        <span className="text-[10px] text-slate-400 block">Compliance</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">All departments performing normally.</p>
                )}
              </div>
            </div>

          </div>

          {/* Recent Live Completions Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Team Completions</h3>
                <p className="text-xs text-slate-500">Live stream of checklist submissions syncing to Google Sheets</p>
              </div>
              <button
                onClick={() => setAdminView('submissions')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                View Full Audit Log <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {completions.slice(0, 5).map(c => (
                <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {c.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.userName} <span className="font-normal text-slate-500">completed</span> {c.taskTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">"{c.notes}"</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right text-xs shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {formatTimestamp(c.completedAt)}
                    </span>
                    {c.proofUrl && (
                      <a
                        href={c.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold hover:underline"
                      >
                        Proof Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: TASK CADENCE MANAGER */}
      {adminView === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Frequency Filter */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['all', 'daily', 'weekly', 'monthly', 'one-time'] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => setTaskFreqFilter(freq)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    taskFreqFilter === freq
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {freq === 'all' ? 'All Tasks' : freq}
                </button>
              ))}
            </div>

            <button
              onClick={() => onOpenCreateTask()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>

          {/* Tasks Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Task Title & Details</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Assignees</th>
                    <th className="px-4 py-3">Checklist Steps</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTasks.map(task => {
                    const freqStyles = getFrequencyColor(task.frequency);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{task.title}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{task.description || 'No description'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold border text-[10px] ${freqStyles.badgeBg}`}>
                            {formatFrequencyLabel(task.frequency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          {task.department}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {task.assignedTo.includes('*') ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">All Members (*)</span>
                          ) : (
                            <span>{task.assignedTo.length} member(s)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {task.checklist ? `${task.checklist.length} checkpoints` : '0'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => onOpenCreateTask(task)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deletingId === task.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TEAM ACCOUNTS MANAGER */}
      {adminView === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Team Member Login Credentials</h3>
              <p className="text-xs text-slate-500">Accounts created by admin. Synchronized with the Users sheet tab.</p>
            </div>
            <button
              onClick={onOpenCreateUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Member</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Password</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {u.password || '••••••••'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {u.department}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Remove account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SUBMISSIONS AUDIT LOG */}
      {adminView === 'submissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={submissionSearch}
                onChange={e => setSubmissionSearch(e.target.value)}
                placeholder="Search by team member, task title, or notes..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="/api/export/csv"
                download
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>

              <button
                onClick={onNavigateToSheets}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheet Sync</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Task Title</th>
                    <th className="px-4 py-3">Frequency & Cycle</th>
                    <th className="px-4 py-3">Completed At</th>
                    <th className="px-4 py-3">Time Spent</th>
                    <th className="px-4 py-3">Notes & Deliverable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCompletions.map(comp => (
                    <tr key={comp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{comp.userName}</p>
                        <p className="text-[10px] text-slate-400">{comp.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {comp.taskTitle}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">
                          {comp.frequency} ({comp.cycleId})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {formatTimestamp(comp.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {comp.timeSpentMinutes ? `${comp.timeSpentMinutes} mins` : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 dark:text-slate-300 text-xs italic">"{comp.notes}"</p>
                        {comp.proofUrl && (
                          <a
                            href={comp.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 mt-0.5 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" /> View Proof Link
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
