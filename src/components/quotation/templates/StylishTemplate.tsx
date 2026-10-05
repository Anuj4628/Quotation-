import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const StylishTemplate: React.FC<TemplateProps> = ({
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
        {/* Top Crimson Banner & Brand Header */}
        {!isContinuationPage ? (
          <div className="pb-4 mb-4 border-b-2 border-rose-600">
            {/* Top decorative accent bar */}
            <div className="w-full h-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 rounded-full mb-3" />

            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[300px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-14 w-auto max-w-[260px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[9px] uppercase tracking-wider mt-1 border border-rose-200">
                  {company.name || 'Jubilant Metal & Alloys'}
                </span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {company.tagline || 'Govt. Recognized Star Export House • Precision Engineering'}
                </p>
              </div>

              <div className="text-right text-[10px] text-slate-600 space-y-0.5 max-w-[420px]">
                <p className="font-bold text-rose-950 text-xs">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p className="text-slate-700">
                  <span>Phone: <strong className="text-slate-900">{company.phone}</strong></span>
                  {' • '}
                  <span>Email: <strong className="text-slate-900">{company.email}</strong></span>
                </p>
                <div className="pt-1 flex items-center justify-end gap-1.5 font-mono text-[9px]">
                  <span className="bg-rose-50 border border-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-bold">
                    GSTIN: {company.gstin}
                  </span>
                  {company.pan && (
                    <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                      PAN: {company.pan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-3 mb-4 border-b border-rose-200 flex justify-between items-center text-xs">
            <span className="font-extrabold text-rose-700 tracking-wide">{company.name}</span>
            <span className="text-slate-400 font-mono">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Stylish Title & Quote Ribbon */}
        {!isContinuationPage && (
          <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm tracking-widest uppercase">
                {documentTitle || 'COMMERCIAL QUOTATION'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/30 text-rose-100 border border-rose-400/40">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-200 font-medium">Quote ID:</span>
              <span className="font-mono font-bold text-sm bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* Date and Metadata Bar */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-rose-50/40 border border-rose-100 rounded-xl text-[10px]">
            <div>
              <span className="text-rose-900/60 block text-[9px] font-bold uppercase">Date</span>
              <strong className="text-slate-900">{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-rose-900/60 block text-[9px] font-bold uppercase">Valid Until</span>
              <strong className="text-slate-900">{quotation.validUntil}</strong>
            </div>
            <div>
              <span className="text-rose-900/60 block text-[9px] font-bold uppercase">Sales Contact</span>
              <strong className="text-slate-900">{quotation.salesperson || 'Representative'}</strong>
            </div>
            <div>
              <span className="text-rose-900/60 block text-[9px] font-bold uppercase">Customer Ref</span>
              <strong className="text-slate-900">{quotation.customerReference || 'Standard Order'}</strong>
            </div>
          </div>
        )}

        {/* Customer & Shipping Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-white border border-rose-200 rounded-xl shadow-xs text-[10.5px]">
              <span className="text-[9.5px] font-extrabold text-rose-700 uppercase tracking-wider block mb-1">
                Client Information
              </span>
              <h3 className="font-bold text-slate-950 text-xs">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-medium">
                {quotation.customerGstin && (
                  <span className="bg-rose-50 border border-rose-200 text-rose-900 px-2 py-0.5 rounded">
                    GSTIN: <strong>{quotation.customerGstin}</strong>
                  </span>
                )}
                {quotation.customerPhone && (
                  <span className="text-slate-600">Phone: <strong>{quotation.customerPhone}</strong></span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-[10.5px]">
              <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Dispatch & Consignee Destination
              </span>
              <p className="text-slate-600">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <p className="text-slate-600 mt-1">State Code: <strong>{quotation.customerStateCode || '27'}</strong></p>
            </div>
          </div>
        )}

        {/* Product Items Table with Stylish Accents */}
        <div className="mb-4 overflow-hidden border border-rose-100 rounded-xl shadow-xs">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-rose-900 to-rose-950 text-white font-semibold">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-2 text-left">Description</th>
                <th className="py-2.5 px-2 text-center w-16">HSN</th>
                <th className="py-2.5 px-2 text-right w-14">Qty</th>
                <th className="py-2.5 px-2 text-center w-12">Unit</th>
                <th className="py-2.5 px-2 text-right w-20">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-2.5 px-2 text-right w-16">Disc</th>}
                <th className="py-2.5 px-2 text-right w-14">GST</th>
                <th className="py-2.5 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-rose-50/20' : 'bg-white'}>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-400">{startIndex + idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <p className="font-bold text-slate-900 text-[10.5px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-rose-900/70 text-[9px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-center text-slate-600 uppercase">{item.unit}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-2.5 px-2 text-right font-mono text-rose-600">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stylish Financial Summary */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-7 space-y-3">
              <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl text-[10px]">
                <span className="font-bold text-rose-900 uppercase tracking-wider block">Amount in Words:</span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-[10px] shadow-xs">
                  <span className="font-extrabold text-rose-800 uppercase tracking-wider block mb-1">
                    Bank Remittance Information:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <p><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-500">A/c No:</span> <strong className="font-mono text-rose-900">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-white border border-rose-200 rounded-xl p-3 text-[10px] space-y-1.5 shadow-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Other Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-gradient-to-r from-rose-900 to-rose-950 text-white p-2.5 rounded-lg mt-2 shadow-xs">
                  <span className="font-extrabold text-xs uppercase tracking-wider">Grand Total:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Terms & Stylish Signature */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-8 p-3 bg-rose-50/30 border border-rose-100 rounded-xl text-[9.5px]">
              <span className="font-bold text-rose-900 uppercase tracking-wider block mb-1">
                Commercial Contract Clauses:
              </span>
              <ul className="space-y-0.5 text-slate-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-slate-200 rounded-xl bg-white shadow-xs">
              <span className="text-[9px] text-slate-400 block mb-1">Authorized Seal</span>
              <div className="h-14 flex items-center justify-center relative">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-12 w-auto object-contain opacity-85"
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
              <span className="border-t border-rose-300 pt-1 w-full text-[9px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
              <span className="text-[8.5px] text-slate-500">
                {signature.signatoryDesignation || 'Commercial Division'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Stylish Footer */}
      <div className="mt-auto pt-3 border-t border-rose-100 flex justify-between items-center text-[9.5px] text-slate-400">
        <p className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
          <span>Industrial Quotation • {company.name}</span>
        </p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
