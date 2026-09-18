import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Company Profile
  getCompany: () => ipcRenderer.sendSync('db:getCompany'),
  updateCompany: (data: any) => ipcRenderer.sendSync('db:updateCompany', data),

  // Users
  getUsers: () => ipcRenderer.sendSync('db:getUsers'),
  getCurrentUser: () => ipcRenderer.sendSync('db:getCurrentUser'),
  setCurrentUser: (user: any) => ipcRenderer.sendSync('db:setCurrentUser', user),
  updateUser: (id: string, updates: any) => ipcRenderer.sendSync('db:updateUser', id, updates),
  createUser: (user: any) => ipcRenderer.sendSync('db:createUser', user),

  // Authentication & Session Management
  authLogin: (credentials: { username: string; password: string }) => ipcRenderer.invoke('auth:login', credentials),
  authVerifySession: (token: string) => ipcRenderer.invoke('auth:verifySession', token),
  authLogout: (token: string) => ipcRenderer.invoke('auth:logout', token),
  authChangePassword: (data: { oldPassword: string; newPassword: string }) => ipcRenderer.invoke('auth:changePassword', data),

  // Categories
  getCategories: () => ipcRenderer.sendSync('db:getCategories'),
  saveCategory: (cat: any) => ipcRenderer.sendSync('db:saveCategory', cat),
  deleteCategory: (id: string) => ipcRenderer.sendSync('db:deleteCategory', id),

  // Products
  getProducts: () => ipcRenderer.sendSync('db:getProducts'),
  getProductById: (id: string) => ipcRenderer.sendSync('db:getProductById', id),
  saveProduct: (prod: any) => ipcRenderer.sendSync('db:saveProduct', prod),
  duplicateProduct: (id: string) => ipcRenderer.sendSync('db:duplicateProduct', id),
  deleteProduct: (id: string) => ipcRenderer.sendSync('db:deleteProduct', id),

  // Customers
  getCustomers: () => ipcRenderer.sendSync('db:getCustomers'),
  getCustomerById: (id: string) => ipcRenderer.sendSync('db:getCustomerById', id),
  saveCustomer: (cust: any) => ipcRenderer.sendSync('db:saveCustomer', cust),
  deleteCustomer: (id: string) => ipcRenderer.sendSync('db:deleteCustomer', id),

  // Bank Accounts & Terms
  getBankAccounts: () => ipcRenderer.sendSync('db:getBankAccounts'),
  saveBankAccount: (bank: any) => ipcRenderer.sendSync('db:saveBankAccount', bank),
  deleteBankAccount: (id: string) => ipcRenderer.sendSync('db:deleteBankAccount', id),

  getTermsTemplates: () => ipcRenderer.sendSync('db:getTermsTemplates'),
  saveTermsTemplate: (tmpl: any) => ipcRenderer.sendSync('db:saveTermsTemplate', tmpl),

  // Settings & Sequence
  getSettings: () => ipcRenderer.sendSync('db:getSettings'),
  updateSettings: (settings: any) => ipcRenderer.sendSync('db:updateSettings', settings),
  getNextQuotationNumber: () => ipcRenderer.sendSync('db:getNextQuotationNumber'),
  incrementQuotationSequence: () => ipcRenderer.sendSync('db:incrementQuotationSequence'),

  // Quotations
  getQuotations: () => ipcRenderer.sendSync('db:getQuotations'),
  getQuotationById: (id: string) => ipcRenderer.sendSync('db:getQuotationById', id),
  saveQuotation: (quotation: any) => ipcRenderer.sendSync('db:saveQuotation', quotation),
  duplicateQuotation: (id: string) => ipcRenderer.sendSync('db:duplicateQuotation', id),
  updateQuotationStatus: (id: string, status: string, note?: string) => ipcRenderer.sendSync('db:updateQuotationStatus', id, status, note),
  deleteQuotation: (id: string) => ipcRenderer.sendSync('db:deleteQuotation', id),

  // Proforma Invoices
  getProformaInvoices: () => ipcRenderer.sendSync('db:getProformaInvoices'),
  getProformaInvoiceById: (id: string) => ipcRenderer.sendSync('db:getProformaInvoiceById', id),
  saveProformaInvoice: (proforma: any) => ipcRenderer.sendSync('db:saveProformaInvoice', proforma),
  duplicateProformaInvoice: (id: string) => ipcRenderer.sendSync('db:duplicateProformaInvoice', id),
  updateProformaInvoiceStatus: (id: string, status: string, note?: string) => ipcRenderer.sendSync('db:updateProformaInvoiceStatus', id, status, note),
  deleteProformaInvoice: (id: string) => ipcRenderer.sendSync('db:deleteProformaInvoice', id),
  getNextProformaNumber: () => ipcRenderer.sendSync('db:getNextProformaNumber'),
  incrementProformaSequence: () => ipcRenderer.sendSync('db:incrementProformaSequence'),

  // Backup & Import
  exportAllDataJson: () => ipcRenderer.sendSync('db:exportAllDataJson'),
  importDataJson: (json: string) => ipcRenderer.sendSync('db:importDataJson', json),
  resetToSampleData: () => ipcRenderer.sendSync('db:resetToSampleData'),

  // Native SQLite File Operations
  backupDatabase: () => ipcRenderer.invoke('db:backupDatabase'),
  restoreDatabase: () => ipcRenderer.invoke('db:restoreDatabase'),

  // Persistent File Assets (Signature / Stamp)
  saveAssetFile: (base64Data: string, filename: string) => ipcRenderer.invoke('app:saveAssetFile', base64Data, filename),

  // PDF disk storage & shell helpers
  savePDFToDisk: (base64Data: string, filename: string) => ipcRenderer.invoke('app:savePDFToDisk', base64Data, filename),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('app:showItemInFolder', filePath),
  prepareWhatsAppShare: (base64Data: string, filename: string, messageText: string, targetPhone?: string) =>
    ipcRenderer.invoke('app:prepareWhatsAppShare', base64Data, filename, messageText, targetPhone),

  // Migrate existing data from localStorage
  migrateLocalStorage: (payload: any) => ipcRenderer.sendSync('db:migrateLocalStorage', payload),
});
