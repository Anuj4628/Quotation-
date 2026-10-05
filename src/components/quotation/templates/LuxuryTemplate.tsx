import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const LuxuryTemplate: React.FC<TemplateProps> = ({
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
    <div className="flex flex-col justify-between h-full text-stone-800 font-serif">
      <div>
        {/* Luxury Crest & Header */}
        {!isContinuationPage ? (
          <div className="pb-4 mb-4 border-b-2 border-stone-800 relative">
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[300px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-14 w-auto max-w-[260px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <h1 className="text-base font-bold text-stone-900 tracking-wider uppercase font-serif mt-1">
                  {company.name}
                </h1>
                <p className="text-[10px] text-amber-800 font-sans tracking-widest uppercase font-semibold">
                  {company.tagline || 'Excellence in Precision Metallurgy & Global Exports'}
                </p>
              </div>

              <div className="text-right text-[10px] text-stone-600 font-sans space-y-0.5 max-w-[420px]">
                <p className="font-semibold text-stone-900">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p>
                  <span>Tel: <strong className="text-stone-900">{company.phone}</strong></span>
                  {' • '}
                  <span>Email: <strong className="text-stone-900">{company.email}</strong></span>
                </p>
                <div className="pt-1.5 flex items-center justify-end gap-2 font-mono text-[9px]">
                  <span className="bg-stone-100 border border-amber-600/40 text-amber-950 px-2 py-0.5 rounded font-bold">
                    GSTIN: {company.gstin}
                  </span>
                  {company.pan && (
                    <span className="bg-stone-100 border border-stone-300 text-stone-800 px-2 py-0.5 rounded font-bold">
                      PAN: {company.pan}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Fine gold rule */}
            <div className="w-full h-0.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 mt-3" />
          </div>
        ) : (
          <div className="pb-3 mb-4 border-b border-amber-600/40 flex justify-between items-center text-xs font-sans">
            <span className="font-bold text-stone-900 tracking-wider uppercase">{company.name}</span>
            <span className="text-amber-900 font-mono">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Title Bar with Prestige Styling */}
        {!isContinuationPage && (
          <div className="mb-4 flex items-center justify-between border-y-2 border-stone-800 py-2.5 px-3 bg-stone-50">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm tracking-widest text-stone-950 uppercase font-serif">
                {documentTitle || 'EXECUTIVE COMMERCIAL QUOTATION'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-sans font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2 py-0.5 rounded text-[9.5px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-sans text-xs">
              <span className="text-stone-500 uppercase tracking-wider text-[10px]">Reference:</span>
              <span className="font-mono font-bold text-stone-900 bg-white border border-stone-300 px-2 py-0.5 rounded">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* Metadata Strip */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-amber-50/30 border border-amber-200/60 rounded-md text-[10px] font-sans">
            <div>
              <span className="text-stone-500 block uppercase text-[9px] tracking-wider">Date of Issue</span>
              <strong className="text-stone-900">{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-stone-500 block uppercase text-[9px] tracking-wider">Valid Through</span>
              <strong className="text-stone-900">{quotation.validUntil}</strong>
            </div>
            <div>
              <span className="text-stone-500 block uppercase text-[9px] tracking-wider">Commercial Advisor</span>
              <strong className="text-stone-900">{quotation.salesperson || 'Commercial Desk'}</strong>
            </div>
            <div>
              <span className="text-stone-500 block uppercase text-[9px] tracking-wider">Client Inquiry No</span>
              <strong className="text-stone-900">{quotation.customerReference || 'Executive Brief'}</strong>
            </div>
          </div>
        )}

        {/* Customer Section */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-4 mb-4 font-sans">
            <div className="p-3 bg-stone-50/70 border border-stone-300 rounded-md text-[10.5px]">
              <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Prepared Exclusively For:
              </span>
              <h3 className="font-bold text-stone-950 text-xs font-serif">{quotation.customerName}</h3>
              <p className="text-stone-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-stone-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                {quotation.customerGstin && (
                  <span className="border border-stone-300 bg-white px-2 py-0.5 rounded font-mono">
                    GSTIN: <strong>{quotation.customerGstin}</strong>
                  </span>
                )}
                {quotation.customerPhone && (
                  <span className="text-stone-600">Tel: <strong>{quotation.customerPhone}</strong></span>
                )}
              </div>
            </div>

            <div className="p-3 bg-stone-50/70 border border-stone-300 rounded-md text-[10.5px]">
              <span className="text-[9.5px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Consignee & Delivery Destination:
              </span>
              <p className="text-stone-600">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-stone-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <p className="text-stone-600 mt-1">Place of Supply: <strong>{quotation.customerState} ({quotation.customerStateCode || '27'})</strong></p>
            </div>
          </div>
        )}

        {/* Product Items Table with Luxury Styling */}
        <div className="mb-4 overflow-hidden border border-stone-800 rounded-md">
          <table className="w-full text-[10px] border-collapse font-sans">
            <thead>
              <tr className="bg-stone-900 text-amber-100 font-semibold border-b border-amber-600">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-2 text-left">Specification & Description</th>
                <th className="py-2.5 px-2 text-center w-16">HSN Code</th>
                <th className="py-2.5 px-2 text-right w-14">Quantity</th>
                <th className="py-2.5 px-2 text-center w-12">Unit</th>
                <th className="py-2.5 px-2 text-right w-20">Unit Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-2.5 px-2 text-right w-16">Disc</th>}
                <th className="py-2.5 px-2 text-right w-14">GST</th>
                <th className="py-2.5 px-2 text-right w-24">Gross Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-amber-50/15' : 'bg-white'}>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-400">{startIndex + idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <p className="font-bold text-stone-950 text-[10.5px] font-serif">{item.productName}</p>
                    {item.description && <p className="text-stone-600 text-[9.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-amber-900/80 text-[9px] mt-0.5">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-600">{item.hsnCode || '-'}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-stone-900">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-center text-stone-600 uppercase">{item.unit}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-stone-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-2.5 px-2 text-right font-mono text-amber-800">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-right font-mono text-stone-600">{item.gstRate}%</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Luxury Financial Summary */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mb-4 font-sans">
            <div className="col-span-7 space-y-3">
              <div className="p-3 bg-stone-50 border border-stone-300 rounded-md text-[10px]">
                <span className="font-bold text-amber-900 uppercase tracking-wider block font-serif">
                  Total Valuation in Words:
                </span>
                <p className="font-bold text-stone-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-3 bg-stone-50 border border-stone-300 rounded-md text-[10px]">
                  <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1 font-serif">
                    Settlement & Banking Routing:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <p><span className="text-stone-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-stone-500">Account:</span> <strong className="font-mono text-amber-900">{bank.accountNumber}</strong></p>
                    <p><span className="text-stone-500">IFSC Code:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-stone-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-stone-50 border border-stone-300 rounded-md p-3 text-[10px] space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-stone-900">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600 border-t border-stone-200 pt-1">
                  <span>Taxable Basis:</span>
                  <span className="font-mono font-semibold text-stone-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>CGST:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>SGST:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>IGST:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Handling / Freight:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-stone-900 text-amber-200 p-2.5 rounded border border-amber-600 mt-2">
                  <span className="font-bold text-xs uppercase tracking-widest font-serif">Executive Total:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Terms & Luxury Signature Block */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-4 mt-2 font-sans">
            <div className="col-span-8 p-3 bg-stone-50 border border-stone-200 rounded-md text-[9.5px]">
              <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1 font-serif">
                Commercial Undertakings & Terms:
              </span>
              <ul className="space-y-0.5 text-stone-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-600">◆</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border-2 border-stone-300 rounded-md bg-white">
              <span className="text-[9px] text-stone-400 block mb-1 font-serif">Certified by {company.name}</span>
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
              <span className="border-t border-amber-600 pt-1 w-full text-[9px] font-bold text-stone-900 block mt-1 font-serif">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
              <span className="text-[8.5px] text-stone-500">
                {signature.signatoryDesignation || 'Managing Director / Commercial'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Luxury Footer */}
      <div className="mt-auto pt-3 border-t border-stone-300 flex justify-between items-center text-[9.5px] text-stone-400 font-sans">
        <p>Official Executive Quotation • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
