import { JWT } from 'google-auth-library';
import { db } from './storage';
import { User, Task, TaskCompletion, GoogleSheetConfig } from '../src/types';

export interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    usersSynced?: number;
    tasksSynced?: number;
    completionsSynced?: number;
  };
}

export class GoogleSheetsService {
  /**
   * Helper to parse Google service account credentials
   */
  private static getServiceAccountCredentials(config: GoogleSheetConfig) {
    if (config.serviceAccountKey && config.serviceAccountKey.trim()) {
      try {
        const parsed = JSON.parse(config.serviceAccountKey.trim());
        return {
          client_email: parsed.client_email || config.serviceAccountEmail,
          private_key: parsed.private_key
        };
      } catch {
        // If not JSON, check if it's the raw private key
        return {
          client_email: config.serviceAccountEmail,
          private_key: config.serviceAccountKey
        };
      }
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key
        };
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Get an authenticated access token from Google Service Account
   */
  private static async getAuthToken(config: GoogleSheetConfig): Promise<string> {
    const creds = this.getServiceAccountCredentials(config);
    if (!creds || !creds.client_email || !creds.private_key) {
      throw new Error('No valid Google Service Account credentials found. Please provide Service Account JSON in Admin Settings.');
    }

    // Format private key correctly if newlines are escaped
    const formattedPrivateKey = creds.private_key.replace(/\\n/g, '\n');

    const client = new JWT({
      email: creds.client_email,
      key: formattedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to acquire OAuth access token for Google Service Account.');
    }

    return tokenResponse.token;
  }

  /**
   * Test connection to Google Sheet
   */
  public static async testConnection(config: GoogleSheetConfig): Promise<{ success: boolean; message: string; title?: string }> {
    if (config.appsScriptUrl && config.appsScriptUrl.trim()) {
      try {
        const res = await fetch(config.appsScriptUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return {
            success: true,
            message: `Connected successfully via Google Apps Script Web App! ${data.spreadsheetTitle ? `Spreadsheet: "${data.spreadsheetTitle}"` : ''}`
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Apps Script connection failed: ${err.message || 'Network error'}`
        };
      }
    }

    if (!config.sheetId) {
      return { success: false, message: 'Google Sheet ID is required.' };
    }

    try {
      const token = await this.getAuthToken(config);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}?fields=properties.title,sheets.properties.title`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || res.statusText;
        if (res.status === 403) {
          return {
            success: false,
            message: `Permission Denied (403): Please share your Google Sheet with the Service Account email with 'Editor' permissions.`
          };
        }
        if (res.status === 404) {
          return {
            success: false,
            message: `Sheet Not Found (404): Check that the Google Sheet ID is correct.`
          };
        }
        return {
          success: false,
          message: `Google Sheets API Error (${res.status}): ${msg}`
        };
      }

      const sheetData = await res.json();
      return {
        success: true,
        message: `Successfully connected to Google Sheet: "${sheetData.properties?.title || 'Spreadsheet'}"`,
        title: sheetData.properties?.title
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to authenticate with Google Sheets API.'
      };
    }
  }

  /**
   * Push all Users, Tasks, and Completions to Google Sheet
   */
  public static async pushAllData(config: GoogleSheetConfig): Promise<SyncResult> {
    const users = db.getUsers();
    const tasks = db.getTasks();
    const completions = db.getCompletions();

    // If using Google Apps Script Webhook
    if (config.appsScriptUrl && config.appsScriptUrl.trim()) {
      try {
        const res = await fetch(config.appsScriptUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pushAll',
            users,
            tasks,
            completions
          })
        });

        if (!res.ok) {
          throw new Error(`Apps Script responded with HTTP ${res.status}`);
        }

        db.updateSheetConfig({
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncMessage: `Pushed ${users.length} users, ${tasks.length} tasks, ${completions.length} completions via Webhook.`
        });

        return {
          success: true,
          message: 'All team members, tasks, and completion records pushed to Google Sheet.',
          details: {
            usersSynced: users.length,
            tasksSynced: tasks.length,
            completionsSynced: completions.length
          }
        };
      } catch (err: any) {
        db.updateSheetConfig({
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'error',
          lastSyncMessage: err.message
        });
        return {
          success: false,
          message: `Webhook push failed: ${err.message}`
        };
      }
    }

    // Direct Google Sheets API v4
    if (!config.sheetId) {
      return { success: false, message: 'Google Sheet ID is not configured.' };
    }

    try {
      const token = await this.getAuthToken(config);
      const sheetId = config.sheetId;

      // 1. Ensure Tabs Exist
      await this.ensureSheetTabsExist(token, sheetId, config);

      // 2. Prepare Tab Data
      // Users Tab
      const userRows = [
        ['User ID', 'Name', 'Email', 'Password', 'Role', 'Department', 'Active', 'Auth Provider', 'Created At'],
        ...users.map(u => [
          u.id,
          u.name,
          u.email,
          u.password || '',
          u.role,
          u.department,
          u.isActive ? 'TRUE' : 'FALSE',
          u.authProvider,
          u.createdAt
        ])
      ];

      // Tasks Tab
      const taskRows = [
        ['Task ID', 'Title', 'Description', 'Frequency', 'Priority', 'Department', 'Assigned To', 'Due Time/Day', 'Checklist Items', 'Requires Proof', 'Created At'],
        ...tasks.map(t => [
          t.id,
          t.title,
          t.description,
          t.frequency,
          t.priority,
          t.department,
          t.assignedTo.join(', '),
          t.dueTime || t.dueDate || `Day ${t.targetDayOfWeek ?? t.targetDayOfMonth ?? ''}`,
          t.checklist.map(c => c.text).join(' | '),
          t.requiresProofUrl ? 'YES' : 'NO',
          t.createdAt
        ])
      ];

      // Completions Tab
      const completionRows = [
        ['Completion ID', 'Task Title', 'Team Member', 'Email', 'Frequency', 'Cycle ID', 'Completed Timestamp', 'Time Spent (Mins)', 'Proof / Attachment Link', 'Notes / Remarks', 'Status'],
        ...completions.map(c => [
          c.id,
          c.taskTitle,
          c.userName,
          c.userEmail,
          c.frequency,
          c.cycleId,
          c.completedAt,
          c.timeSpentMinutes || 0,
          c.proofUrl || '',
          c.notes || '',
          c.status
        ])
      ];

      // 3. Batch Update Sheets
      const tabs = config.sheetTabs || {
        usersTab: 'Users',
        tasksTab: 'Tasks',
        completionsTab: 'Completions'
      };

      await this.updateSheetValues(token, sheetId, `${tabs.usersTab}!A1:I${userRows.length + 50}`, userRows);
      await this.updateSheetValues(token, sheetId, `${tabs.tasksTab}!A1:K${taskRows.length + 50}`, taskRows);
      await this.updateSheetValues(token, sheetId, `${tabs.completionsTab}!A1:K${completionRows.length + 50}`, completionRows);

      db.updateSheetConfig({
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Directly synced ${users.length} users, ${tasks.length} tasks, and ${completions.length} completions.`
      });

      return {
        success: true,
        message: `Successfully synchronized ${users.length} users, ${tasks.length} tasks, and ${completions.length} task completions to Google Sheets!`,
        details: {
          usersSynced: users.length,
          tasksSynced: tasks.length,
          completionsSynced: completions.length
        }
      };
    } catch (err: any) {
      db.updateSheetConfig({
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'error',
        lastSyncMessage: err.message
      });
      return {
        success: false,
        message: `Google Sheets sync failed: ${err.message}`
      };
    }
  }

  /**
   * Append a single completion row directly when a member submits their form
   */
  public static async appendCompletion(config: GoogleSheetConfig, completion: TaskCompletion): Promise<void> {
    if (!config.sheetId && !config.appsScriptUrl) return;

    if (config.appsScriptUrl) {
      try {
        await fetch(config.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'appendCompletion', completion })
        });
      } catch (err) {
        console.warn('Failed to append to Apps Script Webhook:', err);
      }
      return;
    }

    try {
      const token = await this.getAuthToken(config);
      const tab = config.sheetTabs?.completionsTab || 'Completions';
      const row = [
        completion.id,
        completion.taskTitle,
        completion.userName,
        completion.userEmail,
        completion.frequency,
        completion.cycleId,
        completion.completedAt,
        completion.timeSpentMinutes || 0,
        completion.proofUrl || '',
        completion.notes || '',
        completion.status
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}/values/${encodeURIComponent(tab)}!A1:append?valueInputOption=USER_ENTERED`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      });
    } catch (err) {
      console.warn('Could not auto-append completion to Google Sheets:', err);
    }
  }

  /**
   * Ensure standard tabs exist in the Google Spreadsheet
   */
  private static async ensureSheetTabsExist(token: string, sheetId: string, config: GoogleSheetConfig): Promise<void> {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title`;
    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    const existingTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title);

    const requiredTabs = [
      config.sheetTabs?.usersTab || 'Users',
      config.sheetTabs?.tasksTab || 'Tasks',
      config.sheetTabs?.completionsTab || 'Completions'
    ];

    const missingTabs = requiredTabs.filter(tab => !existingTitles.includes(tab));
    if (missingTabs.length === 0) return;

    const requests = missingTabs.map(title => ({
      addSheet: {
        properties: {
          title
        }
      }
    }));

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`;
    await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
  }

  /**
   * Helper to write a 2D array of values to a given sheet range
   */
  private static async updateSheetValues(token: string, sheetId: string, range: string, values: any[][]): Promise<void> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to update sheet range ${range}`);
    }
  }

  /**
   * Generates complete ready-to-use Google Apps Script code
   */
  public static getAppsScriptTemplate(): string {
    return `/**
 * Team Task & Checklist Hub - Google Apps Script Connector
 * 
 * Instructions:
 * 1. In your Google Sheet, go to Extensions -> Apps Script
 * 2. Delete any existing code and paste this entire file
 * 3. Click Deploy -> New deployment
 * 4. Select type: "Web app"
 * 5. Set "Execute as": "Me"
 * 6. Set "Who has access": "Anyone"
 * 7. Click Deploy, authorize access, and copy the Web App URL into the app's Admin Settings!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        spreadsheetTitle: ss.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'appendCompletion') {
      var c = body.completion;
      var sheet = getOrCreateSheet(ss, 'Completions', [
        'Completion ID', 'Task Title', 'Team Member', 'Email', 'Frequency', 'Cycle ID', 'Completed Timestamp', 'Time Spent (Mins)', 'Proof / Attachment Link', 'Notes / Remarks', 'Status'
      ]);
      sheet.appendRow([
        c.id, c.taskTitle, c.userName, c.userEmail, c.frequency, c.cycleId, c.completedAt, c.timeSpentMinutes || 0, c.proofUrl || '', c.notes || '', c.status
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'pushAll') {
      // 1. Users
      var uSheet = getOrCreateSheet(ss, 'Users', ['User ID', 'Name', 'Email', 'Password', 'Role', 'Department', 'Active', 'Auth Provider', 'Created At']);
      uSheet.getRange(2, 1, Math.max(1, uSheet.getLastRow()), 9).clearContent();
      if (body.users && body.users.length > 0) {
        var uRows = body.users.map(function(u) {
          return [u.id, u.name, u.email, u.password || '', u.role, u.department, u.isActive ? 'TRUE' : 'FALSE', u.authProvider, u.createdAt];
        });
        uSheet.getRange(2, 1, uRows.length, 9).setValues(uRows);
      }

      // 2. Tasks
      var tSheet = getOrCreateSheet(ss, 'Tasks', ['Task ID', 'Title', 'Description', 'Frequency', 'Priority', 'Department', 'Assigned To', 'Due Time/Day', 'Checklist Items', 'Requires Proof', 'Created At']);
      tSheet.getRange(2, 1, Math.max(1, tSheet.getLastRow()), 11).clearContent();
      if (body.tasks && body.tasks.length > 0) {
        var tRows = body.tasks.map(function(t) {
          return [
            t.id, t.title, t.description, t.frequency, t.priority, t.department,
            (t.assignedTo || []).join(', '),
            t.dueTime || t.dueDate || ('Day ' + (t.targetDayOfWeek || t.targetDayOfMonth || '')),
            (t.checklist || []).map(function(c){ return c.text; }).join(' | '),
            t.requiresProofUrl ? 'YES' : 'NO',
            t.createdAt
          ];
        });
        tSheet.getRange(2, 1, tRows.length, 11).setValues(tRows);
      }

      // 3. Completions
      var cSheet = getOrCreateSheet(ss, 'Completions', ['Completion ID', 'Task Title', 'Team Member', 'Email', 'Frequency', 'Cycle ID', 'Completed Timestamp', 'Time Spent (Mins)', 'Proof / Attachment Link', 'Notes / Remarks', 'Status']);
      cSheet.getRange(2, 1, Math.max(1, cSheet.getLastRow()), 11).clearContent();
      if (body.completions && body.completions.length > 0) {
        var cRows = body.completions.map(function(c) {
          return [c.id, c.taskTitle, c.userName, c.userEmail, c.frequency, c.cycleId, c.completedAt, c.timeSpentMinutes || 0, c.proofUrl || '', c.notes || '', c.status];
        });
        cSheet.getRange(2, 1, cRows.length, 11).setValues(cRows);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'All data synchronized' })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Apps Script Web App is running' })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
  }
  return sheet;
}
`;
  }
}
