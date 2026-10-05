// ==============================================================================
// MULTI-CURRENCY & EXCHANGE RATE ENGINE
// Decimal-safe conversions, live API fetching, offline caching & amount-in-words
// ==============================================================================

import { Quotation, QuotationItem } from '../types';
import { numberToWordsIndian } from '../utils/calculator';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  country: string;
  majorUnit: string;
  majorUnitPlural: string;
  minorUnit?: string;
  minorUnitPlural?: string;
}

export const TOP_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    country: 'India',
    majorUnit: 'Rupee',
    majorUnitPlural: 'Rupees',
    minorUnit: 'Paise',
    minorUnitPlural: 'Paise',
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    country: 'United States',
    majorUnit: 'US Dollar',
    majorUnitPlural: 'US Dollars',
    minorUnit: 'Cent',
    minorUnitPlural: 'Cents',
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    country: 'European Union',
    majorUnit: 'Euro',
    majorUnitPlural: 'Euros',
    minorUnit: 'Cent',
    minorUnitPlural: 'Cents',
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    country: 'United Kingdom',
    majorUnit: 'British Pound',
    majorUnitPlural: 'British Pounds',
    minorUnit: 'Penny',
    minorUnitPlural: 'Pence',
  },
  {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimals: 2,
    country: 'United Arab Emirates',
    majorUnit: 'UAE Dirham',
    majorUnitPlural: 'UAE Dirhams',
    minorUnit: 'Fils',
    minorUnitPlural: 'Fils',
  },
  {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    decimals: 2,
    country: 'Saudi Arabia',
    majorUnit: 'Saudi Riyal',
    majorUnitPlural: 'Saudi Riyals',
    minorUnit: 'Halala',
    minorUnitPlural: 'Halalas',
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    country: 'Australia',
    majorUnit: 'Australian Dollar',
    majorUnitPlural: 'Australian Dollars',
    minorUnit: 'Cent',
    minorUnitPlural: 'Cents',
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
    country: 'Canada',
    majorUnit: 'Canadian Dollar',
    majorUnitPlural: 'Canadian Dollars',
    minorUnit: 'Cent',
    minorUnitPlural: 'Cents',
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimals: 2,
    country: 'Singapore',
    majorUnit: 'Singapore Dollar',
    majorUnitPlural: 'Singapore Dollars',
    minorUnit: 'Cent',
    minorUnitPlural: 'Cents',
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    country: 'Japan',
    majorUnit: 'Japanese Yen',
    majorUnitPlural: 'Japanese Yen',
  },
];

// Fallback baseline exchange rates (1 INR = X currency)
const FALLBACK_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.0118,
  EUR: 0.0109,
  GBP: 0.0093,
  AED: 0.0434,
  SAR: 0.0443,
  AUD: 0.0182,
  CAD: 0.0163,
  SGD: 0.0157,
  JPY: 1.82,
};

const CACHE_KEY = 'jma_exchange_rates_cache_v1';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface ExchangeRatesResult {
  rates: Record<string, number>;
  date: string;
  source: 'live' | 'cache' | 'fallback';
  error?: string;
}

export function getCurrencyInfo(code?: string): CurrencyInfo {
  const target = (code || 'INR').toUpperCase();
  return TOP_CURRENCIES.find((c) => c.code === target) || TOP_CURRENCIES[0];
}

/**
 * Fetch live exchange rates relative to INR from reliable public APIs
 * with automatic caching and offline fallback.
 */
export async function fetchExchangeRates(forceRefresh = false): Promise<ExchangeRatesResult> {
  const now = Date.now();

  // 1. Check local cache
  if (!forceRefresh && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (now - parsed.timestamp < CACHE_DURATION_MS && parsed.rates) {
          return {
            rates: parsed.rates,
            date: parsed.date || new Date().toISOString().split('T')[0],
            source: 'cache',
          };
        }
      }
    } catch (e) {
      console.warn('Failed reading exchange rate cache:', e);
    }
  }

  // 2. Fetch from primary public API: open.er-api.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const rates: Record<string, number> = { INR: 1 };
        TOP_CURRENCIES.forEach((c) => {
          if (data.rates[c.code] !== undefined) {
            rates[c.code] = Number(data.rates[c.code]);
          } else {
            rates[c.code] = FALLBACK_RATES[c.code] || 1;
          }
        });

        const dateStr = data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Cache result
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              rates,
              date: dateStr,
              timestamp: now,
            })
          );
        } catch (e) {}

        return {
          rates,
          date: dateStr,
          source: 'live',
        };
      }
    }
  } catch (err: any) {
    console.warn('Primary exchange rate API failed, trying fallback source:', err?.message);
  }

  // 3. Fallback public API: frankfurter.app
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.frankfurter.app/latest?from=INR', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const rates: Record<string, number> = { INR: 1 };
        TOP_CURRENCIES.forEach((c) => {
          if (c.code === 'INR') {
            rates.INR = 1;
          } else if (data.rates[c.code] !== undefined) {
            rates[c.code] = Number(data.rates[c.code]);
          } else {
            rates[c.code] = FALLBACK_RATES[c.code] || 1;
          }
        });

        const dateStr = data.date || new Date().toISOString().split('T')[0];

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              rates,
              date: dateStr,
              timestamp: now,
            })
          );
        } catch (e) {}

        return {
          rates,
          date: dateStr,
          source: 'live',
        };
      }
    }
  } catch (err: any) {
    console.warn('Secondary exchange rate API failed:', err?.message);
  }

  // 4. Return cached rates if any exist, even if expired
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.rates) {
        return {
          rates: parsed.rates,
          date: parsed.date || new Date().toISOString().split('T')[0],
          source: 'cache',
          error: 'Live rates unreachable; using stored rates.',
        };
      }
    }
  } catch (e) {}

  // 5. Ultimate fallback: static rates for guaranteed 100% offline availability
  return {
    rates: { ...FALLBACK_RATES },
    date: new Date().toISOString().split('T')[0],
    source: 'fallback',
    error: 'Live exchange rates unavailable. Offline rates applied.',
  };
}

/**
 * Decimal safe rounding based on currency precision
 */
export function roundCurrency(amount: number, currencyCode: string): number {
  const info = getCurrencyInfo(currencyCode);
  if (info.decimals === 0) {
    return Math.round(amount);
  }
  const factor = Math.pow(10, info.decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Professional currency formatting with standard symbol and thousands separator
 */
export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    const info = getCurrencyInfo(currencyCode);
    return `${info.symbol}0.00`;
  }

  const info = getCurrencyInfo(currencyCode);
  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (currencyCode === 'INR') {
    formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);
    return `${sign}₹${formatted}`;
  }

  if (currencyCode === 'JPY') {
    formatted = new Intl.NumberFormat('ja-JP', {
      maximumFractionDigits: 0,
    }).format(Math.round(absAmount));
    return `${sign}¥${formatted}`;
  }

  // Western currencies
  formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(absAmount);

  // Symbol placement
  if (currencyCode === 'AED') {
    return `${sign}د.إ ${formatted}`;
  }
  if (currencyCode === 'SAR') {
    return `${sign}ر.س ${formatted}`;
  }
  return `${sign}${info.symbol}${formatted}`;
}

// Helper: Standard English Western number to words
function westernNumberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
      if (n > 0) str += ' ';
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) str += '-' + ones[n % 10];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  }

  let words = '';
  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  const thousand = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (billion > 0) {
    words += convertHundreds(billion) + ' Billion ';
  }
  if (million > 0) {
    words += convertHundreds(million) + ' Million ';
  }
  if (thousand > 0) {
    words += convertHundreds(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertHundreds(remainder);
  }

  return words.trim();
}

/**
 * Currency-aware amount in words
 * E.g. $52.00 -> "Fifty-Two US Dollars Only"
 * E.g. €48.25 -> "Forty-Eight Euros and Twenty-Five Cents Only"
 * E.g. ₹5,000 -> "Rupees Five Thousand Only"
 */
export function amountInWordsForCurrency(amount: number, currencyCode = 'INR'): string {
  if (currencyCode === 'INR') {
    return numberToWordsIndian(amount);
  }

  const info = getCurrencyInfo(currencyCode);
  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * Math.pow(10, info.decimals));

  if (intPart === 0 && decPart === 0) {
    return `${info.majorUnitPlural} Zero Only`;
  }

  const majorText = intPart > 0 ? westernNumberToWords(intPart) : 'Zero';
  const majorName = intPart === 1 ? info.majorUnit : info.majorUnitPlural;

  if (decPart > 0 && info.minorUnit) {
    const minorText = westernNumberToWords(decPart);
    const minorName = decPart === 1 ? info.minorUnit : (info.minorUnitPlural || info.minorUnit);
    return `${majorText} ${majorName} and ${minorText} ${minorName} Only`;
  }

  return `${majorText} ${majorName} Only`;
}

export interface ConvertedQuotationDisplay {
  currency: CurrencyInfo;
  isConverted: boolean;
  exchangeRate: number;
  exchangeRateDate: string;
  isCustomRate: boolean;
  exchangeRateNote?: string;

  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  freightCharges: number;
  packingCharges: number;
  insuranceCharges: number;
  loadingCharges: number;
  otherCharges: number;
  extraChargesTotal: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  format: (amount: number) => string;
}

/**
 * Calculates the converted quotation display values without mutating the original quotation.
 */
export function getConvertedQuotationDisplay(
  quotation: Quotation,
  targetCurrency?: string,
  snapshotRate?: number,
  snapshotDate?: string,
  isCustomRate?: boolean
): ConvertedQuotationDisplay {
  const displayCurrency = (targetCurrency || quotation.displayCurrency || 'INR').toUpperCase();
  const info = getCurrencyInfo(displayCurrency);
  const isConverted = displayCurrency !== 'INR';

  // Format helper bound to the active display currency
  const format = (amt: number) => formatCurrency(amt, displayCurrency);

  // If not converted, return original numbers directly!
  if (!isConverted) {
    return {
      currency: info,
      isConverted: false,
      exchangeRate: 1,
      exchangeRateDate: quotation.quotationDate,
      isCustomRate: false,
      items: quotation.items,
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      taxableAmount: quotation.taxableAmount,
      cgstTotal: quotation.cgstTotal,
      sgstTotal: quotation.sgstTotal,
      igstTotal: quotation.igstTotal,
      totalTax: quotation.totalTax,
      freightCharges: quotation.freightCharges || 0,
      packingCharges: quotation.packingCharges || 0,
      insuranceCharges: quotation.insuranceCharges || 0,
      loadingCharges: quotation.loadingCharges || 0,
      otherCharges: quotation.otherCharges || 0,
      extraChargesTotal: quotation.extraChargesTotal || 0,
      roundOff: quotation.roundOff || 0,
      grandTotal: quotation.grandTotal,
      amountInWords: quotation.amountInWords,
      format,
    };
  }

  // Resolve rate: props > quotation snapshot > fallback
  const rate =
    snapshotRate !== undefined && snapshotRate > 0
      ? snapshotRate
      : quotation.exchangeRate !== undefined && quotation.exchangeRate > 0
        ? quotation.exchangeRate
        : FALLBACK_RATES[displayCurrency] || 1;

  const date =
    snapshotDate ||
    quotation.exchangeRateDate ||
    quotation.quotationDate ||
    new Date().toISOString().split('T')[0];

  const customFlag =
    isCustomRate !== undefined ? isCustomRate : Boolean(quotation.isCustomRate);

  // Decimal conversion helper
  const conv = (amount: number) => roundCurrency((amount || 0) * rate, displayCurrency);

  // Convert items
  const convertedItems: QuotationItem[] = (quotation.items || []).map((it) => {
    const cRate = conv(it.rate);
    const cGross = conv(it.grossAmount);
    const cDiscount = conv(it.discountAmount);
    const cTaxable = conv(it.taxableAmount);
    const cCgst = conv(it.cgstAmount);
    const cSgst = conv(it.sgstAmount);
    const cIgst = conv(it.igstAmount);
    const cTotal = conv(it.totalAmount);

    return {
      ...it,
      rate: cRate,
      grossAmount: cGross,
      discountAmount: cDiscount,
      taxableAmount: cTaxable,
      cgstAmount: cCgst,
      sgstAmount: cSgst,
      igstAmount: cIgst,
      totalAmount: cTotal,
    };
  });

  const convertedSubtotal = conv(quotation.subtotal);
  const convertedDiscount = conv(quotation.totalDiscount);
  const convertedTaxable = conv(quotation.taxableAmount);
  const convertedCgst = conv(quotation.cgstTotal);
  const convertedSgst = conv(quotation.sgstTotal);
  const convertedIgst = conv(quotation.igstTotal);
  const convertedTax = conv(quotation.totalTax);

  const convertedFreight = conv(quotation.freightCharges || 0);
  const convertedPacking = conv(quotation.packingCharges || 0);
  const convertedInsurance = conv(quotation.insuranceCharges || 0);
  const convertedLoading = conv(quotation.loadingCharges || 0);
  const convertedOther = conv(quotation.otherCharges || 0);
  const convertedExtraTotal = conv(quotation.extraChargesTotal || 0);

  const convertedGrandTotal = conv(quotation.grandTotal);
  const convertedRoundOff = conv(quotation.roundOff || 0);

  const convertedWords = amountInWordsForCurrency(convertedGrandTotal, displayCurrency);

  // Professional transparency notice
  const dateFormatted = new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const rateDisplay = rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4);
  const exchangeRateNote = `Exchange Rate: 1 INR = ${rateDisplay} ${displayCurrency} (Dated: ${dateFormatted}${customFlag ? ' • Custom Rate' : ''})`;

  return {
    currency: info,
    isConverted: true,
    exchangeRate: rate,
    exchangeRateDate: date,
    isCustomRate: customFlag,
    exchangeRateNote,
    items: convertedItems,
    subtotal: convertedSubtotal,
    totalDiscount: convertedDiscount,
    taxableAmount: convertedTaxable,
    cgstTotal: convertedCgst,
    sgstTotal: convertedSgst,
    igstTotal: convertedIgst,
    totalTax: convertedTax,
    freightCharges: convertedFreight,
    packingCharges: convertedPacking,
    insuranceCharges: convertedInsurance,
    loadingCharges: convertedLoading,
    otherCharges: convertedOther,
    extraChargesTotal: convertedExtraTotal,
    roundOff: convertedRoundOff,
    grandTotal: convertedGrandTotal,
    amountInWords: convertedWords,
    format,
  };
}
