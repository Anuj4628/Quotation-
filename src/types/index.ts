// ==============================================================================
// JUBILANT METAL AND ALLOYS - TYPE DEFINITIONS
// ==============================================================================

export type UserRole = 'admin' | 'sales_manager' | 'sales_executive' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  gstin: string;
  pan: string;
  cin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  pinCode: string;
  phone: string;
  email: string;
  website: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  isActive: boolean;
  itemCount?: number;
}

export type UnitType = 'PCS' | 'KG' | 'MT' | 'MTR' | 'MM' | 'SET' | 'LOT' | 'NOS';

export interface Product {
  id: string;
  productCode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  material: string; // e.g. Stainless Steel, Carbon Steel, Inconel, Monel, Duplex
  grade: string; // e.g. ASTM A312 TP316L, Inconel 625, UNS S32205
  size?: string; // e.g. 2", 1/2", 100mm
  od?: string; // Outer Diameter
  idDim?: string; // Inner Diameter
  thickness?: string; // e.g. 3.0mm, SCH 40
  length?: string; // e.g. 6 Meters, Random Length
  width?: string;
  schedule?: string; // e.g. SCH 10, SCH 40, SCH 80, SCH 160
  classRating?: string; // e.g. Class 150, Class 300, Class 3000
  pressureRating?: string; // e.g. PN16, 3000 PSI
  standard?: string; // e.g. ASTM A312, ASME B16.9, DIN 2605
  specification?: string; // e.g. Solution Annealed & Pickled
  finish?: string; // e.g. Mill Finish, 2B, Mirror 600 Grit
  form?: string; // e.g. Seamless, ERW, Welded, Forged
  unit: UnitType;
  hsnCode: string;
  gstRate: number; // e.g. 18
  defaultSellingPrice: number;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  designation?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  gstin: string;
  pan?: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  pinCode: string;
  paymentTerms: string;
  creditLimit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId?: string;
  swiftCode?: string;
  isDefault: boolean;
}

export interface TermsTemplate {
  id: string;
  title: string;
  name?: string;
  terms: string[];
  isDefault: boolean;
}

export interface QuotationSettings {
  prefix: string;
  currentYear: number;
  sequenceNumber: number;
  formatTemplate: string; // e.g. "{PREFIX}-{YEAR}-{NUMBER}"
  defaultValidityDays: number;
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  // Proforma Invoice Settings
  piPrefix?: string;
  piSequenceNumber?: number;
  // Authorized Signature & Stamp Settings
  signatureUrl?: string;
  stampUrl?: string;
  signatureEnabled?: boolean;
  stampEnabled?: boolean;
  signatureSize?: 'sm' | 'md' | 'lg';
  stampSize?: 'sm' | 'md' | 'lg';
  signatoryName?: string;
  signatoryDesignation?: string;
}

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'under_negotiation'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface QuotationItem {
  id: string;
  srNo: number;
  productId?: string;
  productName: string;
  description: string;
  material: string;
  grade: string;
  size: string;
  schedule?: string;
  thickness?: string;
  standard?: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  grossAmount: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  hsnCode: string;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface ExtraCharge {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  calculatedAmount: number;
  enabled: boolean;
}

export interface QuotationStatusHistory {
  id: string;
  status: QuotationStatus;
  previousStatus?: QuotationStatus;
  note?: string;
  updatedByName: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  referenceNumber?: string;
  customerReference?: string;
  salesperson: string;
  
  customerId: string;
  customerName: string;
  customerContactPerson?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin: string;
  customerPan?: string;
  billingAddress: string;
  shippingAddress: string;
  customerCity: string;
  customerState: string;
  customerStateCode: string;
  customerPinCode: string;

  items: QuotationItem[];

  // Commercial Summary
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  isInterstate: boolean;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;

  // Extra Charges
  freightCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  loadingCharges: number;
  otherCharges: number;
  extraChargesTotal: number;

  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  // Commercial Clauses
  paymentTerms: string;
  deliveryTerms: string;
  termsAndConditions: string[];
  bankAccountId: string;
  bankDetails?: BankAccount;

  status: QuotationStatus;
  notes?: string;
  statusHistory: QuotationStatusHistory[];

  // Snapshot of signature & stamp for historical immutability
  signatureUrl?: string;
  stampUrl?: string;
  signatureEnabled?: boolean;
  stampEnabled?: boolean;
  signatureSize?: 'sm' | 'md' | 'lg';
  stampSize?: 'sm' | 'md' | 'lg';
  signatoryName?: string;
  signatoryDesignation?: string;
  
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PROFORMA INVOICE DATA MODELS
// ============================================================================

export type ProformaStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'paid'
  | 'cancelled';

export interface ProformaItem {
  id: string;
  srNo: number;
  productId?: string;
  productName: string;
  description: string;
  material: string;
  grade: string;
  size: string;
  schedule?: string;
  thickness?: string;
  standard?: string;
  measurement?: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  grossAmount: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  hsnCode: string;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface ProformaStatusHistory {
  id: string;
  status: ProformaStatus;
  previousStatus?: ProformaStatus;
  note?: string;
  updatedByName: string;
  createdAt: string;
}

export interface ProformaInvoice {
  id: string;
  proformaNumber: string;
  piNumber?: string;
  proformaDate: string; // YYYY-MM-DD
  piDate?: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  referenceNumber?: string;
  customerReference?: string;
  salesperson?: string;
  preparedBy?: string;

  // Bill To (Customer)
  customerId: string;
  customerName: string;
  customerContactPerson?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin: string;
  customerPan?: string;
  billingAddress: string;
  customerCity: string;
  customerState: string;
  customerStateCode: string;
  customerPinCode: string;

  // Dedicated Ship To
  sameAsBilling?: boolean;
  shipToCompany?: string;
  shipToContact?: string;
  shippingAddress: string;
  shipToCity?: string;
  shipToState?: string;
  shipToStateCode?: string;
  shipToPinCode?: string;
  shipToCountry?: string;
  shipToPhone?: string;

  items: ProformaItem[];

  // Commercial Summary
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  isInterstate: boolean;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;

  // Extra Charges
  freightCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  loadingCharges: number;
  otherCharges: number;
  extraChargesTotal: number;

  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  // Commercial Clauses & Notes
  paymentTerms: string;
  deliveryTerms: string;
  expectedDeliveryDate?: string;
  termsAndConditions: string[];
  otherComments?: string;
  bankAccountId: string;
  bankDetails?: BankAccount;

  status: ProformaStatus;
  notes?: string; // Other Comments / Remarks
  statusHistory: ProformaStatusHistory[];

  // Snapshot of signature & stamp for historical immutability
  signatureUrl?: string;
  stampUrl?: string;
  signatureEnabled?: boolean;
  stampEnabled?: boolean;
  signatureSize?: 'sm' | 'md' | 'lg';
  stampSize?: 'sm' | 'md' | 'lg';
  signatoryName?: string;
  signatoryDesignation?: string;

  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
