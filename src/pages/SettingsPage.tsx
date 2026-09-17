import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  FileText,
  Landmark,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
  Stamp,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CompanyProfile, QuotationSettings, BankAccount } from '../types';
import { useToast } from '../context/ToastContext';
import { resolveLogoUrl, resolveSignatureUrl, resolveStampUrl } from '../utils/assetResolver';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'company' | 'quotation' | 'signatory' | 'bank' | 'data'>('company');

  // 1. Company Profile State
  const [company, setCompany] = useState<CompanyProfile>(() => storage.getCompany());

  // 2. Quotation Numbering & Defaults State (including Signature & Stamp)
  const [qSettings, setQSettings] = useState<QuotationSettings>(() => storage.getSettings());

  // 3. Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => storage.getBankAccounts());
  const [editingBank, setEditingBank] = useState<BankAccount>({
    id: '',
    bankName: '',
    accountName: 'JUBILANT METAL AND ALLOYS',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
    swiftCode: '',
    isDefault: false,
  });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Save Company Profile
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateCompany(company);
    success('Settings Saved', 'Company profile and letterhead updated');
  };

  // Save Quotation Settings (including Signature & Stamp)
  const handleSaveQuotationSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    storage.updateSettings(qSettings);
    success('Settings Saved', 'Authorized signature, stamp, and quotation settings updated');
  };

  // Upload/Replace Signature or Stamp
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'signature' | 'stamp'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      error('Invalid File Type', 'Please upload a PNG, JPG, JPEG, or WebP image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'signature') {
        setQSettings((prev) => ({
          ...prev,
          signatureUrl: dataUrl,
          signatureEnabled: true,
        }));
        success('Signature Ready', 'Signature loaded. Click "Save Settings" to apply permanently.');
      } else {
        setQSettings((prev) => ({
          ...prev,
          stampUrl: dataUrl,
          stampEnabled: true,
        }));
        success('Stamp Ready', 'Company stamp loaded. Click "Save Settings" to apply permanently.');
      }
    };
    reader.readAsDataURL(file);
    // Reset target value so the same file can be re-selected if needed
    e.target.value = '';
  };

  // Remove Signature or Stamp
  const handleRemoveImage = (type: 'signature' | 'stamp') => {
    if (type === 'signature') {
      setQSettings((prev) => ({
        ...prev,
        signatureUrl: '',
        signatureEnabled: false,
      }));
      success('Signature Removed', 'Authorized signature cleared.');
    } else {
      setQSettings((prev) => ({
        ...prev,
        stampUrl: '',
        stampEnabled: false,
      }));
      success('Stamp Removed', 'Company stamp cleared.');
    }
  };

  // Restore Official Jubilant Signature & Stamp
  const handleRestoreOfficialAssets = () => {
    setQSettings((prev) => ({
      ...prev,
      signatureUrl: '/signature.png',
      stampUrl: '/stamp.png',
      signatureEnabled: true,
      stampEnabled: true,
      signatureSize: 'md',
      stampSize: 'md',
      signatoryName: 'Mohan Jha',
      signatoryDesignation: 'Commercial & Technical Operations',
    }));
    success('Official Assets Restored', 'Jubilant signature and stamp restored to defaults.');
  };

  // Save Bank Account
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank.bankName || !editingBank.accountNumber || !editingBank.ifscCode) {
      error('Validation Error', 'Bank name, Account number and IFSC are required');
      return;
    }

    storage.saveBankAccount(editingBank);
    setBankAccounts(storage.getBankAccounts());
    setIsBankModalOpen(false);
    success('Bank Details Saved', 'Remittance account saved');
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      error('Cannot Delete', 'At least one bank remittance account must remain');
      return;
    }
    storage.deleteBankAccount(id);
    setBankAccounts(storage.getBankAccounts());
    success('Bank Removed', 'Account removed');
  };

  // Desktop SQLite Database Backup & Restore
  const isDesktop = storage.isElectron();

  const handleBackupSQLite = async () => {
    const res = await storage.backupSQLiteDatabase();
    if (res.success) {
      success('Database Backed Up', `SQLite database backup saved successfully`);
    } else if (res.error && res.error !== 'Cancelled by user') {
      error('Backup Error', res.error);
    }
  };

  const handleRestoreSQLite = async () => {
    const res = await storage.restoreSQLiteDatabase();
    if (res.success) {
      success('Database Restored', 'Database backup restored successfully.');
    } else if (res.error && res.error !== 'Cancelled by user') {
      error('Restore Error', res.error);
    }
  };

  // Backup & Restore
  const handleExportData = () => {
    const json = storage.exportAllDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jubilant_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Backup Exported', 'Full database JSON backup downloaded');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = storage.importDataJson(text);
        if (ok) {
          success('Data Restored', 'Database backup imported successfully. Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          error('Import Failed', 'Invalid JSON backup file structure');
        }
      } catch (err) {
        error('Import Error', 'Could not parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset the system database? This will clear all quotations, keep 1 demo company, and maintain your Jubilant Metal and Alloys company profile and product catalog.'
      )
    ) {
      storage.resetToSampleData();
      success('System Reset', 'Clean system state restored. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          System Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Company profile, quotation numbering schemes, bank remittance details, and data backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'company', label: 'Company Profile & Letterhead', icon: Building2 },
          { id: 'quotation', label: 'Quotation Numbering & Defaults', icon: FileText },
          { id: 'signatory', label: 'Authorized Signature & Stamp', icon: Stamp },
          { id: 'bank', label: 'Bank Remittance Accounts', icon: Landmark },
          { id: 'data', label: 'Data Management & Reset', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Official Company & Letterhead Information
            </h2>

            {/* Logo Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={resolveLogoUrl(company.logo)}
                alt="Logo preview"
                className="h-14 w-auto max-w-[260px] object-contain bg-white p-2 rounded-lg border border-slate-200"
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-slate-800">Company Brand Logo</p>
                <p className="text-[11px] text-slate-500">
                  Used as official letterhead on quotations, documents, print layout, and portal navigation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Tagline / Subtitle</label>
                <input
                  type="text"
                  value={company.tagline}
                  onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={company.gstin}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      gstin: e.target.value.toUpperCase(),
                      stateCode: e.target.value.substring(0, 2),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PAN Number <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={company.pan || ''}
                  onChange={(e) => setCompany({ ...company, pan: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CIN (Corporate Identity) <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={company.cin || ''}
                  onChange={(e) => setCompany({ ...company, cin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Address Line 1</label>
                <input
                  type="text"
                  required
                  value={company.addressLine1}
                  onChange={(e) => setCompany({ ...company, addressLine1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address Line 2 (Area / Yard)</label>
                <input
                  type="text"
                  value={company.addressLine2 || ''}
                  onChange={(e) => setCompany({ ...company, addressLine2: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State (Home State for GST)</label>
                <input
                  type="text"
                  value={company.state}
                  onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State Code</label>
                <input
                  type="text"
                  value={company.stateCode}
                  onChange={(e) => setCompany({ ...company, stateCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={company.pinCode}
                  onChange={(e) => setCompany({ ...company, pinCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone / Telephone</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Sales Email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={company.website}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Quotation Numbering & Commercial Defaults */}
      {activeTab === 'quotation' && (
        <form onSubmit={handleSaveQuotationSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Quotation Sequence & Numbering Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prefix</label>
                <input
                  type="text"
                  required
                  value={qSettings.prefix}
                  onChange={(e) => setQSettings({ ...qSettings, prefix: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">e.g. JMA</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Sequence Counter</label>
                <input
                  type="number"
                  required
                  value={qSettings.sequenceNumber}
                  onChange={(e) => setQSettings({ ...qSettings, sequenceNumber: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Increments after every new quote</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Scheme</label>
                <input
                  type="text"
                  required
                  value={qSettings.formatTemplate}
                  onChange={(e) => setQSettings({ ...qSettings, formatTemplate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">&#123;PREFIX&#125;-&#123;YEAR&#125;-&#123;NUMBER&#125;</span>
              </div>
            </div>

            {/* Live Number Example */}
            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-700 block">Preview Next Quotation Number</span>
                <p className="font-mono font-bold text-sm text-red-900">
                  {(qSettings.formatTemplate || '{PREFIX}-{YEAR}-{NUMBER}')
                    .replace('{PREFIX}', qSettings.prefix || 'JMA')
                    .replace('{YEAR}', new Date().getFullYear().toString())
                    .replace('{NUMBER}', (qSettings.sequenceNumber || 1011).toString().padStart(4, '0'))}
                </p>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pt-4 pb-2">
              Proforma Invoice Sequence & Numbering Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PI Prefix</label>
                <input
                  type="text"
                  required
                  value={qSettings.piPrefix || 'JMA-PI'}
                  onChange={(e) => setQSettings({ ...qSettings, piPrefix: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">e.g. JMA-PI</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Proforma Sequence Counter</label>
                <input
                  type="number"
                  required
                  value={qSettings.piSequenceNumber || 501}
                  onChange={(e) => setQSettings({ ...qSettings, piSequenceNumber: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Independent sequence counter for Proforma Invoices</span>
              </div>
            </div>

            {/* Live PI Number Example */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Preview Next Proforma Invoice Number</span>
                <p className="font-mono font-bold text-sm text-blue-900">
                  {`${qSettings.piPrefix || 'JMA-PI'}-${new Date().getFullYear()}-${(qSettings.piSequenceNumber || 501).toString().padStart(4, '0')}`}
                </p>
              </div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pt-4 pb-2">
              Commercial Terms Defaults
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Quotation Validity (Days)</label>
                <input
                  type="number"
                  value={qSettings.defaultValidityDays}
                  onChange={(e) =>
                    setQSettings({ ...qSettings, defaultValidityDays: parseInt(e.target.value) || 15 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Delivery Terms</label>
                <input
                  type="text"
                  value={qSettings.defaultDeliveryTerms}
                  onChange={(e) => setQSettings({ ...qSettings, defaultDeliveryTerms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Payment Terms</label>
              <input
                type="text"
                value={qSettings.defaultPaymentTerms}
                onChange={(e) => setQSettings({ ...qSettings, defaultPaymentTerms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
              />
            </div>

            {/* Authorized Signature & Stamp Section Shortcut */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-red-600" />
                    <span>Authorized Signature & Company Stamp</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload and manage official authorized signature and company stamp used on all quotation documents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('signatory')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Configure Signature & Stamp →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="h-12 w-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {qSettings.signatureUrl ? (
                      <img src={resolveSignatureUrl(qSettings.signatureUrl)} alt="Signature" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No signature</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">Signature: {qSettings.signatureUrl ? 'Configured' : 'Not Set'}</p>
                    <p className="text-[11px] text-slate-500">Status: {qSettings.signatureEnabled !== false ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="h-12 w-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                    {qSettings.stampUrl ? (
                      <img src={resolveStampUrl(qSettings.stampUrl)} alt="Stamp" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No stamp</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">Stamp: {qSettings.stampUrl ? 'Configured' : 'Not Set'}</p>
                    <p className="text-[11px] text-slate-500">Status: {qSettings.stampEnabled !== false ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Quotation Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB: Authorized Signature & Stamp */}
      {activeTab === 'signatory' && (
        <div className="space-y-6 text-xs">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stamp className="w-5 h-5 text-red-600" />
                <span>Authorized Signature & Company Stamp</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload official authorized signature and circular company seal stamp. These will automatically appear on all Quotation Previews, Downloaded PDFs, Print A4 copies, and WhatsApp document shares.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreOfficialAssets}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                title="Restore Mohan Jha signature and Sunmarg India company stamp"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Official Assets</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotationSettings()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Signature Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Authorized Signature
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Supports PNG (transparent recommended), JPG, JPEG, and WebP.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qSettings.signatureEnabled !== false}
                      onChange={(e) =>
                        setQSettings({ ...qSettings, signatureEnabled: e.target.checked })
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Enable Signature</span>
                  </label>
                </div>

                {/* Preview Box & Upload Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="h-28 w-44 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden shrink-0">
                    {qSettings.signatureUrl ? (
                      <img
                        src={resolveSignatureUrl(qSettings.signatureUrl)}
                        alt="Signature Preview"
                        className="max-h-full max-w-full object-contain select-none"
                      />
                    ) : (
                      <div className="text-center text-slate-400 space-y-1">
                        <ImageIcon className="w-6 h-6 mx-auto opacity-40" />
                        <span className="text-[10px] block">No signature uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full sm:w-auto text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{qSettings.signatureUrl ? 'Replace Signature' : 'Upload Signature'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => handleImageUpload(e, 'signature')}
                          className="hidden"
                        />
                      </label>

                      {qSettings.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('signature')}
                          className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-semibold transition-all text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Signature aspect ratio will be preserved without stretching.
                    </p>
                  </div>
                </div>

                {/* Size Controls */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Signature Display Size:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setQSettings({ ...qSettings, signatureSize: size })}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          (qSettings.signatureSize || 'md') === size
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {size === 'sm' ? 'Small' : size === 'md' ? 'Medium (Standard)' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Stamp Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Official Company Stamp
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Company rubber stamp or seal. Supports PNG, JPG, JPEG, and WebP.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qSettings.stampEnabled !== false}
                      onChange={(e) =>
                        setQSettings({ ...qSettings, stampEnabled: e.target.checked })
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Enable Stamp</span>
                  </label>
                </div>

                {/* Preview Box & Upload Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="h-28 w-28 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 shadow-inner overflow-hidden shrink-0">
                    {qSettings.stampUrl ? (
                      <img
                        src={resolveStampUrl(qSettings.stampUrl)}
                        alt="Stamp Preview"
                        className="max-h-full max-w-full object-contain select-none"
                      />
                    ) : (
                      <div className="text-center text-slate-400 space-y-1">
                        <Stamp className="w-6 h-6 mx-auto opacity-40" />
                        <span className="text-[10px] block">No stamp uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full sm:w-auto text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{qSettings.stampUrl ? 'Replace Stamp' : 'Upload Stamp'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => handleImageUpload(e, 'stamp')}
                          className="hidden"
                        />
                      </label>

                      {qSettings.stampUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('stamp')}
                          className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-semibold transition-all text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      The stamp will appear centered above the authorized signature.
                    </p>
                  </div>
                </div>

                {/* Size Controls */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Stamp Display Size:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setQSettings({ ...qSettings, stampSize: size })}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          (qSettings.stampSize || 'md') === size
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {size === 'sm' ? 'Small' : size === 'md' ? 'Medium (Standard)' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Signatory Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Signatory Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Signatory Officer Name
                    </label>
                    <input
                      type="text"
                      value={qSettings.signatoryName || ''}
                      onChange={(e) => setQSettings({ ...qSettings, signatoryName: e.target.value })}
                      placeholder="e.g. Mohan Jha"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Signatory Designation / Subtitle
                    </label>
                    <input
                      type="text"
                      value={qSettings.signatoryDesignation || ''}
                      onChange={(e) =>
                        setQSettings({ ...qSettings, signatoryDesignation: e.target.value })
                      }
                      placeholder="e.g. Commercial & Technical Operations"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Document Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft sticky top-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-600" />
                    <span>Live Document Preview</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    A4 Quotation Footer
                  </span>
                </div>

                {/* Realistic Quotation Document Mockup */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center text-center">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">For</p>
                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                      {company.name || 'JUBILANT METAL AND ALLOYS'}
                    </p>

                    <div className="flex flex-col items-center justify-center py-2 min-h-[95px] gap-2">
                      {/* Stamp Preview */}
                      {qSettings.stampEnabled !== false && qSettings.stampUrl ? (
                        <img
                          src={resolveStampUrl(qSettings.stampUrl)}
                          alt="Stamp Preview"
                          className={`object-contain select-none transition-all ${
                            qSettings.stampSize === 'sm'
                              ? 'h-16 w-16'
                              : qSettings.stampSize === 'lg'
                              ? 'h-24 w-24'
                              : 'h-20 w-20'
                          }`}
                        />
                      ) : null}

                      {/* Signature Preview */}
                      {qSettings.signatureEnabled !== false && qSettings.signatureUrl ? (
                        <img
                          src={resolveSignatureUrl(qSettings.signatureUrl)}
                          alt="Signature Preview"
                          className={`object-contain select-none transition-all ${
                            qSettings.signatureSize === 'sm'
                              ? 'h-11 max-w-[160px]'
                              : qSettings.signatureSize === 'lg'
                              ? 'h-18 max-w-[240px]'
                              : 'h-14 max-w-[200px]'
                          }`}
                        />
                      ) : null}

                      {/* If neither enabled or uploaded */}
                      {(!qSettings.stampEnabled || !qSettings.stampUrl) &&
                        (!qSettings.signatureEnabled || !qSettings.signatureUrl) && (
                          <div className="h-14 flex items-center justify-center text-[11px] text-slate-400 italic">
                            (No stamp or signature enabled)
                          </div>
                        )}
                    </div>

                    <div className="border-t border-slate-400 pt-1.5 px-6 text-center min-w-[200px] mt-1">
                      <span className="font-bold text-slate-800 block text-xs">
                        Authorized Signatory
                      </span>
                      {qSettings.signatoryDesignation && (
                        <span className="text-[10px] text-slate-500 block">
                          {qSettings.signatoryDesignation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Historical Immutability Protected</span>
                  </p>
                  <p className="text-emerald-700">
                    Existing quotations preserve the exact signature and stamp captured when they were finalized. Any updates made here will automatically apply to newly generated quotations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveQuotationSettings()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Signature & Stamp Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bank Accounts */}
      {activeTab === 'bank' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Configured Remittance Accounts ({bankAccounts.length})
            </h2>
            <button
              onClick={() => {
                setEditingBank({
                  id: '',
                  bankName: '',
                  accountName: company.name,
                  accountNumber: '',
                  ifscCode: '',
                  branchName: '',
                  upiId: '',
                  swiftCode: '',
                  isDefault: false,
                });
                setIsBankModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Bank Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{b.bankName}</span>
                    {b.isDefault && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Default Remittance
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-slate-600 font-mono">
                    <p>A/C: <strong className="text-slate-900">{b.accountNumber}</strong></p>
                    <p>IFSC: <strong className="text-slate-900">{b.ifscCode}</strong></p>
                    <p className="font-sans text-xs">Branch: {b.branchName}</p>
                    {b.upiId && <p className="font-sans text-xs">UPI: {b.upiId}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setEditingBank(b);
                      setIsBankModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Edit Account
                  </button>
                  <button
                    onClick={() => handleDeleteBank(b.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bank Modal */}
          {isBankModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingBank.id ? 'Edit Bank Account' : 'Add Bank Account'}
                </h3>
                <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={editingBank.bankName}
                      onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                      placeholder="HDFC Bank Limited"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Account Name</label>
                    <input
                      type="text"
                      required
                      value={editingBank.accountName}
                      onChange={(e) => setEditingBank({ ...editingBank, accountName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      value={editingBank.accountNumber}
                      onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={editingBank.ifscCode}
                      onChange={(e) => setEditingBank({ ...editingBank, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Branch Name</label>
                    <input
                      type="text"
                      required
                      value={editingBank.branchName}
                      onChange={(e) => setEditingBank({ ...editingBank, branchName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      value={editingBank.upiId || ''}
                      onChange={(e) => setEditingBank({ ...editingBank, upiId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="defBank"
                      checked={editingBank.isDefault}
                      onChange={(e) => setEditingBank({ ...editingBank, isDefault: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="defBank" className="font-semibold cursor-pointer">
                      Make this the default bank account for quotations
                    </label>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBankModalOpen(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl shadow-md"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Data Management & Backup */}
      {activeTab === 'data' && (
        <div className="space-y-6 text-xs">
          {/* Backup & Restore */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              System Backup & Data Migration
            </h2>
            <p className="text-slate-600">
              You can download a complete backup of all database records (quotations, customers, products, categories, templates and settings) to backup your database or transfer it to another environment.
            </p>

            {isDesktop && (
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-emerald-900 text-xs">Persistent SQLite Desktop Database</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Your quotation records are saved permanently in Windows AppData SQLite database.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBackupSQLite}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup Database (.db)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreSQLite}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore Database (.db)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Snapshot</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Restore from JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Database */}
          <div className="bg-red-50/60 p-6 rounded-2xl border border-red-200 shadow-soft space-y-3">
            <h2 className="text-sm font-bold text-red-900 uppercase tracking-wider">
              Reset Database to Clean State
            </h2>
            <p className="text-red-700">
              Clear all quotation records and reset customer database to 1 single demo company (<strong>Demo Engineering Corporation Pvt Ltd</strong>). Your Jubilant Metal and Alloys company settings, logo, bank accounts, and 20 industrial metal products will be preserved intact.
            </p>
            <button
              type="button"
              onClick={handleResetSampleData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Database to Clean State</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
