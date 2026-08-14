import { Task, TaskCompletion, TaskFrequency } from '../types';

export function getTodayCycleId(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function getWeekCycleId(): string {
  const d = new Date();
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function getMonthCycleId(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentCycleIdForFrequency(frequency: TaskFrequency): string {
  switch (frequency) {
    case 'daily':
      return getTodayCycleId();
    case 'weekly':
      return getWeekCycleId();
    case 'monthly':
      return getMonthCycleId();
    case 'one-time':
      return 'one-time';
  }
}

export function isTaskCompletedInCurrentCycle(
  task: Task,
  completions: TaskCompletion[],
  userId?: string
): { isCompleted: boolean; completion?: TaskCompletion } {
  const currentCycle = getCurrentCycleIdForFrequency(task.frequency);

  const matched = completions.find(c => {
    if (c.taskId !== task.id) return false;
    if (userId && c.userId !== userId) return false;
    if (task.frequency === 'one-time') return true;
    return c.cycleId === currentCycle;
  });

  return {
    isCompleted: !!matched,
    completion: matched
  };
}

export function formatFrequencyLabel(freq: TaskFrequency): string {
  switch (freq) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'one-time':
      return 'One-time';
  }
}

export function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoStr;
  }
}

export function getFrequencyColor(freq: TaskFrequency): {
  badgeBg: string;
  badgeText: string;
  borderColor: string;
} {
  switch (freq) {
    case 'daily':
      return {
        badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        badgeText: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-l-blue-500'
      };
    case 'weekly':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-l-emerald-500'
      };
    case 'monthly':
      return {
        badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        badgeText: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-l-purple-500'
      };
    case 'one-time':
      return {
        badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        badgeText: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-l-amber-500'
      };
  }
}
