import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  FilePlus2,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { storage } from '../services/storage';
import { Customer } from '../types';
import { useToast } from '../context/ToastContext';
import { formatINR, getStateCodeByName } from '../utils/calculator';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('400001');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [creditLimit, setCreditLimit] = useState<number>(5000000);
  const [notes, setNotes] = useState('');

  const customers = useMemo(() => storage.getCustomers(), [refreshKey]);
  const quotations = useMemo(() => storage.getQuotations(), [refreshKey]);

  // Compute quotation stats per customer
  const customerStats = useMemo(() => {
    const map: Record<string, { totalQuotes: number; totalValue: number; approvedCount: number }> = {};
    quotations.forEach((q) => {
      if (!map[q.customerId]) {
        map[q.customerId] = { totalQuotes: 0, totalValue: 0, approvedCount: 0 };
      }
      map[q.customerId].totalQuotes += 1;
      map[q.customerId].totalValue += q.grandTotal;
      if (q.status === 'approved' || q.status === 'converted') {
        map[q.customerId].approvedCount += 1;
      }
    });
    return map;
  }, [quotations]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        c.gstin.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(search.toLowerCase());

      const matchState = selectedState === 'all' || c.state === selectedState;
      return matchSearch && matchState;
    });
  }, [customers, search, selectedState]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.state)));
  }, [customers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCode(`CUST-JMA-${customers.length + 101}`);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setGstin('');
    setPan('');
    setBillingAddress('');
    setShippingAddress('');
    setCity('Mumbai');
    setState('Maharashtra');
    setPinCode('400001');
    setPaymentTerms('30 Days Net');
    setCreditLimit(5000000);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCode(c.customerCode);
    setCompanyName(c.companyName);
    setContactPerson(c.contactPerson);
    setEmail(c.email);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp || '');
    setGstin(c.gstin);
    setPan(c.pan || '');
    setBillingAddress(c.billingAddress);
    setShippingAddress(c.shippingAddress || c.billingAddress);
    setCity(c.city);
    setState(c.state);
    setPinCode(c.pinCode);
    setPaymentTerms(c.paymentTerms);
    setCreditLimit(c.creditLimit);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      error('Validation Error', 'Company Name is required');
      return;
    }

    const stateCode = getStateCodeByName(state, gstin);

    storage.saveCustomer({
      ...(editingCustomer ? { id: editingCustomer.id } : {}),
      customerCode: code,
      companyName,
      contactPerson,
      email,
      phone,
      whatsapp,
      gstin: gstin.toUpperCase(),
      pan: pan ? pan.toUpperCase() : (gstin && gstin.length >= 12 ? gstin.substring(2, 12) : ''),
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      city,
      state,
      stateCode,
      country: 'India',
      pinCode,
      paymentTerms,
      creditLimit: Number(creditLimit) || 0,
      notes,
    });

    success(
      editingCustomer ? 'Customer Updated' : 'Customer Added',
      `${companyName} saved successfully`
    );
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove customer "${name}"?`)) {
      storage.deleteCustomer(id);
      success('Customer Removed', `Removed ${name}`);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Customer CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of engineering clients, EPC contractors and enterprise buyers.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, contact person, city, or GSTIN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none w-full sm:w-44"
          >
            <option value="all">All States ({uniqueStates.length})</option>
            {uniqueStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const stats = customerStats[c.id] || { totalQuotes: 0, totalValue: 0, approvedCount: 0 };

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {c.customerCode}
                    </span>
                    <h3
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="font-bold text-base text-slate-900 mt-1.5 hover:text-red-600 cursor-pointer line-clamp-1"
                    >
                      {c.companyName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Customer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.companyName)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Attn: {c.contactPerson}</p>
                  <p className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {c.email}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {c.phone}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {c.city}, {c.state}
                  </p>
                </div>

                {/* GST & Terms */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                  <span>GST: <strong className="text-slate-800">{c.gstin}</strong></span>
                  <span className="text-slate-500 font-sans">{c.paymentTerms}</span>
                </div>
              </div>

              {/* Stats Footer & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Quotations</p>
                  <p className="text-xs font-bold text-slate-900">
                    {stats.totalQuotes} quotes • {formatINR(stats.totalValue)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => navigate(`/quotations/new?customerId=${c.id}`)}
                    title="Create Quotation for Customer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Quote</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Larsen & Toubro Heavy Eng"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500 font-semibold cursor-text"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sanjay Deshmukh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="purchase@lnt.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 22 6705 4000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GSTIN (15 Digits) <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="27AAACL0140P1ZL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="AAACL0140P"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Gate No. / Street / Industrial Area..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Shipping Address (Leave blank if same as billing)
                </label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Consignee warehouse / manufacturing works..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="30 Days Net"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
