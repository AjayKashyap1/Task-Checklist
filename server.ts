import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/storage';
import { GoogleSheetsService } from './server/googleSheets';
import { User, Task, TaskCompletion } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to get logged-in user from headers
  const getAuthUser = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return null;
    return db.getUserById(token) || null;
  };

  // ==========================================
  // AUTH API
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact your administrator.' });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      user,
      token: user.id
    });
  });

  app.post('/api/auth/google', (req, res) => {
    const { email, name, avatar, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In' });
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      // Create new member account automatically if signed in with Google
      const isFirstUser = db.getUsers().length === 0;
      const isAdmin = email.toLowerCase().includes('admin') || isFirstUser || email === 'ajay741900@gmail.com';
      user = db.addUser({
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: isAdmin ? 'admin' : 'member',
        department: 'General',
        avatar,
        googleId,
        isActive: true,
        createdAt: new Date().toISOString(),
        authProvider: 'google'
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account has been deactivated. Please contact your administrator.' });
      }
      if (avatar && !user.avatar) {
        user = db.updateUser(user.id, { avatar, googleId }) || user;
      }
    }

    res.json({
      user,
      token: user.id
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user, token: user.id });
  });

  // ==========================================
  // USERS MANAGEMENT (Admin creates accounts)
  // ==========================================
  app.get('/api/users', (req, res) => {
    const users = db.getUsers();
    res.json({ users });
  });

  app.post('/api/users', (req, res) => {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: role || 'member',
      department: department || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      authProvider: 'both'
    };

    db.addUser(newUser);

    // If auto-sync is enabled, trigger push in background
    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.status(201).json({ user: newUser });
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.json({ user: updated });
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const success = db.deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.json({ success: true });
  });

  // ==========================================
  // TASKS MANAGEMENT
  // ==========================================
  app.get('/api/tasks', (req, res) => {
    const tasks = db.getTasks();
    res.json({ tasks });
  });

  app.post('/api/tasks', (req, res) => {
    const {
      title,
      description,
      frequency,
      priority,
      department,
      assignedTo,
      dueTime,
      targetDayOfWeek,
      targetDayOfMonth,
      dueDate,
      checklist,
      requiresNotes,
      requiresProofUrl,
      requiresTimeSpent,
      customFields
    } = req.body;

    if (!title || !frequency) {
      return res.status(400).json({ error: 'Title and frequency are required' });
    }

    const authUser = getAuthUser(req);

    const newTask: Task = {
      id: `tsk_${Date.now()}`,
      title: title.trim(),
      description: description || '',
      frequency,
      priority: priority || 'medium',
      department: department || 'All',
      assignedTo: Array.isArray(assignedTo) && assignedTo.length > 0 ? assignedTo : ['*'],
      dueTime,
      targetDayOfWeek,
      targetDayOfMonth,
      dueDate,
      checklist: Array.isArray(checklist) ? checklist : [],
      requiresNotes: requiresNotes ?? true,
      requiresProofUrl: requiresProofUrl ?? false,
      requiresTimeSpent: requiresTimeSpent ?? false,
      customFields: customFields || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: authUser?.id || 'admin'
    };

    db.addTask(newTask);

    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.status(201).json({ task: newTask });
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateTask(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.json({ task: updated });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const success = db.deleteTask(id);
    if (!success) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const config = db.getSheetConfig();
    if (config.autoSync && (config.sheetId || config.appsScriptUrl)) {
      GoogleSheetsService.pushAllData(config).catch(err => console.warn('Auto-sync error:', err));
    }

    res.json({ success: true });
  });

  // ==========================================
  // COMPLETIONS & FORM SUBMISSION
  // ==========================================
  app.get('/api/completions', (req, res) => {
    const completions = db.getCompletions();
    res.json({ completions });
  });

  app.post('/api/completions', async (req, res) => {
    const {
      taskId,
      notes,
      proofUrl,
      timeSpentMinutes,
      subtasksCompleted,
      cycleId,
      customResponses
    } = req.body;

    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newCompletion: TaskCompletion = {
      id: `cmp_${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      frequency: task.frequency,
      cycleId: cycleId || new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
      notes: notes || '',
      proofUrl: proofUrl || '',
      timeSpentMinutes: Number(timeSpentMinutes) || 0,
      status: 'verified',
      subtasksCompleted: subtasksCompleted || [],
      customResponses
    };

    db.addCompletion(newCompletion);

    // Auto-store on Google Sheet
    const config = db.getSheetConfig();
    if (config.sheetId || config.appsScriptUrl) {
      GoogleSheetsService.appendCompletion(config, newCompletion).catch(err =>
        console.warn('Error appending completion to Google Sheet:', err)
      );
    }

    res.status(201).json({ completion: newCompletion });
  });

  app.delete('/api/completions/:id', (req, res) => {
    const { id } = req.params;
    const success = db.deleteCompletion(id);
    if (!success) {
      return res.status(404).json({ error: 'Completion not found' });
    }
    res.json({ success: true });
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  app.get('/api/dashboard/stats', (req, res) => {
    const stats = db.getDashboardStats();
    res.json(stats);
  });

  // ==========================================
  // GOOGLE SHEETS CONFIG & SYNC
  // ==========================================
  app.get('/api/sheets/config', (req, res) => {
    const config = db.getSheetConfig();
    // Do not return raw private key in plain text if masked
    res.json({ config });
  });

  app.post('/api/sheets/config', (req, res) => {
    const updates = req.body;
    const updated = db.updateSheetConfig(updates);
    res.json({ config: updated });
  });

  app.post('/api/sheets/test', async (req, res) => {
    const config = req.body.config || db.getSheetConfig();
    const result = await GoogleSheetsService.testConnection(config);
    res.json(result);
  });

  app.post('/api/sheets/sync-push', async (req, res) => {
    const config = req.body.config || db.getSheetConfig();
    const result = await GoogleSheetsService.pushAllData(config);
    res.json(result);
  });

  app.get('/api/sheets/script-template', (req, res) => {
    const template = GoogleSheetsService.getAppsScriptTemplate();
    res.json({ template });
  });

  app.get('/api/export/csv', (req, res) => {
    const completions = db.getCompletions();
    const headers = ['Completion ID', 'Task Title', 'Team Member', 'Email', 'Frequency', 'Cycle ID', 'Completed Timestamp', 'Time Spent (Mins)', 'Proof URL', 'Notes', 'Status'];
    const rows = completions.map(c => [
      c.id,
      `"${c.taskTitle.replace(/"/g, '""')}"`,
      `"${c.userName.replace(/"/g, '""')}"`,
      c.userEmail,
      c.frequency,
      c.cycleId,
      c.completedAt,
      c.timeSpentMinutes || 0,
      `"${(c.proofUrl || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=team-checklist-completions-${Date.now()}.csv`);
    res.send(csvContent);
  });

  // ==========================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
