import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MemberChecklist } from './components/MemberChecklist';
import { AdminDashboard } from './components/AdminDashboard';
import { GoogleSheetSettings } from './components/GoogleSheetSettings';
import { AuthModal } from './components/AuthModal';
import { TaskSubmissionModal } from './components/TaskSubmissionModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateUserModal } from './components/CreateUserModal';
import { Task, User, TaskCompletion, DashboardStats, GoogleSheetConfig } from './types';
import { api } from './services/api';
import {
  CheckSquare,
  Shield,
  FileSpreadsheet,
  Users,
  LayoutDashboard,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';

function AppContent() {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'checklist' | 'admin' | 'settings'>('checklist');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | undefined>();

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [taskForSubmission, setTaskForSubmission] = useState<Task | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const [isDataLoading, setIsDataLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      const [tasksRes, usersRes, completionsRes, statsRes, configRes] = await Promise.allSettled([
        api.getTasks(),
        api.getUsers(),
        api.getCompletions(),
        api.getDashboardStats(),
        api.getSheetConfig()
      ]);

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value);
      if (completionsRes.status === 'fulfilled') setCompletions(completionsRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (configRes.status === 'fulfilled') setSheetConfig(configRes.value);
    } catch (err) {
      console.warn('Error loading app data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, currentUser]);

  const handleOpenSubmitModal = (task: Task) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setTaskForSubmission(task);
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSuccess = (newCompletion: TaskCompletion) => {
    setCompletions(prev => [newCompletion, ...prev.filter(c => c.id !== newCompletion.id)]);
    loadAllData();
  };

  const handleOpenCreateTask = (task?: Task) => {
    setTaskToEdit(task || null);
    setIsCreateTaskModalOpen(true);
  };

  const handleTaskCreatedOrUpdated = () => {
    loadAllData();
  };

  const handleUserCreated = () => {
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
        sheetConfig={sheetConfig}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading team checklists & cadence data...</p>
          </div>
        ) : (
          <>
            {currentTab === 'checklist' && (
              <MemberChecklist
                tasks={tasks}
                completions={completions}
                onOpenSubmitModal={handleOpenSubmitModal}
                onRefreshData={loadAllData}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard
                stats={stats}
                tasks={tasks}
                users={users}
                completions={completions}
                onOpenCreateTask={handleOpenCreateTask}
                onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
                onRefreshData={loadAllData}
                onNavigateToSheets={() => setCurrentTab('settings')}
              />
            )}

            {currentTab === 'settings' && (
              <GoogleSheetSettings
                onRefreshStats={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-300">TeamCheck Cadence Hub</span>
            <span>• Google Sheets Synchronized</span>
          </div>
          <p className="text-slate-400">
            Frequencies: Daily • Weekly • Monthly • One-time
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <TaskSubmissionModal
        task={taskForSubmission}
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setTaskForSubmission(null);
        }}
        onSuccess={handleSubmissionSuccess}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={handleTaskCreatedOrUpdated}
        users={users}
        taskToEdit={taskToEdit}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={handleUserCreated}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
