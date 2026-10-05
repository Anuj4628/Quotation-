import React, { useState, useEffect } from 'react';
import { X, DollarSign, RefreshCw, Check, ArrowRight, AlertCircle, Info } from 'lucide-react';
import {
  TOP_CURRENCIES,
  fetchExchangeRates,
  formatCurrency,
  roundCurrency,
  amountInWordsForCurrency,
} from '../../services/currencyService';
import { Quotation } from '../../types';

export interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  currentCurrency?: string;
  currentRate?: number;
  currentIsCustomRate?: boolean;
  onApplyCurrency: (currencyData: {
    displayCurrency: string;
    exchangeRate: number;
    exchangeRateDate: string;
    isCustomRate: boolean;
    customRate?: number;
  }) => void;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  quotation,
  currentCurrency,
  currentRate,
  currentIsCustomRate,
  onApplyCurrency,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    (currentCurrency || quotation.displayCurrency || 'INR').toUpperCase()
  );
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });
  const [rateDate, setRateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rateSource, setRateSource] = useState<string>('live');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom rate override state
  const [isCustomRate, setIsCustomRate] = useState<boolean>(
    currentIsCustomRate !== undefined ? currentIsCustomRate : Boolean(quotation.isCustomRate)
  );
  const [customRateInput, setCustomRateInput] = useState<string>(() => {
    if (quotation.customRate && quotation.customRate > 0) return String(quotation.customRate);
    if (currentRate && currentRate > 0 && currentCurrency !== 'INR') return String(currentRate);
    return '';
  });

  // Fetch live exchange rates on mount
  useEffect(() => {
    let isMounted = true;
    const loadRates = async (force = false) => {
      setIsLoadingRates(true);
      setErrorMessage(null);
      const res = await fetchExchangeRates(force);
      if (!isMounted) return;

      setRates(res.rates);
      setRateDate(res.date);
      setRateSource(res.source);
      if (res.error) setErrorMessage(res.error);
      setIsLoadingRates(false);

      // If user currently has no custom rate input, prepopulate with live rate
      if (!customRateInput && selectedCurrency !== 'INR') {
        const r = res.rates[selectedCurrency] || 1;
        setCustomRateInput(String(r));
      }
    };

    if (isOpen) {
      loadRates();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;



  // Resolve active exchange rate for preview
  const liveRate = rates[selectedCurrency] || (selectedCurrency === 'INR' ? 1 : 0.0118);
  const activeRate = isCustomRate && Number(customRateInput) > 0 ? Number(customRateInput) : liveRate;

  // Calculations for live preview
  const originalGrandTotal = quotation.grandTotal || 0;
  const isConverted = selectedCurrency !== 'INR';
  const convertedGrandTotal = isConverted
    ? roundCurrency(originalGrandTotal * activeRate, selectedCurrency)
    : originalGrandTotal;
  const convertedWords = amountInWordsForCurrency(convertedGrandTotal, selectedCurrency);

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    if (code === 'INR') {
      setIsCustomRate(false);
      setCustomRateInput('');
    } else {
      const r = rates[code] || 1;
      setCustomRateInput(String(r));
    }
  };

  const handleApply = () => {
    onApplyCurrency({
      displayCurrency: selectedCurrency,
      exchangeRate: activeRate,
      exchangeRateDate: rateDate,
      isCustomRate: isConverted && isCustomRate,
      customRate: isConverted && isCustomRate ? activeRate : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quotation Multi-Currency System
              </h2>
              <p className="text-xs text-slate-400">
                Display & export this quotation in international currencies with live exchange rates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Quick-Pick Grid */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-slate-50/50">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Currency:
              </label>
              <button
                onClick={() => fetchExchangeRates(true)}
                disabled={isLoadingRates}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                title="Refresh live exchange rates"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRates ? 'animate-spin' : ''}`} />
                <span>{isLoadingRates ? 'Fetching Rates...' : 'Refresh Rates'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TOP_CURRENCIES.map((c) => {
                const isSelected = c.code === selectedCurrency;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencySelect(c.code)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-base font-bold mb-0.5">{c.symbol}</span>
                    <span className="text-xs font-extrabold tracking-wider">{c.code}</span>
                    <span className="text-[9.5px] text-slate-500 truncate max-w-full">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange Rate Details / Custom Rate Override */}
          {isConverted && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Exchange Rate: 1 INR = {activeRate < 0.01 ? activeRate.toFixed(6) : activeRate.toFixed(4)} {selectedCurrency}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Source: {rateSource.toUpperCase()} • As of {rateDate}
                  </span>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCustomRate}
                    onChange={(e) => {
                      setIsCustomRate(e.target.checked);
                      if (e.target.checked && !customRateInput) {
                        setCustomRateInput(String(liveRate));
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Use Custom Rate</span>
                </label>
              </div>

              {isCustomRate && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Enter Commercial Conversion Rate (1 INR = ? {selectedCurrency}):
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.000001"
                      value={customRateInput}
                      onChange={(e) => setCustomRateInput(e.target.value)}
                      placeholder="e.g. 0.0120"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomRateInput(String(liveRate))}
                    className="px-2.5 py-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium mt-4 shrink-0"
                  >
                    Reset to Live
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Converted Preview Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl shadow-md space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quotation Grand Total Conversion Preview:
            </span>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Original Value (INR):</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(originalGrandTotal)}
                </span>
              </div>

              <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />

              <div className="text-right">
                <span className="text-[11px] text-emerald-400 block font-semibold">
                  Display Value ({selectedCurrency}):
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white">
                  {formatCurrency(convertedGrandTotal, selectedCurrency)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 italic">
              <span className="font-semibold text-slate-400 not-italic">Amount in Words: </span>
              {convertedWords}
            </div>
          </div>

          {/* Immutability & Safety Guarantee Note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Financial Immutability Guarantee:</strong> Changing the display currency converts values for
              the PDF, print, and preview only. Your original quotation amounts and GST tax categories in INR remain
              100% safe and unmutated in the database.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => handleCurrencySelect('INR')}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            Reset to INR (₹)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply {selectedCurrency}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
