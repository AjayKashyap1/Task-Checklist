import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, TaskCompletion, TaskFrequency } from '../types';
import {
  isTaskCompletedInCurrentCycle,
  formatFrequencyLabel,
  getFrequencyColor,
  formatTimestamp
} from '../utils/dateUtils';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ListTodo
} from 'lucide-react';

interface MemberChecklistProps {
  tasks: Task[];
  completions: TaskCompletion[];
  onOpenSubmitModal: (task: Task) => void;
  onRefreshData: () => void;
}

export const MemberChecklist: React.FC<MemberChecklistProps> = ({
  tasks,
  completions,
  onOpenSubmitModal,
  onRefreshData
}) => {
  const { currentUser } = useAuth();
  const [selectedFreq, setSelectedFreq] = useState<TaskFrequency | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  // Filter tasks assigned to user or global ('*')
  const userTasks = tasks.filter(t => {
    if (!t.isActive) return false;
    if (currentUser?.role === 'admin' || currentUser?.role === 'manager') return true;
    if (t.assignedTo.includes('*')) return true;
    if (currentUser && t.assignedTo.includes(currentUser.id)) return true;
    return false;
  });

  // Filter by frequency
  const filteredTasks = userTasks.filter(task => {
    if (selectedFreq !== 'all' && task.frequency !== selectedFreq) return false;
    if (selectedDepartment !== 'All' && task.department !== selectedDepartment && task.department !== 'All') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    const { isCompleted } = isTaskCompletedInCurrentCycle(task, completions, currentUser?.id);
    if (statusFilter === 'pending' && isCompleted) return false;
    if (statusFilter === 'completed' && !isCompleted) return false;

    return true;
  });

  // Calculate metrics
  const completedCount = userTasks.filter(
    t => isTaskCompletedInCurrentCycle(t, completions, currentUser?.id).isCompleted
  ).length;
  const totalCount = userTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const departments = ['All', ...Array.from(new Set(tasks.map(t => t.department).filter(Boolean)))];

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Personal Progress Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Active Cadence Hub
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser ? `Welcome, ${currentUser.name}` : 'Team Checklist Portal'}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Complete your daily, weekly, monthly, and assigned one-time team responsibilities.
            </p>
          </div>

          {/* Progress Pill Bar */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl flex items-center space-x-4 min-w-[260px]">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500 transition-all duration-500"
                  strokeDasharray={`${completionPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{completionPercentage}%</span>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Checklist Compliance</p>
              <p className="text-lg font-bold text-white">
                {completedCount} of {totalCount} Completed
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                {totalCount - completedCount === 0 ? 'All caught up!' : `${totalCount - completedCount} tasks remaining`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cadence Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Frequency Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['all', 'daily', 'weekly', 'monthly', 'one-time'] as const).map(freq => {
            const isActive = selectedFreq === freq;
            const count = freq === 'all'
              ? userTasks.length
              : userTasks.filter(t => t.frequency === freq).length;

            return (
              <button
                key={freq}
                id={`freq-tab-${freq}`}
                onClick={() => setSelectedFreq(freq)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{freq === 'all' ? 'All Cadences' : freq}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-tasks-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search checklist tasks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No tasks match your filters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || selectedFreq !== 'all'
              ? 'Try changing your search keywords or cadence filters.'
              : 'You currently have no tasks assigned in this department.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => {
            const { isCompleted, completion } = isTaskCompletedInCurrentCycle(
              task,
              completions,
              currentUser?.id
            );
            const freqStyles = getFrequencyColor(task.frequency);

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden border-l-4 ${
                  freqStyles.borderColor
                } ${
                  isCompleted
                    ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${freqStyles.badgeBg}`}>
                        {formatFrequencyLabel(task.frequency)}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {task.department}
                      </span>
                      {task.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          Urgent
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-base font-bold tracking-tight mb-1.5 ${
                    isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                  }`}>
                    {task.title}
                  </h3>
                  
                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Checklist Subtask items count */}
                  {task.checklist && task.checklist.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Required Steps ({task.checklist.length})
                      </p>
                      <div className="space-y-1">
                        {task.checklist.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{item.text}</span>
                          </div>
                        ))}
                        {task.checklist.length > 3 && (
                          <p className="text-[10px] text-slate-400 pl-3.5">
                            +{task.checklist.length - 3} more checkpoints...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Submission button or Completion timestamp */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    {task.dueTime && (
                      <span>Due: {task.dueTime}</span>
                    )}
                    {task.dueDate && (
                      <span>Due: {task.dueDate}</span>
                    )}
                    {task.targetDayOfWeek !== undefined && (
                      <span>Every {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][task.targetDayOfWeek]}</span>
                    )}
                  </div>

                  {isCompleted && completion ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        Done at {formatTimestamp(completion.completedAt)}
                      </span>
                      {completion.proofUrl && (
                        <a
                          href={completion.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          View Proof <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      id={`open-submit-${task.id}`}
                      onClick={() => onOpenSubmitModal(task)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 flex items-center space-x-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Complete Task</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
