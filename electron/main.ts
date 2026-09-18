import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from './database';

// Configure application identity
app.name = 'Jubilant Metal and Alloys';

let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================================
// Production File-Based Error & Activity Logging
// ============================================================================
function getLogFile(): string {
  try {
    const userData = app.getPath('userData');
    const logDir = path.join(userData, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return path.join(logDir, 'app.log');
  } catch (e) {
    return path.join(process.cwd(), 'app.log');
  }
}

export function logApp(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: any) {
  try {
    const logPath = getLogFile();
    const timestamp = new Date().toISOString();
    let detailText = '';
    if (details) {
      detailText = details instanceof Error ? `\n${details.stack || details.message}` : ` ${JSON.stringify(details)}`;
    }
    const line = `[${timestamp}] [${level}] ${message}${detailText}\n`;
    fs.appendFileSync(logPath, line);
    if (level === 'ERROR') {
      console.error(`[${level}]`, message, details || '');
    } else {
      console.log(`[${level}]`, message, details || '');
    }
  } catch (e) {
    console.error('Logging write failure:', e);
  }
}

// Global process error handlers to prevent unhandled Electron crash modal dialogs
process.on('uncaughtException', (error) => {
  logApp('ERROR', 'Uncaught Exception in Main Process', error);
});

process.on('unhandledRejection', (reason) => {
  logApp('ERROR', 'Unhandled Rejection in Main Process', reason);
});

async function createWindow() {
  const assetsDir = path.join(app.getPath('userData'), 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    title: 'Jubilant Metal and Alloys – Quotation Billing',
    icon: path.join(__dirname, '../public/favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  // Open external links (e.g. WhatsApp, web URLs) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// Safe IPC Wrappers (Prevents any IPC call from crashing main process)
// ============================================================================
function safeSync(channel: string, handler: (event: Electron.IpcMainEvent, ...args: any[]) => any, fallback: any = null) {
  ipcMain.on(channel, (event, ...args) => {
    try {
      const res = handler(event, ...args);
      event.returnValue = (res !== undefined) ? res : fallback;
    } catch (err: any) {
      logApp('ERROR', `Error processing sync IPC [${channel}]`, err);
      event.returnValue = fallback;
    }
  });
}

function safeHandle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any>) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (err: any) {
      logApp('ERROR', `Error processing async IPC [${channel}]`, err);
      return { success: false, error: err?.message || 'Operation failed' };
    }
  });
}

function registerIpcHandlers() {
  // Company Profile
  safeSync('db:getCompany', () => dbManager.getCompany(), null);
  safeSync('db:updateCompany', (_e, data) => dbManager.updateCompany(data), null);

  // Users
  safeSync('db:getUsers', () => dbManager.getUsers(), []);
  safeSync('db:getCurrentUser', () => dbManager.getCurrentUser(), null);
  safeSync('db:setCurrentUser', () => true, true);
  safeSync('db:updateUser', (_e, id, updates) => dbManager.updateUser(id, updates), null);
  safeSync('db:createUser', (_e, user) => dbManager.createUser(user), null);

  // Authentication & Persistent Sessions
  safeHandle('auth:login', async (_e, credentials: { username: string; password: string }) => {
    return dbManager.loginAdmin(credentials.username, credentials.password);
  });
  safeHandle('auth:verifySession', async (_e, token: string) => {
    return dbManager.verifySession(token);
  });
  safeHandle('auth:logout', async (_e, token: string) => {
    return { success: dbManager.logoutSession(token) };
  });
  safeHandle('auth:changePassword', async (_e, data: { oldPassword: string; newPassword: string }) => {
    return dbManager.changeAdminPassword(data.oldPassword, data.newPassword);
  });

  // Categories
  safeSync('db:getCategories', () => dbManager.getCategories(), []);
  safeSync('db:saveCategory', (_e, cat) => dbManager.saveCategory(cat), null);
  safeSync('db:deleteCategory', (_e, id) => dbManager.deleteCategory(id), false);

  // Products
  safeSync('db:getProducts', () => dbManager.getProducts(), []);
  safeSync('db:getProductById', (_e, id) => dbManager.getProductById(id), null);
  safeSync('db:saveProduct', (_e, prod) => dbManager.saveProduct(prod), null);
  safeSync('db:duplicateProduct', (_e, id) => dbManager.duplicateProduct(id), null);
  safeSync('db:deleteProduct', (_e, id) => dbManager.deleteProduct(id), false);

  // Customers
  safeSync('db:getCustomers', () => dbManager.getCustomers(), []);
  safeSync('db:getCustomerById', (_e, id) => dbManager.getCustomerById(id), null);
  safeSync('db:saveCustomer', (_e, cust) => dbManager.saveCustomer(cust), null);
  safeSync('db:deleteCustomer', (_e, id) => dbManager.deleteCustomer(id), false);

  // Bank Accounts & Terms
  safeSync('db:getBankAccounts', () => dbManager.getBankAccounts(), []);
  safeSync('db:saveBankAccount', (_e, bank) => dbManager.saveBankAccount(bank), null);
  safeSync('db:deleteBankAccount', (_e, id) => dbManager.deleteBankAccount(id), false);
  safeSync('db:getTermsTemplates', () => dbManager.getTermsTemplates(), []);
  safeSync('db:saveTermsTemplate', (_e, tmpl) => dbManager.saveTermsTemplate(tmpl), null);

  // Settings & Sequence
  safeSync('db:getSettings', () => dbManager.getSettings(), DatabaseManager.DEFAULT_SETTINGS);
  safeSync('db:updateSettings', (_e, settings) => dbManager.updateSettings(settings), DatabaseManager.DEFAULT_SETTINGS);
  safeSync('db:getNextQuotationNumber', () => dbManager.getNextQuotationNumber(), `JMA-${new Date().getFullYear()}-1011`);
  safeSync('db:incrementQuotationSequence', () => {
    dbManager.incrementQuotationSequence();
    return true;
  }, true);

  // Quotations
  safeSync('db:getQuotations', () => dbManager.getQuotations(), []);
  safeSync('db:getQuotationById', (_e, id) => dbManager.getQuotationById(id), null);
  safeSync('db:saveQuotation', (_e, quotation) => dbManager.saveQuotation(quotation), null);
  safeSync('db:duplicateQuotation', (_e, id) => dbManager.duplicateQuotation(id), null);
  safeSync('db:updateQuotationStatus', (_e, id, status, note) => dbManager.updateQuotationStatus(id, status, note), null);
  safeSync('db:deleteQuotation', (_e, id) => dbManager.deleteQuotation(id), false);

  // Proforma Invoices
  safeSync('db:getProformaInvoices', () => dbManager.getProformaInvoices(), []);
  safeSync('db:getProformaInvoiceById', (_e, id) => dbManager.getProformaInvoiceById(id), null);
  safeSync('db:saveProformaInvoice', (_e, proforma) => dbManager.saveProformaInvoice(proforma), null);
  safeSync('db:duplicateProformaInvoice', (_e, id) => dbManager.duplicateProformaInvoice(id), null);
  safeSync('db:updateProformaInvoiceStatus', (_e, id, status, note) => dbManager.updateProformaInvoiceStatus(id, status, note), null);
  safeSync('db:deleteProformaInvoice', (_e, id) => dbManager.deleteProformaInvoice(id), false);
  safeSync('db:getNextProformaNumber', () => dbManager.getNextProformaNumber(), `JMA-PI-${new Date().getFullYear()}-0501`);
  safeSync('db:incrementProformaSequence', () => {
    dbManager.incrementProformaSequence();
    return true;
  }, true);

  // JSON Backup & Restore
  safeSync('db:exportAllDataJson', () => dbManager.exportAllDataJson(), '{}');
  safeSync('db:importDataJson', (_e, json) => dbManager.importDataJson(json), false);
  safeSync('db:resetToSampleData', () => {
    dbManager.resetToSampleData();
    return true;
  }, true);

  // Migration from localStorage if localStorage has records and SQLite has none
  safeSync('db:migrateLocalStorage', (_e, payload) => {
    try {
      const existingQuotes = dbManager.getQuotations();
      if (existingQuotes.length === 0 && payload.quotations && payload.quotations.length > 0) {
        logApp('INFO', `[Migration] Migrating ${payload.quotations.length} quotations from localStorage to SQLite...`);
        for (const q of payload.quotations) {
          dbManager.saveQuotation(q);
        }
      }
      if (payload.settings) {
        dbManager.updateSettings(payload.settings);
      }
      return true;
    } catch (e) {
      logApp('ERROR', '[Migration] Failed to migrate localStorage to SQLite', e);
      return false;
    }
  }, false);

  // Native SQLite Database Backup (.db file)
  safeHandle('db:backupDatabase', async () => {
    if (!mainWindow) return { success: false, error: 'Window not active' };
    const dateStr = new Date().toISOString().split('T')[0];
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export SQLite Database Backup',
      defaultPath: `Jubilant-Quotation-Backup-${dateStr}.db`,
      filters: [
        { name: 'SQLite Database (*.db)', extensions: ['db', 'sqlite'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Cancelled by user' };
    }

    const ok = dbManager.backupDatabase(filePath);
    return { success: ok, filePath };
  });

  // Native SQLite Database Restore (.db file)
  safeHandle('db:restoreDatabase', async () => {
    if (!mainWindow) return { success: false, error: 'Window not active' };

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select SQLite Database Backup to Restore',
      properties: ['openFile'],
      filters: [
        { name: 'SQLite Database (*.db, *.sqlite)', extensions: ['db', 'sqlite'] },
        { name: 'All Files (*.*)', extensions: ['*'] },
      ],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, error: 'Cancelled by user' };
    }

    const confirmRes = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Cancel', 'Yes, Restore Database'],
      defaultId: 0,
      cancelId: 0,
      title: 'Confirm Database Restore',
      message: 'Are you sure you want to restore this database backup?',
      detail: 'Restoring will replace all current quotations, customers, and settings with the records from the backup file. This cannot be undone.',
    });

    if (confirmRes.response !== 1) {
      return { success: false, error: 'Restore aborted by user' };
    }

    const ok = await dbManager.restoreDatabase(filePaths[0]);
    if (ok && mainWindow) {
      mainWindow.reload();
    }
    return { success: ok };
  });

  // Save persistent file assets (Signatures & Stamps)
  safeHandle('app:saveAssetFile', async (_event, base64Data: string, filename: string) => {
    try {
      const assetsDir = path.join(app.getPath('userData'), 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // If dataUrl format (data:image/png;base64,...), extract raw base64
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

      const safeFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'asset.png';
      const safeName = `${Date.now()}-${safeFilename}`;
      const filePath = path.join(assetsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      // Return the base64 dataUrl directly for 100% reliable offline image rendering in Chromium
      return { success: true, url: base64Data, path: filePath };
    } catch (err: any) {
      logApp('ERROR', '[AssetStorage] Failed to save asset file', err);
      return { success: false, error: err.message };
    }
  });

  // Save generated PDF directly to user's Downloads folder
  safeHandle('app:savePDFToDisk', async (_event, base64Data: string, filename: string) => {
    try {
      const downloadsDir = app.getPath('downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // If dataUrl format (data:application/pdf;base64,...), extract raw base64
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

      const safeFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document.pdf';
      const filePath = path.join(downloadsDir, safeFilename);
      fs.writeFileSync(filePath, buffer);

      // Verify file was written and is not empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Saved PDF file is empty');
      }

      logApp('INFO', `[PDFStorage] Successfully saved PDF to ${filePath} (${stats.size} bytes)`);
      return { success: true, filePath, size: stats.size };
    } catch (err: any) {
      logApp('ERROR', '[PDFStorage] Failed to save PDF to disk', err);
      return { success: false, error: err.message };
    }
  });

  // Show file in Windows Explorer
  safeHandle('app:showItemInFolder', async (_event, filePath: string) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return { success: true };
      }
      return { success: false, error: 'File does not exist' };
    } catch (err: any) {
      logApp('ERROR', '[Shell] Failed to show item in folder', err);
      return { success: false, error: err.message };
    }
  });

  // Prepare WhatsApp Share: Silent temporary PDF save, copy to clipboard, and open WhatsApp chat
  safeHandle('app:prepareWhatsAppShare', async (_event, base64Data: string, filename: string, messageText: string, targetPhone?: string) => {
    try {
      const tempDir = path.join(app.getPath('temp'), 'jubilant-shares');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Extract raw base64 data
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

      const safeFilename = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document.pdf';
      const filePath = path.join(tempDir, safeFilename);
      fs.writeFileSync(filePath, buffer);

      // Validate file
      if (!fs.existsSync(filePath)) {
        throw new Error('Generated PDF file could not be verified on disk');
      }
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Generated PDF file is empty (0 bytes)');
      }
      if (!filePath.toLowerCase().endsWith('.pdf')) {
        throw new Error('Generated file is not a valid PDF');
      }

      logApp('INFO', `[WhatsAppShare] Silently saved share PDF to ${filePath} (${stats.size} bytes)`);

      // Copy file to Windows Clipboard as native file drop (CF_HDROP) via PowerShell
      try {
        const { execFile } = require('child_process');
        execFile('powershell', ['-NoProfile', '-Command', `Set-Clipboard -Path "${filePath}"`]);
      } catch (clipErr) {
        logApp('WARN', '[WhatsAppShare] Clipboard copy warning', clipErr);
      }

      // Format WhatsApp URL and launch without opening any Save As or download dialog
      const encoded = encodeURIComponent(messageText || '');
      let cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;

      await shell.openExternal(waUrl);

      return { success: true, filePath, filename: safeFilename, size: stats.size };
    } catch (err: any) {
      logApp('ERROR', '[WhatsAppShare] Failed to prepare WhatsApp share', err);
      return { success: false, error: err.message || 'Failed to prepare share' };
    }
  });
}

app.whenReady().then(async () => {
  try {
    dbManager = new DatabaseManager();
    await dbManager.init();
    logApp('INFO', `DatabaseManager initialized successfully at: ${dbManager.getDbPath()}`);
  } catch (err) {
    logApp('ERROR', 'Fatal: Failed to initialize DatabaseManager on startup', err);
  }

  registerIpcHandlers();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
