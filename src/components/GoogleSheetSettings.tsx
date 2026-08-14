import React, { useState, useEffect } from 'react';
import { GoogleSheetConfig } from '../types';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Key,
  Layers,
  Sparkles,
  HelpCircle,
  Download
} from 'lucide-react';

interface GoogleSheetSettingsProps {
  onRefreshStats?: () => void;
}

export const GoogleSheetSettings: React.FC<GoogleSheetSettingsProps> = ({ onRefreshStats }) => {
  const [config, setConfig] = useState<GoogleSheetConfig>({
    sheetId: '',
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
  });

  const [activeSubTab, setActiveSubTab] = useState<'service_account' | 'apps_script' | 'guide'>('service_account');
  const [scriptTemplate, setScriptTemplate] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    api.getSheetConfig().then(setConfig).catch(() => {});
    api.getAppsScriptTemplate().then(setScriptTemplate).catch(() => {});
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateSheetConfig(config);
      setConfig(updated);
      setTestResult({ success: true, message: 'Google Sheet settings saved successfully!' });
      setTimeout(() => setTestResult(null), 4000);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSheetConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.pushAllToSheets(config);
      setSyncResult(res);
      if (res.success) {
        setConfig(prev => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncMessage: res.message
        }));
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptTemplate);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Google Sheets Integration & Data Sync
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  config.sheetId || config.appsScriptUrl
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {config.sheetId || config.appsScriptUrl ? 'Integrated & Live' : 'Pending Configuration'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Store team member login accounts, task definitions, and real-time checklist completion logs in your Google Spreadsheet.
              </p>
            </div>
          </div>

          {/* Quick Push & Test Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="test-sheet-connection-btn"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              id="push-all-sheets-btn"
              onClick={handlePushAll}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Now (Push All)'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {testResult && (
          <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {syncResult && (
          <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
            syncResult.success
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{syncResult.message}</span>
          </div>
        )}
      </div>

      {/* Integration Method Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('service_account')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'service_account'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Option 1: Google Service Account (Recommended)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('apps_script')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'apps_script'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Option 2: 1-Click Apps Script Webhook</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'guide'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Step-by-Step Setup Guide</span>
        </button>
      </div>

      {/* Tab 1: Service Account */}
      {activeSubTab === 'service_account' && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Google Spreadsheet ID *
            </label>
            <input
              id="sheet-id-input"
              type="text"
              value={config.sheetId}
              onChange={e => setConfig({ ...config, sheetId: e.target.value })}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Find this in your Google Sheet URL: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">docs.google.com/spreadsheets/d/<b>[SPREADSHEET_ID]</b>/edit</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Service Account Email (Optional if pasting full JSON below)
            </label>
            <input
              id="service-account-email-input"
              type="email"
              value={config.serviceAccountEmail || ''}
              onChange={e => setConfig({ ...config, serviceAccountEmail: e.target.value })}
              placeholder="e.g. team-checklist-sync@your-gcp-project.iam.gserviceaccount.com"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              *Make sure to click <b>Share</b> on your Google Sheet and invite this email as <b>Editor</b>!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Service Account Credentials Key (Full JSON or Private Key)
            </label>
            <textarea
              id="service-account-key-input"
              rows={4}
              value={config.serviceAccountKey || ''}
              onChange={e => setConfig({ ...config, serviceAccountKey: e.target.value })}
              placeholder='Paste your Google Service Account JSON key here, e.g.:&#10;{ "type": "service_account", "client_email": "...", "private_key": "-----BEGIN PRIVATE KEY-----..." }'
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Sheet Tab Name Customization */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Worksheet Tab Names
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Users & Passwords Tab</label>
                <input
                  type="text"
                  value={config.sheetTabs?.usersTab || 'Users'}
                  onChange={e => setConfig({
                    ...config,
                    sheetTabs: { ...config.sheetTabs, usersTab: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Tasks & Frequencies Tab</label>
                <input
                  type="text"
                  value={config.sheetTabs?.tasksTab || 'Tasks'}
                  onChange={e => setConfig({
                    ...config,
                    sheetTabs: { ...config.sheetTabs, tasksTab: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Task Submissions Tab</label>
                <input
                  type="text"
                  value={config.sheetTabs?.completionsTab || 'Completions'}
                  onChange={e => setConfig({
                    ...config,
                    sheetTabs: { ...config.sheetTabs, completionsTab: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Real-Time Submission Sync</p>
              <p className="text-[11px] text-slate-500">Automatically append every completion form directly to the Google Sheet.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={e => setConfig({ ...config, autoSync: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              id="save-sheet-settings-btn"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving Settings...' : 'Save Google Sheet Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Apps Script Webhook */}
      {activeSubTab === 'apps_script' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Google Apps Script Webhook URL
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              If you don't have Google Cloud Console access for a Service Account, you can connect your Google Sheet in 60 seconds using this Webhook script.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              id="apps-script-url-input"
              type="url"
              value={config.appsScriptUrl || ''}
              onChange={e => setConfig({ ...config, appsScriptUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Script Snippet Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Copy-Paste Ready Google Apps Script
              </label>
              <button
                type="button"
                onClick={handleCopyScript}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Code Copied!' : 'Copy Script to Clipboard'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl max-h-60 overflow-y-auto border border-slate-800">
              {scriptTemplate}
            </pre>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-500/20"
            >
              {isSaving ? 'Saving...' : 'Save Webhook URL'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Step-by-Step Guide */}
      {activeSubTab === 'guide' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Google Sheet Integration Setup Instructions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Follow these simple steps to connect your team checklist with Google Sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create Google Sheet</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Go to <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline">sheets.new</a> and create a blank spreadsheet (e.g. "Team Checklist & Tasks").
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Copy Sheet ID</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Copy the Spreadsheet ID from the URL between <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/d/</code> and <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/edit</code> and paste it into Option 1.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Authorize & Sync</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Share the sheet with your Service Account email as Editor (or use the Apps Script Webhook). Click <b>Sync Now</b> to initialize the sheets!
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Automated Sheet Tab Creation</p>
              <p>
                You don't need to manually create column headers or tabs. When you click <b>Sync Now (Push All)</b>, the system automatically provisions the <code className="font-mono font-semibold">Users</code>, <code className="font-mono font-semibold">Tasks</code>, and <code className="font-mono font-semibold">Completions</code> tabs with styled header rows!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Option */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Offline CSV Backup</h4>
          <p className="text-xs text-slate-500 mt-0.5">Download all checklist completions as a standard CSV spreadsheet</p>
        </div>
        <a
          href="/api/export/csv"
          download
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All Submissions (.CSV)</span>
        </a>
      </div>

    </div>
  );
};
