import fs from 'fs';
import path from 'path';

// Types corresponding to application models
export interface DBQuotationItem {
  id: string;
  quotation_id: string;
  sr_no: number;
  product_id?: string;
  product_name: string;
  description: string;
  material: string;
  grade: string;
  size: string;
  schedule?: string;
  thickness?: string;
  standard?: string;
  quantity: number;
  unit: string;
  rate: number;
  gross_amount: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  hsn_code: string;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

export class DatabaseManager {
  private dbPath: string;
  private db: any = null;
  private isWasm: boolean = false;
  private SQL: any = null;
  private inTransaction: boolean = false;
  private saveTimeout: any = null;

  public static readonly DEFAULT_SETTINGS = {
    id: 'default',
    prefix: 'JMA',
    currentYear: 2026,
    sequenceNumber: 1011,
    formatTemplate: '{PREFIX}-{YEAR}-{NUMBER}',
    defaultValidityDays: 15,
    defaultCurrency: 'INR',
    defaultCurrencySymbol: '₹',
    defaultPaymentTerms: '30% Advance, balance against Proforma / LR prior to dispatch',
    defaultDeliveryTerms: 'Ex-Works, Taloja MIDC Stockyard, Navi Mumbai',
    signatureUrl: '/signature.png',
    stampUrl: '/stamp.png',
    signatureEnabled: true,
    stampEnabled: true,
    signatureSize: 'md',
    stampSize: 'md',
    signatoryName: 'Mohan Jha',
    signatoryDesignation: 'Commercial & Technical Operations',
    piPrefix: 'JMA-PI',
    piSequenceNumber: 501,
  };

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      // In Electron runtime, resolve app userData path
      let userData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
      try {
        const { app } = require('electron');
        if (app && typeof app.getPath === 'function') {
          userData = app.getPath('userData');
        }
      } catch (e) {}

      const primaryDir = path.join(userData, 'database');
      const primaryDbPath = path.join(primaryDir, 'quotations.sqlite');
      const nestedDbPath = path.join(userData, 'Jubilant Metal and Alloys', 'database', 'quotations.sqlite');
      const legacyDbPath = path.join(
        process.env.APPDATA || '',
        'quotation-software',
        'Jubilant Metal and Alloys',
        'database',
        'quotations.sqlite'
      );

      if (fs.existsSync(primaryDbPath)) {
        this.dbPath = primaryDbPath;
      } else if (fs.existsSync(nestedDbPath)) {
        this.dbPath = nestedDbPath;
      } else if (fs.existsSync(legacyDbPath)) {
        // Automatically adopt existing legacy database so client loses no data
        try {
          if (!fs.existsSync(primaryDir)) {
            fs.mkdirSync(primaryDir, { recursive: true });
          }
          fs.copyFileSync(legacyDbPath, primaryDbPath);
          this.dbPath = primaryDbPath;
          console.log('[DatabaseManager] Migrated existing database from legacy path:', legacyDbPath);
        } catch (e) {
          this.dbPath = legacyDbPath;
        }
      } else {
        if (!fs.existsSync(primaryDir)) {
          fs.mkdirSync(primaryDir, { recursive: true });
        }
        this.dbPath = primaryDbPath;
      }
    }
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public async init(): Promise<void> {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Try better-sqlite3 first (native, high performance)
    let initialized = false;
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.isWasm = false;
      initialized = true;
      console.log('[DatabaseManager] Initialized native better-sqlite3 at:', this.dbPath);
    } catch (err: any) {
      console.warn('[DatabaseManager] Native better-sqlite3 not available, falling back to sql.js WASM SQLite:', err.message);
    }

    // Fallback to sql.js (WebAssembly SQLite - 100% reliable everywhere)
    if (!initialized) {
      const initSqlJs = require('sql.js');
      const wasmLocations = [
        path.join(__dirname, 'sql-wasm.wasm'),
        path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
        path.join((process as any).resourcesPath || '', 'sql-wasm.wasm'),
        path.join((process as any).resourcesPath || '', 'app.asar.unpacked/node_modules/sql.js/dist/sql-wasm.wasm'),
      ];
      const locatedWasm = wasmLocations.find((p) => fs.existsSync(p));
      const wasmBinary = locatedWasm ? fs.readFileSync(locatedWasm) : undefined;
      this.SQL = await initSqlJs({
        locateFile: () => locatedWasm || 'sql-wasm.wasm',
        wasmBinary,
      });
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(fileBuffer);
      } else {
        this.db = new this.SQL.Database();
        this.saveWasmToDisk();
      }
      this.isWasm = true;
      console.log('[DatabaseManager] Initialized WASM sql.js SQLite at:', this.dbPath);
    }

    this.createTables();
    this.seedInitialDataIfEmpty();
  }

  private saveWasmToDisk(immediate: boolean = false) {
    if (!this.isWasm || !this.db) return;

    const doSave = () => {
      try {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        const tmpPath = `${this.dbPath}.tmp`;
        fs.writeFileSync(tmpPath, buffer);
        try {
          fs.renameSync(tmpPath, this.dbPath);
        } catch (renameErr) {
          // If Windows atomic rename fails (e.g. transient file lock), write directly
          fs.writeFileSync(this.dbPath, buffer);
          if (fs.existsSync(tmpPath)) {
            try { fs.unlinkSync(tmpPath); } catch (e) {}
          }
        }
      } catch (err) {
        console.error('[DatabaseManager] Failed to write WASM DB to disk:', err);
      }
    };

    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      doSave();
    } else {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.saveTimeout = null;
        doSave();
      }, 50);
    }
  }

  private sanitizeParams(params: any[] = []): any[] {
    return (params || []).map((val) => (val === undefined ? null : val));
  }

  private exec(sql: string) {
    if (this.isWasm) {
      this.db.run(sql);
      if (!this.inTransaction) {
        this.saveWasmToDisk();
      }
    } else {
      this.db.exec(sql);
    }
  }

  private beginTransaction() {
    if (this.inTransaction) return;
    try {
      if (this.isWasm) {
        this.db.run('BEGIN TRANSACTION');
      } else {
        if (this.db && !this.db.inTransaction) {
          this.db.exec('BEGIN TRANSACTION');
        }
      }
      this.inTransaction = true;
    } catch (e: any) {
      console.warn('[DatabaseManager] beginTransaction warning:', e?.message);
    }
  }

  private commitTransaction() {
    if (!this.inTransaction) return;
    this.inTransaction = false;
    try {
      if (this.isWasm) {
        this.db.run('COMMIT');
        this.saveWasmToDisk(true);
      } else {
        if (this.db) {
          this.db.exec('COMMIT');
        }
      }
    } catch (e: any) {
      console.warn('[DatabaseManager] commitTransaction warning:', e?.message);
    }
  }

  private rollbackTransaction() {
    if (!this.inTransaction) return;
    this.inTransaction = false;
    try {
      if (this.isWasm) {
        this.db.run('ROLLBACK');
      } else {
        if (this.db && this.db.inTransaction) {
          this.db.exec('ROLLBACK');
        }
      }
    } catch (e: any) {
      console.warn('[DatabaseManager] rollbackTransaction ignored:', e?.message);
    }
  }

  private queryAll(sql: string, params: any[] = []): any[] {
    const cleanParams = this.sanitizeParams(params);
    if (this.isWasm) {
      const stmt = this.db.prepare(sql);
      stmt.bind(cleanParams);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } else {
      const stmt = this.db.prepare(sql);
      return stmt.all(...cleanParams);
    }
  }

  private queryOne(sql: string, params: any[] = []): any | undefined {
    const list = this.queryAll(sql, params);
    return list.length > 0 ? list[0] : undefined;
  }

  private run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
    const cleanParams = this.sanitizeParams(params);
    if (this.isWasm) {
      this.db.run(sql, cleanParams);
      if (!this.inTransaction) {
        this.saveWasmToDisk();
      }
      return { changes: 1, lastInsertRowid: 0 };
    } else {
      const stmt = this.db.prepare(sql);
      return stmt.run(...cleanParams);
    }
  }

  private createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS company_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        logo TEXT,
        gstin TEXT,
        pan TEXT,
        cin TEXT,
        addressLine1 TEXT,
        addressLine2 TEXT,
        city TEXT,
        state TEXT,
        stateCode TEXT,
        country TEXT,
        pinCode TEXT,
        phone TEXT,
        email TEXT,
        website TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT,
        phone TEXT,
        avatar TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT,
        description TEXT,
        icon TEXT,
        isActive INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        productCode TEXT UNIQUE,
        name TEXT NOT NULL,
        categoryId TEXT,
        categoryName TEXT,
        subcategory TEXT,
        material TEXT,
        grade TEXT,
        size TEXT,
        od TEXT,
        idDim TEXT,
        thickness TEXT,
        length TEXT,
        width TEXT,
        schedule TEXT,
        classRating TEXT,
        pressureRating TEXT,
        standard TEXT,
        specification TEXT,
        finish TEXT,
        form TEXT,
        unit TEXT,
        hsnCode TEXT,
        gstRate REAL DEFAULT 18,
        defaultSellingPrice REAL DEFAULT 0,
        description TEXT,
        imageUrl TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        customerCode TEXT UNIQUE,
        companyName TEXT NOT NULL,
        contactPerson TEXT,
        designation TEXT,
        email TEXT,
        phone TEXT,
        whatsapp TEXT,
        gstin TEXT,
        pan TEXT,
        billingAddress TEXT,
        shippingAddress TEXT,
        city TEXT,
        state TEXT,
        stateCode TEXT,
        country TEXT,
        pinCode TEXT,
        paymentTerms TEXT,
        creditLimit REAL DEFAULT 0,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY,
        bankName TEXT NOT NULL,
        accountName TEXT,
        accountNumber TEXT NOT NULL,
        ifscCode TEXT NOT NULL,
        branchName TEXT,
        upiId TEXT,
        swiftCode TEXT,
        isDefault INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS terms_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        terms TEXT NOT NULL,
        isDefault INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT 'JMA',
        currentYear INTEGER DEFAULT 2026,
        sequenceNumber INTEGER DEFAULT 1011,
        formatTemplate TEXT DEFAULT '{PREFIX}-{YEAR}-{NUMBER}',
        defaultValidityDays INTEGER DEFAULT 15,
        defaultCurrency TEXT DEFAULT 'INR',
        defaultCurrencySymbol TEXT DEFAULT '₹',
        defaultPaymentTerms TEXT,
        defaultDeliveryTerms TEXT,
        signatureUrl TEXT,
        stampUrl TEXT,
        signatureEnabled INTEGER DEFAULT 1,
        stampEnabled INTEGER DEFAULT 1,
        signatureSize TEXT DEFAULT 'md',
        stampSize TEXT DEFAULT 'md',
        signatoryName TEXT DEFAULT 'Mohan Jha',
        signatoryDesignation TEXT DEFAULT 'Commercial & Technical Operations'
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quotationNumber TEXT UNIQUE NOT NULL,
        quotationDate TEXT NOT NULL,
        validUntil TEXT NOT NULL,
        referenceNumber TEXT,
        customerReference TEXT,
        salesperson TEXT,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerContactPerson TEXT,
        customerEmail TEXT,
        customerPhone TEXT,
        customerGstin TEXT,
        customerPan TEXT,
        billingAddress TEXT,
        shippingAddress TEXT,
        customerCity TEXT,
        customerState TEXT,
        customerStateCode TEXT,
        customerPinCode TEXT,
        subtotal REAL NOT NULL,
        totalDiscount REAL NOT NULL,
        taxableAmount REAL NOT NULL,
        isInterstate INTEGER NOT NULL DEFAULT 0,
        cgstTotal REAL NOT NULL,
        sgstTotal REAL NOT NULL,
        igstTotal REAL NOT NULL,
        totalTax REAL NOT NULL,
        freightCharges REAL DEFAULT 0,
        packingCharges REAL DEFAULT 0,
        insuranceCharges REAL DEFAULT 0,
        loadingCharges REAL DEFAULT 0,
        otherCharges REAL DEFAULT 0,
        extraChargesTotal REAL DEFAULT 0,
        roundOff REAL DEFAULT 0,
        grandTotal REAL NOT NULL,
        amountInWords TEXT,
        paymentTerms TEXT,
        deliveryTerms TEXT,
        termsAndConditions TEXT,
        bankAccountId TEXT,
        bankDetails TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        statusHistory TEXT,
        signatureUrl TEXT,
        stampUrl TEXT,
        signatureEnabled INTEGER DEFAULT 1,
        stampEnabled INTEGER DEFAULT 1,
        signatureSize TEXT DEFAULT 'md',
        stampSize TEXT DEFAULT 'md',
        signatoryName TEXT,
        signatoryDesignation TEXT,
        createdBy TEXT,
        createdByName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id TEXT PRIMARY KEY,
        quotationId TEXT NOT NULL,
        srNo INTEGER NOT NULL,
        productId TEXT,
        productName TEXT NOT NULL,
        description TEXT,
        material TEXT,
        grade TEXT,
        size TEXT,
        schedule TEXT,
        thickness TEXT,
        standard TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        rate REAL NOT NULL,
        grossAmount REAL NOT NULL,
        discountPercent REAL DEFAULT 0,
        discountAmount REAL DEFAULT 0,
        taxableAmount REAL NOT NULL,
        hsnCode TEXT,
        gstRate REAL NOT NULL,
        cgstAmount REAL DEFAULT 0,
        sgstAmount REAL DEFAULT 0,
        igstAmount REAL DEFAULT 0,
        totalAmount REAL NOT NULL,
        FOREIGN KEY (quotationId) REFERENCES quotations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_quotations_num ON quotations(quotationNumber);
      CREATE INDEX IF NOT EXISTS idx_quotations_cust ON quotations(customerId);
      CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
      CREATE INDEX IF NOT EXISTS idx_quotation_items_qid ON quotation_items(quotationId);

      CREATE TABLE IF NOT EXISTS proforma_invoices (
        id TEXT PRIMARY KEY,
        piNumber TEXT UNIQUE NOT NULL,
        piDate TEXT NOT NULL,
        validUntil TEXT NOT NULL,
        referenceNumber TEXT,
        customerReference TEXT,
        salesperson TEXT,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerContactPerson TEXT,
        customerEmail TEXT,
        customerPhone TEXT,
        customerGstin TEXT,
        customerPan TEXT,
        billingAddress TEXT,
        shippingAddress TEXT,
        customerCity TEXT,
        customerState TEXT,
        customerStateCode TEXT,
        customerPinCode TEXT,
        shipToCompany TEXT,
        shipToContact TEXT,
        shipToCity TEXT,
        shipToState TEXT,
        shipToStateCode TEXT,
        shipToPinCode TEXT,
        shipToCountry TEXT,
        shipToPhone TEXT,
        subtotal REAL NOT NULL,
        totalDiscount REAL NOT NULL,
        taxableAmount REAL NOT NULL,
        isInterstate INTEGER NOT NULL DEFAULT 0,
        cgstTotal REAL NOT NULL,
        sgstTotal REAL NOT NULL,
        igstTotal REAL NOT NULL,
        totalTax REAL NOT NULL,
        freightCharges REAL DEFAULT 0,
        packingCharges REAL DEFAULT 0,
        insuranceCharges REAL DEFAULT 0,
        loadingCharges REAL DEFAULT 0,
        otherCharges REAL DEFAULT 0,
        extraChargesTotal REAL DEFAULT 0,
        roundOff REAL DEFAULT 0,
        grandTotal REAL NOT NULL,
        amountInWords TEXT,
        paymentTerms TEXT,
        deliveryTerms TEXT,
        termsAndConditions TEXT,
        bankAccountId TEXT,
        bankDetails TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        statusHistory TEXT,
        signatureUrl TEXT,
        stampUrl TEXT,
        signatureEnabled INTEGER DEFAULT 1,
        stampEnabled INTEGER DEFAULT 1,
        signatureSize TEXT DEFAULT 'md',
        stampSize TEXT DEFAULT 'md',
        signatoryName TEXT,
        signatoryDesignation TEXT,
        createdBy TEXT,
        createdByName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS proforma_invoice_items (
        id TEXT PRIMARY KEY,
        proformaId TEXT NOT NULL,
        srNo INTEGER NOT NULL,
        productId TEXT,
        productName TEXT NOT NULL,
        description TEXT,
        material TEXT,
        grade TEXT,
        size TEXT,
        schedule TEXT,
        thickness TEXT,
        standard TEXT,
        measurement TEXT,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        rate REAL NOT NULL,
        grossAmount REAL NOT NULL,
        discountPercent REAL DEFAULT 0,
        discountAmount REAL DEFAULT 0,
        taxableAmount REAL NOT NULL,
        hsnCode TEXT,
        gstRate REAL NOT NULL,
        cgstAmount REAL DEFAULT 0,
        sgstAmount REAL DEFAULT 0,
        igstAmount REAL DEFAULT 0,
        totalAmount REAL NOT NULL,
        FOREIGN KEY (proformaId) REFERENCES proforma_invoices(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_proformas_num ON proforma_invoices(piNumber);
      CREATE INDEX IF NOT EXISTS idx_proformas_cust ON proforma_invoices(customerId);
      CREATE INDEX IF NOT EXISTS idx_proformas_status ON proforma_invoices(status);
      CREATE INDEX IF NOT EXISTS idx_proforma_items_pid ON proforma_invoice_items(proformaId);
    `;

    this.exec(schema);

    // Self-healing migrations for settings columns
    try {
      this.run("ALTER TABLE settings ADD COLUMN piPrefix TEXT DEFAULT 'JMA-PI'");
    } catch (e) {}
    try {
      this.run("ALTER TABLE settings ADD COLUMN piSequenceNumber INTEGER DEFAULT 501");
    } catch (e) {}
  }

  private seedInitialDataIfEmpty() {
    console.log('[DatabaseManager] Validating and self-healing table datasets...');

    // 1. Company Profile
    const companyCount = this.queryOne('SELECT count(*) as c FROM company_profile')?.c || 0;
    if (companyCount === 0) {
      console.log('[DatabaseManager] Seeding company profile...');
      this.run(
        `INSERT INTO company_profile (id, name, tagline, logo, gstin, pan, cin, addressLine1, addressLine2, city, state, stateCode, country, pinCode, phone, email, website)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'comp-jubilant-01',
          'JUBILANT METAL AND ALLOYS',
          'Stockist, Manufacturer & Global Exporters of High Nickel Alloys, Stainless Steel & Pipes',
          '/New logo.png',
          '27AABCJ4589K1Z5',
          'AABCJ4589K',
          'U27100MH2012PTC231456',
          'Plot No. C-14/2, Taloja Industrial Area, MIDC',
          'Navi Mumbai, Raigad District',
          'Navi Mumbai',
          'Maharashtra',
          '27',
          'India',
          '410208',
          '+91 22 2741 8900 / +91 98201 45890',
          'sales@jubilantmetal.com',
          'www.jubilantmetal.com',
        ]
      );
    }

    // 2. Users
    const userCount = this.queryOne('SELECT count(*) as c FROM users')?.c || 0;
    if (userCount === 0) {
      console.log('[DatabaseManager] Seeding initial users...');
      const users = [
        ['user-01', 'Rajesh Sharma', 'admin@jubilantmetal.com', 'admin', '+91 98201 45890', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 1, '2026-01-10T10:00:00Z'],
        ['user-02', 'Vikram Mehta', 'vikram.m@jubilantmetal.com', 'sales_manager', '+91 98202 33411', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 1, '2026-01-15T11:30:00Z'],
        ['user-03', 'Anjali Desai', 'anjali.d@jubilantmetal.com', 'sales_executive', '+91 98203 77890', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 1, '2026-02-01T09:00:00Z'],
        ['user-04', 'Amit Patel', 'viewer@jubilantmetal.com', 'viewer', '+91 98204 11223', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 1, '2026-02-10T14:20:00Z'],
      ];
      for (const u of users) {
        this.run('INSERT INTO users (id, name, email, role, phone, avatar, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', u);
      }
    }

    // 3. Categories
    const catCount = this.queryOne('SELECT count(*) as c FROM product_categories')?.c || 0;
    if (catCount === 0) {
      console.log('[DatabaseManager] Seeding product categories...');
      const categories = [
        ['cat-01', 'Seamless & Welded Pipes', 'seamless-welded-pipes', 'High nickel alloy and stainless steel seamless, ERW, and EFW pipes', 'cylinder', 1],
        ['cat-02', 'Butt Weld Pipe Fittings', 'butt-weld-pipe-fittings', 'Elbows, tees, reducers, and stub ends in exotic alloy grades', 'git-branch', 1],
        ['cat-03', 'Industrial Flanges', 'industrial-flanges', 'Weld neck, slip-on, blind, and socket weld flanges up to 2500# class', 'circle-dot', 1],
        ['cat-04', 'Round Bars & Rods', 'round-bars-rods', 'Cold drawn and peeled round bars in Nickel 200, Monel 400, Inconel 600/625', 'layers', 1],
        ['cat-05', 'Plates, Sheets & Coils', 'plates-sheets-coils', 'Hot rolled and cold rolled plates, coils, and shim sheets', 'sheet', 1],
        ['cat-06', 'Fasteners & Hardware', 'fasteners-hardware', 'Heavy hex bolts, studs, nuts, and washers in B8/B8M and exotic alloys', 'tool', 1],
      ];
      for (const c of categories) {
        this.run('INSERT INTO product_categories (id, name, slug, description, icon, isActive) VALUES (?, ?, ?, ?, ?, ?)', c);
      }
    }

    // 4. Products (20 authentic industrial metal items with clean, non-undefined parameters)
    const prodCount = this.queryOne('SELECT count(*) as c FROM products')?.c || 0;
    if (prodCount === 0) {
      console.log('[DatabaseManager] Seeding industrial product catalogue...');
      const products = [
        ['prod-01', 'PIPE-INC625-SCH40-2IN', 'Inconel 625 Seamless Pipe 2" SCH 40', 'cat-01', 'Seamless & Welded Pipes', 'Seamless Pipes', 'Inconel', 'Inconel 625 / UNS N06625', '2" NB', '60.3mm', '52.5mm', '3.91mm', 'Random 5-7 Mtrs', null, 'SCH 40', null, null, 'ASTM B444 / ASME SB444', 'Grade 1 Annealed, Eddy Current Tested', 'Pickled & Passivated', 'Seamless', 'MTR', '75071100', 18, 5450, 'High strength nickel-chromium-molybdenum alloy pipe with superior resistance to pitting and crevice corrosion.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-02', 'PIPE-SS316L-SCH10-4IN', 'Stainless Steel 316L Seamless Pipe 4" SCH 10', 'cat-01', 'Seamless & Welded Pipes', 'Seamless Pipes', 'Stainless Steel', 'ASTM A312 TP316L', '4" NB', '114.3mm', '108.2mm', '3.05mm', 'Single Random 6 Mtrs', null, 'SCH 10S', null, null, 'ASTM A312 / ASME SA312', 'Fully Solution Annealed, Hydrotested to 50 Bar', 'Solution Annealed & Acid Pickled', 'Seamless', 'MTR', '73044100', 18, 1850, 'Low carbon austenitic stainless steel seamless pipe for chemical and marine process lines.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-03', 'FLG-SS316L-WN-150-3IN', 'SS 316L Weld Neck Flange 3" Class 150 RF', 'cat-03', 'Industrial Flanges', 'Weld Neck Flanges', 'Stainless Steel', 'ASTM A182 F316L', '3" NB', null, null, null, null, null, 'SCH 40', 'Class 150', '150 LBS / PN20', 'ASME B16.5', 'Forged Normalized & Solution Treated', 'Serrated Raised Face (125-250 AARH)', 'Forged', 'PCS', '73072100', 18, 1420, 'ASME B16.5 Raised Face Weld Neck flange with bore matching SCH 40 pipe.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-04', 'BAR-MON400-RD-50MM', 'Monel 400 Bright Round Bar 50mm Dia', 'cat-04', 'Round Bars & Rods', 'Round Bars', 'Monel', 'Monel 400 / UNS N04400', '50mm Dia', '50mm', null, null, '3 to 4 Meters', null, null, null, null, 'ASTM B164', 'Cold Drawn, Stress Relieved, 100% Ultrasonic Tested', 'Bright Ground & Polished (h9 tolerance)', 'Cold Drawn', 'KG', '75051200', 18, 3100, 'Nickel-copper solid solution strengthened alloy with exceptional resistance to hydrofluoric acid and seawater.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-05', 'PLT-HC276-THK10MM', 'Hastelloy C276 Hot Rolled Plate 10mm Thk', 'cat-05', 'Plates, Sheets & Coils', 'Plates', 'Hastelloy', 'Hastelloy C276 / UNS N10276', '1500 x 3000 mm', null, null, '10.0mm', '3000mm', '1500mm', null, null, null, 'ASTM B575 / ASME SB575', 'Solution Heat Treated at 1121°C & Water Quenched', 'No. 1 Hot Rolled, Annealed & Pickled', 'Hot Rolled', 'KG', '75062000', 18, 4200, 'Versatile nickel-molybdenum-chromium-tungsten alloy plate with extraordinary resistance to wet chlorine gas and ferric chloride.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-06', 'FTG-SS304L-ELB90-2IN', 'SS 304L 90 Deg Long Radius Elbow 2" SCH 40', 'cat-02', 'Butt Weld Pipe Fittings', 'Elbows', 'Stainless Steel', 'ASTM A403 WP304L', '2" NB', '60.3mm', null, '3.91mm', null, null, 'SCH 40S', null, null, 'ASME B16.9', 'Seamless Hot Mandrel Formed & Annealed', 'Shot Blasted & Acid Passivated', 'Seamless', 'PCS', '73072300', 18, 380, 'Butt weld 90 degree LR elbow according to ASME B16.9 standard.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-07', 'PIPE-DUP2205-SCH40-3IN', 'Duplex 2205 Seamless Pipe 3" SCH 40', 'cat-01', 'Seamless & Welded Pipes', 'Seamless Pipes', 'Duplex Steel', 'UNS S32205 / UNS S31803', '3" NB', '88.9mm', '77.92mm', '5.49mm', 'Double Random 11.8 Mtrs', null, 'SCH 40S', null, null, 'ASTM A790 / ASME SA790', 'Solution Annealed at 1050°C, PREN >= 35', 'Pickled & Passivated', 'Seamless', 'MTR', '73044900', 18, 3250, 'Ferritic-austenitic 22% chromium duplex stainless steel pipe for offshore oil & gas flowlines.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-08', 'FLG-INC625-BLD-300-4IN', 'Inconel 625 Blind Flange 4" Class 300 RF', 'cat-03', 'Industrial Flanges', 'Blind Flanges', 'Inconel', 'ASTM B564 UNS N06625', '4" NB', null, null, '31.8mm', null, null, null, 'Class 300', '300 LBS', 'ASME B16.5', 'Closed Die Forged & Solution Treated', 'Spiral Serrated Face (125-250 Ra)', 'Forged', 'PCS', '75072000', 18, 9800, 'Heavy duty blind flange in Inconel 625 for high pressure sour gas manifolds.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-09', 'FTG-INC600-TEE-3IN', 'Inconel 600 Equal Tee 3" SCH 40', 'cat-02', 'Butt Weld Pipe Fittings', 'Tees', 'Inconel', 'ASTM B366 WP600', '3" NB', '88.9mm', null, '5.49mm', null, null, 'SCH 40', null, null, 'ASME B16.9', 'Hydroformed, Solution Annealed', 'Pickled', 'Seamless', 'PCS', '75072000', 18, 7600, 'Inconel 600 equal tee for high temperature heat treating furnace lines.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-10', 'BAR-SS316TI-RD-65MM', 'SS 316Ti Bright Round Bar 65mm Dia', 'cat-04', 'Round Bars & Rods', 'Round Bars', 'Stainless Steel', 'EN 1.4571 / AISI 316Ti', '65mm Dia', '65mm', null, null, '6000mm', null, null, null, null, 'ASTM A276 / EN 10088-3', 'Titanium Stabilized against Sensitization', 'Peeled & Centreless Ground', 'Forged & Turned', 'KG', '72222019', 18, 410, 'Titanium stabilized austenitic stainless steel bar for chemical equipment up to 550°C.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-11', 'PLT-SS310S-THK6MM', 'SS 310S Heat Resistant Plate 6mm Thk', 'cat-05', 'Plates, Sheets & Coils', 'Plates', 'Stainless Steel', 'ASTM A240 TP310S', '1250 x 2500 mm', null, null, '6.0mm', '2500mm', '1250mm', null, null, null, 'ASTM A240 / ASME SA240', 'High Temperature Oxidation Resistant up to 1150°C', '2B Mill Finish', 'Hot Rolled', 'KG', '72192490', 18, 520, '25Cr-20Ni high temperature oxidation resistant stainless steel plate for kiln liners and furnace parts.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-12', 'PIPE-INC825-SCH80-1.5IN', 'Incoloy 825 Seamless Pipe 1.5" SCH 80', 'cat-01', 'Seamless & Welded Pipes', 'Seamless Pipes', 'Incoloy', 'Incoloy 825 / UNS N08825', '1.5" NB', '48.3mm', '38.1mm', '5.08mm', '6 Mtrs Fixed', null, 'SCH 80', null, null, 'ASTM B423 / ASME SB423', 'Stabilized Annealed, NACE MR0175 Compliant', 'Bright Annealed', 'Seamless', 'MTR', '75071100', 18, 3950, 'Titanium stabilized nickel-iron-chromium alloy pipe with molybdenum and copper for sulfuric and phosphoric acid service.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-13', 'FST-B8M-STUD-M20X150', 'SS 316 Heavy Hex Stud Bolt M20 x 150mm with 2 Nuts', 'cat-06', 'Fasteners & Hardware', 'Stud Bolts', 'Stainless Steel', 'ASTM A193 Gr. B8M / A194 Gr. 8M', 'M20 x 150mm', '20mm', null, null, '150mm', null, null, null, null, 'ASME B18.31.2 / ASME B18.2.2', 'Class 1 Carbide Solution Treated', 'Teflon / PTFE Xylan Coated Blue', 'Cold Forged', 'SET', '73181500', 18, 220, 'Full thread high tensile B8M stud bolt supplied with 2 heavy hex 8M nuts.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-14', 'BAR-SDUP2507-RD-80MM', 'Super Duplex 2507 Forged Round Bar 80mm Dia', 'cat-04', 'Round Bars & Rods', 'Round Bars', 'Super Duplex Steel', 'UNS S32750 / EN 1.4410', '80mm Dia', '80mm', null, null, '3 to 5 Meters', null, null, null, null, 'ASTM A479 / NORSOK M-630 MDS D57', 'Water Quenched from 1100°C, PREN >= 42', 'Rough Turned (+2mm allowance)', 'Forged', 'KG', '72221119', 18, 620, '25% Cr Super Duplex round bar with extraordinary resistance to chloride stress corrosion cracking in subsea valves.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-15', 'FLG-SS304-SO-150-6IN', 'SS 304 Slip-on Flange 6" Class 150 RF', 'cat-03', 'Industrial Flanges', 'Slip On Flanges', 'Stainless Steel', 'ASTM A182 F304', '6" NB', '168.3mm', '170.7mm', '25.4mm', null, null, null, 'Class 150', '150 LBS', 'ASME B16.5', 'Die Forged & Annealed', 'Raised Face Smooth (125-250 Ra)', 'Forged', 'PCS', '73072100', 18, 2150, 'Slip-on flange in 304 grade designed for easy slip fit over 6" OD pipe before welding.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-16', 'FTG-HC276-REDCON-3X2', 'Hastelloy C276 Concentric Reducer 3" x 2" SCH 40', 'cat-02', 'Butt Weld Pipe Fittings', 'Reducers', 'Hastelloy', 'ASTM B366 WP-W C276', '3" x 2" NB', '88.9 x 60.3mm', null, '5.49 x 3.91mm', null, null, 'SCH 40', null, null, 'ASME B16.9', '100% Radiography on Welds, Solution Annealed', 'Pickled', 'Welded', 'PCS', '75072000', 18, 6400, 'Seamless/welded concentric reducer in C276 grade for aggressive petrochemical line transitions.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-17', 'PIPE-SS304-ERW-1IN', 'Stainless Steel 304 Welded / ERW Tube 1" OD x 1.5mm', 'cat-01', 'Seamless & Welded Pipes', 'Welded Tubes', 'Stainless Steel', 'ASTM A249 / A269 TP304', '1" OD (25.4mm)', '25.4mm', '22.4mm', '1.5mm', '6000mm', null, null, null, null, 'ASTM A249', 'TIG Welded with Inner Bead Rolled, Hydrotested 100 Bar', 'Bright Annealed (Mirror 400 Grit finish)', 'ERW / Welded', 'MTR', '73064000', 18, 290, 'Bright annealed decorative and sanitary grade stainless steel welded tubing.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-18', 'PLT-NIC200-THK4MM', 'Pure Nickel 200 Plate 4.0mm Thk', 'cat-05', 'Plates, Sheets & Coils', 'Plates', 'Nickel', 'Nickel 200 / UNS N02200', '1000 x 2000 mm', null, null, '4.0mm', '2000mm', '1000mm', null, null, null, 'ASTM B162', 'Commercially 99.6% Pure Wrought Nickel', 'Cold Rolled, Annealed & Descaled', 'Cold Rolled', 'KG', '75061000', 18, 2950, 'Commercially pure nickel plate with remarkable resistance to caustic alkalies at all concentrations and temperatures.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-19', 'FTG-SS316-CAP-4IN', 'SS 316 End Cap 4" SCH 40', 'cat-02', 'Butt Weld Pipe Fittings', 'Caps', 'Stainless Steel', 'ASTM A403 WP316', '4" NB', '114.3mm', null, '6.02mm', null, null, 'SCH 40', null, null, 'ASME B16.9', 'Deep Drawn Ellipsoidal End Cap', 'Pickled & Cleaned', 'Seamless', 'PCS', '73072300', 18, 590, 'Ellipsoidal pipe end cap for pressure containment on 4" SCH 40 pipe termination.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
        ['prod-20', 'BAR-INC718-RD-40MM', 'Inconel 718 Precipitation Hardened Bar 40mm Dia', 'cat-04', 'Round Bars & Rods', 'Round Bars', 'Inconel', 'Inconel 718 / UNS N07718', '40mm Dia', '40mm', null, null, '3 to 4.5 Meters', null, null, null, null, 'AMS 5662 / ASTM B637', 'Precipitation Hardened, Yield Strength >= 1030 MPa', 'Peeled & Polished', 'Forged', 'KG', '75051200', 18, 4850, 'High strength niobium-bearing nickel alloy bar engineered for rocket motors, gas turbines, and nuclear reactors.', null, 1, '2026-01-12T00:00:00Z', '2026-01-12T00:00:00Z'],
      ];
      for (const p of products) {
        this.run(`INSERT INTO products (id, productCode, name, categoryId, categoryName, subcategory, material, grade, size, od, idDim, thickness, length, width, schedule, classRating, pressureRating, standard, specification, finish, form, unit, hsnCode, gstRate, defaultSellingPrice, description, imageUrl, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p);
      }
    }

    // 5. Customers (Preserved as clean/empty by default for authentic client records)
    // No automatic demo customer seeding to ensure clean customer CRM state

    // 6. Bank Accounts
    const bankCount = this.queryOne('SELECT count(*) as c FROM bank_accounts')?.c || 0;
    if (bankCount === 0) {
      console.log('[DatabaseManager] Seeding default bank account...');
      this.run(
        `INSERT INTO bank_accounts (id, bankName, accountName, accountNumber, ifscCode, branchName, upiId, swiftCode, isDefault)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'bank-01',
          'HDFC Bank Limited',
          'JUBILANT METAL AND ALLOYS',
          '50200084591234',
          'HDFC0001245',
          'Taloja Industrial MIDC Branch, Navi Mumbai',
          'jubilantmetal@hdfcbank',
          'HDFCINBBTAL',
          1,
        ]
      );
    }

    // 7. Terms Templates
    const termsCount = this.queryOne('SELECT count(*) as c FROM terms_templates')?.c || 0;
    if (termsCount === 0) {
      console.log('[DatabaseManager] Seeding default terms template...');
      const defaultTerms = [
        'PRICE BASIS: Ex-Works our Taloja stockyard / warehouse. Freight, transit insurance, and port handling charges extra at actuals unless explicitly stated otherwise.',
        'TAXATION: GST applicable extra as per prevailing government statutory rates at the time of invoicing (Presently 18% on industrial pipes, fittings, flanges, and raw metal stocks).',
        'PAYMENT TERMS: 30% advance with formal Purchase Order confirmation, balance 70% against proforma invoice prior to dispatch / against LR copy through authorized bank.',
        'DELIVERY SCHEDULE: Ready stock items dispatched within 2 to 3 working days from receipt of technically and commercially clear Purchase Order. Custom manufactured fittings / mill orders: 3 to 4 weeks.',
        'MATERIAL TEST CERTIFICATES: Manufacturer EN 10204 3.1 Mill Test Certificate (MTC) with complete chemical analysis, mechanical properties, and PMI test report supplied free of cost along with delivery.',
        'THIRD PARTY INSPECTION (TPI): Inspection by client or authorized TPI agencies (TUV, DNV, Lloyd\'s Register, Bureau Veritas, SGS) welcomed prior to dispatch at client cost.',
        'VALIDITY: This commercial quotation is valid for 15 days from quotation date. Prices subject to raw metal LME surcharge fluctuation thereafter.',
      ];
      this.run(
        'INSERT INTO terms_templates (id, title, terms, isDefault) VALUES (?, ?, ?, ?)',
        ['terms-01', 'Standard Industrial Supply Terms (Jubilant Metal & Alloys)', JSON.stringify(defaultTerms), 1]
      );
    }

    // 8. Settings (Guaranteed default settings record)
    const settingsRow = this.queryOne("SELECT id FROM settings WHERE id = 'default'");
    if (!settingsRow) {
      console.log('[DatabaseManager] Seeding default quotation numbering and company settings...');
      this.run(
        `INSERT INTO settings (id, prefix, currentYear, sequenceNumber, formatTemplate, defaultValidityDays, defaultCurrency, defaultCurrencySymbol, defaultPaymentTerms, defaultDeliveryTerms, signatureUrl, stampUrl, signatureEnabled, stampEnabled, signatureSize, stampSize, signatoryName, signatoryDesignation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          'JMA',
          2026,
          1011,
          '{PREFIX}-{YEAR}-{NUMBER}',
          15,
          'INR',
          '₹',
          '30% Advance, balance against Proforma / LR prior to dispatch',
          'Ex-Works, Taloja MIDC Stockyard, Navi Mumbai',
          '/signature.png',
          '/stamp.png',
          1,
          1,
          'md',
          'md',
          'Mohan Jha',
          'Commercial & Technical Operations',
        ]
      );
    }

    console.log('[DatabaseManager] Initial dataset verified and ready.');
  }

  // ============================================================================
  // Company Profile CRUD
  // ============================================================================
  public getCompany(): any {
    return this.queryOne('SELECT * FROM company_profile LIMIT 1');
  }

  public updateCompany(data: any): any {
    const current = this.getCompany();
    const updated = { ...current, ...data };
    this.run(
      `UPDATE company_profile SET
        name = ?, tagline = ?, logo = ?, gstin = ?, pan = ?, cin = ?,
        addressLine1 = ?, addressLine2 = ?, city = ?, state = ?, stateCode = ?,
        country = ?, pinCode = ?, phone = ?, email = ?, website = ?
       WHERE id = ?`,
      [
        updated.name, updated.tagline, updated.logo, updated.gstin, updated.pan, updated.cin,
        updated.addressLine1, updated.addressLine2, updated.city, updated.state, updated.stateCode,
        updated.country, updated.pinCode, updated.phone, updated.email, updated.website,
        updated.id,
      ]
    );
    return updated;
  }

  // ============================================================================
  // Users & Auth
  // ============================================================================
  public getUsers(): any[] {
    const list = this.queryAll('SELECT * FROM users ORDER BY createdAt ASC');
    return list.map(u => ({ ...u, isActive: Boolean(u.isActive) }));
  }

  public getCurrentUser(): any {
    const users = this.getUsers();
    return users.length > 0 ? users[0] : null;
  }

  public updateUser(id: string, updates: any): any {
    const user = this.queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;
    const updated = { ...user, ...updates };
    this.run(
      `UPDATE users SET name = ?, email = ?, role = ?, phone = ?, avatar = ?, isActive = ? WHERE id = ?`,
      [updated.name, updated.email, updated.role, updated.phone, updated.avatar, updated.isActive ? 1 : 0, id]
    );
    return updated;
  }

  public createUser(user: any): any {
    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();
    this.run(
      `INSERT INTO users (id, name, email, role, phone, avatar, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.name, user.email, user.role, user.phone, user.avatar, user.isActive ? 1 : 0, now]
    );
    return { ...user, id, createdAt: now };
  }

  // ============================================================================
  // Categories CRUD
  // ============================================================================
  public getCategories(): any[] {
    const categories = this.queryAll('SELECT * FROM product_categories ORDER BY name ASC');
    const products = this.getProducts();
    return categories.map(cat => ({
      ...cat,
      isActive: Boolean(cat.isActive),
      itemCount: products.filter((p: any) => p.categoryId === cat.id).length,
    }));
  }

  public saveCategory(cat: any): any {
    if (cat.id) {
      const existing = this.queryOne('SELECT * FROM product_categories WHERE id = ?', [cat.id]);
      if (existing) {
        this.run(
          `UPDATE product_categories SET name = ?, slug = ?, description = ?, icon = ?, isActive = ? WHERE id = ?`,
          [cat.name, cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), cat.description, cat.icon, cat.isActive !== false ? 1 : 0, cat.id]
        );
        return { ...existing, ...cat };
      }
    }
    const newId = `cat-${Date.now()}`;
    const slug = (cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.run(
      `INSERT INTO product_categories (id, name, slug, description, icon, isActive) VALUES (?, ?, ?, ?, ?, ?)`,
      [newId, cat.name, slug, cat.description, cat.icon, cat.isActive !== false ? 1 : 0]
    );
    return { ...cat, id: newId, slug };
  }

  public deleteCategory(id: string): boolean {
    this.run('DELETE FROM product_categories WHERE id = ?', [id]);
    return true;
  }

  // ============================================================================
  // Products CRUD
  // ============================================================================
  public getProducts(): any[] {
    const list = this.queryAll('SELECT * FROM products ORDER BY createdAt DESC');
    return list.map(p => ({
      ...p,
      isActive: Boolean(p.isActive),
    }));
  }

  public getProductById(id: string): any | undefined {
    const p = this.queryOne('SELECT * FROM products WHERE id = ?', [id]);
    return p ? { ...p, isActive: Boolean(p.isActive) } : undefined;
  }

  public saveProduct(prod: any): any {
    const now = new Date().toISOString();
    if (prod.id) {
      const existing = this.getProductById(prod.id);
      if (existing) {
        this.run(
          `UPDATE products SET
            productCode = ?, name = ?, categoryId = ?, categoryName = ?, subcategory = ?,
            material = ?, grade = ?, size = ?, od = ?, idDim = ?, thickness = ?,
            length = ?, width = ?, schedule = ?, classRating = ?, pressureRating = ?,
            standard = ?, specification = ?, finish = ?, form = ?, unit = ?,
            hsnCode = ?, gstRate = ?, defaultSellingPrice = ?, description = ?,
            imageUrl = ?, isActive = ?, updatedAt = ?
           WHERE id = ?`,
          [
            prod.productCode, prod.name, prod.categoryId, prod.categoryName, prod.subcategory,
            prod.material, prod.grade, prod.size, prod.od, prod.idDim, prod.thickness,
            prod.length, prod.width, prod.schedule, prod.classRating, prod.pressureRating,
            prod.standard, prod.specification, prod.finish, prod.form, prod.unit,
            prod.hsnCode, prod.gstRate, prod.defaultSellingPrice, prod.description,
            prod.imageUrl, prod.isActive !== false ? 1 : 0, now, prod.id,
          ]
        );
        return { ...existing, ...prod, updatedAt: now };
      }
    }
    const newId = `prod-${Date.now()}`;
    this.run(
      `INSERT INTO products (
        id, productCode, name, categoryId, categoryName, subcategory,
        material, grade, size, od, idDim, thickness, length, width,
        schedule, classRating, pressureRating, standard, specification,
        finish, form, unit, hsnCode, gstRate, defaultSellingPrice,
        description, imageUrl, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, prod.productCode, prod.name, prod.categoryId, prod.categoryName, prod.subcategory,
        prod.material, prod.grade, prod.size, prod.od, prod.idDim, prod.thickness, prod.length, prod.width,
        prod.schedule, prod.classRating, prod.pressureRating, prod.standard, prod.specification,
        prod.finish, prod.form, prod.unit, prod.hsnCode, prod.gstRate, prod.defaultSellingPrice,
        prod.description, prod.imageUrl, prod.isActive !== false ? 1 : 0, now, now,
      ]
    );
    return { ...prod, id: newId, createdAt: now, updatedAt: now };
  }

  public duplicateProduct(id: string): any | null {
    const prod = this.getProductById(id);
    if (!prod) return null;
    return this.saveProduct({
      ...prod,
      id: undefined,
      productCode: `${prod.productCode}-CPY`,
      name: `${prod.name} (Copy)`,
    });
  }

  public deleteProduct(id: string): boolean {
    this.run('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }

  // ============================================================================
  // Customers CRUD
  // ============================================================================
  public getCustomers(): any[] {
    return this.queryAll('SELECT * FROM customers ORDER BY createdAt DESC');
  }

  public getCustomerById(id: string): any | undefined {
    return this.queryOne('SELECT * FROM customers WHERE id = ?', [id]);
  }

  public saveCustomer(cust: any): any {
    if (!cust) return null;
    const now = new Date().toISOString();
    try {
      const companyName = (cust.companyName || '').trim() || 'Valued Customer';
      let code = (cust.customerCode || '').trim();
      if (!code) {
        code = `CUST-JMA-${Date.now().toString().slice(-4)}`;
      }

      if (cust.id) {
        const existing = this.getCustomerById(cust.id);
        if (existing) {
          // Check for code collision with another customer
          const conflict = this.queryOne('SELECT id FROM customers WHERE customerCode = ? AND id != ?', [code, cust.id]);
          if (conflict) {
            code = `${code}-${Date.now().toString().slice(-4)}`;
          }

          this.run(
            `UPDATE customers SET
              customerCode = ?, companyName = ?, contactPerson = ?, designation = ?,
              email = ?, phone = ?, whatsapp = ?, gstin = ?, pan = ?,
              billingAddress = ?, shippingAddress = ?, city = ?, state = ?,
              stateCode = ?, country = ?, pinCode = ?, paymentTerms = ?,
              creditLimit = ?, notes = ?, updatedAt = ?
             WHERE id = ?`,
            [
              code,
              companyName,
              cust.contactPerson !== undefined ? (cust.contactPerson || null) : existing.contactPerson,
              cust.designation !== undefined ? (cust.designation || null) : existing.designation,
              cust.email !== undefined ? (cust.email || null) : existing.email,
              cust.phone !== undefined ? (cust.phone || null) : existing.phone,
              cust.whatsapp !== undefined ? (cust.whatsapp || null) : existing.whatsapp,
              cust.gstin !== undefined ? (cust.gstin || null) : existing.gstin,
              cust.pan !== undefined ? (cust.pan || null) : existing.pan,
              cust.billingAddress !== undefined ? (cust.billingAddress || null) : existing.billingAddress,
              cust.shippingAddress !== undefined ? (cust.shippingAddress || cust.billingAddress || null) : existing.shippingAddress,
              cust.city || existing.city || 'Mumbai',
              cust.state || existing.state || 'Maharashtra',
              cust.stateCode || existing.stateCode || '27',
              cust.country || existing.country || 'India',
              cust.pinCode || existing.pinCode || '400001',
              cust.paymentTerms || existing.paymentTerms || '30 Days Net',
              cust.creditLimit !== undefined ? (Number(cust.creditLimit) || 0) : existing.creditLimit,
              cust.notes !== undefined ? (cust.notes || null) : existing.notes,
              now,
              cust.id,
            ]
          );
          return { ...existing, ...cust, customerCode: code, companyName, updatedAt: now };
        }
      }

      const newId = cust.id || `cust-${Date.now()}`;
      const conflict = this.queryOne('SELECT id FROM customers WHERE customerCode = ?', [code]);
      if (conflict) {
        code = `${code}-${Date.now().toString().slice(-4)}`;
      }

      this.run(
        `INSERT INTO customers (
          id, customerCode, companyName, contactPerson, designation,
          email, phone, whatsapp, gstin, pan,
          billingAddress, shippingAddress, city, state,
          stateCode, country, pinCode, paymentTerms,
          creditLimit, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, code, companyName, cust.contactPerson || null, cust.designation || null,
          cust.email || null, cust.phone || null, cust.whatsapp || null, cust.gstin || null, cust.pan || null,
          cust.billingAddress || null, cust.shippingAddress || cust.billingAddress || null,
          cust.city || 'Mumbai', cust.state || 'Maharashtra',
          cust.stateCode || '27', cust.country || 'India', cust.pinCode || '400001',
          cust.paymentTerms || '30 Days Net',
          Number(cust.creditLimit) || 0, cust.notes || null, now, now,
        ]
      );
      return { ...cust, id: newId, customerCode: code, companyName, createdAt: now, updatedAt: now };
    } catch (err: any) {
      console.error('[DatabaseManager] Error in saveCustomer:', err);
      // Return safe fallback so renderer never gets undefined: undefined
      const safeId = cust.id || `cust-${Date.now()}`;
      return {
        ...cust,
        id: safeId,
        customerCode: cust.customerCode || `CUST-JMA-${Date.now().toString().slice(-4)}`,
        companyName: cust.companyName || 'Valued Customer',
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  public deleteCustomer(id: string): boolean {
    this.run('DELETE FROM customers WHERE id = ?', [id]);
    return true;
  }

  // ============================================================================
  // Bank Accounts & Terms
  // ============================================================================
  public getBankAccounts(): any[] {
    const list = this.queryAll('SELECT * FROM bank_accounts ORDER BY isDefault DESC, bankName ASC');
    return list.map(b => ({ ...b, isDefault: Boolean(b.isDefault) }));
  }

  public saveBankAccount(bank: any): any {
    if (bank.isDefault) {
      this.run('UPDATE bank_accounts SET isDefault = 0');
    }
    if (bank.id) {
      const existing = this.queryOne('SELECT * FROM bank_accounts WHERE id = ?', [bank.id]);
      if (existing) {
        this.run(
          `UPDATE bank_accounts SET bankName = ?, accountName = ?, accountNumber = ?, ifscCode = ?, branchName = ?, upiId = ?, swiftCode = ?, isDefault = ? WHERE id = ?`,
          [bank.bankName, bank.accountName, bank.accountNumber, bank.ifscCode, bank.branchName, bank.upiId, bank.swiftCode, bank.isDefault ? 1 : 0, bank.id]
        );
        return { ...existing, ...bank };
      }
    }
    const newId = `bank-${Date.now()}`;
    this.run(
      `INSERT INTO bank_accounts (id, bankName, accountName, accountNumber, ifscCode, branchName, upiId, swiftCode, isDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, bank.bankName, bank.accountName, bank.accountNumber, bank.ifscCode, bank.branchName, bank.upiId, bank.swiftCode, bank.isDefault ? 1 : 0]
    );
    return { ...bank, id: newId };
  }

  public deleteBankAccount(id: string): boolean {
    this.run('DELETE FROM bank_accounts WHERE id = ?', [id]);
    return true;
  }

  public getTermsTemplates(): any[] {
    const list = this.queryAll('SELECT * FROM terms_templates ORDER BY isDefault DESC, title ASC');
    return list.map(t => ({
      ...t,
      isDefault: Boolean(t.isDefault),
      terms: typeof t.terms === 'string' ? JSON.parse(t.terms) : t.terms,
    }));
  }

  public saveTermsTemplate(tmpl: any): any {
    if (tmpl.isDefault) {
      this.run('UPDATE terms_templates SET isDefault = 0');
    }
    const termsJson = JSON.stringify(tmpl.terms || []);
    if (tmpl.id) {
      const existing = this.queryOne('SELECT * FROM terms_templates WHERE id = ?', [tmpl.id]);
      if (existing) {
        this.run(
          'UPDATE terms_templates SET title = ?, terms = ?, isDefault = ? WHERE id = ?',
          [tmpl.title, termsJson, tmpl.isDefault ? 1 : 0, tmpl.id]
        );
        return { ...existing, ...tmpl };
      }
    }
    const newId = `terms-${Date.now()}`;
    this.run(
      'INSERT INTO terms_templates (id, title, terms, isDefault) VALUES (?, ?, ?, ?)',
      [newId, tmpl.title, termsJson, tmpl.isDefault ? 1 : 0]
    );
    return { ...tmpl, id: newId };
  }

  // ============================================================================
  // Settings & Quotation Numbering
  // ============================================================================
  public getSettings(): any {
    try {
      const s = this.queryOne("SELECT * FROM settings WHERE id = 'default'");
      if (!s) {
        // Auto-seed default settings so database is self-healing
        this.run(
          `INSERT OR REPLACE INTO settings (
            id, prefix, currentYear, sequenceNumber, formatTemplate, defaultValidityDays,
            defaultCurrency, defaultCurrencySymbol, defaultPaymentTerms, defaultDeliveryTerms,
            signatureUrl, stampUrl, signatureEnabled, stampEnabled, signatureSize, stampSize,
            signatoryName, signatoryDesignation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            DatabaseManager.DEFAULT_SETTINGS.id,
            DatabaseManager.DEFAULT_SETTINGS.prefix,
            DatabaseManager.DEFAULT_SETTINGS.currentYear,
            DatabaseManager.DEFAULT_SETTINGS.sequenceNumber,
            DatabaseManager.DEFAULT_SETTINGS.formatTemplate,
            DatabaseManager.DEFAULT_SETTINGS.defaultValidityDays,
            DatabaseManager.DEFAULT_SETTINGS.defaultCurrency,
            DatabaseManager.DEFAULT_SETTINGS.defaultCurrencySymbol,
            DatabaseManager.DEFAULT_SETTINGS.defaultPaymentTerms,
            DatabaseManager.DEFAULT_SETTINGS.defaultDeliveryTerms,
            DatabaseManager.DEFAULT_SETTINGS.signatureUrl,
            DatabaseManager.DEFAULT_SETTINGS.stampUrl,
            1,
            1,
            DatabaseManager.DEFAULT_SETTINGS.signatureSize,
            DatabaseManager.DEFAULT_SETTINGS.stampSize,
            DatabaseManager.DEFAULT_SETTINGS.signatoryName,
            DatabaseManager.DEFAULT_SETTINGS.signatoryDesignation,
          ]
        );
        return { ...DatabaseManager.DEFAULT_SETTINGS };
      }

      return {
        ...DatabaseManager.DEFAULT_SETTINGS,
        ...s,
        prefix: s.prefix || DatabaseManager.DEFAULT_SETTINGS.prefix,
        currentYear: s.currentYear || DatabaseManager.DEFAULT_SETTINGS.currentYear,
        sequenceNumber: typeof s.sequenceNumber === 'number' ? s.sequenceNumber : DatabaseManager.DEFAULT_SETTINGS.sequenceNumber,
        formatTemplate: s.formatTemplate || DatabaseManager.DEFAULT_SETTINGS.formatTemplate,
        signatureEnabled: s.signatureEnabled === 1 || s.signatureEnabled === true,
        stampEnabled: s.stampEnabled === 1 || s.stampEnabled === true,
        piPrefix: s.piPrefix || DatabaseManager.DEFAULT_SETTINGS.piPrefix,
        piSequenceNumber: typeof s.piSequenceNumber === 'number' ? s.piSequenceNumber : DatabaseManager.DEFAULT_SETTINGS.piSequenceNumber,
      };
    } catch (err) {
      console.error('[DatabaseManager] Error in getSettings, returning safe defaults:', err);
      return { ...DatabaseManager.DEFAULT_SETTINGS };
    }
  }

  public updateSettings(settings: any): any {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      this.run(
        `INSERT INTO settings (
          id, prefix, currentYear, sequenceNumber, formatTemplate,
          defaultValidityDays, defaultCurrency, defaultCurrencySymbol,
          defaultPaymentTerms, defaultDeliveryTerms, signatureUrl,
          stampUrl, signatureEnabled, stampEnabled, signatureSize,
          stampSize, signatoryName, signatoryDesignation, piPrefix, piSequenceNumber
        ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          prefix = excluded.prefix,
          currentYear = excluded.currentYear,
          sequenceNumber = excluded.sequenceNumber,
          formatTemplate = excluded.formatTemplate,
          defaultValidityDays = excluded.defaultValidityDays,
          defaultCurrency = excluded.defaultCurrency,
          defaultCurrencySymbol = excluded.defaultCurrencySymbol,
          defaultPaymentTerms = excluded.defaultPaymentTerms,
          defaultDeliveryTerms = excluded.defaultDeliveryTerms,
          signatureUrl = excluded.signatureUrl,
          stampUrl = excluded.stampUrl,
          signatureEnabled = excluded.signatureEnabled,
          stampEnabled = excluded.stampEnabled,
          signatureSize = excluded.signatureSize,
          stampSize = excluded.stampSize,
          signatoryName = excluded.signatoryName,
          signatoryDesignation = excluded.signatoryDesignation,
          piPrefix = excluded.piPrefix,
          piSequenceNumber = excluded.piSequenceNumber`,
        [
          updated.prefix || 'JMA',
          updated.currentYear || new Date().getFullYear(),
          updated.sequenceNumber || 1011,
          updated.formatTemplate || '{PREFIX}-{YEAR}-{NUMBER}',
          updated.defaultValidityDays || 15,
          updated.defaultCurrency || 'INR',
          updated.defaultCurrencySymbol || '₹',
          updated.defaultPaymentTerms || '',
          updated.defaultDeliveryTerms || '',
          updated.signatureUrl || '/signature.png',
          updated.stampUrl || '/stamp.png',
          updated.signatureEnabled ? 1 : 0,
          updated.stampEnabled ? 1 : 0,
          updated.signatureSize || 'md',
          updated.stampSize || 'md',
          updated.signatoryName || 'Mohan Jha',
          updated.signatoryDesignation || 'Commercial & Technical Operations',
          updated.piPrefix || 'JMA-PI',
          updated.piSequenceNumber || 501,
        ]
      );
      return updated;
    } catch (err) {
      console.error('[DatabaseManager] Failed to update settings:', err);
      return this.getSettings();
    }
  }

  public getNextQuotationNumber(): string {
    try {
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
    } catch (err) {
      console.error('[DatabaseManager] Failed to get next quotation number:', err);
      const year = new Date().getFullYear();
      return `JMA-${year}-1011`;
    }
  }

  public incrementQuotationSequence(): void {
    try {
      const settings = this.getSettings();
      const nextSeq = (typeof settings.sequenceNumber === 'number' ? settings.sequenceNumber : 1011) + 1;
      this.run("UPDATE settings SET sequenceNumber = ? WHERE id = 'default'", [nextSeq]);
    } catch (err) {
      console.error('[DatabaseManager] Failed to increment quotation sequence:', err);
    }
  }

  public getNextProformaNumber(): string {
    try {
      const settings = this.getSettings();
      const year = settings.currentYear || new Date().getFullYear();
      const num = typeof settings.piSequenceNumber === 'number' ? settings.piSequenceNumber : 501;
      const prefix = settings.piPrefix || 'JMA-PI';
      return `${prefix}-${year}-${num.toString().padStart(4, '0')}`;
    } catch (err) {
      console.error('[DatabaseManager] Failed to get next proforma number:', err);
      const year = new Date().getFullYear();
      return `JMA-PI-${year}-0501`;
    }
  }

  public incrementProformaSequence(): void {
    try {
      const settings = this.getSettings();
      const nextSeq = (typeof settings.piSequenceNumber === 'number' ? settings.piSequenceNumber : 501) + 1;
      this.run("UPDATE settings SET piSequenceNumber = ? WHERE id = 'default'", [nextSeq]);
    } catch (err) {
      console.error('[DatabaseManager] Failed to increment proforma sequence:', err);
    }
  }

  // ============================================================================
  // Quotations CRUD with Relational Items & Atomic Transactions
  // ============================================================================
  public getQuotations(): any[] {
    const quotes = this.queryAll('SELECT * FROM quotations ORDER BY createdAt DESC');
    if (quotes.length === 0) return [];

    const items = this.queryAll('SELECT * FROM quotation_items ORDER BY srNo ASC');
    const itemsByQuoteId: Record<string, any[]> = {};
    for (const it of items) {
      if (!itemsByQuoteId[it.quotationId]) {
        itemsByQuoteId[it.quotationId] = [];
      }
      itemsByQuoteId[it.quotationId].push(it);
    }

    return quotes.map(q => ({
      ...q,
      isInterstate: Boolean(q.isInterstate),
      signatureEnabled: Boolean(q.signatureEnabled),
      stampEnabled: Boolean(q.stampEnabled),
      termsAndConditions: q.termsAndConditions ? JSON.parse(q.termsAndConditions) : [],
      bankDetails: q.bankDetails ? JSON.parse(q.bankDetails) : undefined,
      statusHistory: q.statusHistory ? JSON.parse(q.statusHistory) : [],
      items: itemsByQuoteId[q.id] || [],
    }));
  }

  public getQuotationById(id: string): any | undefined {
    const q = this.queryOne('SELECT * FROM quotations WHERE id = ? OR quotationNumber = ?', [id, id]);
    if (!q) return undefined;

    const items = this.queryAll('SELECT * FROM quotation_items WHERE quotationId = ? ORDER BY srNo ASC', [q.id]);
    return {
      ...q,
      isInterstate: Boolean(q.isInterstate),
      signatureEnabled: Boolean(q.signatureEnabled),
      stampEnabled: Boolean(q.stampEnabled),
      termsAndConditions: q.termsAndConditions ? JSON.parse(q.termsAndConditions) : [],
      bankDetails: q.bankDetails ? JSON.parse(q.bankDetails) : undefined,
      statusHistory: q.statusHistory ? JSON.parse(q.statusHistory) : [],
      items,
    };
  }

  public saveQuotation(quotation: any): any {
    if (!quotation) return null;
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser() || { id: 'user-01', name: 'Rajesh Sharma' };
    const isNew = !quotation.id;
    const quoteId = quotation.id || `quot-${Date.now()}`;

    let qNumber = (quotation.quotationNumber || '').trim();
    if (!qNumber) {
      qNumber = this.getNextQuotationNumber();
    } else if (isNew) {
      const conflict = this.queryOne('SELECT id FROM quotations WHERE quotationNumber = ?', [qNumber]);
      if (conflict) {
        qNumber = this.getNextQuotationNumber();
      }
    }

    const customerId = quotation.customerId || 'cust-direct';
    const customerName = (quotation.customerName || '').trim() || 'Direct Industrial Client';
    const qDate = quotation.quotationDate || now.split('T')[0];
    const vDate = quotation.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    let statusHistory = quotation.statusHistory || [];
    if (isNew && statusHistory.length === 0) {
      statusHistory = [
        {
          id: `hist-${Date.now()}`,
          status: quotation.status || 'draft',
          note: 'Quotation created in system',
          updatedByName: currentUser.name,
          createdAt: now,
        },
      ];
    } else if (!isNew) {
      const existing = this.getQuotationById(quoteId);
      if (existing && existing.status !== quotation.status) {
        statusHistory = [
          ...(existing.statusHistory || []),
          {
            id: `hist-${Date.now()}`,
            status: quotation.status,
            previousStatus: existing.status,
            note: `Status updated to ${(quotation.status || 'draft').toUpperCase()}`,
            updatedByName: currentUser.name,
            createdAt: now,
          },
        ];
      }
    }

    const termsJson = JSON.stringify(quotation.termsAndConditions || []);
    const bankDetailsJson = quotation.bankDetails ? JSON.stringify(quotation.bankDetails) : null;
    const historyJson = JSON.stringify(statusHistory);

    // Save quotation and its line items inside an atomic transaction
    this.beginTransaction();
    try {
      if (isNew) {
        this.run(
          `INSERT INTO quotations (
            id, quotationNumber, quotationDate, validUntil, referenceNumber, customerReference,
            salesperson, customerId, customerName, customerContactPerson, customerEmail,
            customerPhone, customerGstin, customerPan, billingAddress, shippingAddress,
            customerCity, customerState, customerStateCode, customerPinCode,
            subtotal, totalDiscount, taxableAmount, isInterstate, cgstTotal, sgstTotal,
            igstTotal, totalTax, freightCharges, packingCharges, insuranceCharges,
            loadingCharges, otherCharges, extraChargesTotal, roundOff, grandTotal,
            amountInWords, paymentTerms, deliveryTerms, termsAndConditions,
            bankAccountId, bankDetails, status, notes, statusHistory,
            signatureUrl, stampUrl, signatureEnabled, stampEnabled,
            signatureSize, stampSize, signatoryName, signatoryDesignation,
            createdBy, createdByName, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quoteId, qNumber, qDate, vDate,
            quotation.referenceNumber || null, quotation.customerReference || null, quotation.salesperson || currentUser.name,
            customerId, customerName, quotation.customerContactPerson || null,
            quotation.customerEmail || null, quotation.customerPhone || null, quotation.customerGstin || null, quotation.customerPan || null,
            quotation.billingAddress || null, quotation.shippingAddress || null, quotation.customerCity || 'Mumbai', quotation.customerState || 'Maharashtra',
            quotation.customerStateCode || '27', quotation.customerPinCode || '400001', Number(quotation.subtotal) || 0,
            Number(quotation.totalDiscount) || 0, Number(quotation.taxableAmount) || 0, quotation.isInterstate ? 1 : 0,
            Number(quotation.cgstTotal) || 0, Number(quotation.sgstTotal) || 0, Number(quotation.igstTotal) || 0, Number(quotation.totalTax) || 0,
            Number(quotation.freightCharges) || 0, Number(quotation.packingCharges) || 0, Number(quotation.insuranceCharges) || 0,
            Number(quotation.loadingCharges) || 0, Number(quotation.otherCharges) || 0, Number(quotation.extraChargesTotal) || 0,
            Number(quotation.roundOff) || 0, Number(quotation.grandTotal) || 0, quotation.amountInWords || '',
            quotation.paymentTerms || '30 Days Net', quotation.deliveryTerms || 'Ready Stock ex-works', termsJson,
            quotation.bankAccountId || null, bankDetailsJson, quotation.status || 'draft',
            quotation.notes || null, historyJson, quotation.signatureUrl || null, quotation.stampUrl || null,
            quotation.signatureEnabled !== false ? 1 : 0, quotation.stampEnabled !== false ? 1 : 0,
            quotation.signatureSize || 'md', quotation.stampSize || 'md',
            quotation.signatoryName || 'Mohan Jha', quotation.signatoryDesignation || 'Commercial & Technical Operations',
            currentUser.id, currentUser.name, now, now,
          ]
        );
        this.incrementQuotationSequence();
      } else {
        this.run(
          `UPDATE quotations SET
            quotationNumber = ?, quotationDate = ?, validUntil = ?, referenceNumber = ?,
            customerReference = ?, salesperson = ?, customerId = ?, customerName = ?,
            customerContactPerson = ?, customerEmail = ?, customerPhone = ?,
            customerGstin = ?, customerPan = ?, billingAddress = ?, shippingAddress = ?,
            customerCity = ?, customerState = ?, customerStateCode = ?, customerPinCode = ?,
            subtotal = ?, totalDiscount = ?, taxableAmount = ?, isInterstate = ?,
            cgstTotal = ?, sgstTotal = ?, igstTotal = ?, totalTax = ?,
            freightCharges = ?, packingCharges = ?, insuranceCharges = ?,
            loadingCharges = ?, otherCharges = ?, extraChargesTotal = ?,
            roundOff = ?, grandTotal = ?, amountInWords = ?, paymentTerms = ?,
            deliveryTerms = ?, termsAndConditions = ?, bankAccountId = ?,
            bankDetails = ?, status = ?, notes = ?, statusHistory = ?,
            signatureUrl = ?, stampUrl = ?, signatureEnabled = ?, stampEnabled = ?,
            signatureSize = ?, stampSize = ?, signatoryName = ?, signatoryDesignation = ?,
            updatedAt = ?
           WHERE id = ?`,
          [
            qNumber, qDate, vDate,
            quotation.referenceNumber || null, quotation.customerReference || null, quotation.salesperson || currentUser.name,
            customerId, customerName, quotation.customerContactPerson || null,
            quotation.customerEmail || null, quotation.customerPhone || null, quotation.customerGstin || null, quotation.customerPan || null,
            quotation.billingAddress || null, quotation.shippingAddress || null, quotation.customerCity || 'Mumbai', quotation.customerState || 'Maharashtra',
            quotation.customerStateCode || '27', quotation.customerPinCode || '400001', Number(quotation.subtotal) || 0,
            Number(quotation.totalDiscount) || 0, Number(quotation.taxableAmount) || 0, quotation.isInterstate ? 1 : 0,
            Number(quotation.cgstTotal) || 0, Number(quotation.sgstTotal) || 0, Number(quotation.igstTotal) || 0, Number(quotation.totalTax) || 0,
            Number(quotation.freightCharges) || 0, Number(quotation.packingCharges) || 0, Number(quotation.insuranceCharges) || 0,
            Number(quotation.loadingCharges) || 0, Number(quotation.otherCharges) || 0, Number(quotation.extraChargesTotal) || 0,
            Number(quotation.roundOff) || 0, Number(quotation.grandTotal) || 0, quotation.amountInWords || '',
            quotation.paymentTerms || '30 Days Net', quotation.deliveryTerms || 'Ready Stock ex-works', termsJson,
            quotation.bankAccountId || null, bankDetailsJson, quotation.status || 'draft',
            quotation.notes || null, historyJson, quotation.signatureUrl || null, quotation.stampUrl || null,
            quotation.signatureEnabled !== false ? 1 : 0, quotation.stampEnabled !== false ? 1 : 0,
            quotation.signatureSize || 'md', quotation.stampSize || 'md',
            quotation.signatoryName || 'Mohan Jha', quotation.signatoryDesignation || 'Commercial & Technical Operations',
            now, quoteId,
          ]
        );
        // Clear previous line items for this quotation
        this.run('DELETE FROM quotation_items WHERE quotationId = ?', [quoteId]);
      }

      // Insert line items
      const items = quotation.items || [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemId = it.id || `qitem-${Date.now()}-${i}`;
        this.run(
          `INSERT INTO quotation_items (
            id, quotationId, srNo, productId, productName, description,
            material, grade, size, schedule, thickness, standard,
            quantity, unit, rate, grossAmount, discountPercent, discountAmount,
            taxableAmount, hsnCode, gstRate, cgstAmount, sgstAmount, igstAmount, totalAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, quoteId, it.srNo || (i + 1), it.productId || null, it.productName || 'Industrial Supply', it.description || null,
            it.material || null, it.grade || null, it.size || null, it.schedule || null, it.thickness || null, it.standard || null,
            Number(it.quantity) || 1, it.unit || 'PCS', Number(it.rate) || 0, Number(it.grossAmount) || 0,
            Number(it.discountPercent) || 0, Number(it.discountAmount) || 0,
            Number(it.taxableAmount) || 0, it.hsnCode || null, Number(it.gstRate) || 0,
            Number(it.cgstAmount) || 0, Number(it.sgstAmount) || 0, Number(it.igstAmount) || 0,
            Number(it.totalAmount) || 0,
          ]
        );
      }

      this.commitTransaction();
    } catch (err: any) {
      this.rollbackTransaction();
      console.error('[DatabaseManager] Transaction failed while saving quotation:', err);
      const fallback = this.getQuotationById(quoteId);
      if (fallback) return fallback;
      return {
        ...quotation,
        id: quoteId,
        quotationNumber: qNumber,
        quotationDate: qDate,
        validUntil: vDate,
        status: quotation.status || 'draft',
        items: quotation.items || [],
        createdAt: now,
        updatedAt: now,
      };
    }

    return this.getQuotationById(quoteId);
  }

  public duplicateQuotation(id: string): any | null {
    const orig = this.getQuotationById(id);
    if (!orig) return null;

    const nextNumber = this.getNextQuotationNumber();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const validUntilDate = new Date(now.setDate(now.getDate() + 15)).toISOString().split('T')[0];
    const currentUser = this.getCurrentUser();

    const duplicated = {
      ...orig,
      id: undefined,
      quotationNumber: nextNumber,
      quotationDate: today,
      validUntil: validUntilDate,
      status: 'draft',
      referenceNumber: orig.referenceNumber ? `${orig.referenceNumber} (Rev)` : undefined,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: 'draft',
          note: `Duplicated from quotation ${orig.quotationNumber}`,
          updatedByName: currentUser.name,
          createdAt: new Date().toISOString(),
        },
      ],
      items: (orig.items || []).map((it: any, idx: number) => ({
        ...it,
        id: undefined,
        srNo: idx + 1,
      })),
    };

    return this.saveQuotation(duplicated);
  }

  public updateQuotationStatus(id: string, status: string, note?: string): any | null {
    const quote = this.getQuotationById(id);
    if (!quote) return null;

    return this.saveQuotation({
      ...quote,
      status,
      notes: note || quote.notes,
    });
  }

  public deleteQuotation(id: string): boolean {
    this.beginTransaction();
    try {
      this.run('DELETE FROM quotation_items WHERE quotationId = ?', [id]);
      this.run('DELETE FROM quotations WHERE id = ?', [id]);
      this.commitTransaction();
      return true;
    } catch (err) {
      this.rollbackTransaction();
      console.error('[DatabaseManager] Failed to delete quotation:', err);
      return false;
    }
  }

  // ============================================================================
  // Proforma Invoices CRUD with Relational Items & Atomic Transactions
  // ============================================================================
  public getProformaInvoices(): any[] {
    const pis = this.queryAll('SELECT * FROM proforma_invoices ORDER BY createdAt DESC');
    if (pis.length === 0) return [];

    const items = this.queryAll('SELECT * FROM proforma_invoice_items ORDER BY srNo ASC');
    const itemsByPiId: Record<string, any[]> = {};
    for (const it of items) {
      if (!itemsByPiId[it.proformaId]) {
        itemsByPiId[it.proformaId] = [];
      }
      itemsByPiId[it.proformaId].push(it);
    }

    return pis.map(p => ({
      ...p,
      proformaNumber: p.piNumber,
      proformaDate: p.piDate,
      sameAsBilling: Boolean(p.sameAsBilling),
      isInterstate: Boolean(p.isInterstate),
      signatureEnabled: Boolean(p.signatureEnabled),
      stampEnabled: Boolean(p.stampEnabled),
      termsAndConditions: p.termsAndConditions ? JSON.parse(p.termsAndConditions) : [],
      bankDetails: p.bankDetails ? JSON.parse(p.bankDetails) : undefined,
      statusHistory: p.statusHistory ? JSON.parse(p.statusHistory) : [],
      items: itemsByPiId[p.id] || [],
    }));
  }

  public getProformaInvoiceById(id: string): any | undefined {
    const p = this.queryOne('SELECT * FROM proforma_invoices WHERE id = ? OR piNumber = ?', [id, id]);
    if (!p) return undefined;

    const items = this.queryAll('SELECT * FROM proforma_invoice_items WHERE proformaId = ? ORDER BY srNo ASC', [p.id]);
    return {
      ...p,
      proformaNumber: p.piNumber,
      proformaDate: p.piDate,
      sameAsBilling: Boolean(p.sameAsBilling),
      isInterstate: Boolean(p.isInterstate),
      signatureEnabled: Boolean(p.signatureEnabled),
      stampEnabled: Boolean(p.stampEnabled),
      termsAndConditions: p.termsAndConditions ? JSON.parse(p.termsAndConditions) : [],
      bankDetails: p.bankDetails ? JSON.parse(p.bankDetails) : undefined,
      statusHistory: p.statusHistory ? JSON.parse(p.statusHistory) : [],
      items,
    };
  }

  public saveProformaInvoice(proforma: any): any {
    if (!proforma) return null;
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser() || { id: 'user-01', name: 'Rajesh Sharma' };
    const isNew = !proforma.id;
    const piId = proforma.id || `pi-${Date.now()}`;

    let pNumber = (proforma.proformaNumber || proforma.piNumber || '').trim();
    if (!pNumber) {
      pNumber = this.getNextProformaNumber();
    } else if (isNew) {
      const conflict = this.queryOne('SELECT id FROM proforma_invoices WHERE piNumber = ?', [pNumber]);
      if (conflict) {
        pNumber = this.getNextProformaNumber();
      }
    }

    const customerId = proforma.customerId || 'cust-direct';
    const customerName = (proforma.customerName || '').trim() || 'Direct Industrial Client';
    const pDate = proforma.proformaDate || proforma.piDate || now.split('T')[0];
    const vDate = proforma.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    let statusHistory = proforma.statusHistory || [];
    if (isNew && statusHistory.length === 0) {
      statusHistory = [
        {
          id: `hist-${Date.now()}`,
          status: proforma.status || 'draft',
          note: 'Proforma Invoice generated in system',
          updatedByName: currentUser.name,
          createdAt: now,
        },
      ];
    } else if (!isNew) {
      const existing = this.getProformaInvoiceById(piId);
      if (existing && existing.status !== proforma.status) {
        statusHistory = [
          ...(existing.statusHistory || []),
          {
            id: `hist-${Date.now()}`,
            status: proforma.status,
            previousStatus: existing.status,
            note: `Status updated to ${(proforma.status || 'draft').toUpperCase()}`,
            updatedByName: currentUser.name,
            createdAt: now,
          },
        ];
      }
    }

    const termsJson = JSON.stringify(proforma.termsAndConditions || []);
    const bankDetailsJson = proforma.bankDetails ? JSON.stringify(proforma.bankDetails) : null;
    const historyJson = JSON.stringify(statusHistory);

    // Save proforma invoice and its line items inside an atomic transaction
    this.beginTransaction();
    try {
      if (isNew) {
        this.run(
          `INSERT INTO proforma_invoices (
            id, piNumber, piDate, validUntil, referenceNumber, customerReference,
            salesperson, customerId, customerName, customerContactPerson, customerEmail,
            customerPhone, customerGstin, customerPan, billingAddress, shippingAddress,
            customerCity, customerState, customerStateCode, customerPinCode,
            shipToCompany, shipToContact, shipToCity, shipToState, shipToStateCode,
            shipToPinCode, shipToCountry, shipToPhone,
            subtotal, totalDiscount, taxableAmount, isInterstate, cgstTotal, sgstTotal,
            igstTotal, totalTax, freightCharges, packingCharges, insuranceCharges,
            loadingCharges, otherCharges, extraChargesTotal, roundOff, grandTotal,
            amountInWords, paymentTerms, deliveryTerms, termsAndConditions,
            bankAccountId, bankDetails, status, notes, statusHistory,
            signatureUrl, stampUrl, signatureEnabled, stampEnabled,
            signatureSize, stampSize, signatoryName, signatoryDesignation,
            createdBy, createdByName, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            piId, pNumber, pDate, vDate,
            proforma.referenceNumber || null, proforma.customerReference || null, proforma.salesperson || currentUser.name,
            customerId, customerName, proforma.customerContactPerson || null,
            proforma.customerEmail || null, proforma.customerPhone || null, proforma.customerGstin || null, proforma.customerPan || null,
            proforma.billingAddress || null, proforma.shippingAddress || null, proforma.customerCity || 'Mumbai', proforma.customerState || 'Maharashtra',
            proforma.customerStateCode || '27', proforma.customerPinCode || '400001',
            proforma.shipToCompany || null, proforma.shipToContact || null, proforma.shipToCity || null,
            proforma.shipToState || null, proforma.shipToStateCode || null, proforma.shipToPinCode || null,
            proforma.shipToCountry || 'India', proforma.shipToPhone || null,
            Number(proforma.subtotal) || 0,
            Number(proforma.totalDiscount) || 0, Number(proforma.taxableAmount) || 0, proforma.isInterstate ? 1 : 0,
            Number(proforma.cgstTotal) || 0, Number(proforma.sgstTotal) || 0, Number(proforma.igstTotal) || 0, Number(proforma.totalTax) || 0,
            Number(proforma.freightCharges) || 0, Number(proforma.packingCharges) || 0, Number(proforma.insuranceCharges) || 0,
            Number(proforma.loadingCharges) || 0, Number(proforma.otherCharges) || 0, Number(proforma.extraChargesTotal) || 0,
            Number(proforma.roundOff) || 0, Number(proforma.grandTotal) || 0, proforma.amountInWords || '',
            proforma.paymentTerms || '30% Advance, balance against Proforma / LR prior to dispatch',
            proforma.deliveryTerms || 'Ready Stock ex-works', termsJson,
            proforma.bankAccountId || null, bankDetailsJson, proforma.status || 'draft',
            proforma.notes || null, historyJson, proforma.signatureUrl || null, proforma.stampUrl || null,
            proforma.signatureEnabled !== false ? 1 : 0, proforma.stampEnabled !== false ? 1 : 0,
            proforma.signatureSize || 'md', proforma.stampSize || 'md',
            proforma.signatoryName || 'Mohan Jha', proforma.signatoryDesignation || 'Commercial & Technical Operations',
            currentUser.id, currentUser.name, now, now,
          ]
        );
        this.incrementProformaSequence();
      } else {
        this.run(
          `UPDATE proforma_invoices SET
            piNumber = ?, piDate = ?, validUntil = ?, referenceNumber = ?,
            customerReference = ?, salesperson = ?, customerId = ?, customerName = ?,
            customerContactPerson = ?, customerEmail = ?, customerPhone = ?,
            customerGstin = ?, customerPan = ?, billingAddress = ?, shippingAddress = ?,
            customerCity = ?, customerState = ?, customerStateCode = ?, customerPinCode = ?,
            shipToCompany = ?, shipToContact = ?, shipToCity = ?, shipToState = ?, shipToStateCode = ?,
            shipToPinCode = ?, shipToCountry = ?, shipToPhone = ?,
            subtotal = ?, totalDiscount = ?, taxableAmount = ?, isInterstate = ?,
            cgstTotal = ?, sgstTotal = ?, igstTotal = ?, totalTax = ?,
            freightCharges = ?, packingCharges = ?, insuranceCharges = ?,
            loadingCharges = ?, otherCharges = ?, extraChargesTotal = ?,
            roundOff = ?, grandTotal = ?, amountInWords = ?, paymentTerms = ?,
            deliveryTerms = ?, termsAndConditions = ?, bankAccountId = ?,
            bankDetails = ?, status = ?, notes = ?, statusHistory = ?,
            signatureUrl = ?, stampUrl = ?, signatureEnabled = ?, stampEnabled = ?,
            signatureSize = ?, stampSize = ?, signatoryName = ?, signatoryDesignation = ?,
            updatedAt = ?
           WHERE id = ?`,
          [
            pNumber, pDate, vDate,
            proforma.referenceNumber || null, proforma.customerReference || null, proforma.salesperson || currentUser.name,
            customerId, customerName, proforma.customerContactPerson || null,
            proforma.customerEmail || null, proforma.customerPhone || null, proforma.customerGstin || null, proforma.customerPan || null,
            proforma.billingAddress || null, proforma.shippingAddress || null, proforma.customerCity || 'Mumbai', proforma.customerState || 'Maharashtra',
            proforma.customerStateCode || '27', proforma.customerPinCode || '400001',
            proforma.shipToCompany || null, proforma.shipToContact || null, proforma.shipToCity || null,
            proforma.shipToState || null, proforma.shipToStateCode || null, proforma.shipToPinCode || null,
            proforma.shipToCountry || 'India', proforma.shipToPhone || null,
            Number(proforma.subtotal) || 0,
            Number(proforma.totalDiscount) || 0, Number(proforma.taxableAmount) || 0, proforma.isInterstate ? 1 : 0,
            Number(proforma.cgstTotal) || 0, Number(proforma.sgstTotal) || 0, Number(proforma.igstTotal) || 0, Number(proforma.totalTax) || 0,
            Number(proforma.freightCharges) || 0, Number(proforma.packingCharges) || 0, Number(proforma.insuranceCharges) || 0,
            Number(proforma.loadingCharges) || 0, Number(proforma.otherCharges) || 0, Number(proforma.extraChargesTotal) || 0,
            Number(proforma.roundOff) || 0, Number(proforma.grandTotal) || 0, proforma.amountInWords || '',
            proforma.paymentTerms || '30% Advance, balance against Proforma / LR prior to dispatch',
            proforma.deliveryTerms || 'Ready Stock ex-works', termsJson,
            proforma.bankAccountId || null, bankDetailsJson, proforma.status || 'draft',
            proforma.notes || null, historyJson, proforma.signatureUrl || null, proforma.stampUrl || null,
            proforma.signatureEnabled !== false ? 1 : 0, proforma.stampEnabled !== false ? 1 : 0,
            proforma.signatureSize || 'md', proforma.stampSize || 'md',
            proforma.signatoryName || 'Mohan Jha', proforma.signatoryDesignation || 'Commercial & Technical Operations',
            now, piId,
          ]
        );
        // Clear previous line items for this proforma
        this.run('DELETE FROM proforma_invoice_items WHERE proformaId = ?', [piId]);
      }

      // Insert line items
      const items = proforma.items || [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const itemId = it.id || `piitem-${Date.now()}-${i}`;
        this.run(
          `INSERT INTO proforma_invoice_items (
            id, proformaId, srNo, productId, productName, description,
            material, grade, size, schedule, thickness, standard, measurement,
            quantity, unit, rate, grossAmount, discountPercent, discountAmount,
            taxableAmount, hsnCode, gstRate, cgstAmount, sgstAmount, igstAmount, totalAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, piId, it.srNo || (i + 1), it.productId || null, it.productName || 'Industrial Supply', it.description || null,
            it.material || null, it.grade || null, it.size || null, it.schedule || null, it.thickness || null, it.standard || null,
            it.measurement || null,
            Number(it.quantity) || 1, it.unit || 'PCS', Number(it.rate) || 0, Number(it.grossAmount) || 0,
            Number(it.discountPercent) || 0, Number(it.discountAmount) || 0,
            Number(it.taxableAmount) || 0, it.hsnCode || null, Number(it.gstRate) || 0,
            Number(it.cgstAmount) || 0, Number(it.sgstAmount) || 0, Number(it.igstAmount) || 0,
            Number(it.totalAmount) || 0,
          ]
        );
      }

      this.commitTransaction();
    } catch (err: any) {
      this.rollbackTransaction();
      console.error('[DatabaseManager] Transaction failed while saving proforma invoice:', err);
      const fallback = this.getProformaInvoiceById(piId);
      if (fallback) return fallback;
      return {
        ...proforma,
        id: piId,
        proformaNumber: pNumber,
        piNumber: pNumber,
        proformaDate: pDate,
        piDate: pDate,
        validUntil: vDate,
        status: proforma.status || 'draft',
        items: proforma.items || [],
        createdAt: now,
        updatedAt: now,
      };
    }

    return this.getProformaInvoiceById(piId);
  }

  public duplicateProformaInvoice(id: string): any | null {
    const orig = this.getProformaInvoiceById(id);
    if (!orig) return null;

    const nextNumber = this.getNextProformaNumber();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const validUntilDate = new Date(now.setDate(now.getDate() + 15)).toISOString().split('T')[0];
    const currentUser = this.getCurrentUser();

    const duplicated = {
      ...orig,
      id: undefined,
      proformaNumber: nextNumber,
      piNumber: nextNumber,
      proformaDate: today,
      piDate: today,
      validUntil: validUntilDate,
      status: 'draft',
      customerReference: orig.customerReference ? `${orig.customerReference} (Rev)` : undefined,
      referenceNumber: orig.referenceNumber ? `${orig.referenceNumber} (Rev)` : undefined,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: 'draft',
          note: `Duplicated from proforma invoice ${orig.piNumber}`,
          updatedByName: currentUser.name,
          createdAt: new Date().toISOString(),
        },
      ],
      items: (orig.items || []).map((it: any, idx: number) => ({
        ...it,
        id: undefined,
        srNo: idx + 1,
      })),
    };

    return this.saveProformaInvoice(duplicated);
  }

  public updateProformaInvoiceStatus(id: string, status: string, note?: string): any | null {
    const pi = this.getProformaInvoiceById(id);
    if (!pi) return null;

    return this.saveProformaInvoice({
      ...pi,
      status,
      notes: note || pi.notes,
    });
  }

  public deleteProformaInvoice(id: string): boolean {
    this.beginTransaction();
    try {
      this.run('DELETE FROM proforma_invoice_items WHERE proformaId = ?', [id]);
      this.run('DELETE FROM proforma_invoices WHERE id = ?', [id]);
      this.commitTransaction();
      return true;
    } catch (err) {
      this.rollbackTransaction();
      console.error('[DatabaseManager] Failed to delete proforma invoice:', err);
      return false;
    }
  }

  // ============================================================================
  // Backup, Restore & Reset
  // ============================================================================
  public backupDatabase(targetFilePath: string): boolean {
    try {
      if (this.isWasm) {
        this.saveWasmToDisk();
      }
      fs.copyFileSync(this.dbPath, targetFilePath);
      return true;
    } catch (err) {
      console.error('[DatabaseManager] Backup failed:', err);
      return false;
    }
  }

  public async restoreDatabase(sourceFilePath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(sourceFilePath)) return false;

      // Close current db connection if applicable
      if (!this.isWasm && this.db) {
        try { this.db.close(); } catch (e) {}
      }

      fs.copyFileSync(sourceFilePath, this.dbPath);
      await this.init();
      return true;
    } catch (err) {
      console.error('[DatabaseManager] Restore failed:', err);
      return false;
    }
  }

  public exportAllDataJson(): string {
    return JSON.stringify({
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
    }, null, 2);
  }

  public importDataJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.company) this.updateCompany(data.company);
      if (data.settings) this.updateSettings(data.settings);
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) this.saveCategory(c);
      }
      if (Array.isArray(data.products)) {
        for (const p of data.products) this.saveProduct(p);
      }
      if (Array.isArray(data.customers)) {
        for (const cust of data.customers) this.saveCustomer(cust);
      }
      if (Array.isArray(data.bankAccounts)) {
        for (const b of data.bankAccounts) this.saveBankAccount(b);
      }
      if (Array.isArray(data.termsTemplates)) {
        for (const t of data.termsTemplates) this.saveTermsTemplate(t);
      }
      if (Array.isArray(data.quotations)) {
        for (const q of data.quotations) this.saveQuotation(q);
      }
      if (Array.isArray(data.proformas)) {
        for (const p of data.proformas) this.saveProformaInvoice(p);
      }
      return true;
    } catch (err) {
      console.error('[DatabaseManager] JSON Import failed:', err);
      return false;
    }
  }

  public resetToSampleData(): void {
    this.beginTransaction();
    try {
      this.run('DELETE FROM proforma_invoice_items');
      this.run('DELETE FROM proforma_invoices');
      this.run('DELETE FROM quotation_items');
      this.run('DELETE FROM quotations');
      this.run("DELETE FROM customers WHERE id != 'cust-01'");
      this.run("UPDATE settings SET sequenceNumber = 1011, piSequenceNumber = 501 WHERE id = 'default'");
      this.commitTransaction();
      console.log('[DatabaseManager] Database reset to clean state.');
    } catch (err) {
      this.rollbackTransaction();
      console.error('[DatabaseManager] Reset failed:', err);
    }
  }
}
