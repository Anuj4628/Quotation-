import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Package,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Copy,
  Printer,
  Download,
  Trash2,
  ArrowUpRight,
  Filter,
  Layers,
  Calendar,
} from 'lucide-react';
import { storage } from '../services/storage';
import { formatINR } from '../utils/calculator';
import { Quotation, QuotationStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationDocument } from '../components/quotation/QuotationDocument';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  const quotations = useMemo(() => storage.getQuotations(), [refreshKey]);
  const customers = useMemo(() => storage.getCustomers(), [refreshKey]);
  const products = useMemo(() => storage.getProducts(), [refreshKey]);

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    const totalQuotations = quotations.length;
    const totalValue = quotations.reduce((acc, q) => acc + q.grandTotal, 0);

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthQuotes = quotations.filter((q) => q.quotationDate.startsWith(currentYearMonth));
    const thisMonthValue = thisMonthQuotes.reduce((acc, q) => acc + q.grandTotal, 0);

    const pendingQuotes = quotations.filter(
      (q) => q.status === 'draft' || q.status === 'sent' || q.status === 'viewed' || q.status === 'under_negotiation'
    );
    const approvedQuotes = quotations.filter((q) => q.status === 'approved' || q.status === 'converted');

    const statusCounts: Record<QuotationStatus, number> = {
      draft: 0,
      sent: 0,
      viewed: 0,
      under_negotiation: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
    };

    quotations.forEach((q) => {
      if (statusCounts[q.status] !== undefined) {
        statusCounts[q.status]++;
      }
    });

    return {
      totalQuotations,
      totalValue,
      thisMonthValue,
      thisMonthCount: thisMonthQuotes.length,
      pendingCount: pendingQuotes.length,
      pendingValue: pendingQuotes.reduce((acc, q) => acc + q.grandTotal, 0),
      approvedCount: approvedQuotes.length,
      approvedValue: approvedQuotes.reduce((acc, q) => acc + q.grandTotal, 0),
      customersCount: customers.length,
      productsCount: products.length,
      statusCounts,
    };
  }, [quotations, customers, products]);

  // Monthly values for chart
  const monthlyData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    quotations.forEach((q) => {
      const monthKey = q.quotationDate.substring(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = { count: 0, total: 0 };
      }
      map[monthKey].count += 1;
      map[monthKey].total += q.grandTotal;
    });

    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { month, label, ...data };
      });
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'all') return quotations.slice(0, 8);
    return quotations.filter((q) => q.status === statusFilter).slice(0, 8);
  }, [quotations, statusFilter]);

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
      if (ok) success('PDF Generated', `Downloaded ${q.quotationNumber}.pdf`);
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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of your quotations, customers and sales activity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/proformas/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-soft transition-all"
          >
            <Plus className="w-4 h-4 text-red-400" />
            <span>New Proforma</span>
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

      {/* 7 KPI Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quotations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Quotations</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              {stats.totalQuotations}
            </p>
            <span className="text-xs font-semibold text-slate-500">All Time</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active commercial tenders</p>
        </div>

        {/* Card 2: Total Quotation Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Quotation Value</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 truncate">
              {formatINR(stats.totalValue)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-2">Across all quotation stages</p>
        </div>

        {/* Card 3: This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 truncate">
              {formatINR(stats.thisMonthValue)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-2">{stats.thisMonthCount} quotes generated this month</p>
        </div>

        {/* Card 4: Pending Quotations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Quotations</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
              {stats.pendingCount}
            </p>
            <span className="text-xs font-semibold text-blue-600 font-mono">
              {formatINR(stats.pendingValue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Under negotiation & review</p>
        </div>
      </div>

      {/* Secondary Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Approved Quotes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Approved & Converted</p>
            <p className="text-lg font-bold text-slate-900">{stats.approvedCount} ({formatINR(stats.approvedValue)})</p>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Active B2B Customers</p>
            <p className="text-lg font-bold text-slate-900">{stats.customersCount} Companies</p>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Metal & Alloy SKUs</p>
            <p className="text-lg font-bold text-slate-900">{stats.productsCount} Specifications</p>
          </div>
        </div>
      </div>

      {/* Analytics: Status Overview & Monthly Value Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quotation Status Overview */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quotation Status Overview</h2>
              <p className="text-xs text-slate-500">Distribution across sales funnel</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
              {stats.totalQuotations} Total
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([st, count]) => {
              const pct = stats.totalQuotations > 0 ? Math.round((count / stats.totalQuotations) * 100) : 0;
              const colorMap: Record<string, string> = {
                approved: 'bg-emerald-500',
                converted: 'bg-purple-600',
                sent: 'bg-blue-500',
                viewed: 'bg-cyan-500',
                under_negotiation: 'bg-amber-500',
                draft: 'bg-slate-400',
                expired: 'bg-orange-500',
                rejected: 'bg-red-500',
              };

              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="capitalize text-slate-700">{st.replace('_', ' ')}</span>
                    <span className="text-slate-500 font-mono">
                      {count} <span className="text-[11px] opacity-70">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorMap[st] || 'bg-slate-400'} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Quotation Value Bar Breakdown */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Quotation Value</h2>
              <p className="text-xs text-slate-500">Trend over recent billing cycles</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pipeline</span>
              <span className="text-sm font-bold font-mono text-slate-900">{formatINR(stats.totalValue)}</span>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No quotation activity yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Create your first metal quotation to visualize monthly value and conversion trends.
              </p>
              <button
                type="button"
                onClick={() => navigate('/quotations/new')}
                className="mt-4 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                + Create Quotation
              </button>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
              {monthlyData.map((item) => {
                const maxVal = Math.max(...monthlyData.map((d) => d.total), 1);
                const heightPct = Math.round((item.total / maxVal) * 100);

                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-slate-600 whitespace-nowrap">
                      {formatINR(item.total)}
                    </div>
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-44">
                      <div
                        className="w-full bg-gradient-to-t from-red-600 to-red-500 rounded-t-xl group-hover:from-red-700 group-hover:to-red-600 transition-all duration-300"
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 mt-1">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.count} quotes</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Quotations</h2>
            <p className="text-xs text-slate-500">Latest commercial proposals generated</p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['all', 'approved', 'sent', 'under_negotiation', 'draft'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Quotation No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-700">No quotations found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {quotations.length === 0
                        ? 'Your quotation database is clean. Create your first quotation to get started.'
                        : 'No quotations match the selected status filter.'}
                    </p>
                    {quotations.length === 0 && (
                      <button
                        type="button"
                        onClick={() => navigate('/quotations/new')}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Quotation</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
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
                    <td className="py-3 px-4">
                      <span
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="font-mono font-bold text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        {q.quotationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{q.quotationDate}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-xs">{q.customerName}</p>
                      <p className="text-[11px] text-slate-400">{q.customerState}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {q.items.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatINR(q.taxableAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatINR(q.totalTax)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(q.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                          statusBadgeClasses[q.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {q.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/quotations/${q.id}`)}
                          title="View Details"
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
                          title="Print Quotation"
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
              }))}
            </tbody>
          </table>
        </div>

        {/* View All Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Showing {filteredQuotations.length} of {quotations.length} total quotations
          </span>
          <button
            onClick={() => navigate('/quotations')}
            className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700"
          >
            <span>View All Quotations</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hidden container for printing/PDF export if triggered from table */}
      {printingQuotation && (
        <div className="fixed left-0 top-0 pointer-events-none opacity-100 -z-50" style={{ width: '794px' }}>
          <QuotationDocument quotation={printingQuotation} id="hidden-print-doc" />
        </div>
      )}
    </div>
  );
};
