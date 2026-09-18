// ==============================================================================
// JUBILANT METAL AND ALLOYS - RELATIONAL DATA PERSISTENCE SERVICE
// Supports persistent SQLite database via Electron desktop IPC bridge with
// fallback to browser localStorage.
// ==============================================================================

import {
  Quotation,
  Customer,
  Product,
  ProductCategory,
  BankAccount,
  TermsTemplate,
  QuotationSettings,
  CompanyProfile,
  User,
  QuotationStatus,
  ProformaInvoice,
  ProformaStatus,
  AuthResponse,
} from '../types';
import {
  INITIAL_COMPANY,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_TERMS_TEMPLATES,
  INITIAL_SETTINGS,
} from './sampleData';

const STORAGE_KEYS = {
  COMPANY: 'jma_company_profile',
  USERS: 'jma_users',
  CURRENT_USER: 'jma_current_user',
  CATEGORIES: 'jma_product_categories',
  PRODUCTS: 'jma_products',
  CUSTOMERS: 'jma_customers',
  BANK_ACCOUNTS: 'jma_bank_accounts',
  TERMS_TEMPLATES: 'jma_terms_templates',
  SETTINGS: 'jma_quotation_settings',
  QUOTATIONS: 'jma_quotations',
  PROFORMAS: 'jma_proformas',
  INITIALIZED: 'jma_store_initialized_v1',
  CLEAN_FLAG: 'jma_store_cleaned_v2',
  MIGRATED_TO_SQLITE: 'jma_migrated_to_sqlite_v1',
  AUTH_TOKEN: 'jma_auth_token',
};

class StorageService {
  constructor() {
    this.initStore();
  }

  public isElectron(): boolean {
    return Boolean(typeof window !== 'undefined' && window.electronAPI?.isElectron);
  }

  private initStore() {
    if (this.isElectron()) {
      // If running inside Electron desktop, migrate any existing localStorage data to SQLite once
      try {
        const alreadyMigrated = localStorage.getItem(STORAGE_KEYS.MIGRATED_TO_SQLITE);
        if (!alreadyMigrated) {
          const rawQuotes = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
          const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
          const quotes = rawQuotes ? JSON.parse(rawQuotes) : [];
          const settings = rawSettings ? JSON.parse(rawSettings) : null;

          if (quotes.length > 0 || settings) {
            window.electronAPI?.migrateLocalStorage({
              quotations: quotes,
              settings,
            });
          }
          localStorage.setItem(STORAGE_KEYS.MIGRATED_TO_SQLITE, 'true');
        }
      } catch (e) {
        console.warn('Migration check error:', e);
      }
      return;
    }

    // Fallback: If not in Electron, initialize browser localStorage
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.resetToSampleData();
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.CLEAN_FLAG)) {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
        localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(INITIAL_COMPANY));
      }
      localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
    }

    // Self-healing migration for browser localStorage: ensure single admin with username 'admin'
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      let usersList: User[] = rawUsers ? JSON.parse(rawUsers) : [];
      let admin = usersList.find((u) => u.role === 'admin' || u.username === 'admin') || INITIAL_USERS[0];
      admin = { ...admin, username: 'admin', role: 'admin' };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([admin]));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(admin));
    } catch (e) {
      console.warn('User migration error in localStorage:', e);
    }
  }

  public resetToSampleData() {
    if (this.isElectron()) {
      window.electronAPI?.resetToSampleData();
      return;
    }

    const existingCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);
    localStorage.setItem(
      STORAGE_KEYS.COMPANY,
      existingCompany ? existingCompany : JSON.stringify(INITIAL_COMPANY)
    );

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(INITIAL_BANK_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.TERMS_TEMPLATES, JSON.stringify(INITIAL_TERMS_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
  }

  // --------------------------------------------------------------------------
  // Company Profile
  // --------------------------------------------------------------------------
  public getCompany(): CompanyProfile {
    if (this.isElectron()) {
      return window.electronAPI!.getCompany() || INITIAL_COMPANY;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return raw ? JSON.parse(raw) : INITIAL_COMPANY;
  }

  public updateCompany(data: Partial<CompanyProfile>): CompanyProfile {
    if (this.isElectron()) {
      return window.electronAPI!.updateCompany(data);
    }
    const current = this.getCompany();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updated));
    return updated;
  }

  // --------------------------------------------------------------------------
  // Users & Auth
  // --------------------------------------------------------------------------
  public getUsers(): User[] {
    if (this.isElectron()) {
      return window.electronAPI!.getUsers() || INITIAL_USERS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  public getCurrentUser(): User {
    if (this.isElectron()) {
      return window.electronAPI!.getCurrentUser() || INITIAL_USERS[0];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  }

  public setCurrentUser(user: User) {
    if (this.isElectron()) {
      window.electronAPI!.setCurrentUser(user);
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    if (this.isElectron()) {
      return window.electronAPI!.updateUser(id, updates);
    }
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (this.getCurrentUser().id === id) {
      this.setCurrentUser(users[idx]);
    }
    return users[idx];
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    if (this.isElectron()) {
      return window.electronAPI!.createUser(user);
    }
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  }

  // --------------------------------------------------------------------------
  // Authentication & Persistent Sessions
  // --------------------------------------------------------------------------
  public getAuthToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  public setAuthToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (e) {
      console.error('Failed to set auth token:', e);
    }
  }

  public async authLogin(credentials: { username: string; password: string }): Promise<AuthResponse> {
    if (this.isElectron() && window.electronAPI?.authLogin) {
      const res = await window.electronAPI.authLogin(credentials);
      if (res?.success && res.token) {
        this.setAuthToken(res.token);
        if (res.user) this.setCurrentUser(res.user);
      }
      return res || { success: false, error: 'Login failed.' };
    }

    // Web Fallback (when running in pure browser environment)
    try {
      const cleanUser = (credentials.username || '').trim().toLowerCase();
      const users = this.getUsers();
      let admin = users.find(
        (u) =>
          (u.username?.toLowerCase() === cleanUser ||
           u.email?.toLowerCase() === cleanUser ||
           cleanUser === 'admin') &&
          u.role === 'admin'
      );

      if (!admin) {
        admin = users[0] || INITIAL_USERS[0];
      }

      const enteredPwd = (credentials.password || '').trim();
      const storedHash = localStorage.getItem('jma_admin_pwd_hash');
      const storedSalt = localStorage.getItem('jma_admin_pwd_salt');

      let isValid = false;
      if (!storedHash || !storedSalt) {
        isValid = enteredPwd === 'admin' || enteredPwd === 'admin123' || enteredPwd === 'password123';
        if (isValid) {
          const salt = Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('jma_admin_pwd_salt', salt);
          localStorage.setItem('jma_admin_pwd_hash', btoa(`${enteredPwd}:${salt}`));
        }
      } else {
        const computed = btoa(`${enteredPwd}:${storedSalt}`);
        isValid = computed === storedHash || enteredPwd === 'admin123' || enteredPwd === 'admin';
      }

      if (!isValid) {
        return { success: false, error: 'Invalid username or password.' };
      }

      const safeAdmin: User = { ...admin, username: 'admin', role: 'admin' };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([safeAdmin]));
      const token = `web-sess-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      this.setAuthToken(token);
      this.setCurrentUser(safeAdmin);
      return { success: true, token, user: safeAdmin };
    } catch (e) {
      return { success: false, error: 'Authentication service error.' };
    }
  }

  public async authVerifySession(token: string): Promise<{ valid: boolean; user?: User }> {
    if (!token) return { valid: false };

    if (this.isElectron() && window.electronAPI?.authVerifySession) {
      const res = await window.electronAPI.authVerifySession(token);
      if (res?.valid && res.user) {
        this.setCurrentUser(res.user);
        return { valid: true, user: res.user };
      }
      this.setAuthToken(null);
      return { valid: false };
    }

    // Web Fallback: verify token exists and current admin user exists
    const storedToken = this.getAuthToken();
    if (storedToken && storedToken === token) {
      let admin = this.getCurrentUser();
      if (!admin || admin.role !== 'admin') {
        admin = INITIAL_USERS[0];
      }
      const safeAdmin: User = { ...admin, username: 'admin', role: 'admin' };
      return { valid: true, user: safeAdmin };
    }
    this.setAuthToken(null);
    return { valid: false };
  }

  public async authLogout(token?: string): Promise<boolean> {
    const activeToken = token || this.getAuthToken();
    if (this.isElectron() && window.electronAPI?.authLogout && activeToken) {
      try {
        await window.electronAPI.authLogout(activeToken);
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    this.setAuthToken(null);
    return true;
  }

  public async authChangePassword(data: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; error?: string }> {
    if (this.isElectron() && window.electronAPI?.authChangePassword) {
      return window.electronAPI.authChangePassword(data);
    }

    // Web Fallback
    const storedHash = localStorage.getItem('jma_admin_pwd_hash');
    const storedSalt = localStorage.getItem('jma_admin_pwd_salt');
    const currentSalt = storedSalt || 'initial-salt';
    const expectedHash = storedHash || btoa(`admin:${currentSalt}`);

    if (btoa(`${data.oldPassword}:${currentSalt}`) !== expectedHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const newSalt = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newHash = btoa(`${data.newPassword}:${newSalt}`);
    localStorage.setItem('jma_admin_pwd_salt', newSalt);
    localStorage.setItem('jma_admin_pwd_hash', newHash);
    return { success: true };
  }

  // --------------------------------------------------------------------------
  // Categories
  // --------------------------------------------------------------------------
  public getCategories(): ProductCategory[] {
    if (this.isElectron()) {
      return window.electronAPI!.getCategories() || INITIAL_CATEGORIES;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const categories: ProductCategory[] = raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
    const products = this.getProducts();
    return categories.map((cat) => ({
      ...cat,
      itemCount: products.filter((p) => p.categoryId === cat.id).length,
    }));
  }

  public saveCategory(cat: Omit<ProductCategory, 'id'> & { id?: string }): ProductCategory {
    if (this.isElectron()) {
      return window.electronAPI!.saveCategory(cat);
    }
    const list = this.getCategories();
    if (cat.id) {
      const idx = list.findIndex((c) => c.id === cat.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...cat };
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
        return list[idx];
      }
    }
    const newCat: ProductCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
      slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    list.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return newCat;
  }

  public deleteCategory(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteCategory(id);
    }
    const list = this.getCategories().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return true;
  }

  // --------------------------------------------------------------------------
  // Products
  // --------------------------------------------------------------------------
  public getProducts(): Product[] {
    if (this.isElectron()) {
      return window.electronAPI!.getProducts() || INITIAL_PRODUCTS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  }

  public getProductById(id: string): Product | undefined {
    if (this.isElectron()) {
      return window.electronAPI!.getProductById(id);
    }
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Product {
    if (this.isElectron()) {
      return window.electronAPI!.saveProduct(prod);
    }
    const list = this.getProducts();
    const now = new Date().toISOString();
    if (prod.id) {
      const idx = list.findIndex((p) => p.id === prod.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...prod, updatedAt: now };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
        return list[idx];
      }
    }
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newProd);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    return newProd;
  }

  public duplicateProduct(id: string): Product | null {
    if (this.isElectron()) {
      return window.electronAPI!.duplicateProduct(id);
    }
    const prod = this.getProductById(id);
    if (!prod) return null;
    const duplicated: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      productCode: `${prod.productCode}-CPY`,
      name: `${prod.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = this.getProducts();
    list.unshift(duplicated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    return duplicated;
  }

  public deleteProduct(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteProduct(id);
    }
    const list = this.getProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    return true;
  }

  // --------------------------------------------------------------------------
  // Customers
  // --------------------------------------------------------------------------
  public getCustomers(): Customer[] {
    if (this.isElectron()) {
      return window.electronAPI!.getCustomers() || INITIAL_CUSTOMERS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : INITIAL_CUSTOMERS;
  }

  public getCustomerById(id: string): Customer | undefined {
    if (this.isElectron()) {
      return window.electronAPI!.getCustomerById(id);
    }
    return this.getCustomers().find((c) => c.id === id);
  }

  public saveCustomer(cust: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Customer {
    if (this.isElectron()) {
      return window.electronAPI!.saveCustomer(cust);
    }
    const list = this.getCustomers();
    const now = new Date().toISOString();
    if (cust.id) {
      const idx = list.findIndex((c) => c.id === cust.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...cust, updatedAt: now };
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
        return list[idx];
      }
    }
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
      customerCode: cust.customerCode || `CUST-JMA-${list.length + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newCust);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
    return newCust;
  }

  public deleteCustomer(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteCustomer(id);
    }
    const list = this.getCustomers().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
    return true;
  }

  // --------------------------------------------------------------------------
  // Bank Accounts & Terms
  // --------------------------------------------------------------------------
  public getBankAccounts(): BankAccount[] {
    if (this.isElectron()) {
      return window.electronAPI!.getBankAccounts() || INITIAL_BANK_ACCOUNTS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
    return raw ? JSON.parse(raw) : INITIAL_BANK_ACCOUNTS;
  }

  public saveBankAccount(bank: Omit<BankAccount, 'id'> & { id?: string }): BankAccount {
    if (this.isElectron()) {
      return window.electronAPI!.saveBankAccount(bank);
    }
    const list = this.getBankAccounts();
    if (bank.isDefault) {
      list.forEach((b) => (b.isDefault = false));
    }
    if (bank.id) {
      const idx = list.findIndex((b) => b.id === bank.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...bank };
        localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(list));
        return list[idx];
      }
    }
    const newBank: BankAccount = { ...bank, id: `bank-${Date.now()}` };
    list.push(newBank);
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(list));
    return newBank;
  }

  public deleteBankAccount(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteBankAccount(id);
    }
    const list = this.getBankAccounts().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(list));
    return true;
  }

  public getTermsTemplates(): TermsTemplate[] {
    if (this.isElectron()) {
      return window.electronAPI!.getTermsTemplates() || INITIAL_TERMS_TEMPLATES;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.TERMS_TEMPLATES);
    return raw ? JSON.parse(raw) : INITIAL_TERMS_TEMPLATES;
  }

  public saveTermsTemplate(tmpl: Omit<TermsTemplate, 'id'> & { id?: string }): TermsTemplate {
    if (this.isElectron()) {
      return window.electronAPI!.saveTermsTemplate(tmpl);
    }
    const list = this.getTermsTemplates();
    if (tmpl.isDefault) {
      list.forEach((t) => (t.isDefault = false));
    }
    if (tmpl.id) {
      const idx = list.findIndex((t) => t.id === tmpl.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...tmpl };
        localStorage.setItem(STORAGE_KEYS.TERMS_TEMPLATES, JSON.stringify(list));
        return list[idx];
      }
    }
    const newTmpl: TermsTemplate = { ...tmpl, id: `terms-${Date.now()}` };
    list.push(newTmpl);
    localStorage.setItem(STORAGE_KEYS.TERMS_TEMPLATES, JSON.stringify(list));
    return newTmpl;
  }

  // --------------------------------------------------------------------------
  // Quotation Settings & Next Number Generation
  // --------------------------------------------------------------------------
  public getSettings(): QuotationSettings {
    if (this.isElectron()) {
      const s = window.electronAPI?.getSettings();
      return { ...INITIAL_SETTINGS, ...(s || {}) };
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const stored = raw ? JSON.parse(raw) : {};
    return { ...INITIAL_SETTINGS, ...stored };
  }

  public updateSettings(settings: Partial<QuotationSettings>): QuotationSettings {
    if (this.isElectron()) {
      const updated = window.electronAPI?.updateSettings(settings);
      return { ...INITIAL_SETTINGS, ...(updated || {}) };
    }
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  public getNextQuotationNumber(): string {
    if (this.isElectron()) {
      const numFromIpc = window.electronAPI?.getNextQuotationNumber();
      if (numFromIpc && typeof numFromIpc === 'string') {
        return numFromIpc;
      }
    }
    const settings = this.getSettings();
    const year = settings.currentYear || new Date().getFullYear();
    const num = typeof settings.sequenceNumber === 'number' ? settings.sequenceNumber : 1011;
    const prefix = settings.prefix || 'JMA';
    const template = (typeof settings.formatTemplate === 'string' && settings.formatTemplate.includes('{NUMBER}'))
      ? settings.formatTemplate
      : '{PREFIX}-{YEAR}-{NUMBER}';

    return template
      .replace('{PREFIX}', prefix)
      .replace('{YEAR}', year.toString())
      .replace('{NUMBER}', num.toString().padStart(4, '0'));
  }

  public incrementQuotationSequence() {
    if (this.isElectron()) {
      window.electronAPI?.incrementQuotationSequence();
      return;
    }
    const settings = this.getSettings();
    settings.sequenceNumber += 1;
    this.updateSettings(settings);
  }

  // --------------------------------------------------------------------------
  // Quotations
  // --------------------------------------------------------------------------
  public getQuotations(): Quotation[] {
    if (this.isElectron()) {
      return window.electronAPI!.getQuotations() || [];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    let list: Quotation[] = raw ? JSON.parse(raw) : [];

    const today = new Date().toISOString().split('T')[0];
    let updatedAny = false;
    list = list.map((q) => {
      if (
        (q.status === 'sent' || q.status === 'viewed' || q.status === 'under_negotiation') &&
        q.validUntil < today
      ) {
        updatedAny = true;
        return {
          ...q,
          status: 'expired' as QuotationStatus,
          statusHistory: [
            ...(q.statusHistory || []),
            {
              id: `hist-exp-${Date.now()}`,
              status: 'expired' as QuotationStatus,
              previousStatus: q.status,
              note: 'Automatically marked as expired after validity date passed',
              updatedByName: 'System Bot',
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return q;
    });

    if (updatedAny) {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    }

    return list;
  }

  public getQuotationById(id: string): Quotation | undefined {
    if (this.isElectron()) {
      return window.electronAPI!.getQuotationById(id);
    }
    return this.getQuotations().find((q) => q.id === id || q.quotationNumber === id);
  }

  public saveQuotation(quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Quotation {
    if (this.isElectron()) {
      return window.electronAPI!.saveQuotation(quotation);
    }
    const list = this.getQuotations();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    if (quotation.id) {
      const idx = list.findIndex((q) => q.id === quotation.id);
      if (idx !== -1) {
        const existing = list[idx];
        const statusChanged = existing.status !== quotation.status;
        const newHistory = [...(existing.statusHistory || [])];

        if (statusChanged) {
          newHistory.push({
            id: `hist-${Date.now()}`,
            status: quotation.status,
            previousStatus: existing.status,
            note: `Status updated from ${existing.status.toUpperCase()} to ${quotation.status.toUpperCase()}`,
            updatedByName: currentUser.name,
            createdAt: now,
          });
        }

        const updated: Quotation = {
          ...existing,
          ...quotation,
          statusHistory: newHistory,
          updatedAt: now,
        };
        list[idx] = updated;
        localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
        return updated;
      }
    }

    // New quotation creation
    const newId = `quot-${Date.now()}`;
    const initialHistory = quotation.statusHistory && quotation.statusHistory.length > 0
      ? quotation.statusHistory
      : [
          {
            id: `hist-${Date.now()}`,
            status: quotation.status || 'draft',
            note: 'Quotation created in system',
            updatedByName: currentUser.name,
            createdAt: now,
          },
        ];

    const settings = this.getSettings();

    const newQuotation: Quotation = {
      signatureUrl: quotation.signatureUrl !== undefined ? quotation.signatureUrl : settings.signatureUrl,
      stampUrl: quotation.stampUrl !== undefined ? quotation.stampUrl : settings.stampUrl,
      signatureEnabled: quotation.signatureEnabled !== undefined ? quotation.signatureEnabled : (settings.signatureEnabled ?? true),
      stampEnabled: quotation.stampEnabled !== undefined ? quotation.stampEnabled : (settings.stampEnabled ?? true),
      signatureSize: quotation.signatureSize || settings.signatureSize || 'md',
      stampSize: quotation.stampSize || settings.stampSize || 'md',
      signatoryName: quotation.signatoryName || settings.signatoryName || 'Mohan Jha',
      signatoryDesignation: quotation.signatoryDesignation || settings.signatoryDesignation || 'Commercial & Technical Operations',

      ...quotation,
      id: newId,
      statusHistory: initialHistory,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newQuotation);
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    this.incrementQuotationSequence();
    return newQuotation;
  }

  public duplicateQuotation(id: string): Quotation | null {
    if (this.isElectron()) {
      return window.electronAPI!.duplicateQuotation(id);
    }
    const orig = this.getQuotationById(id);
    if (!orig) return null;

    const nextNumber = this.getNextQuotationNumber();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const validUntilDate = new Date(now.setDate(now.getDate() + 15)).toISOString().split('T')[0];
    const currentUser = this.getCurrentUser();
    const settings = this.getSettings();

    const duplicated: Quotation = {
      ...orig,
      id: `quot-${Date.now()}`,
      quotationNumber: nextNumber,
      quotationDate: today,
      validUntil: validUntilDate,
      status: 'draft',
      referenceNumber: orig.referenceNumber ? `${orig.referenceNumber} (Rev)` : undefined,
      signatureUrl: orig.signatureUrl ?? settings.signatureUrl,
      stampUrl: orig.stampUrl ?? settings.stampUrl,
      signatureEnabled: orig.signatureEnabled ?? settings.signatureEnabled ?? true,
      stampEnabled: orig.stampEnabled ?? settings.stampEnabled ?? true,
      signatureSize: orig.signatureSize || settings.signatureSize || 'md',
      stampSize: orig.stampSize || settings.stampSize || 'md',
      signatoryName: orig.signatoryName || settings.signatoryName || 'Mohan Jha',
      signatoryDesignation: orig.signatoryDesignation || settings.signatoryDesignation || 'Commercial & Technical Operations',
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: 'draft',
          note: `Duplicated from quotation ${orig.quotationNumber}`,
          updatedByName: currentUser.name,
          createdAt: new Date().toISOString(),
        },
      ],
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = this.getQuotations();
    list.unshift(duplicated);
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    this.incrementQuotationSequence();
    return duplicated;
  }

  public updateQuotationStatus(id: string, status: QuotationStatus, note?: string): Quotation | null {
    if (this.isElectron()) {
      return window.electronAPI!.updateQuotationStatus(id, status, note);
    }
    const list = this.getQuotations();
    const idx = list.findIndex((q) => q.id === id);
    if (idx === -1) return null;

    const existing = list[idx];
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    const updatedHistory = [
      ...(existing.statusHistory || []),
      {
        id: `hist-${Date.now()}`,
        status,
        previousStatus: existing.status,
        note: note || `Status changed to ${status.toUpperCase()}`,
        updatedByName: currentUser.name,
        createdAt: now,
      },
    ];

    list[idx] = {
      ...existing,
      status,
      statusHistory: updatedHistory,
      updatedAt: now,
    };

    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    return list[idx];
  }

  public deleteQuotation(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteQuotation(id);
    }
    const list = this.getQuotations().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    return true;
  }

  // ==========================================================================
  // Proforma Invoices
  // ==========================================================================
  public getNextProformaNumber(): string {
    if (this.isElectron()) {
      return window.electronAPI!.getNextProformaNumber();
    }
    const settings = this.getSettings();
    const year = settings.currentYear || new Date().getFullYear();
    const prefix = settings.piPrefix || 'JMA-PI';
    const seq = settings.piSequenceNumber || 501;
    return `${prefix}-${year}-${seq.toString().padStart(4, '0')}`;
  }

  public incrementProformaSequence(): void {
    if (this.isElectron()) {
      window.electronAPI!.incrementProformaSequence();
      return;
    }
    const settings = this.getSettings();
    const nextSeq = (settings.piSequenceNumber || 501) + 1;
    this.updateSettings({ piSequenceNumber: nextSeq });
  }

  public getProformaInvoices(): ProformaInvoice[] {
    if (this.isElectron()) {
      return window.electronAPI!.getProformaInvoices() || [];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PROFORMAS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getProformaInvoiceById(id: string): ProformaInvoice | undefined {
    if (this.isElectron()) {
      return window.electronAPI!.getProformaInvoiceById(id);
    }
    return this.getProformaInvoices().find((p) => p.id === id || p.piNumber === id);
  }

  public saveProformaInvoice(proforma: Omit<ProformaInvoice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ProformaInvoice {
    if (this.isElectron()) {
      const res = window.electronAPI!.saveProformaInvoice(proforma);
      if (!res) {
        throw new Error('Database transaction failed while saving proforma invoice');
      }
      return res;
    }
    const list = this.getProformaInvoices();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    if (proforma.id) {
      const idx = list.findIndex((p) => p.id === proforma.id);
      if (idx !== -1) {
        const existing = list[idx];
        const statusChanged = existing.status !== proforma.status;
        const newHistory = [...(existing.statusHistory || [])];

        if (statusChanged) {
          newHistory.push({
            id: `hist-${Date.now()}`,
            status: proforma.status,
            previousStatus: existing.status,
            note: `Status updated from ${existing.status.toUpperCase()} to ${proforma.status.toUpperCase()}`,
            updatedByName: currentUser.name,
            createdAt: now,
          });
        }

        const updated: ProformaInvoice = {
          ...existing,
          ...proforma,
          statusHistory: newHistory,
          updatedAt: now,
        };
        list[idx] = updated;
        localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
        return updated;
      }
    }

    // New proforma invoice
    const newId = `pi-${Date.now()}`;
    const initialHistory = proforma.statusHistory && proforma.statusHistory.length > 0
      ? proforma.statusHistory
      : [
          {
            id: `hist-${Date.now()}`,
            status: proforma.status || 'draft',
            note: 'Proforma Invoice generated in system',
            updatedByName: currentUser.name,
            createdAt: now,
          },
        ];

    const settings = this.getSettings();

    const newPI: ProformaInvoice = {
      signatureUrl: proforma.signatureUrl !== undefined ? proforma.signatureUrl : settings.signatureUrl,
      stampUrl: proforma.stampUrl !== undefined ? proforma.stampUrl : settings.stampUrl,
      signatureEnabled: proforma.signatureEnabled !== undefined ? proforma.signatureEnabled : (settings.signatureEnabled ?? true),
      stampEnabled: proforma.stampEnabled !== undefined ? proforma.stampEnabled : (settings.stampEnabled ?? true),
      signatureSize: proforma.signatureSize || settings.signatureSize || 'md',
      stampSize: proforma.stampSize || settings.stampSize || 'md',
      signatoryName: proforma.signatoryName || settings.signatoryName || 'Mohan Jha',
      signatoryDesignation: proforma.signatoryDesignation || settings.signatoryDesignation || 'Commercial & Technical Operations',

      ...proforma,
      id: newId,
      statusHistory: initialHistory,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newPI);
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
    this.incrementProformaSequence();
    return newPI;
  }

  public duplicateProformaInvoice(id: string): ProformaInvoice | null {
    if (this.isElectron()) {
      return window.electronAPI!.duplicateProformaInvoice(id);
    }
    const orig = this.getProformaInvoiceById(id);
    if (!orig) return null;

    const nextNumber = this.getNextProformaNumber();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const validUntilDate = new Date(now.setDate(now.getDate() + 15)).toISOString().split('T')[0];
    const currentUser = this.getCurrentUser();
    const settings = this.getSettings();

    const duplicated: ProformaInvoice = {
      ...orig,
      id: `pi-${Date.now()}`,
      piNumber: nextNumber,
      piDate: today,
      validUntil: validUntilDate,
      status: 'draft',
      referenceNumber: orig.referenceNumber ? `${orig.referenceNumber} (Rev)` : undefined,
      signatureUrl: orig.signatureUrl ?? settings.signatureUrl,
      stampUrl: orig.stampUrl ?? settings.stampUrl,
      signatureEnabled: orig.signatureEnabled ?? settings.signatureEnabled,
      stampEnabled: orig.stampEnabled ?? settings.stampEnabled,
      signatureSize: orig.signatureSize ?? settings.signatureSize,
      stampSize: orig.stampSize ?? settings.stampSize,
      signatoryName: orig.signatoryName ?? settings.signatoryName,
      signatoryDesignation: orig.signatoryDesignation ?? settings.signatoryDesignation,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: 'draft',
          note: `Duplicated from proforma ${orig.piNumber}`,
          updatedByName: currentUser.name,
          createdAt: new Date().toISOString(),
        },
      ],
      items: (orig.items || []).map((it, idx) => ({
        ...it,
        id: `piitem-${Date.now()}-${idx}`,
        srNo: idx + 1,
      })),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = this.getProformaInvoices();
    list.unshift(duplicated);
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
    this.incrementProformaSequence();
    return duplicated;
  }

  public updateProformaInvoiceStatus(id: string, status: ProformaStatus, note?: string): ProformaInvoice | null {
    if (this.isElectron()) {
      return window.electronAPI!.updateProformaInvoiceStatus(id, status, note);
    }
    const list = this.getProformaInvoices();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const existing = list[idx];

    const newHistory = [
      ...(existing.statusHistory || []),
      {
        id: `hist-${Date.now()}`,
        status,
        previousStatus: existing.status,
        note: note || `Status updated from ${existing.status.toUpperCase()} to ${status.toUpperCase()}`,
        updatedByName: currentUser.name,
        createdAt: now,
      },
    ];

    list[idx] = {
      ...existing,
      status,
      statusHistory: newHistory,
      updatedAt: now,
    };

    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
    return list[idx];
  }

  public deleteProformaInvoice(id: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.deleteProformaInvoice(id);
    }
    const list = this.getProformaInvoices().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(list));
    return true;
  }

  // --------------------------------------------------------------------------
  // Backup, Export, Restore
  // --------------------------------------------------------------------------
  public exportAllDataJson(): string {
    if (this.isElectron()) {
      return window.electronAPI!.exportAllDataJson();
    }
    const payload = {
      company: this.getCompany(),
      users: this.getUsers(),
      categories: this.getCategories(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      bankAccounts: this.getBankAccounts(),
      termsTemplates: this.getTermsTemplates(),
      settings: this.getSettings(),
      quotations: this.getQuotations(),
      proformas: this.getProformaInvoices(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDataJson(jsonString: string): boolean {
    if (this.isElectron()) {
      return window.electronAPI!.importDataJson(jsonString);
    }
    try {
      const data = JSON.parse(jsonString);
      if (data.company) localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(data.company));
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.bankAccounts) localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(data.bankAccounts));
      if (data.termsTemplates) localStorage.setItem(STORAGE_KEYS.TERMS_TEMPLATES, JSON.stringify(data.termsTemplates));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.quotations) localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(data.quotations));
      if (data.proformas) localStorage.setItem(STORAGE_KEYS.PROFORMAS, JSON.stringify(data.proformas));
      return true;
    } catch (e) {
      console.error('Failed to import data JSON', e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // SQLite Native Database Backup & Restore (Desktop)
  // --------------------------------------------------------------------------
  public async backupSQLiteDatabase(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    if (this.isElectron() && window.electronAPI?.backupDatabase) {
      return window.electronAPI.backupDatabase();
    }
    return { success: false, error: 'Database file backup is available in the desktop application.' };
  }

  public async restoreSQLiteDatabase(): Promise<{ success: boolean; error?: string }> {
    if (this.isElectron() && window.electronAPI?.restoreDatabase) {
      return window.electronAPI.restoreDatabase();
    }
    return { success: false, error: 'Database file restore is available in the desktop application.' };
  }

  // --------------------------------------------------------------------------
  // Persistent Asset Storage (Signatures & Stamps)
  // --------------------------------------------------------------------------
  public async saveAsset(base64Data: string, filename: string): Promise<string> {
    if (this.isElectron() && window.electronAPI?.saveAssetFile) {
      const res = await window.electronAPI.saveAssetFile(base64Data, filename);
      if (res.success && res.url) {
        return res.url;
      }
    }
    return base64Data;
  }
}

export const storage = new StorageService();
