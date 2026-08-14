import React, { useState } from 'react';
import { User, Task, TaskFrequency, TaskPriority, TaskChecklistItem } from '../types';
import { api } from '../services/api';
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  users: User[];
  taskToEdit?: Task | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  users,
  taskToEdit
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [frequency, setFrequency] = useState<TaskFrequency>(taskToEdit?.frequency || 'daily');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [department, setDepartment] = useState(taskToEdit?.department || 'All');
  const [assignedTo, setAssignedTo] = useState<string[]>(taskToEdit?.assignedTo || ['*']);
  const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '17:00');
  const [targetDayOfWeek, setTargetDayOfWeek] = useState<number>(taskToEdit?.targetDayOfWeek ?? 1);
  const [targetDayOfMonth, setTargetDayOfMonth] = useState<number>(taskToEdit?.targetDayOfMonth ?? 1);
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || '');
  
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(
    taskToEdit?.checklist || [
      { id: '1', text: 'Step 1: Verify deliverables & checklist criteria' },
      { id: '2', text: 'Step 2: Log completion and share notes' }
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState('');
  
  const [requiresNotes, setRequiresNotes] = useState(taskToEdit?.requiresNotes ?? true);
  const [requiresProofUrl, setRequiresProofUrl] = useState(taskToEdit?.requiresProofUrl ?? true);
  const [requiresTimeSpent, setRequiresTimeSpent] = useState(taskToEdit?.requiresTimeSpent ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([...checklist, { id: `c_${Date.now()}`, text: newChecklistText.trim() }]);
    setNewChecklistText('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(c => c.id !== id));
  };

  const handleAssigneeToggle = (userId: string) => {
    if (userId === '*') {
      setAssignedTo(['*']);
      return;
    }

    let updated = assignedTo.filter(id => id !== '*');
    if (updated.includes(userId)) {
      updated = updated.filter(id => id !== userId);
    } else {
      updated.push(userId);
    }

    if (updated.length === 0) {
      updated = ['*'];
    }
    setAssignedTo(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payload: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        frequency,
        priority,
        department,
        assignedTo,
        dueTime: dueTime || undefined,
        targetDayOfWeek: frequency === 'weekly' ? targetDayOfWeek : undefined,
        targetDayOfMonth: frequency === 'monthly' ? targetDayOfMonth : undefined,
        dueDate: frequency === 'one-time' ? dueDate : undefined,
        checklist,
        requiresNotes,
        requiresProofUrl,
        requiresTimeSpent,
        isActive: true
      };

      let result: Task;
      if (taskToEdit) {
        result = await api.updateTask(taskToEdit.id, payload);
      } else {
        result = await api.createTask(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {taskToEdit ? 'Edit Task Cadence' : 'Create Team Task & Checklist'}
              </h3>
              <p className="text-xs text-slate-500">Configure frequency, checklist steps, and team assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Daily Standup & Log Review"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description / Standard Operating Procedure (SOP)
            </label>
            <textarea
              id="task-desc-input"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe expectations, key links, or guidelines for the team member..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* Frequency & Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Recurrence Frequency *
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['daily', 'weekly', 'monthly', 'one-time'] as const).map(freq => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg capitalize transition ${
                      frequency === freq
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Cadence Timing details */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Cadence Schedule & Deadline
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Due Time (HH:MM)
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>

              {frequency === 'weekly' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={targetDayOfWeek}
                    onChange={e => setTargetDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                  >
                    <option value={1}>Every Monday</option>
                    <option value={2}>Every Tuesday</option>
                    <option value={3}>Every Wednesday</option>
                    <option value={4}>Every Thursday</option>
                    <option value={5}>Every Friday</option>
                    <option value={6}>Every Saturday</option>
                    <option value={0}>Every Sunday</option>
                  </select>
                </div>
              )}

              {frequency === 'monthly' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Day of Month (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={targetDayOfMonth}
                    onChange={e => setTargetDayOfMonth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
              )}

              {frequency === 'one-time' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Department & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Product & QA">Product & QA</option>
                <option value="Management">Management</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Assigned Team Members
              </label>
              <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl space-y-1">
                <label
                  onClick={() => handleAssigneeToggle('*')}
                  className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={assignedTo.includes('*')}
                    onChange={() => {}}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold">All Team Members (*)</span>
                </label>
                {users.map(u => (
                  <label
                    key={u.id}
                    onClick={() => handleAssigneeToggle(u.id)}
                    className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={assignedTo.includes(u.id) || assignedTo.includes('*')}
                      disabled={assignedTo.includes('*')}
                      onChange={() => {}}
                      className="rounded text-blue-600"
                    />
                    <span>{u.name} ({u.department})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Checklist Steps Builder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Checklist Steps / Verification Checkpoints ({checklist.length})
            </label>
            <div className="space-y-2 mb-2">
              {checklist.map((item, idx) => (
                <div key={item.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                placeholder="Add next checklist checkpoint..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Submission Form Requirements */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Completion Form Requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresNotes}
                  onChange={e => setRequiresNotes(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Require Notes</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresProofUrl}
                  onChange={e => setRequiresProofUrl(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Require Proof URL</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresTimeSpent}
                  onChange={e => setRequiresTimeSpent(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Require Time Spent</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              id="save-task-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving Task...' : (taskToEdit ? 'Update Task' : 'Create & Delegate Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
