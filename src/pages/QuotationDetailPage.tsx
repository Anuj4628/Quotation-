import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Copy,
  Printer,
  Download,
  Share2,
  Trash2,
  Clock,
  CheckCircle2,
  ChevronDown,
  History,
  FileCheck2,
  Sparkles,
  Palette,
  DollarSign,
  Globe,
} from 'lucide-react';
import { storage } from '../services/storage';
import { Quotation, QuotationStatus } from '../types';
import { formatINR } from '../utils/calculator';
import { useToast } from '../context/ToastContext';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationDocument } from '../components/quotation/QuotationDocument';
import { ShareModal } from '../components/quotation/ShareModal';
import { ThemeSelectorModal } from '../components/quotation/ThemeSelectorModal';
import { CurrencySelectorModal } from '../components/quotation/CurrencySelectorModal';
import { QUOTATION_THEMES } from '../types/theme';
import { getCurrencyInfo } from '../services/currencyService';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const [newStatus, setNewStatus] = useState<QuotationStatus>('approved');
  const [statusNote, setStatusNote] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const quotation = useMemo(() => {
    if (!id) return undefined;
    return storage.getQuotationById(id);
  }, [id, refreshKey]);

  // Theme & Currency active state (live responsive without full reload)
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    const q = id ? storage.getQuotationById(id) : undefined;
    return q?.themeId || storage.getSettings().defaultTheme || 'modern';
  });
  const [activeCurrency, setActiveCurrency] = useState<string>(() => {
    const q = id ? storage.getQuotationById(id) : undefined;
    return q?.displayCurrency || 'INR';
  });
  const [activeRate, setActiveRate] = useState<number | undefined>(() => {
    const q = id ? storage.getQuotationById(id) : undefined;
    return q?.exchangeRate;
  });
  const [activeRateDate, setActiveRateDate] = useState<string | undefined>(() => {
    const q = id ? storage.getQuotationById(id) : undefined;
    return q?.exchangeRateDate;
  });
  const [activeIsCustomRate, setActiveIsCustomRate] = useState<boolean | undefined>(() => {
    const q = id ? storage.getQuotationById(id) : undefined;
    return q?.isCustomRate;
  });

  if (!quotation) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Quotation Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested quotation ID does not exist.</p>
        <button
          onClick={() => navigate('/quotations')}
          className="mt-4 px-4 py-2 bg-[#0D5C46] hover:bg-[#084434] text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Quotations List
        </button>
      </div>
    );
  }

  const handleDuplicate = () => {
    const dup = storage.duplicateQuotation(quotation.id);
    if (dup) {
      success('Quotation Duplicated', `Created new draft ${dup.quotationNumber}`);
      navigate(`/quotations/${dup.id}`);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?`)) {
      storage.deleteQuotation(quotation.id);
      success('Quotation Deleted', `Deleted ${quotation.quotationNumber}`);
      navigate('/quotations');
    }
  };

  const handleSelectTheme = (themeId: string, setAsGlobalDefault?: boolean) => {
    setActiveThemeId(themeId);
    storage.updateQuotationThemeAndCurrency(quotation.id, { themeId });
    if (setAsGlobalDefault) {
      storage.updateSettings({ defaultTheme: themeId });
    }
    const t = QUOTATION_THEMES.find((item) => item.id === themeId);
    success('Theme Applied', `Switched quotation to ${t?.name || themeId} theme`);
    setRefreshKey((k) => k + 1);
  };

  const handleApplyCurrency = (currencyData: {
    displayCurrency: string;
    exchangeRate: number;
    exchangeRateDate: string;
    isCustomRate: boolean;
    customRate?: number;
  }) => {
    setActiveCurrency(currencyData.displayCurrency);
    setActiveRate(currencyData.exchangeRate);
    setActiveRateDate(currencyData.exchangeRateDate);
    setActiveIsCustomRate(currencyData.isCustomRate);

    storage.updateQuotationThemeAndCurrency(quotation.id, currencyData);
    success(
      'Currency Updated',
      `Quotation converted to ${currencyData.displayCurrency} @ ${currencyData.exchangeRate}`
    );
    setRefreshKey((k) => k + 1);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const currSuffix = activeCurrency !== 'INR' ? `-${activeCurrency}` : '';
    const ok = await generateQuotationPDF({
      elementId: 'quotation-print-document',
      filename: `${quotation.quotationNumber}${currSuffix}-Quotation.pdf`,
    });
    setIsGeneratingPdf(false);
    if (ok) {
      success('PDF Generated', `Downloaded ${quotation.quotationNumber}${currSuffix}.pdf`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateQuotationStatus(quotation.id, newStatus, statusNote);
    success('Status Updated', `Status changed to ${newStatus.toUpperCase()}`);
    setIsStatusModalOpen(false);
    setStatusNote('');
    setRefreshKey((k) => k + 1);
  };

  const statusBadgeClasses: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    sent: 'bg-blue-50 text-blue-700 border-blue-300',
    under_negotiation: 'bg-amber-50 text-amber-700 border-amber-300',
    viewed: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    expired: 'bg-orange-50 text-orange-700 border-orange-300',
    rejected: 'bg-rose-50 text-rose-700 border-rose-300',
    converted: 'bg-purple-50 text-purple-700 border-purple-300',
  };

  const activeThemeObj = QUOTATION_THEMES.find((t) => t.id === activeThemeId) || QUOTATION_THEMES[0];
  const activeCurrencyInfo = getCurrencyInfo(activeCurrency);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Header */}
      <div className="no-print bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
                {quotation.quotationNumber}
              </h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  statusBadgeClasses[quotation.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {quotation.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{quotation.customerName}</strong> • Date: {quotation.quotationDate}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Change Status</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Share</span>
          </button>

          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-purple-600" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print ({activeThemeObj.paperSize})</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D5C46] hover:bg-[#084434] text-white text-xs font-bold shadow-md shadow-[#0D5C46]/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Delete quotation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Theme & Multi-Currency Controls Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Change Theme Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C46] hover:bg-[#084434] text-white text-xs font-bold shadow-md shadow-[#0D5C46]/20 border border-[#BC9647]/40 transition-all cursor-pointer"
          >
            <Palette className="w-4 h-4 text-[#BC9647]" />
            <span>Template: {activeThemeObj.name} ({activeThemeObj.paperSize})</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Change Currency Button */}
          <button
            onClick={() => setIsCurrencyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Currency: {activeCurrency} ({activeCurrencyInfo.symbol})</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Status badge */}
          <div className="flex items-center gap-2 text-xs">
            {activeThemeObj.category === 'festive' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                <span>🪔</span> Festive Theme: {activeThemeObj.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                🏢 Business Theme: {activeThemeObj.name}
              </span>
            )}
          </div>
        </div>

        {/* Currency rate transparency chip */}
        <div className="flex items-center gap-2 text-xs">
          {activeCurrency !== 'INR' && activeRate && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>
                1 INR = {activeRate < 0.01 ? activeRate.toFixed(6) : activeRate.toFixed(4)} {activeCurrency}
                {activeIsCustomRate ? ' (Custom Rate)' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Official Document Layout */}
      <div className="bg-slate-200/50 p-2 sm:p-6 rounded-2xl border border-slate-300/80 overflow-x-auto print:bg-white print:border-none print:p-0">
        <QuotationDocument
          quotation={quotation}
          id="quotation-print-document"
          themeId={activeThemeId}
          displayCurrency={activeCurrency}
          exchangeRate={activeRate}
          exchangeRateDate={activeRateDate}
          isCustomRate={activeIsCustomRate}
        />
      </div>

      {/* Audit Trail & Activity Timeline */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-[#0D5C46]" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quotation Audit Log & Lifecycle Activity
          </h3>
        </div>

        <div className="space-y-3">
          {quotation.statusHistory && quotation.statusHistory.length > 0 ? (
            quotation.statusHistory.map((hist, idx) => (
              <div key={hist.id || idx} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#0D5C46] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 capitalize">
                      Status: {hist.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(hist.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {hist.note && <p className="text-slate-600 mt-1">{hist.note}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Updated by {hist.updatedByName}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No audit history recorded.</p>
          )}
        </div>
      </div>

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Change Quotation Status</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleStatusChangeSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as QuotationStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold capitalize text-slate-800"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="under_negotiation">Under Negotiation</option>
                  <option value="approved">Approved</option>
                  <option value="converted">Converted (Invoice)</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Note</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Client confirmed PO via email..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D5C46] hover:bg-[#084434] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal
          quotation={quotation}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Theme Selector Modal */}
      {isThemeModalOpen && (
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentThemeId={activeThemeId}
          onSelectTheme={handleSelectTheme}
        />
      )}

      {/* Currency Selector Modal */}
      {isCurrencyModalOpen && (
        <CurrencySelectorModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
          quotation={quotation}
          currentCurrency={activeCurrency}
          currentRate={activeRate}
          currentIsCustomRate={activeIsCustomRate}
          onApplyCurrency={handleApplyCurrency}
        />
      )}
    </div>
  );
};
