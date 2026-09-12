import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  Copy,
  Printer,
  Trash2,
  Share2,
  Calendar,
  X,
  FileSpreadsheet,
  ReceiptText,
} from 'lucide-react';
import { storage } from '../services/storage';
import { formatINR } from '../utils/calculator';
import { ProformaInvoice, ProformaStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { generateProformaPDF } from '../utils/pdfGenerator';
import { ProformaDocument } from '../components/proforma/ProformaDocument';
import { ProformaShareModal } from '../components/proforma/ProformaShareModal';

export const ProformasPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Print
  const [shareProforma, setShareProforma] = useState<ProformaInvoice | null>(null);
  const [printingProforma, setPrintingProforma] = useState<ProformaInvoice | null>(null);

  const proformas = useMemo(() => storage.getProformaInvoices(), [refreshKey]);
  const customers = useMemo(() => storage.getCustomers(), [refreshKey]);

  // Status Tabs
  const statusTabs: { id: string; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = { all: proformas.length };
    proformas.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return [
      { id: 'all', label: 'All Proformas', count: proformas.length },
      { id: 'approved', label: 'Approved', count: counts['approved'] || 0 },
      { id: 'sent', label: 'Sent', count: counts['sent'] || 0 },
      { id: 'paid', label: 'Paid', count: counts['paid'] || 0 },
      { id: 'draft', label: 'Drafts', count: counts['draft'] || 0 },
      { id: 'cancelled', label: 'Cancelled', count: counts['cancelled'] || 0 },
    ];
  }, [proformas]);

  // Filtering Logic
  const filteredProformas = useMemo(() => {
    return proformas.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = p.proformaNumber.toLowerCase().includes(query);
        const matchCustomer = p.customerName.toLowerCase().includes(query);
        const matchShipTo = p.shipToCompany?.toLowerCase().includes(query);
        const matchEmail = p.customerEmail?.toLowerCase().includes(query);
        const matchPhone = p.customerPhone?.includes(query);
        if (!matchNumber && !matchCustomer && !matchShipTo && !matchEmail && !matchPhone) return false;
      }

      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      if (selectedCustomer !== 'all' && p.customerId !== selectedCustomer) {
        return false;
      }

      if (minAmount && p.grandTotal < parseFloat(minAmount)) return false;
      if (maxAmount && p.grandTotal > parseFloat(maxAmount)) return false;

      if (startDate && p.proformaDate < startDate) return false;
      if (endDate && p.proformaDate > endDate) return false;

      return true;
    });
  }, [proformas, searchQuery, selectedStatus, selectedCustomer, minAmount, maxAmount, startDate, endDate]);

  const handleDuplicate = (id: string) => {
    const dup = storage.duplicateProformaInvoice(id);
    if (dup) {
      success('Proforma Duplicated', `Created new draft ${dup.proformaNumber}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (window.confirm(`Are you sure you want to delete Proforma Invoice ${num}?`)) {
      storage.deleteProformaInvoice(id);
      success('Proforma Deleted', `Removed Proforma ${num}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDownloadPdf = async (p: ProformaInvoice) => {
    setPrintingProforma(p);
    setTimeout(async () => {
      const ok = await generateProformaPDF({
        elementId: 'hidden-print-proforma-doc',
        filename: `${p.proformaNumber}-Jubilant.pdf`,
      });
      if (ok) success('PDF Exported', `Downloaded ${p.proformaNumber}.pdf`);
      setPrintingProforma(null);
    }, 200);
  };

  const handlePrint = (p: ProformaInvoice) => {
    setPrintingProforma(p);
    setTimeout(() => {
      window.print();
      setPrintingProforma(null);
    }, 200);
  };

  const handleExportCSV = () => {
    const headers = [
      'Proforma Number',
      'Date',
      'Valid Until',
      'Buyer (Bill To)',
      'Consignee (Ship To)',
      'GSTIN',
      'Items Count',
      'Subtotal',
      'Taxable Amount',
      'Total Tax',
      'Grand Total',
      'Status',
      'Prepared By',
    ];

    const rows = filteredProformas.map((p) => [
      p.proformaNumber,
      p.proformaDate,
      p.validUntil,
      `"${p.customerName.replace(/"/g, '""')}"`,
      `"${(p.shipToCompany || p.customerName).replace(/"/g, '""')}"`,
      p.customerGstin,
      p.items.length,
      p.subtotal,
      p.taxableAmount,
      p.totalTax,
      p.grandTotal,
      p.status,
      p.preparedBy || p.createdByName,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jubilant_Proformas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Downloaded Proforma spreadsheet');
  };

  const statusBadgeClasses: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    paid: 'bg-blue-50 text-blue-700 border-blue-300',
    sent: 'bg-sky-50 text-sky-700 border-sky-300',
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    cancelled: 'bg-red-50 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-xs">
              COMMERCIAL PI
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Proforma Invoices
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, print, track and manage commercial Proforma Invoices with dedicated delivery addresses.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/proformas/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all hover:shadow-lg hover:shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proforma</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedStatus === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedStatus === tab.id ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PI Number, Customer Name, Consignee, Email, Phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showFilters || selectedCustomer !== 'all' || minAmount || maxAmount || startDate || endDate
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Filter</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="all">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Value (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Value (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="5000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedCustomer('all');
                  setMinAmount('');
                  setMaxAmount('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proformas Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {filteredProformas.length === 0 ? (
          <div className="py-16 text-center">
            <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Proforma Invoices Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {proformas.length === 0
                ? 'Create your first commercial Proforma Invoice with Bill To and Ship To specifications.'
                : 'No Proforma Invoices match the applied filter criteria.'}
            </p>
            <button
              onClick={() => navigate('/proformas/new')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Proforma Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Proforma No</th>
                  <th className="py-3 px-4">Date / Valid Until</th>
                  <th className="py-3 px-4">Buyer (Bill To)</th>
                  <th className="py-3 px-4">Consignee (Ship To)</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProformas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span
                        onClick={() => navigate(`/proformas/${p.id}`)}
                        className="cursor-pointer text-red-600 hover:underline"
                      >
                        {p.proformaNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-semibold text-slate-800">{p.proformaDate}</p>
                      <p className="text-[10px] text-slate-400">Valid: {p.validUntil}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{p.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">GST: {p.customerGstin}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-semibold text-slate-800 leading-snug">
                        {p.shipToCompany || p.customerName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.shipToCity || p.customerCity}, {p.shipToState || p.customerState}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {p.items.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(p.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          statusBadgeClasses[p.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/proformas/${p.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Proforma"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/proformas/${p.id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Proforma"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(p)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShareProforma(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Share via WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Print A4"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.proformaNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareProforma && (
        <ProformaShareModal
          proforma={shareProforma}
          isOpen={Boolean(shareProforma)}
          onClose={() => setShareProforma(null)}
        />
      )}

      {/* Hidden Print Container for listing action PDF/Print */}
      {printingProforma && (
        <div className="hidden">
          <ProformaDocument
            proforma={printingProforma}
            id="hidden-print-proforma-doc"
          />
        </div>
      )}
    </div>
  );
};
