import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Package, ArrowRight, X } from 'lucide-react';
import { storage } from '../../services/storage';
import { formatINR } from '../../utils/calculator';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return { quotations: [], customers: [], products: [] };
    const q = query.toLowerCase();

    const quotations = storage
      .getQuotations()
      .filter(
        (quot) =>
          quot.quotationNumber.toLowerCase().includes(q) ||
          quot.customerName.toLowerCase().includes(q) ||
          (quot.customerPhone && quot.customerPhone.includes(q))
      )
      .slice(0, 4);

    const proformas = storage
      .getProformaInvoices()
      .filter(
        (prof) =>
          prof.proformaNumber.toLowerCase().includes(q) ||
          prof.customerName.toLowerCase().includes(q) ||
          (prof.shipToCompany && prof.shipToCompany.toLowerCase().includes(q)) ||
          (prof.customerPhone && prof.customerPhone.includes(q))
      )
      .slice(0, 4);

    const customers = storage
      .getCustomers()
      .filter(
        (cust) =>
          cust.companyName.toLowerCase().includes(q) ||
          cust.contactPerson.toLowerCase().includes(q) ||
          cust.city.toLowerCase().includes(q) ||
          cust.gstin.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const products = storage
      .getProducts()
      .filter(
        (prod) =>
          prod.name.toLowerCase().includes(q) ||
          prod.productCode.toLowerCase().includes(q) ||
          prod.grade.toLowerCase().includes(q) ||
          prod.material.toLowerCase().includes(q)
      )
      .slice(0, 4);

    return { quotations, proformas, customers, products };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quotations, customers, metal grades, ASTM specifications..."
            className="w-full text-base font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Type to search quotations by number or customer, or search products by grade (e.g. 316L, Inconel, Duplex).
            </div>
          ) : results.quotations.length === 0 &&
            results.customers.length === 0 &&
            results.products.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No matching results found for &ldquo;<span className="font-semibold text-slate-800">{query}</span>&rdquo;.
            </div>
          ) : (
            <>
              {/* Quotations */}
              {results.quotations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    Quotations ({results.quotations.length})
                  </div>
                  <div className="space-y-1">
                    {results.quotations.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          navigate(`/quotations/${item.id}`);
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50/70 hover:border-red-100 border border-transparent cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-red-700">
                              {item.quotationNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-700">
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{item.customerName}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-semibold text-sm text-slate-900">
                            {formatINR(item.grandTotal)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proforma Invoices */}
              {results.proformas && results.proformas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Proforma Invoices ({results.proformas.length})
                  </div>
                  <div className="space-y-1">
                    {results.proformas.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          navigate(`/proformas/${item.id}`);
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 hover:border-blue-100 border border-transparent cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-700">
                              {item.proformaNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-700">
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.customerName} {item.shipToCompany && item.shipToCompany !== item.customerName ? `(Consignee: ${item.shipToCompany})` : ''}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-semibold text-sm text-slate-900">
                            {formatINR(item.grandTotal)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Customers ({results.customers.length})
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          onClose();
                          navigate(`/customers/${cust.id}`);
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 border border-transparent cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{cust.companyName}</p>
                          <p className="text-xs text-slate-500">
                            {cust.contactPerson} • {cust.city}, {cust.state}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2 text-xs font-mono text-slate-500">
                          <span>{cust.customerCode}</span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    Products & Alloys ({results.products.length})
                  </div>
                  <div className="space-y-1">
                    {results.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onClose();
                          navigate(`/products?search=${encodeURIComponent(prod.name)}`);
                        }}
                        className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 border border-transparent cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{prod.name}</p>
                          <p className="text-xs text-slate-500">
                            {prod.grade} • {prod.material} • {prod.size || prod.schedule || ''}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-semibold text-sm text-slate-900">
                            {formatINR(prod.defaultSellingPrice)} / {prod.unit}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span>Quick search everywhere</span>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-white px-1 py-0.5 border rounded">ESC</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
