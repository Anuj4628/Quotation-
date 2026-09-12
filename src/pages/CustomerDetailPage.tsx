import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react'
import { storage } from '../services/storage';
import { formatINR } from '../utils/calculator';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = useMemo(() => {
    if (!id) return undefined;
    return storage.getCustomerById(id);
  }, [id]);

  const customerQuotations = useMemo(() => {
    if (!id) return [];
    return storage.getQuotations().filter((q) => q.customerId === id);
  }, [id]);

  const customerProformas = useMemo(() => {
    if (!id) return [];
    return storage.getProformaInvoices().filter((p) => p.customerId === id);
  }, [id]);

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Customer Not Found</h2>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Customers
        </button>
      </div>
    );
  }

  const totalValue = customerQuotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const approvedQuotes = customerQuotations.filter((q) => q.status === 'approved' || q.status === 'converted');
  const pendingQuotes = customerQuotations.filter(
    (q) => q.status === 'draft' || q.status === 'sent' || q.status === 'under_negotiation'
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                {customer.customerCode}
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
                {customer.companyName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Attn: {customer.contactPerson} • {customer.city}, {customer.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/proformas/new`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-soft transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Create Proforma</span>
          </button>
          <button
            onClick={() => navigate(`/quotations/new?customerId=${customer.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </button>
        </div>
      </div>

      {/* Customer 360 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Total Quotations</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customerQuotations.length}</p>
          <p className="text-slate-500 mt-1">Lifetime inquiries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Total Proposal Value</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono truncate">{formatINR(totalValue)}</p>
          <p className="text-slate-500 mt-1">Cumulative order potential</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Approved & Converted</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedQuotes.length}</p>
          <p className="text-slate-500 mt-1">{formatINR(approvedQuotes.reduce((a, q) => a + q.grandTotal, 0))}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-slate-400 font-bold uppercase block text-[10px]">Active / Pending</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pendingQuotes.length}</p>
          <p className="text-slate-500 mt-1">{formatINR(pendingQuotes.reduce((a, q) => a + q.grandTotal, 0))}</p>
        </div>
      </div>

      {/* Customer Profile Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Customer Commercial Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Coordinates</span>
            <p className="font-semibold text-slate-800 mt-1">{customer.contactPerson}</p>
            {customer.designation && <p className="text-slate-500">{customer.designation}</p>}
            <p className="text-slate-600 mt-1">Email: {customer.email}</p>
            <p className="text-slate-600">Phone: {customer.phone}</p>
            {customer.whatsapp && <p className="text-slate-600">WhatsApp: {customer.whatsapp}</p>}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Statutory & Tax Details</span>
            <p className="font-mono font-bold text-slate-900 mt-1">GSTIN: {customer.gstin}</p>
            {customer.pan && <p className="font-mono text-slate-700">PAN: {customer.pan}</p>}
            <p className="text-slate-600 mt-1">State: {customer.state} (Code: {customer.stateCode})</p>
            <p className="text-slate-600">Standard Payment Terms: {customer.paymentTerms}</p>
            <p className="text-slate-600">Credit Limit: {formatINR(customer.creditLimit)}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Addresses</span>
            <div className="mt-1">
              <strong className="text-slate-700">Billing:</strong>
              <p className="text-slate-600">{customer.billingAddress}</p>
              <p className="text-slate-600">{customer.city}, {customer.state} - {customer.pinCode}</p>
            </div>
            {customer.shippingAddress && customer.shippingAddress !== customer.billingAddress && (
              <div className="mt-2">
                <strong className="text-slate-700">Shipping:</strong>
                <p className="text-slate-600">{customer.shippingAddress}</p>
              </div>
            )}
          </div>
        </div>

        {customer.notes && (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Notes</span>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1">
              {customer.notes}
            </p>
          </div>
        )}
      </div>

      {/* Customer Quotations History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Quotation History</h2>
            <p className="text-xs text-slate-500">All proposals sent to {customer.companyName}</p>
          </div>
        </div>

        {customerQuotations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No quotations created for this customer yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">Quotation No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{q.quotationDate}</td>
                    <td className="py-3 px-4 text-slate-600">{q.validUntil}</td>
                    <td className="py-3 px-4 text-center">{q.items.length}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(q.taxableAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(q.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {q.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Proforma Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Proforma Invoice History</h2>
            <p className="text-xs text-slate-500">Commercial Proforma Invoices issued to {customer.companyName}</p>
          </div>
          <button
            onClick={() => navigate(`/proformas/new`)}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Proforma</span>
          </button>
        </div>

        {customerProformas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No Proforma Invoices created for this customer yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4">PI No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Consignee</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerProformas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {p.proformaNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.proformaDate}</td>
                    <td className="py-3 px-4 text-slate-600">{p.validUntil}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.shipToCompany || customer.companyName}
                    </td>
                    <td className="py-3 px-4 text-center">{p.items.length}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(p.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/proformas/${p.id}`)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

