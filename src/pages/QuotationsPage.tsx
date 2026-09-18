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
} from 'lucide-react';
import { storage } from '../services/storage';
import { formatINR } from '../utils/calculator';
import { Quotation, QuotationStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationDocument } from '../components/quotation/QuotationDocument';
import { ShareModal } from '../components/quotation/ShareModal';

export const QuotationsPage: React.FC = () => {
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
  const [shareQuotation, setShareQuotation] = useState<Quotation | null>(null);
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  const quotations = useMemo(() => storage.getQuotations(), [refreshKey]);
  const customers = useMemo(() => storage.getCustomers(), [refreshKey]);

  // Status Tabs
  const statusTabs: { id: string; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = { all: quotations.length };
    quotations.forEach((q) => {
      counts[q.status] = (counts[q.status] || 0) + 1;
    });
    return [
      { id: 'all', label: 'All Quotations', count: quotations.length },
      { id: 'approved', label: 'Approved', count: counts['approved'] || 0 },
      { id: 'sent', label: 'Sent', count: counts['sent'] || 0 },
      { id: 'under_negotiation', label: 'In Negotiation', count: counts['under_negotiation'] || 0 },
      { id: 'draft', label: 'Drafts', count: counts['draft'] || 0 },
      { id: 'viewed', label: 'Viewed', count: counts['viewed'] || 0 },
      { id: 'converted', label: 'Converted', count: counts['converted'] || 0 },
      { id: 'expired', label: 'Expired', count: counts['expired'] || 0 },
    ];
  }, [quotations]);

  // Filtering Logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = q.quotationNumber.toLowerCase().includes(query);
        const matchCustomer = q.customerName.toLowerCase().includes(query);
        const matchEmail = q.customerEmail?.toLowerCase().includes(query);
        const matchPhone = q.customerPhone?.includes(query);
        if (!matchNumber && !matchCustomer && !matchEmail && !matchPhone) return false;
      }

      // Status
      if (selectedStatus !== 'all' && q.status !== selectedStatus) {
        return false;
      }

      // Customer
      if (selectedCustomer !== 'all' && q.customerId !== selectedCustomer) {
        return false;
      }

      // Amount Range
      if (minAmount && q.grandTotal < parseFloat(minAmount)) return false;
      if (maxAmount && q.grandTotal > parseFloat(maxAmount)) return false;

      // Date Range
      if (startDate && q.quotationDate < startDate) return false;
      if (endDate && q.quotationDate > endDate) return false;

      return true;
    });
  }, [quotations, searchQuery, selectedStatus, selectedCustomer, minAmount, maxAmount, startDate, endDate]);

  const handleDuplicate = (id: string) => {
    const dup = storage.duplicateQuotation(id);
    if (dup) {
      success('Quotation Duplicated', `Created new draft ${dup.quotationNumber}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (window.confirm(`Are you sure you want to delete quotation ${num}?`)) {
      storage.deleteQuotation(id);
      success('Quotation Deleted', `Removed quotation ${num}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDownloadPdf = async (q: Quotation) => {
    setPrintingQuotation(q);
    setTimeout(async () => {
      const ok = await generateQuotationPDF({
        elementId: 'hidden-print-doc',
        filename: `${q.quotationNumber}-Jubilant.pdf`,
      });
      if (ok) success('PDF Exported', `Downloaded ${q.quotationNumber}.pdf`);
      setPrintingQuotation(null);
    }, 200);
  };

  const handlePrint = (q: Quotation) => {
    setPrintingQuotation(q);
    setTimeout(() => {
      window.print();
      setPrintingQuotation(null);
    }, 200);
  };

  const handleExportCSV = () => {
    const headers = [
      'Quotation Number',
      'Date',
      'Valid Until',
      'Customer',
      'GSTIN',
      'Items Count',
      'Subtotal',
      'Taxable Amount',
      'Total Tax',
      'Grand Total',
      'Status',
      'Salesperson',
    ];

    const rows = filteredQuotations.map((q) => [
      q.quotationNumber,
      q.quotationDate,
      q.validUntil,
      `"${q.customerName.replace(/"/g, '""')}"`,
      q.customerGstin,
      q.items.length,
      q.subtotal,
      q.taxableAmount,
      q.totalTax,
      q.grandTotal,
      q.status,
      q.salesperson || q.createdByName,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jubilant_Quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Downloaded quotations spreadsheet');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, generate, print and track your industrial quotations.
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
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border shadow-soft transition-colors ${
              showFilters
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => navigate('/quotations/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedStatus === tab.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedStatus === tab.id ? 'bg-red-800 text-red-100' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Expanded Filters Drawer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quotation number, customer name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-fade-in">
            {/* Customer Filter */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Filter by Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:border-red-500"
              >
                <option value="all">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Min Value (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono outline-none focus:border-red-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-red-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-red-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Quotations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No quotations match your current filter criteria. Clear filters or create a new quotation.
            </p>
            <button
              onClick={() => navigate('/quotations/new')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              + Create First Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3.5 px-4">Quotation No.</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Valid Until</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Tax (GST)</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => {
                  const statusBadgeClasses: Record<string, string> = {
                    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    sent: 'bg-blue-50 text-blue-700 border-blue-200',
                    under_negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
                    viewed: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                    draft: 'bg-slate-100 text-slate-700 border-slate-200',
                    expired: 'bg-orange-50 text-orange-700 border-orange-200',
                    rejected: 'bg-red-50 text-red-700 border-red-200',
                    converted: 'bg-purple-50 text-purple-700 border-purple-200',
                  };

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => navigate(`/quotations/${q.id}`)}
                          className="font-mono font-bold text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          {q.quotationNumber}
                        </span>
                        {q.referenceNumber && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {q.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{q.quotationDate}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{q.validUntil}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 truncate max-w-xs">{q.customerName}</p>
                        <p className="text-[11px] text-slate-400">
                          {q.customerCity}, {q.customerState}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {q.items.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatINR(q.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatINR(q.totalTax)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(q.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                            statusBadgeClasses[q.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/quotations/${q.id}`)}
                            title="View Quotation"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/quotations/${q.id}/edit`)}
                            title="Edit Quotation"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShareQuotation(q)}
                            title="Share Quotation"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(q.id)}
                            title="Duplicate Quotation"
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(q)}
                            title="Download PDF"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(q)}
                            title="Print Document"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id, q.quotationNumber)}
                            title="Delete Quotation"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredQuotations.length}</strong> of{' '}
            <strong className="text-slate-800">{quotations.length}</strong> total quotations
          </span>
          <span className="font-mono font-semibold text-slate-700">
            Filtered Total: {formatINR(filteredQuotations.reduce((acc, q) => acc + q.grandTotal, 0))}
          </span>
        </div>
      </div>

      {/* Share Modal */}
      {shareQuotation && (
        <ShareModal
          quotation={shareQuotation}
          isOpen={Boolean(shareQuotation)}
          onClose={() => setShareQuotation(null)}
        />
      )}

      {/* Hidden container for printing/PDF */}
      {printingQuotation && (
        <div className="fixed left-0 top-0 pointer-events-none opacity-100 -z-50" style={{ width: '794px' }}>
          <QuotationDocument quotation={printingQuotation} id="hidden-print-doc" />
        </div>
      )}
    </div>
  );
};
