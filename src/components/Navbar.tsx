import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, GoogleSheetConfig } from '../types';
import { api } from '../services/api';
import {
  CheckSquare,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'checklist' | 'admin' | 'settings';
  setCurrentTab: (tab: 'checklist' | 'admin' | 'settings') => void;
  onOpenLoginModal: () => void;
  sheetConfig?: GoogleSheetConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLoginModal,
  sheetConfig
}) => {
  const { currentUser, logout, switchUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.getUsers().then(setAllUsers).catch(() => {});
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.pushAllToSheets();
      setSyncFeedback(res.success ? 'Synced!' : 'Error');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch {
      setSyncFeedback('Sync failed');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">TeamCheck</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                  Cadence Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Team task delegation & recurrence checklist</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-checklist-btn"
              onClick={() => setCurrentTab('checklist')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'checklist'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>My Tasks & Checklist</span>
            </button>

            {isAdminOrManager && (
              <button
                id="nav-admin-btn"
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {isAdminOrManager && (
              <button
                id="nav-settings-btn"
                onClick={() => setCurrentTab('settings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Sync</span>
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Google Sheet Sync button */}
            {isAdminOrManager && (
              <button
                id="quick-sheet-sync-btn"
                onClick={handleQuickSync}
                disabled={isSyncing}
                title="Sync all data to Google Sheets"
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition text-xs font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{syncFeedback || (isSyncing ? 'Syncing...' : 'Sheet Sync')}</span>
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-xl transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                      {currentUser.name}
                      {currentUser.role === 'admin' && (
                        <Shield className="w-3 h-3 text-amber-400 inline" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{currentUser.department} • {currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {currentUser.role.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">{currentUser.department}</span>
                      </div>
                    </div>

                    {/* Quick Switch Persona (Handy for testing multiple team roles!) */}
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Quick Switch Persona
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {allUsers.map(u => (
                          <button
                            key={u.id}
                            id={`switch-user-${u.id}`}
                            onClick={() => {
                              switchUser(u);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition ${
                              u.id === currentUser.id
                                ? 'bg-blue-600/30 text-blue-200 border border-blue-500/30'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="truncate">{u.name} ({u.role})</span>
                            <span className="text-[10px] text-slate-500">{u.department}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        id="user-logout-btn"
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                          onOpenLoginModal();
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Change Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="open-login-btn"
                onClick={onOpenLoginModal}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-800">
          <button
            onClick={() => setCurrentTab('checklist')}
            className={`flex items-center space-x-1.5 text-xs py-1 px-3 rounded-lg font-medium ${
              currentTab === 'checklist' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-1.5 text-xs py-1 px-3 rounded-lg font-medium ${
                currentTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
          {isAdminOrManager && (
            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-1.5 text-xs py-1 px-3 rounded-lg font-medium ${
                currentTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sheets</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
