import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt } from './templateUtils';

export const SimpleTemplate: React.FC<TemplateProps> = ({
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
    <div className="flex flex-col justify-between h-full text-black font-sans text-xs">
      <div>
        {/* Simple Monochrome Header */}
        {!isContinuationPage ? (
          <div className="pb-3 mb-3 border-b-2 border-black">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[300px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-12 w-auto max-w-[240px] object-contain grayscale"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <h1 className="text-base font-extrabold uppercase tracking-tight mt-1">
                  {company.name}
                </h1>
                <p className="text-[10px] text-slate-600">
                  {company.tagline || 'Govt. Recognized Star Export House'}
                </p>
              </div>

              <div className="text-right text-[10px] text-slate-700 space-y-0.5 max-w-[420px]">
                <p className="font-semibold text-black">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p>Phone: {company.phone} | Email: {company.email}</p>
                <div className="pt-1 font-mono text-[9px]">
                  <span>GSTIN: <strong>{company.gstin}</strong></span>
                  {company.pan && <span className="ml-2">PAN: <strong>{company.pan}</strong></span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-2 mb-3 border-b border-black flex justify-between items-center text-xs">
            <strong className="uppercase">{company.name}</strong>
            <span className="font-mono">Ref: {quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Simple Title Bar */}
        {!isContinuationPage && (
          <div className="mb-3 flex items-center justify-between border border-black p-2 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm uppercase tracking-wider">
                {documentTitle || 'COMMERCIAL QUOTATION'}
              </span>
              <span className="border border-black px-2 py-0.2 rounded text-[9.5px] font-bold uppercase">
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="border border-black bg-black text-white px-2 py-0.2 rounded text-[9px] font-bold">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="font-mono text-xs">
              <span>Quote No: <strong>{quotation.quotationNumber}</strong></span>
            </div>
          </div>
        )}

        {/* Simple Metadata Grid */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-2 mb-3 p-2 border border-slate-300 text-[10px]">
            <div>
              <span className="text-slate-500 block text-[9px]">Date:</span>
              <strong>{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Valid Until:</span>
              <strong>{quotation.validUntil}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Salesperson:</span>
              <strong>{quotation.salesperson || 'Sales Desk'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Inquiry Ref:</span>
              <strong>{quotation.customerReference || 'N/A'}</strong>
            </div>
          </div>
        )}

        {/* Customer & Shipping 2-Column Simple Box */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 border border-slate-300 text-[10px]">
              <span className="font-bold uppercase text-[9px] text-slate-600 block mb-0.5">
                Billed To:
              </span>
              <h3 className="font-bold text-xs">{quotation.customerName}</h3>
              <p className="mt-0.5 text-slate-700">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-700">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 font-mono text-[9px]">
                {quotation.customerGstin && <div>GSTIN: <strong>{quotation.customerGstin}</strong></div>}
                {quotation.customerPhone && <div>Phone: <strong>{quotation.customerPhone}</strong></div>}
              </div>
            </div>

            <div className="p-2.5 border border-slate-300 text-[10px]">
              <span className="font-bold uppercase text-[9px] text-slate-600 block mb-0.5">
                Shipped To:
              </span>
              <p className="font-semibold">{quotation.customerName}</p>
              <p className="mt-0.5 text-slate-700">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-700">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 text-[9px]">
                <span>State Code: <strong>{quotation.customerStateCode || '27'}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Simple Monochrome Table */}
        <div className="mb-3 border border-black">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold">
                <th className="py-1.5 px-2 text-center w-8">#</th>
                <th className="py-1.5 px-2 text-left">Description of Goods</th>
                <th className="py-1.5 px-2 text-center w-16">HSN</th>
                <th className="py-1.5 px-2 text-right w-14">Qty</th>
                <th className="py-1.5 px-2 text-center w-12">Unit</th>
                <th className="py-1.5 px-2 text-right w-20">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-1.5 px-2 text-right w-16">Disc</th>}
                <th className="py-1.5 px-2 text-right w-14">Tax</th>
                <th className="py-1.5 px-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600">{startIndex + idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-[10.5px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-slate-500 text-[8.5px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-1.5 px-2 text-right font-bold">{item.quantity}</td>
                  <td className="py-1.5 px-2 text-center uppercase text-slate-700">{item.unit}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-1.5 px-2 text-right font-mono">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-1.5 px-2 text-right font-mono text-slate-700">{item.gstRate}%</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Simple Totals & Bank Section */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-7 space-y-2">
              <div className="p-2 border border-slate-300 text-[9.5px]">
                <span className="font-bold text-slate-600 uppercase block text-[8.5px]">Amount in Words:</span>
                <p className="font-bold mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-2 border border-slate-300 text-[9px]">
                  <span className="font-bold uppercase block mb-1">Bank Payment Details:</span>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <p>Bank: {bank.bankName}</p>
                    <p>A/c: <strong>{bank.accountNumber}</strong></p>
                    <p>IFSC: {bank.ifscCode}</p>
                    <p>Branch: {bank.branchName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="border border-black p-2.5 text-[9.5px] space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-1">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-semibold">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.totalTax > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>GST (Tax):</span>
                    <span className="font-mono">{formatAmt(display.totalTax, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
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
                {/* Traditional accounting double bottom border */}
                <div className="flex justify-between items-center border-t-2 border-b-4 border-black py-1 mt-1 font-bold">
                  <span className="text-xs uppercase">Grand Total:</span>
                  <span className="font-mono font-black text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Signature Simple Box */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-8 p-2 border border-slate-300 text-[9px]">
              <span className="font-bold uppercase block mb-1">Terms & Conditions:</span>
              <ol className="list-decimal pl-3.5 space-y-0.5 text-slate-700">
                {terms.slice(0, 4).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-black bg-white">
              <span className="text-[8.5px] text-slate-500 block mb-1">For {company.name}</span>
              <div className="h-12 flex items-center justify-center relative">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-11 w-auto object-contain opacity-80"
                    crossOrigin="anonymous"
                  />
                )}
                {signature.enabled && signature.url && (
                  <img
                    src={signature.url}
                    alt="Signature"
                    className="h-11 w-auto object-contain absolute"
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <span className="border-t border-black pt-0.5 w-full text-[8.5px] font-bold block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simple Footer */}
      <div className="mt-auto pt-2 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500">
        <p>Simple Commercial Quotation Document • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
