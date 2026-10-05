import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const ClassicTemplate: React.FC<TemplateProps> = ({
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
        {/* Top Corporate Header */}
        {!isContinuationPage ? (
          <div className="pb-4 mb-4 border-b-2 border-slate-900">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[280px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-14 w-auto max-w-[250px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                {company.name && (
                  <h2 className="text-base font-bold text-slate-950 tracking-tight mt-1 uppercase">
                    {company.name}
                  </h2>
                )}
                <p className="text-[10px] text-slate-600 font-medium leading-tight">
                  {company.tagline || 'Govt. Recognized Star Export House • Importers, Exporters & Stockists'}
                </p>
              </div>

              <div className="text-right text-[10px] text-slate-600 space-y-0.5 max-w-[420px]">
                <p className="font-semibold text-slate-900">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p>
                  <span>Tel: <strong className="text-slate-900">{company.phone}</strong></span>
                  {' • '}
                  <span>Email: <strong className="text-slate-900">{company.email}</strong></span>
                </p>
                <div className="pt-1 flex items-center justify-end gap-2 font-mono text-[9.5px]">
                  <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-bold text-slate-900">
                    GSTIN: {company.gstin}
                  </span>
                  {company.pan && (
                    <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-bold text-slate-900">
                      PAN: {company.pan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-3 mb-4 border-b border-slate-300 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 uppercase">{company.name}</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-700">{quotation.quotationNumber}</span>
            </div>
            <span className="text-slate-500 font-medium">Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Title Bar & Status */}
        {!isContinuationPage && (
          <div className="mb-4 flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm tracking-widest uppercase">
                {documentTitle || 'COMMERCIAL QUOTATION'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Quote No:</span>
              <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* Quotation Metadata Grid */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
            <div>
              <span className="text-slate-500 block">Quotation Date</span>
              <strong className="text-slate-900">{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Valid Until</span>
              <strong className="text-slate-900">{quotation.validUntil}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Salesperson</span>
              <strong className="text-slate-900">{quotation.salesperson || 'Sales Team'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Customer Ref</span>
              <strong className="text-slate-900">{quotation.customerReference || 'Direct Inquiry'}</strong>
            </div>
          </div>
        )}

        {/* Customer Information Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px]">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Billed To (Customer):
              </span>
              <h3 className="font-bold text-slate-950 text-xs">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-medium text-slate-700">
                {quotation.customerGstin && <span>GSTIN: <strong>{quotation.customerGstin}</strong></span>}
                {quotation.customerPhone && <span>Phone: <strong>{quotation.customerPhone}</strong></span>}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px]">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Shipping Details:
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

        {/* Product Items Table */}
        <div className="mb-4 overflow-hidden border border-slate-300 rounded-lg">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2 text-left">Item Description & Specifications</th>
                <th className="py-2 px-2 text-center w-16">HSN/SAC</th>
                <th className="py-2 px-2 text-right w-14">Qty</th>
                <th className="py-2 px-2 text-center w-12">Unit</th>
                <th className="py-2 px-2 text-right w-20">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-2 px-2 text-right w-16">Disc</th>}
                <th className="py-2 px-2 text-right w-14">GST</th>
                <th className="py-2 px-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                  <td className="py-2 px-2 text-center font-mono text-slate-500">{startIndex + idx + 1}</td>
                  <td className="py-2 px-2">
                    <p className="font-bold text-slate-950 text-[10.5px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-slate-500 text-[9px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2 px-2 text-center text-slate-600 uppercase">{item.unit}</td>
                  <td className="py-2 px-2 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-2 px-2 text-right font-mono text-red-600">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-2 px-2 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Totals (Bottom of page 1 if single-page or last page) */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mb-4">
            {/* Amount in words & Bank */}
            <div className="col-span-7 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                <span className="font-bold text-slate-500 uppercase tracking-wider block">Amount in Words:</span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                  <span className="font-bold text-blue-900 uppercase tracking-wider block mb-1">
                    Bank Remittance Details:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <p><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-500">A/c No:</span> <strong className="font-mono">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            {/* Totals Table */}
            <div className="col-span-5">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-[10px] space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
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
                    <span>Freight / Other Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-slate-900 text-white p-2 rounded mt-2">
                  <span className="font-bold text-xs uppercase tracking-wider">Grand Total:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Terms & Authorized Signature */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-8 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[9.5px]">
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Commercial Terms & Conditions:
              </span>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-slate-200 rounded-lg bg-white">
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
              <span className="border-t border-slate-400 pt-1 w-full text-[9px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
              <span className="text-[8.5px] text-slate-500">
                {signature.signatoryDesignation || 'Commercial Operations'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-400">
        <p>This is a computer generated commercial quotation • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
