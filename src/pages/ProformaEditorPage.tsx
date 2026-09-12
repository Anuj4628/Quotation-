import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Package,
  Save,
  ArrowLeft,
  Building2,
  Layers,
  Calculator,
  UserPlus,
  Check,
  X,
  Truck,
  Eye,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { storage } from '../services/storage';
import { calculateQuotation, formatINR } from '../utils/calculator';
import {
  Customer,
  Product,
  ProformaInvoice,
  UnitType,
  ProformaStatus,
} from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ProformaDocument } from '../components/proforma/ProformaDocument';

export const ProformaEditorPage: React.FC = () => {
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

  // Tab State: Edit Form vs Live Preview
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // --------------------------------------------------------------------------
  // Form State
  // --------------------------------------------------------------------------
  const [proformaNumber, setProformaNumber] = useState(() =>
    isEditMode ? '' : storage.getNextProformaNumber()
  );
  const [proformaDate, setProformaDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.defaultValidityDays || 15));
    return d.toISOString().split('T')[0];
  });
  const [customerReference, setCustomerReference] = useState('');
  const [preparedBy, setPreparedBy] = useState(user.name);
  const [paymentTerms, setPaymentTerms] = useState(settings.defaultPaymentTerms || '30% Advance, Balance before Dispatch');
  const [deliveryTerms, setDeliveryTerms] = useState(settings.defaultDeliveryTerms || 'Ex-Works Mumbai, Freight Extra');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [otherComments, setOtherComments] = useState('');

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
    return def ? [...def.terms] : [
      '100% advance against Proforma Invoice or as per mutually agreed terms.',
      'Prices quoted are valid for 15 days from the date of this Proforma Invoice.',
      'Delivery schedule starts from the date of confirmed PO and receipt of advance payment.',
      'Material Test Certificates (EN 10204 3.1) will be provided alongside dispatch.',
    ];
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

  // Customer selection (Bill To)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Dedicated Ship To
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shipToCompany, setShipToCompany] = useState('');
  const [shipToContact, setShipToContact] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shipToCity, setShipToCity] = useState('');
  const [shipToState, setShipToState] = useState('Maharashtra');
  const [shipToStateCode, setShipToStateCode] = useState('27');
  const [shipToPinCode, setShipToPinCode] = useState('');
  const [shipToPhone, setShipToPhone] = useState('');

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
  const [status, setStatus] = useState<ProformaStatus>('draft');
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
      const existing = storage.getProformaInvoiceById(id);
      if (existing) {
        setProformaNumber(existing.proformaNumber);
        setProformaDate(existing.proformaDate);
        setValidUntil(existing.validUntil);
        setCustomerReference(existing.customerReference || '');
        setPreparedBy(existing.preparedBy || existing.createdByName || user.name);
        setPaymentTerms(existing.paymentTerms);
        setDeliveryTerms(existing.deliveryTerms);
        setExpectedDeliveryDate(existing.expectedDeliveryDate || '');
        setOtherComments(existing.otherComments || '');
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
        }

        // Ship To fields
        setSameAsBilling(existing.sameAsBilling ?? true);
        setShipToCompany(existing.shipToCompany || '');
        setShipToContact(existing.shipToContact || '');
        setShippingAddress(existing.shippingAddress || '');
        setShipToCity(existing.shipToCity || '');
        setShipToState(existing.shipToState || 'Maharashtra');
        setShipToStateCode(existing.shipToStateCode || '27');
        setShipToPinCode(existing.shipToPinCode || '');
        setShipToPhone(existing.shipToPhone || '');

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
      if (sameAsBilling) {
        setShipToCompany(found.companyName);
        setShipToContact(found.contactPerson);
        setShippingAddress(found.billingAddress);
        setShipToCity(found.city);
        setShipToState(found.state);
        setShipToStateCode(found.stateCode);
        setShipToPinCode(found.pinCode);
        setShipToPhone(found.phone);
      }
      setPaymentTerms(found.paymentTerms || settings.defaultPaymentTerms || '30% Advance, Balance before Dispatch');
    } else {
      setSelectedCustomer(null);
    }
  };

  const handleSameAsBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked && selectedCustomer) {
      setShipToCompany(selectedCustomer.companyName);
      setShipToContact(selectedCustomer.contactPerson);
      setShippingAddress(selectedCustomer.billingAddress);
      setShipToCity(selectedCustomer.city);
      setShipToState(selectedCustomer.state);
      setShipToStateCode(selectedCustomer.stateCode);
      setShipToPinCode(selectedCustomer.pinCode);
      setShipToPhone(selectedCustomer.phone);
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
    // Place of Supply determined by consignee/shipping state if available, else customer state
    const effectiveState = sameAsBilling
      ? (selectedCustomer ? selectedCustomer.state : company.state)
      : (shipToState || (selectedCustomer ? selectedCustomer.state : company.state));

    return calculateQuotation({
      items,
      companyState: company.state,
      customerState: effectiveState,
      freightAmount,
      packingAmount,
      insuranceAmount,
      loadingAmount,
      otherChargesAmount,
    });
  }, [
    items,
    selectedCustomer,
    sameAsBilling,
    shipToState,
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
      error('Cannot Remove', 'Proforma Invoice must have at least one line item');
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

  // Add Product from Catalog
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
    if (sameAsBilling) {
      setShipToCompany(created.companyName);
      setShipToContact(created.contactPerson);
      setShippingAddress(created.billingAddress);
      setShipToCity(created.city);
      setShipToState(created.state);
      setShipToStateCode(created.stateCode);
      setShipToPinCode(created.pinCode);
      setShipToPhone(created.phone);
    }
    setIsNewCustomerModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // Save Proforma Handler
  // --------------------------------------------------------------------------
  const handleSaveProforma = (targetStatus: ProformaStatus = status, directPreview = false) => {
    if (!selectedCustomer) {
      error('Validation Error', 'Please select or add a customer');
      return;
    }

    if (items.length === 0) {
      error('Validation Error', 'Proforma Invoice must have at least one product line item');
      return;
    }

    const emptyName = items.some((it) => !it.productName.trim());
    if (emptyName) {
      error('Validation Error', 'All item rows must have a Product Name');
      return;
    }

    const payload: Omit<ProformaInvoice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      ...(isEditMode && id ? { id } : {}),
      proformaNumber: proformaNumber || storage.getNextProformaNumber(),
      proformaDate,
      validUntil,
      customerReference: customerReference || undefined,
      preparedBy: preparedBy || user.name,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName,
      customerContactPerson: selectedCustomer.contactPerson,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      customerGstin: selectedCustomer.gstin,
      customerPan: selectedCustomer.pan,
      billingAddress: selectedCustomer.billingAddress,
      customerCity: selectedCustomer.city,
      customerState: selectedCustomer.state,
      customerStateCode: selectedCustomer.stateCode,
      customerPinCode: selectedCustomer.pinCode,

      // Dedicated Ship To
      sameAsBilling,
      shipToCompany: sameAsBilling ? selectedCustomer.companyName : (shipToCompany || selectedCustomer.companyName),
      shipToContact: sameAsBilling ? selectedCustomer.contactPerson : (shipToContact || selectedCustomer.contactPerson),
      shippingAddress: sameAsBilling ? selectedCustomer.billingAddress : (shippingAddress || selectedCustomer.billingAddress),
      shipToCity: sameAsBilling ? selectedCustomer.city : (shipToCity || selectedCustomer.city),
      shipToState: sameAsBilling ? selectedCustomer.state : (shipToState || selectedCustomer.state),
      shipToStateCode: sameAsBilling ? selectedCustomer.stateCode : (shipToStateCode || selectedCustomer.stateCode),
      shipToPinCode: sameAsBilling ? selectedCustomer.pinCode : (shipToPinCode || selectedCustomer.pinCode),
      shipToCountry: 'India',
      shipToPhone: sameAsBilling ? selectedCustomer.phone : (shipToPhone || selectedCustomer.phone),

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
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      termsAndConditions: terms,
      otherComments: otherComments || undefined,
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

    const saved = storage.saveProformaInvoice(payload);
    success(
      isEditMode ? 'Proforma Updated' : 'Proforma Created',
      `Proforma Invoice ${saved.proformaNumber} saved successfully`
    );

    if (directPreview) {
      navigate(`/proformas/${saved.id}`);
    } else {
      navigate('/proformas');
    }
  };

  // Preview snapshot object for real-time live preview tab
  const previewProforma: ProformaInvoice = useMemo(() => {
    return {
      id: id || 'preview-temp-id',
      proformaNumber: proformaNumber || 'JMA-PI-2026-0000',
      proformaDate,
      validUntil,
      customerReference,
      preparedBy,
      customerId: selectedCustomer?.id || 'temp-cust',
      customerName: selectedCustomer?.companyName || 'Buyer Company Name Pvt Ltd',
      customerContactPerson: selectedCustomer?.contactPerson || 'Procurement Manager',
      customerEmail: selectedCustomer?.email || 'buyer@example.com',
      customerPhone: selectedCustomer?.phone || '+91 98000 00000',
      customerGstin: selectedCustomer?.gstin || '27AABCU9603R1ZM',
      customerPan: selectedCustomer?.pan || 'AABCU9603R',
      billingAddress: selectedCustomer?.billingAddress || 'Plot No. 42, Wagle Industrial Estate',
      customerCity: selectedCustomer?.city || 'Thane',
      customerState: selectedCustomer?.state || 'Maharashtra',
      customerStateCode: selectedCustomer?.stateCode || '27',
      customerPinCode: selectedCustomer?.pinCode || '400604',
      sameAsBilling,
      shipToCompany: sameAsBilling ? (selectedCustomer?.companyName || 'Buyer Company Name') : (shipToCompany || 'Consignee Plant'),
      shipToContact: sameAsBilling ? (selectedCustomer?.contactPerson || 'Procurement Manager') : (shipToContact || 'Site In-Charge'),
      shippingAddress: sameAsBilling ? (selectedCustomer?.billingAddress || 'Plot No. 42, Wagle Industrial Estate') : (shippingAddress || 'Plant Delivery Gate #2'),
      shipToCity: sameAsBilling ? (selectedCustomer?.city || 'Thane') : (shipToCity || 'Thane'),
      shipToState: sameAsBilling ? (selectedCustomer?.state || 'Maharashtra') : (shipToState || 'Maharashtra'),
      shipToStateCode: sameAsBilling ? (selectedCustomer?.stateCode || '27') : (shipToStateCode || '27'),
      shipToPinCode: sameAsBilling ? (selectedCustomer?.pinCode || '400604') : (shipToPinCode || '400604'),
      shipToCountry: 'India',
      shipToPhone: sameAsBilling ? (selectedCustomer?.phone || '') : shipToPhone,
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
      expectedDeliveryDate,
      termsAndConditions: terms,
      otherComments,
      bankAccountId: selectedBankId,
      bankDetails: bankAccounts.find((b) => b.id === selectedBankId),
      status,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    id,
    proformaNumber,
    proformaDate,
    validUntil,
    customerReference,
    preparedBy,
    selectedCustomer,
    sameAsBilling,
    shipToCompany,
    shipToContact,
    shippingAddress,
    shipToCity,
    shipToState,
    shipToStateCode,
    shipToPinCode,
    shipToPhone,
    calculations,
    paymentTerms,
    deliveryTerms,
    expectedDeliveryDate,
    terms,
    otherComments,
    selectedBankId,
    bankAccounts,
    status,
    notes,
    signatureUrl,
    stampUrl,
    signatureEnabled,
    stampEnabled,
    signatureSize,
    stampSize,
    signatoryName,
    signatoryDesignation,
    user,
  ]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/proformas')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                PROFORMA
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                {isEditMode ? `Edit Proforma ${proformaNumber}` : 'Create Proforma Invoice'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build official commercial proforma invoice with buyer & consignee delivery specifications and GST calculation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-red-600" />
              <span>Live A4 Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSaveProforma('draft', false)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveProforma(status, true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save & View</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FORM EDITOR */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: Customer Information (Bill To & Ship To) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    1. Buyer (Bill To) & Consignee (Ship To)
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
                  Select Buyer from Database <span className="text-red-500">*</span>
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
                      <p>Billing State: <strong className="text-slate-900">{selectedCustomer.state} ({selectedCustomer.stateCode})</strong></p>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Billing Address</span>
                    <p className="text-slate-700">{selectedCustomer.billingAddress}</p>
                    <p className="text-slate-700">{selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pinCode}</p>
                  </div>

                  {/* Dedicated Consignee / Ship To Section */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Consignee / Delivery Address (Ship To)
                        </span>
                      </div>
                      <label className="flex items-center text-xs text-slate-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={sameAsBilling}
                          onChange={(e) => handleSameAsBillingToggle(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500 mr-1.5"
                        />
                        Same as Billing Address
                      </label>
                    </div>

                    {!sameAsBilling && (
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                              Consignee Company Name
                            </label>
                            <input
                              type="text"
                              value={shipToCompany}
                              onChange={(e) => setShipToCompany(e.target.value)}
                              placeholder="Consignee / Receiving Company"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                              Site Contact Person
                            </label>
                            <input
                              type="text"
                              value={shipToContact}
                              onChange={(e) => setShipToContact(e.target.value)}
                              placeholder="Name / Site In-charge"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Delivery Street Address / Plant Location
                          </label>
                          <textarea
                            rows={2}
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Plot / Gate / Industrial Estate delivery address"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">City</label>
                            <input
                              type="text"
                              value={shipToCity}
                              onChange={(e) => setShipToCity(e.target.value)}
                              placeholder="City"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">State</label>
                            <input
                              type="text"
                              value={shipToState}
                              onChange={(e) => setShipToState(e.target.value)}
                              placeholder="State"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">PIN Code</label>
                            <input
                              type="text"
                              value={shipToPinCode}
                              onChange={(e) => setShipToPinCode(e.target.value)}
                              placeholder="PIN"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Site Phone</label>
                            <input
                              type="text"
                              value={shipToPhone}
                              onChange={(e) => setShipToPhone(e.target.value)}
                              placeholder="Phone"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Line Items & Metal Specifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    2. Product & Metal Specifications
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    <Package className="w-3.5 h-3.5 text-red-600" />
                    <span>From Product Catalog</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items Table Form */}
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative hover:border-slate-300 transition-colors"
                  >
                    {/* Item Row Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Line Item #{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Duplicate item"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                          Product / Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          placeholder="e.g. SS 316L Seamless Pipe"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                          HSN Code
                        </label>
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                          placeholder="7304"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Technical Specifications (Grade, Size, Schedule, Material) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Material</label>
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => handleItemChange(idx, 'material', e.target.value)}
                          placeholder="Stainless Steel"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Grade</label>
                        <input
                          type="text"
                          value={item.grade}
                          onChange={(e) => handleItemChange(idx, 'grade', e.target.value)}
                          placeholder="TP 316L"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Size / Dimension</label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                          placeholder="2 inch NB"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Schedule</label>
                        <input
                          type="text"
                          value={item.schedule}
                          onChange={(e) => handleItemChange(idx, 'schedule', e.target.value)}
                          placeholder="SCH 40"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Thickness</label>
                        <input
                          type="text"
                          value={item.thickness}
                          onChange={(e) => handleItemChange(idx, 'thickness', e.target.value)}
                          placeholder="3.91 mm"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    {/* Quantity, Unit, Rate, Discount, GST & Row Total */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 border-t border-slate-200/60 items-end">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-600 uppercase mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-600 uppercase mb-0.5">Unit</label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value as UnitType)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1.5 text-xs font-medium"
                        >
                          <option value="PCS">PCS</option>
                          <option value="MTR">MTR</option>
                          <option value="KGS">KGS</option>
                          <option value="TON">TON</option>
                          <option value="FEET">FEET</option>
                          <option value="NOS">NOS</option>
                          <option value="SET">SET</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-600 uppercase mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-600 uppercase mb-0.5">Disc %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-emerald-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-600 uppercase mb-0.5">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', parseFloat(e.target.value) || 18)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1.5 text-xs font-mono"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={5}>5%</option>
                          <option value={28}>28%</option>
                          <option value={0}>0% (Exempt)</option>
                        </select>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-semibold text-slate-400 uppercase">Item Amount</span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {formatINR((item.quantity * item.rate * (1 - (item.discountPercent || 0) / 100)) * (1 + (item.gstRate || 0) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: Terms, Delivery & Comments */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    3. Commercial Terms & Special Instructions
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 30% Advance, Balance before Dispatch"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Terms</label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="e.g. Ex-Works Mumbai / CIF Destination"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Special Notes & Other Comments for PI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Other Comments / Special Clauses / Instructions
                </label>
                <textarea
                  rows={2}
                  value={otherComments}
                  onChange={(e) => setOtherComments(e.target.value)}
                  placeholder="e.g. LC terms, inspection at manufacturer works prior to dispatch, specific markings or packaging instructions."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Terms & Conditions List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Terms & Conditions of Sale</label>
                  <select
                    value={selectedTermsTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                  >
                    <option value="">-- Load Standard Terms Template --</option>
                    {termsTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.title || t.name || 'Template'}</option>
                    ))}
                  </select>
                </div>
                {terms.map((term, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold w-4">{i + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const next = [...terms];
                        next[i] = e.target.value;
                        setTerms(next);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setTerms(terms.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTerms([...terms, ''])}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  + Add Condition
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Details & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Proforma Identification */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Document Details
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Proforma Invoice No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proformaNumber}
                  onChange={(e) => setProformaNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">PI Date</label>
                  <input
                    type="date"
                    value={proformaDate}
                    onChange={(e) => setProformaDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buyer PO / Enquiry Ref</label>
                <input
                  type="text"
                  value={customerReference}
                  onChange={(e) => setCustomerReference(e.target.value)}
                  placeholder="e.g. PO-84920 or Email dated 12/09"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prepared By</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProformaStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Remittance Bank</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber.slice(-4)} ({b.accountName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extra Charges */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Freight & Packaging Charges
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Freight / Logistics (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono text-xs"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Packing & Handling (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={packingAmount}
                    onChange={(e) => setPackingAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white space-y-3 shadow-xl">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-700 pb-2 flex items-center justify-between">
                <span>PI Commercial Totals</span>
                <span className="text-[10px] text-red-400 font-mono">
                  {calculations.isInterstate ? 'IGST 18%' : 'CGST+SGST 18%'}
                </span>
              </h3>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">{formatINR(calculations.subtotal)}</span>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatINR(calculations.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-mono text-white">{formatINR(calculations.taxableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total GST:</span>
                  <span className="font-mono text-white">{formatINR(calculations.totalTax)}</span>
                </div>
                {calculations.extraChargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Freight / Packaging:</span>
                    <span className="font-mono text-white">{formatINR(calculations.extraChargesTotal)}</span>
                  </div>
                )}
                {calculations.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Round Off:</span>
                    <span className="font-mono">
                      {calculations.roundOff > 0 ? `+₹${calculations.roundOff}` : `-₹${Math.abs(calculations.roundOff)}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Grand Total:</span>
                <span className="font-mono text-xl font-extrabold text-red-400">
                  {formatINR(calculations.grandTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSaveProforma(status, true)}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Proforma & View Official Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE A4 PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <span>
              Live A4 Document preview for <strong>{proformaNumber || 'New Proforma'}</strong>. Shows exactly how it will print and export to PDF.
            </span>
            <button
              onClick={() => setActiveTab('form')}
              className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-semibold hover:bg-slate-50"
            >
              Back to Editor
            </button>
          </div>
          <div className="bg-slate-200/50 p-6 rounded-2xl border border-slate-300 overflow-x-auto">
            <ProformaDocument proforma={previewProforma} />
          </div>
        </div>
      )}

      {/* Product Catalog Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Select Item from Catalog</h3>
              <button onClick={() => setIsProductPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by grade, name, size..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
            <div className="p-3 overflow-y-auto divide-y divide-slate-100 flex-1">
              {products
                .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.grade.toLowerCase().includes(productSearch.toLowerCase()))
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">Grade: {p.grade} • Material: {p.material} • HSN: {p.hsnCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-900">{formatINR(p.defaultSellingPrice)}</p>
                      <span className="text-[10px] text-slate-400">per {p.unit}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* New Customer Quick Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <form onSubmit={handleCreateCustomerSubmit} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Customer</h3>
              <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company Name *</label>
              <input
                autoFocus
                type="text"
                required
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="Apex Engineering Ltd"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:border-red-500 cursor-text font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GSTIN *</label>
                <input
                  type="text"
                  required
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value.toUpperCase())}
                  placeholder="27AABCU..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newCustPerson}
                  onChange={(e) => setNewCustPerson(e.target.value)}
                  placeholder="Mr. Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={newCustState}
                  onChange={(e) => setNewCustState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Billing Address</label>
              <textarea
                rows={2}
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-xs"
              >
                Save & Select Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
