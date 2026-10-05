import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const BillbookA5Template: React.FC<TemplateProps> = ({
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
        {/* Billbook A5 Top Header */}
        {!isContinuationPage ? (
          <div className="p-2 mb-2 border border-indigo-900/30 rounded-lg bg-indigo-50/20">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-9 w-auto max-w-[120px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <div>
                  <h1 className="font-black text-xs text-indigo-950 uppercase leading-none tracking-tight">
                    {company.name}
                  </h1>
                  <p className="text-[7.5px] text-slate-600 mt-0.5 leading-none">
                    {cleanAddress(company.addressLine1)}, {company.city}
                  </p>
                  <p className="text-[7px] text-slate-500 font-mono mt-0.5">
                    GSTIN: <strong>{company.gstin}</strong> | Tel: {company.phone}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="bg-indigo-700 text-white font-extrabold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider block">
                  {documentTitle || 'BILL ESTIMATE (A5)'}
                </span>
                <div className="font-mono text-[7.5px] text-slate-600 mt-1">
                  <span>No: <strong className="text-indigo-950">{quotation.quotationNumber}</strong></span>
                  <span className="ml-1 text-slate-400">|</span>
                  <span className="ml-1">{quotation.quotationDate}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-1 mb-2 border-b border-indigo-200 flex justify-between items-center text-[8px]">
            <span className="font-black uppercase text-indigo-950">{company.name}</span>
            <span className="font-mono text-slate-500">Bill: {quotation.quotationNumber} • P.{pageNumber}/{totalPages}</span>
          </div>
        )}

        {/* Compact Customer Card */}
        {!isContinuationPage && (
          <div className="mb-2 p-1.5 border border-slate-200 rounded-lg bg-white flex justify-between items-start text-[8px]">
            <div>
              <span className="text-[7px] font-bold text-indigo-800 uppercase block">Customer / Client:</span>
              <strong className="text-slate-950 text-[9px] block leading-tight">{quotation.customerName}</strong>
              <p className="text-slate-600 mt-0.5 leading-tight">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600 leading-tight">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
            </div>

            <div className="text-right text-[7.5px] font-mono shrink-0 space-y-0.5">
              {quotation.customerGstin && <div>GSTIN: <strong>{quotation.customerGstin}</strong></div>}
              {quotation.customerPhone && <div>Phone: <strong>{quotation.customerPhone}</strong></div>}
              <div className="pt-0.5">
                <span className={`px-1 py-0.2 rounded font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Billbook A5 Items Table */}
        <div className="mb-2 overflow-hidden border border-slate-300 rounded-lg">
          <table className="w-full text-[8px] border-collapse">
            <thead>
              <tr className="bg-indigo-950 text-white font-semibold">
                <th className="py-1 px-1 text-center w-6">#</th>
                <th className="py-1 px-1.5 text-left">Item Description</th>
                <th className="py-1 px-1 text-right w-10">Qty</th>
                <th className="py-1 px-1 text-right w-14">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-1 px-1 text-right w-10">Disc</th>}
                <th className="py-1 px-1 text-right w-10">Tax</th>
                <th className="py-1 px-1.5 text-right w-16">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-indigo-50/10' : 'bg-white'}>
                  <td className="py-1 px-1 text-center font-mono text-slate-400">{startIndex + idx + 1}</td>
                  <td className="py-1 px-1.5">
                    <p className="font-bold text-slate-950 text-[8.5px] leading-tight">{item.productName}</p>
                    {item.hsnCode && <span className="text-slate-400 text-[6.5px] font-mono">HSN: {item.hsnCode}</span>}
                    {(item.material || item.grade) && (
                      <span className="text-slate-500 text-[6.5px] ml-1">
                        {[item.material, item.grade].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-1 text-right font-bold font-mono">
                    {item.quantity} <span className="text-[6.5px] uppercase font-normal text-slate-500">{item.unit}</span>
                  </td>
                  <td className="py-1 px-1 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-1 px-1 text-right font-mono text-rose-600">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-1 px-1 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Billbook A5 Summary Strip */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-2 mb-2">
            <div className="col-span-7 space-y-1">
              <div className="p-1 border border-slate-200 rounded bg-slate-50 text-[7px]">
                <span className="font-bold text-slate-500 uppercase block">Words:</span>
                <p className="font-bold text-slate-900 mt-0.5 leading-tight">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-1 border border-slate-200 rounded bg-white text-[7px] font-mono">
                  <span className="font-bold text-indigo-900 uppercase block text-[6.5px]">Bank Account:</span>
                  <div>{bank.bankName} • A/c: <strong>{bank.accountNumber}</strong></div>
                  <div>IFSC: {bank.ifscCode}</div>
                </div>
              )}

              <div className="p-1 border border-slate-100 rounded text-[6.5px] text-slate-500">
                <span>Terms: {terms[0] || '100% advance against PI'} • {terms[1] || 'Ready Stock'}</span>
              </div>
            </div>

            <div className="col-span-5">
              <div className="bg-slate-50 border border-slate-300 rounded p-1.5 text-[7.5px] space-y-0.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalTax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST):</span>
                    <span className="font-mono">{formatAmt(display.totalTax, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-indigo-950 text-white p-1 rounded mt-0.5">
                  <span className="font-bold text-[8px] uppercase">Net Amount:</span>
                  <span className="font-mono font-black text-[9.5px]">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="mt-1 p-1 text-center border border-slate-200 rounded bg-white">
                <div className="h-7 flex items-center justify-center relative">
                  {stamp.enabled && stamp.url && (
                    <img
                      src={stamp.url}
                      alt="Stamp"
                      className="h-7 w-auto object-contain opacity-80"
                      crossOrigin="anonymous"
                    />
                  )}
                  {signature.enabled && signature.url && (
                    <img
                      src={signature.url}
                      alt="Signature"
                      className="h-7 w-auto object-contain absolute"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                <span className="border-t border-slate-300 pt-0.5 w-full text-[6.5px] font-bold text-slate-800 block">
                  {signature.signatoryName || 'Authorized Signatory'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billbook A5 Footer */}
      <div className="mt-auto pt-1 border-t border-slate-200 flex justify-between items-center text-[6.5px] text-slate-400">
        <p>Commercial Billbook A5 • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
