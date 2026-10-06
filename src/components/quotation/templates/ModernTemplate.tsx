import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const ModernTemplate: React.FC<TemplateProps> = ({
  data,
  pageNumber,
  totalPages,
  items,
  startIndex,
  isSinglePage,
  isContinuationPage,
}) => {
  const { quotation, display, company, bank, terms, signature, stamp, logoUrl, documentTitle } = data;

  return (
    <div className="flex flex-col justify-between h-full text-slate-800 font-sans">
      <div>
        {/* Modern Spacious Header */}
        {!isContinuationPage ? (
          <div className="pb-4 mb-4 border-b border-slate-200">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[320px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-14 w-auto max-w-[260px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">
                  {company.name}
                </h1>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {company.tagline || 'Industrial Metals, Precision Alloys & Global Star Export House'}
                </p>
              </div>

              <div className="text-right text-[10px] text-slate-500 space-y-0.5 max-w-[420px]">
                <p className="font-semibold text-slate-800">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p className="text-slate-600">
                  <span>Phone: <strong className="text-slate-800">{company.phone}</strong></span>
                  {' • '}
                  <span>Email: <strong className="text-slate-800">{company.email}</strong></span>
                </p>
                <div className="pt-1.5 flex items-center justify-end gap-1.5 font-mono text-[9.5px]">
                  <span className="bg-slate-100 border border-slate-200 text-slate-900 px-2 py-0.5 rounded-lg font-bold">
                    GSTIN: {company.gstin}
                  </span>
                  {company.pan && (
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-bold">
                      PAN: {company.pan}
                    </span>
                  )}
                  {company.stateCode && (
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-bold">
                      State Code: {company.stateCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-3 mb-4 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900 uppercase">{company.name}</span>
            <span className="font-mono text-slate-500">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Modern Title Bar with Clean Badges */}
        {!isContinuationPage && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="bg-red-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm shadow-red-600/20">
                {documentTitle || 'COMMERCIAL QUOTATION'}
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-900 text-white">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Ref No:</span>
              <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* Modern Metadata Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Quote Date</span>
              <strong className="text-slate-900 text-[11px]">{quotation.quotationDate}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Valid Until</span>
              <strong className="text-slate-900 text-[11px]">{quotation.validUntil}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Executive</span>
              <strong className="text-slate-900 text-[11px]">{quotation.salesperson || 'Commercial Desk'}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Inquiry Ref</span>
              <strong className="text-slate-900 text-[11px]">{quotation.customerReference || 'Direct'}</strong>
            </div>
          </div>
        )}

        {/* Modern Customer & Destination Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-[10.5px]">
              <span className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider block mb-1">
                Client / Bill To
              </span>
              <h3 className="font-extrabold text-slate-900 text-xs">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium">
                {quotation.customerGstin && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-800 font-mono">
                    GSTIN: <strong>{quotation.customerGstin}</strong>
                  </span>
                )}
                {quotation.customerPhone && (
                  <span className="text-slate-500">Phone: <strong className="text-slate-800">{quotation.customerPhone}</strong></span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-[10.5px]">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Dispatch & Consignee Location
              </span>
              <p className="text-slate-600">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <p className="text-slate-500 mt-1">Place of Supply: <strong>{quotation.customerState} ({quotation.customerStateCode || '27'})</strong></p>
            </div>
          </div>
        )}

        {/* Modern Open Product Table */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2.5 px-2.5 text-center w-8">#</th>
                <th className="py-2.5 px-2.5 text-left">Item Description</th>
                <th className="py-2.5 px-2 text-center w-16">HSN</th>
                <th className="py-2.5 px-2 text-right w-14">Qty</th>
                <th className="py-2.5 px-2 text-center w-12">Unit</th>
                <th className="py-2.5 px-2 text-right w-20">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-2.5 px-2 text-right w-16">Disc</th>}
                <th className="py-2.5 px-2 text-right w-14">GST</th>
                <th className="py-2.5 px-2.5 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="py-2.5 px-2.5 text-center font-mono text-slate-400">{startIndex + idx + 1}</td>
                  <td className="py-2.5 px-2.5">
                    <p className="font-bold text-slate-900 text-[10.5px]">{item.productName}</p>
                    {item.description && <p className="text-slate-500 text-[9.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-red-700/80 text-[9px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-500">{item.hsnCode || '-'}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-center text-slate-500 uppercase">{item.unit}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-2.5 px-2 text-right font-mono text-red-600">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modern Financial Summary */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-7 space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9px]">
                  Amount in Words:
                </span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-[10px] shadow-xs">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                    Bank Account Details:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <p><span className="text-slate-400">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-400">A/c:</span> <strong className="font-mono text-slate-900">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-400">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-400">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-[10px] space-y-1.5 shadow-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1">
                  <span>Taxable:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>CGST:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>SGST:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>IGST:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Extra Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-xl mt-2 shadow-md">
                  <span className="font-bold text-xs uppercase tracking-wider">Grand Total:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Terms & Signature */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-8 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[9.5px]">
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Commercial Terms:
              </span>
              <ul className="space-y-0.5 text-slate-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2.5 border border-slate-200 rounded-2xl bg-white shadow-xs">
              <span className="text-[9px] text-slate-400 block mb-1">For {company.name}</span>
              <div className="h-14 flex items-center justify-center relative">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-12 w-auto object-contain opacity-80"
                    crossOrigin="anonymous"
                  />
                )}
                {signature.enabled && signature.url && (
                  <img
                    src={signature.url}
                    alt="Signature"
                    className="h-12 w-auto object-contain absolute"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <span className="border-t border-slate-300 pt-1 w-full text-[9px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
              <span className="text-[8.5px] text-slate-500">
                {signature.signatoryDesignation || 'Commercial Division'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Footer */}
      <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-400">
        <p>Commercial Quotation Document • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
