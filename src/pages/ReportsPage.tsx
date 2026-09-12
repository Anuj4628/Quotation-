import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Package,
  Layers,
} from 'lucide-react';
import { storage } from '../services/storage';
import { formatINR } from '../utils/calculator';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const { success } = useToast();
  const [reportType, setReportType] = useState<'summary' | 'customer' | 'product' | 'status'>('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const quotations = storage.getQuotations();
  const customers = storage.getCustomers();
  const products = storage.getProducts();

  // Filtered by date range
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (startDate && q.quotationDate < startDate) return false;
      if (endDate && q.quotationDate > endDate) return false;
      return true;
    });
  }, [quotations, startDate, endDate]);

  // Total metrics
  const totalValue = filteredQuotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const totalTax = filteredQuotations.reduce((acc, q) => acc + q.totalTax, 0);
  const totalTaxable = filteredQuotations.reduce((acc, q) => acc + q.taxableAmount, 0);

  // Customer-wise Report Data
  const customerBreakdown = useMemo(() => {
    const map: Record<string, { name: string; state: string; count: number; value: number }> = {};
    filteredQuotations.forEach((q) => {
      if (!map[q.customerId]) {
        map[q.customerId] = { name: q.customerName, state: q.customerState, count: 0, value: 0 };
      }
      map[q.customerId].count += 1;
      map[q.customerId].value += q.grandTotal;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filteredQuotations]);

  // Status-wise Report Data
  const statusBreakdown = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    filteredQuotations.forEach((q) => {
      if (!map[q.status]) {
        map[q.status] = { count: 0, value: 0 };
      }
      map[q.status].count += 1;
      map[q.status].value += q.grandTotal;
    });
    return Object.entries(map).map(([status, data]) => ({ status, ...data }));
  }, [filteredQuotations]);

  // Product category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    filteredQuotations.forEach((q) => {
      q.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const cat = prod ? prod.categoryName : 'General Supply';
        if (!map[cat]) {
          map[cat] = { count: 0, value: 0 };
        }
        map[cat].count += it.quantity;
        map[cat].value += it.totalAmount;
      });
    });
    return Object.entries(map).map(([cat, d]) => ({ category: cat, ...d }));
  }, [filteredQuotations, products]);

  const handleExport = () => {
    const headers = ['Report Category', 'Metric / Item', 'Quotes Count', 'Grand Total (INR)'];
    const rows: (string | number)[][] = [];

    if (reportType === 'customer') {
      customerBreakdown.forEach((c) => rows.push(['Customer', `"${c.name}"`, c.count, c.value]));
    } else if (reportType === 'status') {
      statusBreakdown.forEach((s) => rows.push(['Status', s.status.toUpperCase(), s.count, s.value]));
    } else if (reportType === 'product') {
      categoryBreakdown.forEach((p) => rows.push(['Product Category', `"${p.category}"`, p.count, p.value]));
    } else {
      rows.push(['Summary', 'Total Quotations', filteredQuotations.length, totalValue]);
      rows.push(['Summary', 'Taxable Amount', '-', totalTaxable]);
      rows.push(['Summary', 'GST Collections', '-', totalTax]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Jubilant_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report Exported', 'CSV report downloaded');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Sales & Quotation Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commercial summaries, customer-wise analysis and statutory tax reports.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filters & Report Type Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'summary', label: 'Commercial Summary' },
            { id: 'customer', label: 'Customer-wise' },
            { id: 'product', label: 'Product-wise' },
            { id: 'status', label: 'Status-wise' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                reportType === tab.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Proposal Volume</span>
          <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-1 font-mono">
            {formatINR(totalValue)}
          </p>
          <p className="text-slate-500 mt-1">{filteredQuotations.length} Quotations evaluated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Taxable Base</span>
          <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-1 font-mono">
            {formatINR(totalTaxable)}
          </p>
          <p className="text-slate-500 mt-1">Net value before statutory levies</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">GST Liability</span>
          <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-1 font-mono text-red-600">
            {formatINR(totalTax)}
          </p>
          <p className="text-slate-500 mt-1">CGST, SGST & IGST combined</p>
        </div>
      </div>

      {/* Report Table Display */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 capitalize">
            {reportType === 'summary' && 'Quotation Ledger Breakdown'}
            {reportType === 'customer' && 'Customer-wise Quotation Summary'}
            {reportType === 'product' && 'Product Category Performance'}
            {reportType === 'status' && 'Status-wise Distribution Analysis'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'customer' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">Client Company</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-center">Quotations</th>
                  <th className="py-3 px-4 text-right">Total Proposal Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerBreakdown.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.state}</td>
                    <td className="py-3 px-4 text-center font-mono">{c.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(c.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'status' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">Quotation Status</th>
                  <th className="py-3 px-4 text-center">Count</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statusBreakdown.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold uppercase tracking-wider text-slate-800">
                      {s.status.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      {s.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(s.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'product' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">Product Category</th>
                  <th className="py-3 px-4 text-center">Units Quoted</th>
                  <th className="py-3 px-4 text-right">Total Category Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.category}</td>
                    <td className="py-3 px-4 text-center font-mono">{p.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(p.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'summary' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">Quotation No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-red-600">{q.quotationNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{q.quotationDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{q.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(q.taxableAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(q.totalTax)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(q.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {q.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
