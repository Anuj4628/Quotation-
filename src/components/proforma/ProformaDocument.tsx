import React from 'react';
import { ProformaInvoice, CompanyProfile } from '../../types';
import { formatINR } from '../../utils/calculator';
import { storage } from '../../services/storage';
import { resolveLogoUrl, resolveSignatureUrl, resolveStampUrl } from '../../utils/assetResolver';

interface ProformaDocumentProps {
  proforma: ProformaInvoice;
  company?: CompanyProfile;
  id?: string;
}

export const ProformaDocument: React.FC<ProformaDocumentProps> = ({
  proforma,
  company = storage.getCompany(),
  id = 'proforma-print-document',
}) => {
  const bank = proforma.bankDetails || storage.getBankAccounts()[0];

  // Resolve signature & stamp settings: proforma snapshot takes priority for historical preservation
  const settings = storage.getSettings();
  const rawSignatureUrl = proforma.signatureUrl !== undefined ? proforma.signatureUrl : settings.signatureUrl;
  const rawStampUrl = proforma.stampUrl !== undefined ? proforma.stampUrl : settings.stampUrl;
  const signatureUrl = resolveSignatureUrl(rawSignatureUrl);
  const stampUrl = resolveStampUrl(rawStampUrl);
  const signatureEnabled = proforma.signatureEnabled !== undefined ? proforma.signatureEnabled : (settings.signatureEnabled ?? true);
  const stampEnabled = proforma.stampEnabled !== undefined ? proforma.stampEnabled : (settings.stampEnabled ?? true);
  const signatureSize = proforma.signatureSize || settings.signatureSize || 'md';
  const stampSize = proforma.stampSize || settings.stampSize || 'md';
  const signatoryDesignation = proforma.signatoryDesignation || settings.signatoryDesignation || 'Commercial & Technical Operations';

  // Single page if 1 item and short terms
  const isSinglePage =
    proforma.items.length <= 1 &&
    (!proforma.termsAndConditions || proforma.termsAndConditions.length <= 3) &&
    !proforma.otherComments;

  // Pagination for items
  const page1Items = !isSinglePage && proforma.items.length > 6 ? proforma.items.slice(0, 6) : proforma.items;
  const page2Items = !isSinglePage && proforma.items.length > 6 ? proforma.items.slice(6) : [];

  const logoSrc = resolveLogoUrl(company?.logo);

  // Helper to format address without irregular spacing around commas
  const cleanAddressText = (text?: string) => (text ? text.replace(/\s*,\s*/g, ', ').trim() : '');

  // 1. Header Banner
  const renderHeader = () => (
    <div className="flex justify-between items-start pb-4 border-b-2 border-red-600 gap-4">
      {/* Brand Logo & Title */}
      <div className="flex flex-col items-start gap-1 max-w-[260px] shrink-0">
        <div className="bg-white rounded flex items-center">
          <img
            src={logoSrc}
            alt={company.name || 'JUBILANT METAL AND ALLOYS'}
            className="h-14 w-auto max-w-[260px] object-contain shrink-0"
            crossOrigin="anonymous"
          />
        </div>
        {company.name && !company.name.toLowerCase().includes('jubilant') && (
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight font-display uppercase leading-tight">
            {company.name}
          </h2>
        )}
        <p className="text-[10px] text-slate-500 font-medium tracking-wide leading-tight">
          {company.tagline || 'Govt. Recognized Star Export House • Importers, Exporters & Stockists'}
        </p>
      </div>

      {/* Office & Tax IDs */}
      <div className="text-right text-[10px] sm:text-[10.5px] text-slate-600 space-y-0.5 leading-snug shrink-0 max-w-[460px]">
        <p className="font-semibold text-slate-900 leading-tight">
          {cleanAddressText(company.addressLine1)}
        </p>
        {company.addressLine2 && (
          <p className="leading-tight">{cleanAddressText(company.addressLine2)}</p>
        )}
        <p className="leading-tight">
          {cleanAddressText(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}
        </p>
        <p className="leading-tight">
          <span className="text-slate-500">Tel:</span>{' '}
          <span className="font-medium text-slate-800">{company.phone}</span>
        </p>
        <p className="leading-tight">
          <span className="text-slate-500">Email:</span>{' '}
          <span className="font-medium text-slate-800">{company.email}</span>
        </p>
        <div className="pt-1.5 flex items-center justify-end gap-1.5 font-mono text-[9px] sm:text-[9.5px] font-bold text-slate-800">
          <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">GSTIN: {company.gstin}</span>
          {company.pan && company.pan.trim() ? (
            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">PAN: {company.pan}</span>
          ) : null}
          {company.cin && company.cin.trim() ? (
            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">CIN: {company.cin}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  // 2. Title Bar: "PROFORMA INVOICE" + Status Badge + Proforma Number
  const renderTitleBar = () => (
    <div className="pt-3 pb-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 inline-flex items-center px-3 rounded bg-red-600 text-white font-display font-extrabold text-xs tracking-wider uppercase shadow-xs">
            PROFORMA INVOICE
          </span>
          <span
            className={`h-7 inline-flex items-center px-2.5 rounded font-bold text-xs uppercase tracking-wider border ${
              proforma.status === 'approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : proforma.status === 'paid'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : proforma.status === 'sent'
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : proforma.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {proforma.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            PI No:
          </span>
          <span className="h-7 inline-flex items-center font-mono font-extrabold text-sm text-slate-900 bg-slate-100 border border-slate-300 px-2.5 rounded">
            {proforma.proformaNumber}
          </span>
        </div>
      </div>
    </div>
  );

  // 3. Meta Grid (Date, Valid Until, Customer Ref, Prepared By)
  const renderMetaGrid = () => (
    <div className="grid grid-cols-4 gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-3 print:bg-white print:border-slate-300">
      <div>
        <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">PI Date</span>
        <span className="font-bold text-slate-900 text-xs">{proforma.proformaDate}</span>
      </div>
      <div>
        <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Valid Until</span>
        <span className="font-bold text-slate-900 text-xs">{proforma.validUntil}</span>
      </div>
      <div>
        <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Buyer PO / Ref</span>
        <span className="font-bold text-slate-900 text-xs truncate block" title={proforma.customerReference}>
          {proforma.customerReference || 'Direct Order'}
        </span>
      </div>
      <div>
        <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Prepared By</span>
        <span className="font-bold text-slate-900 text-xs truncate block">
          {proforma.preparedBy || proforma.createdByName || 'Sales Operations'}
        </span>
      </div>
    </div>
  );

  // 4. Customer Info: Bill To & Dedicated Ship To
  const renderCustomerGrid = () => {
    const shipToName = proforma.shipToCompany || proforma.customerName;
    const shipToContact = proforma.shipToContact || proforma.customerContactPerson;
    const shipToAddr = proforma.shippingAddress || proforma.billingAddress;
    const shipCity = proforma.shipToCity || proforma.customerCity;
    const shipState = proforma.shipToState || proforma.customerState;
    const shipPin = proforma.shipToPinCode || proforma.customerPinCode;
    const shipPhone = proforma.shipToPhone || proforma.customerPhone;

    return (
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        {/* Bill To */}
        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200 flex flex-col justify-between print:bg-white">
          <div className="space-y-0.5">
            <p className="font-bold text-red-600 uppercase tracking-wider text-[10px] mb-1">
              Buyer / Bill To Details:
            </p>
            <p className="font-bold text-sm text-slate-900 leading-snug">{proforma.customerName}</p>
            {proforma.customerContactPerson && (
              <p className="text-slate-700 text-xs font-medium">Attn: {proforma.customerContactPerson}</p>
            )}
            <p className="text-slate-600 text-[11px] leading-tight">{proforma.billingAddress}</p>
            <p className="text-slate-600 text-[11px]">
              {proforma.customerCity}, {proforma.customerState} - {proforma.customerPinCode}
            </p>
            {proforma.customerPhone && (
              <p className="text-slate-500 text-[10px]">Tel: {proforma.customerPhone}</p>
            )}
          </div>
          <div className="pt-2 font-mono text-[10px] font-bold text-slate-700 flex flex-wrap gap-2">
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              GSTIN: {proforma.customerGstin || 'Unregistered'}
            </span>
            {proforma.customerPan && (
              <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">PAN: {proforma.customerPan}</span>
            )}
          </div>
        </div>

        {/* Dedicated Ship To / Consignee */}
        <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200 flex flex-col justify-between print:bg-white">
          <div className="space-y-0.5">
            <p className="font-bold text-red-600 uppercase tracking-wider text-[10px] mb-1">
              Consignee / Ship To Details:
            </p>
            <p className="font-bold text-sm text-slate-900 leading-snug">{shipToName}</p>
            {shipToContact && (
              <p className="text-slate-700 text-xs font-medium">Attn: {shipToContact}</p>
            )}
            <p className="text-slate-600 text-[11px] leading-tight">{shipToAddr}</p>
            <p className="text-slate-600 text-[11px]">
              {shipCity}, {shipState} - {shipPin}
            </p>
            {shipPhone && (
              <p className="text-slate-500 text-[10px]">Tel: {shipPhone}</p>
            )}
          </div>
          <div className="pt-2 text-[10px] text-slate-600 space-y-0.5 border-t border-slate-200/80 mt-1">
            <p>
              <span className="text-slate-500">Place of Supply:</span>{' '}
              <strong className="text-slate-900">{shipState} (Code: {proforma.shipToStateCode || proforma.customerStateCode})</strong>
            </p>
            <p>
              <span className="text-slate-500">Tax Applicability:</span>{' '}
              <strong className="text-slate-900">{proforma.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 5. Product Specifications Table
  const renderProductTable = (items: typeof proforma.items, startIdx = 0) => (
    <div className="mb-3">
      <table className="w-full text-left border-collapse border border-slate-300 table-fixed">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider print:bg-slate-900 print:text-white">
            <th className="py-2.5 px-2 border border-slate-700 w-[5%] text-center">SR. NO.</th>
            <th className="py-2.5 px-3 border border-slate-700 w-[43%]">PRODUCT & MATERIAL SPECIFICATION</th>
            <th className="py-2.5 px-3 border border-slate-700 w-[8%] text-right">QTY</th>
            <th className="py-2.5 px-2 border border-slate-700 w-[7%] text-center">UNIT</th>
            <th className="py-2.5 px-3 border border-slate-700 w-[12%] text-right">RATE (₹)</th>
            <th className="py-2.5 px-2 border border-slate-700 w-[7%] text-center">GST</th>
            <th className="py-2.5 px-3 border border-slate-700 w-[18%] text-right">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {items.map((item, idx) => {
            const sr = item.srNo || (startIdx + idx + 1);
            return (
              <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70 print:bg-transparent' : 'bg-white'}>
                <td className="py-2.5 px-2 border border-slate-300 text-center font-bold text-slate-500 align-middle text-xs whitespace-nowrap">
                  {sr}
                </td>
                <td className="py-2.5 px-3 border border-slate-300 align-middle">
                  <div className="text-xs text-slate-900 leading-snug font-medium whitespace-pre-wrap break-words">
                    {item.description || item.productName}
                  </div>
                  {(!item.description || !item.description.includes(item.productName)) &&
                    Boolean(item.material || item.grade || item.size) && (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-600 mt-1 leading-tight">
                        {item.material && (
                          <span><strong className="text-slate-800">Mat:</strong> {item.material}</span>
                        )}
                        {item.grade && (
                          <span><strong className="text-slate-800">Grade:</strong> {item.grade}</span>
                        )}
                        {item.size && (
                          <span><strong className="text-slate-800">Size:</strong> {item.size}</span>
                        )}
                        {item.schedule && (
                          <span><strong className="text-slate-800">Sched:</strong> {item.schedule}</span>
                        )}
                        {item.thickness && (
                          <span><strong className="text-slate-800">Thk:</strong> {item.thickness}</span>
                        )}
                      </div>
                    )}
                </td>
                <td className="py-2.5 px-3 border border-slate-300 text-right font-semibold text-slate-900 align-middle text-xs whitespace-nowrap tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2.5 px-2 border border-slate-300 text-center font-medium text-slate-700 align-middle text-xs whitespace-nowrap">
                  {item.unit || 'PCS'}
                </td>
                <td className="py-2.5 px-3 border border-slate-300 text-right font-mono text-slate-800 align-middle text-xs whitespace-nowrap tabular-nums">
                  {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.rate) || 0)}
                  {item.discountPercent > 0 && (
                    <span className="block text-[10px] text-emerald-600 font-sans font-semibold whitespace-nowrap">
                      -{item.discountPercent}%
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-2 border border-slate-300 text-center font-mono text-[11px] text-slate-700 align-middle whitespace-nowrap">
                  {item.gstRate}%
                </td>
                <td className="py-2.5 px-3 border border-slate-300 text-right font-mono font-bold text-slate-900 align-middle text-xs whitespace-nowrap tabular-nums">
                  {formatINR(item.totalAmount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // 6. Commercial Summary & Financial Calculations Grid
  const renderCommercialSummary = () => (
    <div className="grid grid-cols-12 gap-3 mb-3">
      {/* Left: Notes & Amount in Words */}
      <div className="col-span-7 flex flex-col justify-between space-y-2">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:bg-white">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
            Amount in Words (Indian Rupees):
          </span>
          <p className="font-serif italic font-bold text-xs text-slate-900 leading-snug">
            {proforma.amountInWords}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1 print:bg-white">
          <p className="text-[11px]">
            <span className="font-bold text-slate-900">Payment Terms:</span> {proforma.paymentTerms}
          </p>
          <p className="text-[11px]">
            <span className="font-bold text-slate-900">Delivery Terms:</span> {proforma.deliveryTerms}
          </p>
          {proforma.expectedDeliveryDate && (
            <p className="text-[11px]">
              <span className="font-bold text-slate-900">Expected Delivery:</span> {proforma.expectedDeliveryDate}
            </p>
          )}
          {proforma.otherComments && (
            <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-200 italic">
              <span className="font-semibold not-italic text-slate-800">Special Notes:</span> {proforma.otherComments}
            </p>
          )}
        </div>
      </div>

      {/* Right: Financial Totals Breakdown */}
      <div className="col-span-5 bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs space-y-1.5 print:bg-white print:border-slate-300">
        <div className="flex justify-between items-center text-slate-600 text-[11px]">
          <span>Item Subtotal:</span>
          <span className="font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums text-right">{formatINR(proforma.subtotal)}</span>
        </div>
        {proforma.totalDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 text-[11px]">
            <span>Total Discount:</span>
            <span className="font-mono font-semibold whitespace-nowrap tabular-nums text-right">- {formatINR(proforma.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-slate-700 font-semibold border-t border-slate-200 pt-1 text-[11px]">
          <span>Taxable Value:</span>
          <span className="font-mono text-slate-900 whitespace-nowrap tabular-nums text-right">{formatINR(proforma.taxableAmount)}</span>
        </div>

        {/* GST Breakdown */}
        {proforma.isInterstate ? (
          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span>IGST (18%):</span>
            <span className="font-mono font-medium text-slate-800 whitespace-nowrap tabular-nums text-right">{formatINR(proforma.igstTotal)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>CGST (9%):</span>
              <span className="font-mono font-medium text-slate-800 whitespace-nowrap tabular-nums text-right">{formatINR(proforma.cgstTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>SGST (9%):</span>
              <span className="font-mono font-medium text-slate-800 whitespace-nowrap tabular-nums text-right">{formatINR(proforma.sgstTotal)}</span>
            </div>
          </>
        )}

        {/* Extra Charges */}
        {proforma.freightCharges > 0 && (
          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span>Freight / Logistics:</span>
            <span className="font-mono font-medium whitespace-nowrap tabular-nums text-right">{formatINR(proforma.freightCharges)}</span>
          </div>
        )}
        {proforma.packingCharges > 0 && (
          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span>Packing & Handling:</span>
            <span className="font-mono font-medium whitespace-nowrap tabular-nums text-right">{formatINR(proforma.packingCharges)}</span>
          </div>
        )}

        {proforma.roundOff !== 0 && (
          <div className="flex justify-between items-center text-slate-500 text-[10px]">
            <span>Round Off:</span>
            <span className="font-mono whitespace-nowrap tabular-nums text-right">{proforma.roundOff > 0 ? `+₹${proforma.roundOff}` : `-₹${Math.abs(proforma.roundOff)}`}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-center text-xs font-extrabold text-white bg-red-600 p-2 rounded shadow-xs print:bg-slate-900 mt-1">
          <span className="tracking-wide">GRAND TOTAL:</span>
          <span className="font-mono text-sm sm:text-base whitespace-nowrap tabular-nums text-right">{formatINR(proforma.grandTotal)}</span>
        </div>
      </div>
    </div>
  );

  // 7. Terms & Conditions and Bank Details Grid
  const renderTermsAndBank = () => (
    <div className="grid grid-cols-12 gap-3 mb-4 text-xs">
      {/* Terms & Conditions */}
      <div className="col-span-7 bg-slate-50/70 p-3 rounded-lg border border-slate-200 flex flex-col justify-between print:bg-white">
        <div>
          <p className="font-bold text-red-600 uppercase tracking-wider text-[10px] mb-1.5">
            Terms & Conditions of Sale:
          </p>
          <ol className="list-decimal pl-3.5 space-y-1 text-slate-700 text-[10px] leading-relaxed">
            {proforma.termsAndConditions && proforma.termsAndConditions.length > 0 ? (
              proforma.termsAndConditions.map((term, i) => (
                <li key={i}>{term}</li>
              ))
            ) : (
              <li>Payment as per agreed commercial contract. Materials subject to prior sale.</li>
            )}
          </ol>
        </div>
      </div>

      {/* Remittance Bank Details */}
      <div className="col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 flex flex-col justify-between print:bg-white">
        <div>
          <p className="font-bold text-slate-900 uppercase text-[10px] mb-1.5 pb-1 border-b border-slate-200">
            Remittance Bank Details:
          </p>
          <div className="space-y-0.5 text-[10px] text-slate-700">
            <p><span className="text-slate-500">Bank:</span> <strong className="text-slate-900">{bank?.bankName || 'HDFC Bank Limited'}</strong></p>
            <p><span className="text-slate-500">A/C Name:</span> <strong className="text-slate-900">{bank?.accountName || company.name}</strong></p>
            <p><span className="text-slate-500">A/C No:</span> <span className="font-mono font-bold text-slate-900">{bank?.accountNumber}</span></p>
            <p><span className="text-slate-500">IFSC:</span> <span className="font-mono font-bold text-slate-900">{bank?.ifscCode}</span></p>
            <p><span className="text-slate-500">Branch:</span> <span className="text-slate-800">{bank?.branchName}</span></p>
            {bank?.upiId && (
              <p><span className="text-slate-500">UPI ID:</span> <span className="font-mono text-slate-900 font-medium">{bank.upiId}</span></p>
            )}
          </div>
        </div>
        <div className="p-1.5 bg-white rounded border border-slate-200 text-[9px] text-slate-500">
          Please quote PI No. <strong>{proforma.proformaNumber}</strong> in payment remittance advice.
        </div>
      </div>
    </div>
  );

  // 8. Signatory Area
  const renderSignatoryBlock = () => (
    <div className="flex justify-between items-end pt-2 pb-2 text-xs">
      <div className="text-slate-500 text-[10px] space-y-0.5 max-w-sm">
        <p className="font-semibold text-slate-700">Commercial Validity & Acceptance</p>
        <p>This proforma invoice is valid until {proforma.validUntil}. Standard warranty & inspection clauses apply.</p>
        <p>Issued by Jubilant Metal and Alloys. E. & O.E.</p>
      </div>

      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">For</p>
        <p className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
          {company.name || 'JUBILANT METAL AND ALLOYS'}
        </p>

        <div className="flex flex-col items-center justify-center py-1.5 min-h-[90px] gap-1.5">
          {stampEnabled && stampUrl && (
            <img
              src={stampUrl}
              alt="Company Stamp"
              className={`object-contain select-none transition-all ${stampSize === 'sm'
                ? 'h-16 w-16'
                : stampSize === 'lg'
                  ? 'h-24 w-24'
                  : 'h-20 w-20'
                }`}
            />
          )}

          {signatureEnabled && signatureUrl && (
            <img
              src={signatureUrl}
              alt="Authorized Signature"
              className={`object-contain select-none transition-all ${signatureSize === 'sm'
                ? 'h-11 max-w-[160px]'
                : signatureSize === 'lg'
                  ? 'h-18 max-w-[240px]'
                  : 'h-14 max-w-[200px]'
                }`}
            />
          )}

          {(!stampEnabled || !stampUrl) && (!signatureEnabled || !signatureUrl) && (
            <div className="h-14" />
          )}
        </div>

        <div className="border-t border-slate-400 pt-1 px-6 text-center min-w-[200px] mt-1">
          <span className="font-bold text-slate-800 block text-xs">Authorized Signatory</span>
          {signatoryDesignation && (
            <span className="text-[10px] text-slate-500 block">
              {signatoryDesignation}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // 9. Document Continuation Header
  const renderContinuationHeader = (pageNumber: number, totalPages: number) => (
    <div className="flex justify-between items-center pb-3 border-b-2 border-red-600 mb-4">
      <div className="flex items-center gap-3">
        <div className="bg-white rounded flex items-center">
          <img
            src={logoSrc}
            alt={company.name || 'Jubilant Metal and Alloys'}
            className="h-9 w-auto max-w-[180px] object-contain shrink-0"
            crossOrigin="anonymous"
          />
        </div>
        <div>
          {company.name && !company.name.toLowerCase().includes('jubilant') && (
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-display">
              {company.name}
            </h3>
          )}
          <p className="text-[10px] text-slate-500 font-medium">
            Proforma Invoice Continuation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-500">
          PI No: <strong className="font-mono text-slate-900">{proforma.proformaNumber}</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">
          Date: <strong className="text-slate-900">{proforma.proformaDate}</strong>
        </span>
        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );

  // 10. Page Bottom Footer
  const renderFooter = (pageNumber: number, totalPages: number, hasNextPage = false) => (
    <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
      <p>
        This is a computer generated proforma invoice document • {company.name || 'Jubilant Metal and Alloys'}
      </p>
      <p>
        {hasNextPage ? (
          <span className="font-semibold text-slate-600">Page {pageNumber} of {totalPages} • Continued on next page →</span>
        ) : (
          <span>Page {pageNumber} of {totalPages}</span>
        )}
      </p>
    </div>
  );

  const a4PageStyle: React.CSSProperties = {
    width: '794px',
    minHeight: '1123px',
    boxSizing: 'border-box',
  };

  const a4PageClasses =
    'a4-page bg-white text-slate-900 border border-slate-300/80 shadow-2xl rounded-2xl p-8 sm:p-10 mx-auto font-sans leading-relaxed text-xs flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:text-black print:rounded-none relative';

  if (isSinglePage) {
    return (
      <div id={id} className="proforma-document-wrapper">
        <div className={a4PageClasses} style={a4PageStyle}>
          <div>
            {renderHeader()}
            {renderTitleBar()}
            {renderMetaGrid()}
            {renderCustomerGrid()}
            {renderProductTable(proforma.items, 0)}
            {renderCommercialSummary()}
            {renderTermsAndBank()}
            {renderSignatoryBlock()}
          </div>
          {renderFooter(1, 1, false)}
        </div>
      </div>
    );
  }

  const totalPages = 2;

  return (
    <div id={id} className="proforma-document-wrapper space-y-8 print:space-y-0">
      {/* PAGE 1 */}
      <div className={a4PageClasses} style={a4PageStyle}>
        <div>
          {renderHeader()}
          {renderTitleBar()}
          {renderMetaGrid()}
          {renderCustomerGrid()}
          {renderProductTable(page1Items, 0)}
          {renderCommercialSummary()}
        </div>
        {renderFooter(1, totalPages, true)}
      </div>

      {/* PAGE 2 */}
      <div className={a4PageClasses} style={a4PageStyle}>
        <div>
          {renderContinuationHeader(2, totalPages)}

          {page2Items.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2">
                Product Specifications (Continued):
              </p>
              {renderProductTable(page2Items, 6)}
            </div>
          )}

          {renderTermsAndBank()}
          {renderSignatoryBlock()}
        </div>
        {renderFooter(2, totalPages, false)}
      </div>
    </div>
  );
};
