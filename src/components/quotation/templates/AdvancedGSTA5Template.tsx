import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const AdvancedGSTA5Template: React.FC<TemplateProps> = ({
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
    <div className="flex flex-col justify-between h-full text-slate-900 font-sans text-[8.5px] leading-tight select-none">
      <div>
        {/* A5 Compact Header */}
        {!isContinuationPage ? (
          <div className="pb-2 mb-2 border-b-2 border-teal-700">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-9 w-auto max-w-[130px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <div>
                  <h2 className="font-extrabold text-xs text-slate-950 uppercase leading-none">{company.name}</h2>
                  <p className="text-[7.5px] text-slate-600 mt-0.5 leading-none">
                    {cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}`)}
                  </p>
                  <p className="text-[7.5px] text-slate-600 font-mono mt-0.5">
                    GSTIN: <strong>{company.gstin}</strong> | Tel: {company.phone}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="bg-teal-800 text-white font-bold text-[8.5px] px-2 py-0.5 rounded uppercase tracking-wider">
                  {documentTitle || 'GST TAX INVOICE (A5)'}
                </div>
                <div className="font-mono text-[8px] text-slate-700 mt-1">
                  <span>No: <strong className="text-slate-900">{quotation.quotationNumber}</strong></span>
                  <span className="ml-1.5">Date: {quotation.quotationDate}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-1 mb-2 border-b border-teal-600 flex justify-between items-center text-[8px]">
            <strong className="uppercase">{company.name}</strong>
            <span className="font-mono">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* A5 Customer & Consignee Compact Strip */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-2 mb-2 p-1.5 bg-teal-50/40 border border-teal-200 rounded text-[8px]">
            <div>
              <span className="font-bold text-teal-900 uppercase block text-[7.5px]">Billed To:</span>
              <strong className="text-slate-950 text-[9px] block leading-tight">{quotation.customerName}</strong>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <div className="font-mono mt-0.5 text-slate-800">
                GSTIN: <strong>{quotation.customerGstin || 'Unregistered'}</strong>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-600 uppercase block text-[7.5px]">Shipped To:</span>
              <p className="text-slate-700 font-medium">{quotation.customerName}</p>
              <p className="text-slate-600">{cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}</p>
              <div className="font-mono mt-0.5 text-slate-800 flex justify-between">
                <span>State Code: {quotation.customerStateCode || '27'}</span>
                <span className={`px-1 py-0.2 rounded font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* A5 Compact GST Items Table */}
        <div className="mb-2 overflow-hidden border border-teal-800 rounded">
          <table className="w-full text-[8px] border-collapse">
            <thead>
              <tr className="bg-teal-900 text-white font-semibold">
                <th className="py-1 px-1 text-center w-6">#</th>
                <th className="py-1 px-1.5 text-left">Description of Goods</th>
                <th className="py-1 px-1 text-center w-12">HSN</th>
                <th className="py-1 px-1 text-right w-10">Qty</th>
                <th className="py-1 px-1 text-right w-14">Rate</th>
                <th className="py-1 px-1 text-right w-10">GST</th>
                <th className="py-1 px-1.5 text-right w-16">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-teal-50/15' : 'bg-white'}>
                  <td className="py-1 px-1 text-center font-mono text-slate-500">{startIndex + idx + 1}</td>
                  <td className="py-1 px-1.5">
                    <p className="font-bold text-slate-900 text-[8.5px] leading-tight">{item.productName}</p>
                    {(item.material || item.grade || item.size) && (
                      <p className="text-slate-500 text-[7px] mt-0.5">
                        {[item.material, item.grade, item.size].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1 px-1 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-1 px-1 text-right font-bold font-mono">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  <td className="py-1 px-1 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* A5 Compact Financial Summary & Bank Block */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-2 mb-2">
            <div className="col-span-7 space-y-1.5">
              <div className="p-1.5 border border-slate-200 rounded bg-slate-50 text-[7.5px]">
                <span className="font-bold text-slate-500 uppercase block">Amount in Words:</span>
                <p className="font-bold text-slate-900 leading-tight mt-0.5">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-1.5 border border-teal-200 rounded bg-teal-50/30 text-[7.5px]">
                  <span className="font-bold text-teal-900 uppercase block mb-0.5">Bank Details:</span>
                  <div className="grid grid-cols-2 gap-0.5 font-mono">
                    <div>Bank: {bank.bankName}</div>
                    <div>A/c: <strong>{bank.accountNumber}</strong></div>
                    <div>IFSC: {bank.ifscCode}</div>
                    <div>Branch: {bank.branchName}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-slate-50 border border-teal-300 rounded p-1.5 text-[8px] space-y-0.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable:</span>
                  <span className="font-mono font-bold text-slate-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.totalTax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax:</span>
                    <span className="font-mono">{formatAmt(display.totalTax, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Extra Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                {display.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[7px]">
                    <span>Round Off:</span>
                    <span className="font-mono">{display.roundOff > 0 ? `+${display.roundOff.toFixed(2)}` : display.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-teal-900 text-white p-1 rounded mt-1">
                  <span className="font-bold text-[8.5px] uppercase">Grand Total:</span>
                  <span className="font-mono font-extrabold text-[10px]">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* A5 Terms & Signature Compact */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-2 mt-1">
            <div className="col-span-8 p-1.5 border border-slate-200 rounded bg-slate-50 text-[7px]">
              <span className="font-bold text-slate-700 uppercase block mb-0.5">Terms:</span>
              <ul className="list-disc pl-3 space-y-0.5 text-slate-600">
                {terms.slice(0, 3).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-1 border border-slate-200 rounded bg-white">
              <span className="text-[6.5px] text-slate-400 block">For {company.name}</span>
              <div className="h-8 flex items-center justify-center relative my-0.5">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-8 w-auto object-contain opacity-80"
                    crossOrigin="anonymous"
                  />
                )}
                {signature.enabled && signature.url && (
                  <img
                    src={signature.url}
                    alt="Signature"
                    className="h-8 w-auto object-contain absolute"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <span className="border-t border-slate-300 pt-0.5 w-full text-[7px] font-bold text-slate-900 block">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* A5 Footer */}
      <div className="mt-auto pt-1 border-t border-slate-200 flex justify-between items-center text-[7px] text-slate-400">
        <p>A5 Document • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
