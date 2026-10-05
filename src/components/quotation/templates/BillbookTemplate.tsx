import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const BillbookTemplate: React.FC<TemplateProps> = ({
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
    <div className="flex flex-col justify-between h-full text-slate-900 font-sans">
      <div>
        {/* Billbook Commercial Header */}
        {!isContinuationPage ? (
          <div className="p-3 mb-3 border-2 border-slate-900 rounded-lg bg-white">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-12 w-auto max-w-[180px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <div>
                  <h1 className="text-base font-extrabold text-slate-950 uppercase leading-none tracking-tight">
                    {company.name}
                  </h1>
                  <p className="text-[9.5px] text-slate-600 font-medium mt-0.5">
                    {cleanAddress(company.addressLine1)}, {cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}`)}
                  </p>
                  <p className="text-[9px] text-slate-600">
                    Phone: <strong>{company.phone}</strong> | Email: <strong>{company.email}</strong>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded uppercase tracking-wider mb-1">
                  {documentTitle || 'COMMERCIAL BILL / QUOTE'}
                </div>
                <div className="font-mono text-[9px] text-slate-800">
                  <div>GSTIN: <strong>{company.gstin}</strong></div>
                  {company.pan && <div>PAN: <strong>{company.pan}</strong></div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 mb-3 border border-slate-900 rounded flex justify-between items-center text-xs">
            <strong className="uppercase">{company.name}</strong>
            <span className="font-mono">Bill No: {quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Invoice & Customer Matrix */}
        {!isContinuationPage && (
          <div className="grid grid-cols-12 gap-3 mb-3">
            {/* Bill To */}
            <div className="col-span-5 p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-[10px]">
              <span className="font-bold text-sky-800 text-[9px] uppercase tracking-wider block mb-0.5">
                BILL TO:
              </span>
              <h3 className="font-bold text-slate-950 text-[11px]">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 font-mono text-[9px]">
                {quotation.customerGstin && <div>GSTIN: <strong>{quotation.customerGstin}</strong></div>}
                {quotation.customerPhone && <div>Phone: <strong>{quotation.customerPhone}</strong></div>}
              </div>
            </div>

            {/* Ship To */}
            <div className="col-span-4 p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-[10px]">
              <span className="font-bold text-slate-600 text-[9px] uppercase tracking-wider block mb-0.5">
                SHIP TO:
              </span>
              <p className="font-semibold text-slate-900">{quotation.customerName}</p>
              <p className="text-slate-600 mt-0.5">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 text-[9px] text-slate-600">
                <span>Place of Supply: <strong>{quotation.customerState}</strong></span>
              </div>
            </div>

            {/* Bill Info */}
            <div className="col-span-3 p-2.5 border border-slate-300 rounded-lg bg-white text-[9.5px] space-y-1">
              <div>
                <span className="text-slate-500 block text-[8.5px] uppercase">Quotation / Bill No:</span>
                <strong className="font-mono text-slate-950 text-xs block">{quotation.quotationNumber}</strong>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <span className="text-slate-500 block text-[8.5px] uppercase">Bill Date:</span>
                <strong className="text-slate-900 font-mono">{quotation.quotationDate}</strong>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <span className="text-slate-500 block text-[8.5px] uppercase">Status:</span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Items Table */}
        <div className="mb-3 overflow-hidden border border-slate-800 rounded-lg">
          <table className="w-full text-[9.5px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-2 px-1.5 text-center w-7">#</th>
                <th className="py-2 px-2 text-left">Item Name & Details</th>
                <th className="py-2 px-1 text-center w-14">HSN</th>
                <th className="py-2 px-1.5 text-right w-12">Qty</th>
                <th className="py-2 px-1 text-center w-10">Unit</th>
                <th className="py-2 px-1.5 text-right w-16">Price</th>
                {quotation.totalDiscount > 0 && <th className="py-2 px-1 text-right w-12">Disc</th>}
                <th className="py-2 px-1 text-right w-12">GST</th>
                <th className="py-2 px-2 text-right w-20">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="py-1.5 px-1.5 text-center font-mono text-slate-500">{startIndex + idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-slate-950 text-[10px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-slate-500 text-[8.5px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-1.5 px-1.5 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-1.5 px-1 text-center text-slate-600 uppercase">{item.unit}</td>
                  <td className="py-1.5 px-1.5 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-1.5 px-1 text-right font-mono text-red-600">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-1.5 px-1 text-right font-mono text-slate-600">{item.gstRate}%</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Billbook Totals & Bank Block */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-7 space-y-2">
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-[9.5px]">
                <span className="font-bold text-slate-600 uppercase tracking-wider block text-[8.5px]">
                  Total in Words:
                </span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-2 border border-slate-200 rounded-lg bg-white text-[9px]">
                  <span className="font-bold text-sky-800 uppercase tracking-wider block mb-1">
                    Bank Payment Details:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <p><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-500">A/c:</span> <strong className="font-mono">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-[9.5px] space-y-1">
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
                  <span>Taxable:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.totalTax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Total GST:</span>
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
                  <div className="flex justify-between text-slate-500 text-[8.5px]">
                    <span>Round Off:</span>
                    <span className="font-mono">{display.roundOff > 0 ? `+${display.roundOff.toFixed(2)}` : display.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-slate-950 text-white p-2 rounded mt-1.5">
                  <span className="font-black text-xs uppercase tracking-wider">Net Payable:</span>
                  <span className="font-mono font-black text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Terms & Bill Signature */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-8 p-2 border border-slate-200 rounded-lg bg-slate-50 text-[8.5px]">
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                Terms & Conditions:
              </span>
              <ul className="list-disc pl-3.5 space-y-0.5 text-slate-600">
                {terms.slice(0, 4).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-slate-200 rounded-lg bg-white">
              <span className="text-[8px] text-slate-400 block mb-0.5">For {company.name}</span>
              <div className="h-11 flex items-center justify-center relative">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-10 w-auto object-contain opacity-80"
                    crossOrigin="anonymous"
                  />
                )}
                {signature.enabled && signature.url && (
                  <img
                    src={signature.url}
                    alt="Signature"
                    className="h-10 w-auto object-contain absolute"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <span className="border-t border-slate-400 pt-0.5 w-full text-[8.5px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Billbook Footer */}
      <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
        <p>Computer Generated Commercial Bill • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
