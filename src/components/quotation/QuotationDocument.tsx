import React from 'react';
import { Quotation, CompanyProfile } from '../../types';
import { storage } from '../../services/storage';
import { resolveLogoUrl, resolveSignatureUrl, resolveStampUrl } from '../../utils/assetResolver';
import { getConvertedQuotationDisplay } from '../../services/currencyService';
import { getTemplate } from './templates/TemplateRegistry';
import { DocumentData } from './templates/types';

export interface QuotationDocumentProps {
  quotation: Quotation;
  company?: CompanyProfile;
  id?: string;
  themeId?: string;
  displayCurrency?: string;
  exchangeRate?: number;
  exchangeRateDate?: string;
  isCustomRate?: boolean;
}

const DEFAULT_QUOTATION_TERMS = [
  'Prices: EX-WORKS',
  'Delivery: READY STOCK',
  'Loading / Packing: EXTRA',
  'Taxes: GST EXTRA 18%',
  'Payment: 100% ADVANCE AGAINST PERFORMA INVOICE',
  'Validity: 08 DAYS',
];

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  quotation,
  company: _propCompany,
  id = 'quotation-print-document',
  themeId: propThemeId,
  displayCurrency: propCurrency,
  exchangeRate: propRate,
  exchangeRateDate: propDate,
  isCustomRate: propIsCustom,
}) => {
  // Global Settings and Company Profile are the single authoritative source of truth.
  // Dynamically retrieve the latest company profile and settings so changes in Settings
  // (e.g., State Code, address, gstin, bank, signatory, stamp) always reflect across all saved quotations.
  const company = storage.getCompany();
  const settings = storage.getSettings();

  // 1. Resolve Active Template from Registry
  const activeThemeId = propThemeId || quotation.themeId || settings.defaultTheme || 'modern';
  const registeredTemplate = getTemplate(activeThemeId);
  const TemplateComponent = registeredTemplate.component;
  const paperSize = registeredTemplate.paperSize;
  const isA5 = paperSize === 'A5';

  // 2. Resolve Converted Quotation Display (Safe, non-mutating)
  const targetCurrency = propCurrency || quotation.displayCurrency || 'INR';
  const display = getConvertedQuotationDisplay(
    quotation,
    targetCurrency,
    propRate,
    propDate,
    propIsCustom
  );

  const bank =
    storage.getBankAccounts().find((b) => b.id === quotation.bankAccountId) ||
    storage.getBankAccounts().find((b) => b.isDefault) ||
    storage.getBankAccounts()[0] ||
    quotation.bankDetails;

  // 3. Resolve Signature and Stamp (Global Settings is authoritative)
  const rawSignatureUrl =
    settings.signatureUrl !== undefined ? settings.signatureUrl : quotation.signatureUrl;
  const rawStampUrl =
    settings.stampUrl !== undefined ? settings.stampUrl : quotation.stampUrl;

  const signatureData = {
    url: resolveSignatureUrl(rawSignatureUrl),
    enabled:
      settings.signatureEnabled !== undefined
        ? settings.signatureEnabled
        : (quotation.signatureEnabled ?? true),
    size: settings.signatureSize || quotation.signatureSize || 'md',
    signatoryName: settings.signatoryName || quotation.signatoryName || 'Demo Name',
    signatoryDesignation:
      settings.signatoryDesignation ||
      quotation.signatoryDesignation ||
      'Commercial & Technical Operations',
  };

  const stampData = {
    url: resolveStampUrl(rawStampUrl),
    enabled:
      settings.stampEnabled !== undefined
        ? settings.stampEnabled
        : (quotation.stampEnabled ?? true),
    size: settings.stampSize || quotation.stampSize || 'md',
  };

  // 4. Resolve Terms & Conditions
  const rawTerms =
    quotation.termsAndConditions && quotation.termsAndConditions.length > 0
      ? quotation.termsAndConditions
      : DEFAULT_QUOTATION_TERMS;

  const isLegacyDefault =
    rawTerms.length >= 7 &&
    rawTerms.some((t) => t.includes('Taloja') || t.includes('Kalamboli') || t.includes('LME'));

  const termsToRender = isLegacyDefault
    ? DEFAULT_QUOTATION_TERMS
    : rawTerms.map((t) => (/\b15\s*days\b/i.test(t) ? 'Validity: 08 DAYS' : t));

  // 5. Intelligent Document Title
  const getDocumentTitle = () => {
    if (activeThemeId === 'tally') return 'TAX INVOICE';
    if (activeThemeId.includes('gst_tally')) return 'TAX INVOICE / QUOTATION';
    if (activeThemeId.includes('gst')) return 'TAX INVOICE / QUOTATION';
    if (activeThemeId.includes('billbook')) return 'COMMERCIAL BILL / QUOTATION';
    if (activeThemeId === 'luxury') return 'COMMERCIAL QUOTATION';
    return 'COMMERCIAL QUOTATION';
  };

  // 6. Build Standardized DocumentData for Template Engine
  const documentData: DocumentData = {
    quotation,
    display,
    company,
    bank,
    terms: termsToRender,
    signature: signatureData,
    stamp: stampData,
    logoUrl: resolveLogoUrl(company?.logo),
    documentTitle: getDocumentTitle(),
    theme: registeredTemplate.theme,
    paperSize,
    isFestive: registeredTemplate.theme.category === 'festive',
  };

  // 7. Pagination Logic (Dynamic A4 vs A5 chunking)
  const itemsPerPageFirst = isA5 ? 3 : 6;
  const itemsPerPageSubsequent = isA5 ? 5 : 8;

  // Check if single page fits
  const isSinglePage = isA5
    ? display.items.length <= 2 && termsToRender.length <= 3
    : display.items.length <= 1 && termsToRender.length <= 3;

  let pages: Array<{ items: typeof display.items; startIndex: number }> = [];

  if (isSinglePage || display.items.length <= itemsPerPageFirst) {
    pages = [{ items: display.items, startIndex: 0 }];
  } else {
    // Page 1
    pages.push({
      items: display.items.slice(0, itemsPerPageFirst),
      startIndex: 0,
    });
    // Subsequent pages
    let currentIdx = itemsPerPageFirst;
    while (currentIdx < display.items.length) {
      const nextSlice = display.items.slice(currentIdx, currentIdx + itemsPerPageSubsequent);
      pages.push({
        items: nextSlice,
        startIndex: currentIdx,
      });
      currentIdx += itemsPerPageSubsequent;
    }
  }

  const totalPages = pages.length;

  // 8. Container Dimensions
  const pageContainerClass = isA5
    ? 'a5-page doc-page bg-white text-slate-900 border border-slate-300/80 shadow-2xl rounded-xl p-4 sm:p-5 mx-auto font-sans leading-relaxed text-xs flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:text-black print:rounded-none relative overflow-hidden'
    : 'a4-page doc-page bg-white text-slate-900 border border-slate-300/80 shadow-2xl rounded-2xl p-8 sm:p-10 mx-auto font-sans leading-relaxed text-xs flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:text-black print:rounded-none relative overflow-hidden';

  const pageContainerStyle: React.CSSProperties = isA5
    ? {
        width: '559px',
        minHeight: '794px',
        boxSizing: 'border-box',
        position: 'relative',
      }
    : {
        width: '794px',
        minHeight: '1123px',
        boxSizing: 'border-box',
        position: 'relative',
      };

  return (
    <div id={id} className="quotation-document-wrapper space-y-8 print:space-y-0">
      {pages.map((page, idx) => (
        <div key={idx} className={pageContainerClass} style={pageContainerStyle}>
          <TemplateComponent
            data={documentData}
            pageNumber={idx + 1}
            totalPages={totalPages}
            items={page.items}
            startIndex={page.startIndex}
            isSinglePage={totalPages === 1}
            isContinuationPage={idx > 0}
          />
        </div>
      ))}
    </div>
  );
};
