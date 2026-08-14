import React, { useState } from 'react';
import { Task, TaskCompletion } from '../types';
import { api } from '../services/api';
import { getCurrentCycleIdForFrequency, formatFrequencyLabel, getFrequencyColor } from '../utils/dateUtils';
import { fireSuccessConfetti } from '../utils/confetti';
import {
  CheckSquare,
  Clock,
  Link as LinkIcon,
  FileText,
  FileSpreadsheet,
  X,
  AlertCircle,
  Sparkles,
  Check
} from 'lucide-react';

interface TaskSubmissionModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (completion: TaskCompletion) => void;
}

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !task) return null;

  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [timeSpent, setTimeSpent] = useState<number>(15);
  const [completedSubtasks, setCompletedSubtasks] = useState<string[]>(
    task.checklist ? task.checklist.map(c => c.id) : []
  );
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freqStyles = getFrequencyColor(task.frequency);
  const currentCycle = getCurrentCycleIdForFrequency(task.frequency);

  const toggleSubtask = (id: string) => {
    setCompletedSubtasks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (task.requiresProofUrl && !proofUrl.trim()) {
      setError('Proof / deliverable link is required for this task.');
      return;
    }

    if (task.requiresNotes && !notes.trim()) {
      setError('Please add a brief note or remark regarding the work done.');
      return;
    }

    setLoading(true);
    try {
      const completion = await api.submitCompletion({
        taskId: task.id,
        notes: notes.trim(),
        proofUrl: proofUrl.trim(),
        timeSpentMinutes: Number(timeSpent) || 0,
        subtasksCompleted: completedSubtasks,
        cycleId: currentCycle,
        customResponses
      });

      fireSuccessConfetti();
      onSuccess(completion);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit checklist completion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${freqStyles.badgeBg}`}>
              {formatFrequencyLabel(task.frequency)} Cadence
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {task.department}
            </span>
            {task.dueTime && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Due {task.dueTime}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Complete: {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subtask Checkpoints */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Checklist Verification Steps ({completedSubtasks.length}/{task.checklist.length})
              </label>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {task.checklist.map(item => {
                  const isChecked = completedSubtasks.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleSubtask(item.id)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition select-none"
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${
                        isChecked ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes & Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Work Notes & Remarks {task.requiresNotes && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="submission-notes"
              rows={3}
              required={task.requiresNotes}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detail what was completed, outcomes achieved, or next steps..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Proof / Attachment Link & Time Spent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Proof / Deliverable Link {task.requiresProofUrl && <span className="text-red-500">*</span>}</span>
              </label>
              <input
                id="submission-proof-url"
                type="url"
                required={task.requiresProofUrl}
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                placeholder="https://github.com/... or docs link"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Spent (Minutes)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="submission-time-spent"
                  type="number"
                  min="1"
                  max="1440"
                  value={timeSpent}
                  onChange={e => setTimeSpent(Number(e.target.value))}
                  className="w-24 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
                <div className="flex gap-1">
                  {[15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeSpent(mins)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                        timeSpent === mins
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Google Sheets Sync Banner */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>This submission will be permanently recorded and appended to your team's Google Sheet automatically.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              id="submit-task-completion-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Recording to Google Sheets...' : 'Submit & Mark Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
