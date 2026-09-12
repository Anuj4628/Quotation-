import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Package,
  Save,
  Eye,
  ArrowLeft,
  Search,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  Percent,
  Calculator,
  UserPlus,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { storage } from '../services/storage';
import { calculateQuotation, formatINR } from '../utils/calculator';
import {
  Customer,
  Product,
  Quotation,
  QuotationItem,
  UnitType,
  QuotationStatus,
} from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const QuotationEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

  const company = storage.getCompany();
  const settings = storage.getSettings();
  const customers = storage.getCustomers();
  const products = storage.getProducts();
  const bankAccounts = storage.getBankAccounts();
  const termsTemplates = storage.getTermsTemplates();

  // --------------------------------------------------------------------------
  // Form State
  // --------------------------------------------------------------------------
  const [quotationNumber, setQuotationNumber] = useState(() =>
    isEditMode ? '' : storage.getNextQuotationNumber()
  );
  const [quotationDate, setQuotationDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.defaultValidityDays || 15));
    return d.toISOString().split('T')[0];
  });
  const [referenceNumber, setReferenceNumber] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [salesperson, setSalesperson] = useState(user.name);
  const [paymentTerms, setPaymentTerms] = useState(settings.defaultPaymentTerms);
  const [deliveryTerms, setDeliveryTerms] = useState(settings.defaultDeliveryTerms);
  const [selectedBankId, setSelectedBankId] = useState(() => {
    const def = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    return def?.id || '';
  });
  const [selectedTermsTemplateId, setSelectedTermsTemplateId] = useState(() => {
    const def = termsTemplates.find((t) => t.isDefault) || termsTemplates[0];
    return def?.id || '';
  });
  const [terms, setTerms] = useState<string[]>(() => {
    const def = termsTemplates.find((t) => t.isDefault) || termsTemplates[0];
    return def ? [...def.terms] : [];
  });

  // Signature & Stamp snapshot state
  const [signatureUrl, setSignatureUrl] = useState(() => settings.signatureUrl);
  const [stampUrl, setStampUrl] = useState(() => settings.stampUrl);
  const [signatureEnabled, setSignatureEnabled] = useState(() => settings.signatureEnabled ?? true);
  const [stampEnabled, setStampEnabled] = useState(() => settings.stampEnabled ?? true);
  const [signatureSize, setSignatureSize] = useState<'sm' | 'md' | 'lg'>(() => settings.signatureSize || 'md');
  const [stampSize, setStampSize] = useState<'sm' | 'md' | 'lg'>(() => settings.stampSize || 'md');
  const [signatoryName, setSignatoryName] = useState(() => settings.signatoryName || 'Mohan Jha');
  const [signatoryDesignation, setSignatoryDesignation] = useState(() => settings.signatoryDesignation || 'Commercial & Technical Operations');

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');

  // Items
  const [items, setItems] = useState<
    Array<{
      id: string;
      productId?: string;
      productName: string;
      description: string;
      material: string;
      grade: string;
      size: string;
      schedule: string;
      thickness: string;
      standard: string;
      quantity: number;
      unit: UnitType;
      rate: number;
      discountPercent: number;
      gstRate: number;
      hsnCode: string;
    }>
  >([
    {
      id: `item-${Date.now()}`,
      productName: 'SS 316L Seamless Pipe',
      description: 'ASTM A312 TP316L, 2" NB SCH 40, Pickled Finish, Solution Annealed',
      material: 'Stainless Steel',
      grade: 'ASTM A312 TP316L',
      size: '2" NB',
      schedule: 'SCH 40',
      thickness: '3.91 mm',
      standard: 'ASTM A312',
      quantity: 50,
      unit: 'MTR',
      rate: 1450,
      discountPercent: 0,
      gstRate: 18,
      hsnCode: '73044100',
    },
  ]);

  // Extra Charges
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [packingAmount, setPackingAmount] = useState<number>(0);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [loadingAmount, setLoadingAmount] = useState<number>(0);
  const [otherChargesAmount, setOtherChargesAmount] = useState<number>(0);

  // Status & History
  const [status, setStatus] = useState<QuotationStatus>('draft');
  const [notes, setNotes] = useState('');

  // Modals
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPerson, setNewCustPerson] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustState, setNewCustState] = useState('Maharashtra');
  const [newCustPin, setNewCustPin] = useState('400001');

  // --------------------------------------------------------------------------
  // Edit Mode Initialization
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isEditMode && id) {
      const existing = storage.getQuotationById(id);
      if (existing) {
        setQuotationNumber(existing.quotationNumber);
        setQuotationDate(existing.quotationDate);
        setValidUntil(existing.validUntil);
        setReferenceNumber(existing.referenceNumber || '');
        setCustomerReference(existing.customerReference || '');
        setSalesperson(existing.salesperson);
        setPaymentTerms(existing.paymentTerms);
        setDeliveryTerms(existing.deliveryTerms);
        setSelectedBankId(existing.bankAccountId);
        setTerms(existing.termsAndConditions || []);
        setStatus(existing.status);
        setNotes(existing.notes || '');
        setFreightAmount(existing.freightCharges || 0);
        setPackingAmount(existing.packingCharges || 0);
        setInsuranceAmount(existing.insuranceCharges || 0);
        setLoadingAmount(existing.loadingCharges || 0);
        setOtherChargesAmount(existing.otherCharges || 0);

        // Retain historical signature & stamp snapshot
        if (existing.signatureUrl !== undefined) setSignatureUrl(existing.signatureUrl);
        if (existing.stampUrl !== undefined) setStampUrl(existing.stampUrl);
        if (existing.signatureEnabled !== undefined) setSignatureEnabled(existing.signatureEnabled);
        if (existing.stampEnabled !== undefined) setStampEnabled(existing.stampEnabled);
        if (existing.signatureSize) setSignatureSize(existing.signatureSize);
        if (existing.stampSize) setStampSize(existing.stampSize);
        if (existing.signatoryName) setSignatoryName(existing.signatoryName);
        if (existing.signatoryDesignation) setSignatoryDesignation(existing.signatoryDesignation);

        // Find customer
        setSelectedCustomerId(existing.customerId);
        const cust = storage.getCustomerById(existing.customerId);
        if (cust) {
          setSelectedCustomer(cust);
          setShippingAddress(existing.shippingAddress || cust.billingAddress);
          setSameAsBilling(existing.shippingAddress === cust.billingAddress);
        }

        // Set items
        if (existing.items && existing.items.length > 0) {
          setItems(
            existing.items.map((it) => ({
              id: it.id,
              productId: it.productId,
              productName: it.productName,
              description: it.description,
              material: it.material,
              grade: it.grade,
              size: it.size,
              schedule: it.schedule || '',
              thickness: it.thickness || '',
              standard: it.standard || '',
              quantity: it.quantity,
              unit: it.unit,
              rate: it.rate,
              discountPercent: it.discountPercent,
              gstRate: it.gstRate,
              hsnCode: it.hsnCode,
            }))
          );
        }
      }
    }
  }, [isEditMode, id]);

  // Handle Customer Change
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setSelectedCustomer(found);
      setShippingAddress(found.shippingAddress || found.billingAddress);
      setPaymentTerms(found.paymentTerms || settings.defaultPaymentTerms);
    } else {
      setSelectedCustomer(null);
    }
  };

  // Handle Terms Template Change
  const handleTemplateChange = (tmplId: string) => {
    setSelectedTermsTemplateId(tmplId);
    const found = termsTemplates.find((t) => t.id === tmplId);
    if (found) {
      setTerms([...found.terms]);
    }
  };

  // --------------------------------------------------------------------------
  // Calculation Result
  // --------------------------------------------------------------------------
  const calculations = useMemo(() => {
    const customerState = selectedCustomer ? selectedCustomer.state : company.state;

    return calculateQuotation({
      items,
      companyState: company.state,
      customerState,
      freightAmount,
      packingAmount,
      insuranceAmount,
      loadingAmount,
      otherChargesAmount,
    });
  }, [
    items,
    selectedCustomer,
    company.state,
    freightAmount,
    packingAmount,
    insuranceAmount,
    loadingAmount,
    otherChargesAmount,
  ]);

  // --------------------------------------------------------------------------
  // Item Handlers
  // --------------------------------------------------------------------------
  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      productName: '',
      description: '',
      material: 'Stainless Steel',
      grade: '',
      size: '',
      schedule: '',
      thickness: '',
      standard: '',
      quantity: 1,
      unit: 'PCS' as UnitType,
      rate: 0,
      discountPercent: 0,
      gstRate: 18,
      hsnCode: '7304',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      error('Cannot Remove', 'Quotation must have at least one line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateItem = (index: number) => {
    const orig = items[index];
    const copy = { ...orig, id: `item-${Date.now()}` };
    const next = [...items];
    next.splice(index + 1, 0, copy);
    setItems(next);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Add Product from Database
  const handleSelectProduct = (prod: Product) => {
    const newItem = {
      id: `item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      description: prod.description,
      material: prod.material,
      grade: prod.grade,
      size: prod.size || '',
      schedule: prod.schedule || '',
      thickness: prod.thickness || '',
      standard: prod.standard || '',
      quantity: 10,
      unit: prod.unit,
      rate: prod.defaultSellingPrice,
      discountPercent: 0,
      gstRate: prod.gstRate,
      hsnCode: prod.hsnCode,
    };
    setItems((prev) => [...prev, newItem]);
    setIsProductPickerOpen(false);
    success('Product Added', `Added ${prod.name} to line items`);
  };

  // Quick Customer Creation
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustGstin) {
      error('Missing fields', 'Company name and GSTIN are required');
      return;
    }

    const created = storage.saveCustomer({
      customerCode: `CUST-JMA-${Date.now().toString().slice(-4)}`,
      companyName: newCustName,
      contactPerson: newCustPerson || 'Procurement In-Charge',
      email: newCustEmail || 'purchase@company.com',
      phone: newCustPhone || '+91 98000 00000',
      gstin: newCustGstin.toUpperCase(),
      billingAddress: newCustAddress || 'Industrial Area',
      shippingAddress: newCustAddress || 'Industrial Area',
      city: newCustCity || 'Mumbai',
      state: newCustState,
      stateCode: newCustGstin.substring(0, 2),
      country: 'India',
      pinCode: newCustPin,
      paymentTerms: '30 Days Net',
      creditLimit: 1000000,
    });

    success('Customer Created', `Added ${created.companyName}`);
    setSelectedCustomerId(created.id);
    setSelectedCustomer(created);
    setShippingAddress(created.billingAddress);
    setIsNewCustomerModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // Save Quotation Handler
  // --------------------------------------------------------------------------
  const handleSaveQuotation = (targetStatus: QuotationStatus = status, directPreview = false) => {
    if (!selectedCustomer) {
      error('Validation Error', 'Please select or add a customer');
      return;
    }

    if (items.length === 0) {
      error('Validation Error', 'Quotation must have at least one product line item');
      return;
    }

    const emptyName = items.some((it) => !it.productName.trim());
    if (emptyName) {
      error('Validation Error', 'All item rows must have a Product Name');
      return;
    }

    const payload: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      ...(isEditMode && id ? { id } : {}),
      quotationNumber: quotationNumber || storage.getNextQuotationNumber(),
      quotationDate,
      validUntil,
      referenceNumber: referenceNumber || undefined,
      customerReference: customerReference || undefined,
      salesperson: salesperson || user.name,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName,
      customerContactPerson: selectedCustomer.contactPerson,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      customerGstin: selectedCustomer.gstin,
      customerPan: selectedCustomer.pan,
      billingAddress: selectedCustomer.billingAddress,
      shippingAddress: sameAsBilling ? selectedCustomer.billingAddress : shippingAddress,
      customerCity: selectedCustomer.city,
      customerState: selectedCustomer.state,
      customerStateCode: selectedCustomer.stateCode,
      customerPinCode: selectedCustomer.pinCode,
      items: calculations.items,
      subtotal: calculations.subtotal,
      totalDiscount: calculations.totalDiscount,
      taxableAmount: calculations.taxableAmount,
      isInterstate: calculations.isInterstate,
      cgstTotal: calculations.cgstTotal,
      sgstTotal: calculations.sgstTotal,
      igstTotal: calculations.igstTotal,
      totalTax: calculations.totalTax,
      freightCharges: calculations.freightCharges,
      packingCharges: calculations.packingCharges,
      insuranceCharges: calculations.insuranceCharges,
      loadingCharges: calculations.loadingCharges,
      otherCharges: calculations.otherCharges,
      extraChargesTotal: calculations.extraChargesTotal,
      roundOff: calculations.roundOff,
      grandTotal: calculations.grandTotal,
      amountInWords: calculations.amountInWords,
      paymentTerms,
      deliveryTerms,
      termsAndConditions: terms,
      bankAccountId: selectedBankId,
      bankDetails: bankAccounts.find((b) => b.id === selectedBankId),
      status: targetStatus,
      notes,
      signatureUrl,
      stampUrl,
      signatureEnabled,
      stampEnabled,
      signatureSize,
      stampSize,
      signatoryName,
      signatoryDesignation,
      statusHistory: [],
      createdBy: user.id,
      createdByName: user.name,
    };

    const saved = storage.saveQuotation(payload);
    success(
      isEditMode ? 'Quotation Updated' : 'Quotation Created',
      `Quotation ${saved.quotationNumber} saved successfully`
    );

    if (directPreview) {
      navigate(`/quotations/${saved.id}`);
    } else {
      navigate('/quotations');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
              {isEditMode ? `Edit Quotation ${quotationNumber}` : 'Create New Quotation'}
            </h1>
            <p className="text-xs text-slate-500">
              Build industrial metal estimation with automated Indian GST calculation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveQuotation('draft', false)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveQuotation(status, true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save & Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: Customer Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Customer & Consignee Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Customer</span>
              </button>
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Existing Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
              >
                <option value="">-- Choose Customer from Database --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.city}, {c.state} • GST: {c.gstin})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Customer Details Card */}
            {selectedCustomer && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Buyer Company</span>
                    <p className="font-bold text-sm text-slate-900">{selectedCustomer.companyName}</p>
                    <p className="text-slate-600">Attn: {selectedCustomer.contactPerson}</p>
                  </div>
                  <div className="text-left sm:text-right font-mono text-[11px] text-slate-700">
                    <p>GSTIN: <strong className="text-slate-900">{selectedCustomer.gstin}</strong></p>
                    <p>Place of Supply: <strong className="text-slate-900">{selectedCustomer.state} ({selectedCustomer.stateCode})</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Billing Address</span>
                    <p className="text-slate-700">{selectedCustomer.billingAddress}</p>
                    <p className="text-slate-700">{selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pinCode}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Shipping Address</span>
                      <label className="flex items-center text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsBilling}
                          onChange={(e) => {
                            setSameAsBilling(e.target.checked);
                            if (e.target.checked) setShippingAddress(selectedCustomer.billingAddress);
                          }}
                          className="rounded text-red-600 focus:ring-red-500 mr-1"
                        />
                        Same as Billing
                      </label>
                    </div>
                    {!sameAsBilling ? (
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter consignee site delivery address..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                      />
                    ) : (
                      <p className="text-slate-600 italic">Same as Billing Address</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Quotation Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Quotation Parameters & Terms
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quotation Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quotation Date</label>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer RFQ / Tender Ref</label>
                <input
                  type="text"
                  value={customerReference}
                  onChange={(e) => setCustomerReference(e.target.value)}
                  placeholder="e.g. ENQ/LT/HE/2026/01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salesperson / Prepared By</label>
                <input
                  type="text"
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-semibold cursor-not-allowed"
                >
                  <option>INR (₹ - Indian Rupee)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Metal Products Line Items Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. Product Line Items & Metal Specifications ({items.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
                >
                  <Search className="w-3.5 h-3.5 text-red-400" />
                  <span>Select from Product Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Blank Row</span>
                </button>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-4">
              {items.map((item, idx) => {
                const gross = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                const disc = (gross * (Number(item.discountPercent) || 0)) / 100;
                const net = gross - disc;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-mono font-bold text-xs text-slate-700">
                        Item #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          title="Duplicate Item"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          title="Delete Item"
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Row 1: Product Name & Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      <div className="sm:col-span-5">
                        <label className="block font-semibold text-slate-700 mb-0.5">Product Name</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          placeholder="e.g. SS 316L Seamless Pipe"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-slate-700 mb-0.5">Material</label>
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => handleItemChange(idx, 'material', e.target.value)}
                          placeholder="e.g. Stainless Steel / Inconel"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-semibold text-slate-700 mb-0.5">Grade / Specification</label>
                        <input
                          type="text"
                          value={item.grade}
                          onChange={(e) => handleItemChange(idx, 'grade', e.target.value)}
                          placeholder="e.g. ASTM A312 TP316L"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Row 2: Engineering dimensions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">Size / NB</label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                          placeholder='2" NB / 50mm'
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">Schedule / Class</label>
                        <input
                          type="text"
                          value={item.schedule}
                          onChange={(e) => handleItemChange(idx, 'schedule', e.target.value)}
                          placeholder="SCH 40 / Class 150"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">Thickness / Standard</label>
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) => handleItemChange(idx, 'thickness', e.target.value)}
                          placeholder="3.91 mm"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">HSN Code</label>
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                          placeholder="73044100"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {/* Row 3: Commercial Quantities & Rates */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs pt-1 border-t border-slate-200">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold font-mono text-slate-900 outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Unit</label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value as UnitType)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-800 outline-none"
                        >
                          <option value="PCS">PCS</option>
                          <option value="MTR">MTR</option>
                          <option value="KG">KG</option>
                          <option value="MT">MT</option>
                          <option value="SET">SET</option>
                          <option value="NOS">NOS</option>
                          <option value="LOT">LOT</option>
                          <option value="MM">MM</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-semibold text-slate-900 outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Discount %</label>
                        <input
                          type="number"
                          step="any"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', parseFloat(e.target.value) || 18)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-semibold text-slate-800 outline-none"
                        >
                          <option value="18">18% (Standard Metal)</option>
                          <option value="12">12%</option>
                          <option value="28">28%</option>
                          <option value="5">5%</option>
                          <option value="0">0% (Nil / Exempt)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Line Total (₹)</label>
                        <div className="px-2 py-1.5 bg-slate-200/70 rounded-lg font-mono font-bold text-slate-900 text-right truncate">
                          {formatINR(net)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Commercial Terms & Conditions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Terms & Conditions and Bank Details
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Template:</span>
                <select
                  value={selectedTermsTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none"
                >
                  {termsTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Terms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            {/* Editable Terms Points */}
            <div>
              <label className="block font-semibold text-xs text-slate-700 mb-1.5">
                Quotation Clause Bullet Points (Appears on print & PDF)
              </label>
              <div className="space-y-1.5">
                {terms.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={t}
                      onChange={(e) => {
                        const next = [...terms];
                        next[idx] = e.target.value;
                        setTerms(next);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setTerms(terms.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTerms([...terms, 'Additional Commercial Clause'])}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 pt-1"
                >
                  + Add Clause Bullet
                </button>
              </div>
            </div>

            {/* Bank Remittance Account */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block font-semibold text-xs text-slate-700 mb-1">
                Select Bank Remittance Account for Quotation
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - A/C {b.accountNumber} ({b.branchName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Sticky Commercial Calculation Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-20 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Summary & Taxes
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  calculations.isInterstate
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {calculations.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}
              </span>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(calculations.subtotal)}
                </span>
              </div>

              {calculations.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span className="font-mono">- {formatINR(calculations.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-2">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatINR(calculations.taxableAmount)}</span>
              </div>

              {/* Extra Charges Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Extra Charges</p>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Freight:</span>
                  <div className="flex items-center gap-1 w-28">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={freightAmount || ''}
                      onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Packing & Handling:</span>
                  <div className="flex items-center gap-1 w-28">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={packingAmount || ''}
                      onChange={(e) => setPackingAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* GST Calculations */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Goods & Services Tax (GST)</p>
                {calculations.isInterstate ? (
                  <div className="flex justify-between text-slate-700">
                    <span>IGST (18%):</span>
                    <span className="font-mono font-semibold">{formatINR(calculations.igstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>CGST (9%):</span>
                      <span className="font-mono">{formatINR(calculations.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SGST (9%):</span>
                      <span className="font-mono">{formatINR(calculations.sgstTotal)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Total Tax:</span>
                  <span className="font-mono font-semibold">{formatINR(calculations.totalTax)}</span>
                </div>
              </div>

              {/* Round Off */}
              {calculations.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{calculations.roundOff > 0 ? `+₹${calculations.roundOff}` : `-₹${Math.abs(calculations.roundOff)}`}</span>
                </div>
              )}

              {/* Grand Total Highlight */}
              <div className="p-3.5 bg-red-600 text-white rounded-xl shadow-md space-y-1 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                  GRAND TOTAL (INC. ALL TAXES)
                </span>
                <p className="text-xl sm:text-2xl font-display font-extrabold font-mono">
                  {formatINR(calculations.grandTotal)}
                </p>
              </div>

              {/* Indian Words Converter */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount in Words</span>
                <p className="text-[11px] font-serif italic text-slate-800 leading-snug mt-0.5">
                  {calculations.amountInWords}
                </p>
              </div>
            </div>

            {/* Status Select */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold capitalize text-slate-800"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="under_negotiation">Under Negotiation</option>
                <option value="approved">Approved</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => handleSaveQuotation(status, true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Quotation & View</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/quotations')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Drawer/Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">Select Metal Product from Catalog</h3>
              </div>
              <button
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by alloy, ASTM grade, size, material (e.g. 316L, Inconel, Flange)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {products
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.grade.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.material.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.productCode.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-3 hover:bg-red-50/70 cursor-pointer rounded-xl flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-red-600 font-bold">
                          {prod.productCode}
                        </span>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-red-700">
                          {prod.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prod.material} • <strong className="text-slate-700">{prod.grade}</strong> • {prod.size || prod.schedule || ''}
                      </p>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">{prod.specification || prod.standard}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-slate-900">
                        {formatINR(prod.defaultSellingPrice)}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase">per {prod.unit}</span>
                      <span className="block mt-1 text-[10px] font-bold text-red-600 group-hover:underline">
                        + Select Product
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Larsen & Toubro Heavy Eng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500 cursor-text font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Contact Person</label>
                  <input
                    type="text"
                    value={newCustPerson}
                    onChange={(e) => setNewCustPerson(e.target.value)}
                    placeholder="e.g. Rajesh Patil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">
                    GSTIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={newCustGstin}
                    onChange={(e) => setNewCustGstin(e.target.value.toUpperCase())}
                    placeholder="27AABCJ4589K1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="purchase@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Billing Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Plot No. / Industrial Estate..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">City</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">State</label>
                  <input
                    type="text"
                    value={newCustState}
                    onChange={(e) => setNewCustState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">PIN Code</label>
                  <input
                    type="text"
                    value={newCustPin}
                    onChange={(e) => setNewCustPin(e.target.value)}
                    placeholder="400001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
