import {
  CompanyProfile,
  User,
  ProductCategory,
  Product,
  Customer,
  BankAccount,
  TermsTemplate,
  QuotationSettings,
  Quotation,
  QuotationStatus,
  ProformaInvoice,
  ProformaStatus,
} from './index';

export interface ElectronDBAPI {
  isElectron: boolean;
  // Company Profile
  getCompany: () => CompanyProfile;
  updateCompany: (data: Partial<CompanyProfile>) => CompanyProfile;

  // Users & Auth
  getUsers: () => User[];
  getCurrentUser: () => User;
  setCurrentUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => User | null;
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  authLogin: (credentials: { username: string; password: string }) => Promise<{ success: boolean; token?: string; user?: User; error?: string }>;
  authVerifySession: (token: string) => Promise<{ valid: boolean; user?: User }>;
  authLogout: (token: string) => Promise<{ success: boolean }>;
  authChangePassword: (data: { oldPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;

  // Categories
  getCategories: () => ProductCategory[];
  saveCategory: (cat: Omit<ProductCategory, 'id'> & { id?: string }) => ProductCategory;
  deleteCategory: (id: string) => boolean;

  // Products
  getProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  saveProduct: (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Product;
  duplicateProduct: (id: string) => Product | null;
  deleteProduct: (id: string) => boolean;

  // Customers
  getCustomers: () => Customer[];
  getCustomerById: (id: string) => Customer | undefined;
  saveCustomer: (cust: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Customer;
  deleteCustomer: (id: string) => boolean;

  // Bank Accounts & Terms
  getBankAccounts: () => BankAccount[];
  saveBankAccount: (bank: Omit<BankAccount, 'id'> & { id?: string }) => BankAccount;
  deleteBankAccount: (id: string) => boolean;

  getTermsTemplates: () => TermsTemplate[];
  saveTermsTemplate: (tmpl: Omit<TermsTemplate, 'id'> & { id?: string }) => TermsTemplate;

  // Settings & Sequence
  getSettings: () => QuotationSettings;
  updateSettings: (settings: Partial<QuotationSettings>) => QuotationSettings;
  getNextQuotationNumber: () => string;
  incrementQuotationSequence: () => void;

  // Quotations
  getQuotations: () => Quotation[];
  getQuotationById: (id: string) => Quotation | undefined;
  saveQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Quotation;
  duplicateQuotation: (id: string) => Quotation | null;
  updateQuotationStatus: (id: string, status: QuotationStatus, note?: string) => Quotation | null;
  deleteQuotation: (id: string) => boolean;

  // Proforma Invoices
  getProformaInvoices: () => ProformaInvoice[];
  getProformaInvoiceById: (id: string) => ProformaInvoice | undefined;
  saveProformaInvoice: (proforma: Omit<ProformaInvoice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => ProformaInvoice;
  duplicateProformaInvoice: (id: string) => ProformaInvoice | null;
  updateProformaInvoiceStatus: (id: string, status: ProformaStatus, note?: string) => ProformaInvoice | null;
  deleteProformaInvoice: (id: string) => boolean;
  getNextProformaNumber: () => string;
  incrementProformaSequence: () => void;

  // Backup & Import
  exportAllDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  resetToSampleData: () => void;

  // SQLite Database Native File Backup & Restore
  backupDatabase: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  restoreDatabase: () => Promise<{ success: boolean; error?: string }>;

  // Persistent File Storage (for Signature / Stamp / Logo)
  saveAssetFile: (base64Data: string, filename: string) => Promise<{ success: boolean; url?: string; error?: string }>;

  // PDF disk storage & shell helpers
  savePDFToDisk: (base64Data: string, filename: string) => Promise<{ success: boolean; filePath?: string; size?: number; error?: string }>;
  showItemInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  prepareWhatsAppShare: (base64Data: string, filename: string, messageText: string, targetPhone?: string) => Promise<{ success: boolean; filePath?: string; filename?: string; size?: number; error?: string }>;

  // Migration from localStorage if needed
  migrateLocalStorage: (payload: any) => boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronDBAPI;
  }
}
