-- ==============================================================================
-- JUBILANT METAL AND ALLOYS - Quotation & Billing Management System Schema
-- PostgreSQL / Supabase Production Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sales_executive', 'viewer')),
    phone TEXT,
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Companies / Profile Settings
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'JUBILANT METAL AND ALLOYS',
    tagline TEXT DEFAULT 'Stockist, Manufacturer & Global Exporters of High Nickel Alloys, Stainless Steel, Titanium & Pipes',
    logo_url TEXT,
    gstin TEXT NOT NULL,
    pan TEXT NOT NULL,
    cin TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    pin_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Database with Metal & Industrial Specifications
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    subcategory TEXT,
    material TEXT NOT NULL, -- Stainless Steel, Inconel, Monel, Duplex, Carbon Steel, etc.
    grade TEXT NOT NULL, -- ASTM A312 TP316L, Inconel 625, UNS S32205, etc.
    size TEXT, -- 1/2" to 48", 10mm to 500mm
    od TEXT, -- Outer Diameter
    id_dim TEXT, -- Inner Diameter
    thickness TEXT, -- 1.5mm, 3mm, 10mm
    length TEXT, -- 6 MTR, Cut to length
    width TEXT,
    schedule TEXT, -- SCH 10, SCH 40, SCH 80, SCH 160, SCH XXS
    class_rating TEXT, -- Class 150, 300, 600, 900, 1500, 2500, 3000, 6000
    pressure_rating TEXT, -- PN10, PN16, PN40, 1000 WOG
    standard TEXT, -- ASTM, ASME, DIN, EN, ISO, JIS
    specification TEXT, -- ASTM A312 / ASME SA312
    finish TEXT, -- 2B, No. 4, Mirror, Pickled, Mill Finish
    form TEXT, -- Seamless, Welded, Forged, Hot Rolled, Cold Drawn
    unit TEXT NOT NULL DEFAULT 'PCS', -- PCS, KG, MT, MTR, MM, SET, LOT, NOS
    hsn_code TEXT NOT NULL DEFAULT '7304',
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    default_selling_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customer Database (CRM)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    designation TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    gstin TEXT NOT NULL,
    pan TEXT,
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    pin_code TEXT NOT NULL,
    payment_terms TEXT DEFAULT '30 Days Net',
    credit_limit NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quotation Configuration & Settings
CREATE TABLE IF NOT EXISTS quotation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prefix TEXT NOT NULL DEFAULT 'JMA',
    current_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    sequence_number INT NOT NULL DEFAULT 1,
    format_template TEXT NOT NULL DEFAULT '{PREFIX}-{YEAR}-{NUMBER}',
    default_validity_days INT NOT NULL DEFAULT 15,
    default_currency TEXT NOT NULL DEFAULT 'INR',
    default_currency_symbol TEXT NOT NULL DEFAULT '₹',
    default_payment_terms TEXT DEFAULT '100% against Proforma Invoice / Dispatch',
    default_delivery_terms TEXT DEFAULT 'Ex-Works, Mumbai / Taloja Godown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    upi_id TEXT,
    swift_code TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Terms & Conditions Templates
CREATE TABLE IF NOT EXISTS terms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    terms JSONB NOT NULL, -- Array of string bullet points
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Quotations Header Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT UNIQUE NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    reference_number TEXT,
    customer_reference TEXT,
    salesperson TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Denormalized customer snapshot for immutability
    customer_name TEXT NOT NULL,
    customer_contact_person TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_gstin TEXT,
    customer_pan TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    customer_state TEXT NOT NULL,
    customer_state_code TEXT NOT NULL,

    -- Commercial Calculations
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
    cgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    -- Extra Charges (Freight, Packing, Insurance, Loading, Other)
    freight_charges NUMERIC(15,2) DEFAULT 0.00,
    packing_charges NUMERIC(15,2) DEFAULT 0.00,
    insurance_charges NUMERIC(15,2) DEFAULT 0.00,
    loading_charges NUMERIC(15,2) DEFAULT 0.00,
    other_charges NUMERIC(15,2) DEFAULT 0.00,
    
    round_off NUMERIC(6,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    amount_in_words TEXT NOT NULL,

    -- Terms and Commercial Clauses
    payment_terms TEXT,
    delivery_terms TEXT,
    terms_and_conditions JSONB,
    bank_account_id UUID REFERENCES bank_accounts(id),

    -- Status and Audit
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'viewed', 'under_negotiation', 'approved', 'rejected', 'expired', 'converted')) DEFAULT 'draft',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quotation Line Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sr_no INT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    material TEXT,
    grade TEXT,
    size TEXT,
    schedule TEXT,
    thickness TEXT,
    standard TEXT,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT NOT NULL,
    rate NUMERIC(15,2) NOT NULL,
    gross_amount NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) NOT NULL,
    hsn_code TEXT NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Quotation Status History & Audit Log
CREATE TABLE IF NOT EXISTS quotation_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    note TEXT,
    updated_by_name TEXT NOT NULL DEFAULT 'System Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
