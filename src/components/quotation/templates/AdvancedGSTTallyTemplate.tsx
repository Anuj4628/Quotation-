import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt } from './templateUtils';

export const AdvancedGSTTallyTemplate: React.FC<TemplateProps> = ({
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
    <div className="flex flex-col justify-between h-full text-black font-sans text-[10px] leading-tight">
      <div className="border-2 border-black bg-white">
        {/* Document Title Header Bar */}
        <div className="text-center font-bold text-xs tracking-wider uppercase py-1 border-b border-black bg-slate-100">
          {documentTitle || 'COMMERCIAL QUOTATION / TAX INVOICE'}
        </div>

        {/* Company & Voucher Details Grid */}
        {!isContinuationPage ? (
          <div className="grid grid-cols-2 border-b border-black">
            {/* Left: Supplier Details */}
            <div className="p-2 border-r border-black flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={company.name}
                      className="h-10 w-auto max-w-[160px] object-contain"
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div>
                    <h2 className="font-extrabold text-sm uppercase leading-tight">{company.name}</h2>
                    <p className="text-[9px] text-slate-700">{company.tagline || 'Govt. Recognized Export House'}</p>
                  </div>
                </div>
                <p className="mt-1">{cleanAddress(company.addressLine1)}</p>
                {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                <p className="mt-0.5">Contact: <strong>{company.phone}</strong> | Email: <strong>{company.email}</strong></p>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-300 font-mono text-[9px] space-y-0.5">
                <div>GSTIN/UIN: <strong>{company.gstin}</strong></div>
                <div>State Name: <strong>{company.state}</strong>, Code: <strong>{company.stateCode || '27'}</strong></div>
                {company.pan && <div>PAN/IT No: <strong>{company.pan}</strong></div>}
              </div>
            </div>

            {/* Right: Voucher Metadata Grid (Accounting Style) */}
            <div className="text-[9px] divide-y divide-black">
              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Quotation / Invoice No.</span>
                  <strong className="font-mono text-xs">{quotation.quotationNumber}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Dated</span>
                  <strong className="font-mono text-[10px]">{quotation.quotationDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Delivery Note</span>
                  <strong>{quotation.referenceNumber || 'N/A'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Mode/Terms of Payment</span>
                  <strong>{quotation.paymentTerms || '100% Advance'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Buyer's Order No.</span>
                  <strong>{quotation.customerReference || 'Inquiry'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Valid Until</span>
                  <strong className="font-mono text-[10px]">{quotation.validUntil}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Despatched Through</span>
                  <strong>{quotation.deliveryTerms || 'Road Transport'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Destination</span>
                  <strong>{quotation.customerCity}, {quotation.customerState}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-black flex justify-between items-center text-xs">
            <span className="font-extrabold uppercase">{company.name}</span>
            <span className="font-mono">Ref: {quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Buyer & Consignee Box */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
            {/* Buyer (Bill to) */}
            <div className="p-2 text-[9.5px]">
              <span className="font-bold text-[8.5px] uppercase text-slate-700 block mb-0.5">
                Buyer (Bill to):
              </span>
              <h3 className="font-extrabold text-[11px] uppercase leading-tight">{quotation.customerName}</h3>
              <p className="mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p>{cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}</p>
              <div className="mt-1 font-mono text-[9px]">
                <div>GSTIN/UIN: <strong>{quotation.customerGstin || 'Unregistered'}</strong></div>
                <div>State Name: <strong>{quotation.customerState}</strong>, Code: <strong>{quotation.customerStateCode || '27'}</strong></div>
              </div>
            </div>

            {/* Consignee (Ship to) */}
            <div className="p-2 text-[9.5px]">
              <span className="font-bold text-[8.5px] uppercase text-slate-700 block mb-0.5">
                Consignee (Ship to):
              </span>
              <p className="font-semibold">{quotation.customerName}</p>
              <p className="mt-0.5">{cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}</p>
              <p>{cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}</p>
              <div className="mt-1 font-mono text-[9px]">
                <div>State Name: <strong>{quotation.customerState}</strong>, Code: <strong>{quotation.customerStateCode || '27'}</strong></div>
                <div>Place of Supply: <strong>{quotation.customerState}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Tally Structured Accounting Item Table */}
        <div className="border-b border-black">
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold divide-x divide-black text-center">
                <th className="py-1 px-1 w-8">Sl No.</th>
                <th className="py-1 px-2 text-left">Description of Goods & Specifications</th>
                <th className="py-1 px-1 w-16">HSN/SAC</th>
                <th className="py-1 px-1 w-14">Quantity</th>
                <th className="py-1 px-1 w-16 text-right">Rate</th>
                <th className="py-1 px-1 w-10">per</th>
                {quotation.totalDiscount > 0 && <th className="py-1 px-1 w-12 text-right">Disc %</th>}
                <th className="py-1 px-1.5 w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black divide-x divide-black bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="divide-x divide-black align-top">
                  <td className="py-1 px-1 text-center font-mono">{startIndex + idx + 1}</td>
                  <td className="py-1 px-2">
                    <p className="font-bold text-[10px] uppercase">{item.productName}</p>
                    {item.description && <p className="text-slate-700 text-[8.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-[8px] text-slate-600 mt-0.5 font-mono">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1 px-1 text-center font-mono">{item.hsnCode || '-'}</td>
                  <td className="py-1 px-1 text-right font-bold font-mono">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-1 px-1 text-right font-mono">{formatAmt(item.rate, display)}</td>
                  <td className="py-1 px-1 text-center uppercase text-[8px]">{item.unit}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-1 px-1 text-right font-mono">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                    </td>
                  )}
                  <td className="py-1 px-1.5 text-right font-mono font-bold">
                    {formatAmt(item.taxableAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tally Bottom Calculation & Terms Grid */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 divide-x divide-black">
            {/* Left 7 Columns: Amount in Words, Bank & Declaration */}
            <div className="col-span-7 flex flex-col justify-between divide-y divide-black">
              {/* Amount in words */}
              <div className="p-2 text-[9px]">
                <span className="text-[8px] text-slate-600 uppercase block">Amount Chargeable (in words):</span>
                <strong className="uppercase font-bold text-[9.5px] leading-tight block mt-0.5">
                  {display.amountInWords}
                </strong>
              </div>

              {/* Company Bank Details */}
              {bank && (
                <div className="p-2 text-[8.5px] space-y-0.5 bg-slate-50">
                  <span className="font-bold uppercase text-[8px] text-slate-700 block">Company's Bank Details:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono">
                    <div>Bank Name: <strong>{bank.bankName}</strong></div>
                    <div>A/c No.: <strong>{bank.accountNumber}</strong></div>
                    <div>Branch: <strong>{bank.branchName}</strong></div>
                    <div>IFS Code: <strong>{bank.ifscCode}</strong></div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions & Declaration */}
              <div className="p-2 text-[8px] space-y-1">
                <span className="font-bold uppercase text-slate-700 block">Declaration & Terms:</span>
                <ol className="list-decimal pl-3 space-y-0.5 text-slate-700">
                  {terms.slice(0, 4).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
                <p className="text-[7.5px] text-slate-500 italic pt-1">
                  We declare that this quotation shows the actual price of the goods described and that all particulars are true and correct.
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Accounting Ledger Totals & Signatory Box */}
            <div className="col-span-5 flex flex-col justify-between divide-y divide-black">
              {/* Financial Totals Breakdown */}
              <div className="p-2 text-[9px] space-y-1">
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Freight / Other Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                {display.roundOff !== 0 && (
                  <div className="flex justify-between text-[8px] text-slate-600">
                    <span>Round Off:</span>
                    <span className="font-mono">{display.roundOff > 0 ? `+${display.roundOff.toFixed(2)}` : display.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-black pt-1 font-bold text-xs">
                  <span>TOTAL:</span>
                  <span className="font-mono font-extrabold">{formatAmt(display.grandTotal, display)}</span>
                </div>
                <div className="text-[7.5px] text-right text-slate-500">E. & O.E.</div>
              </div>

              {/* Authorised Signatory Box */}
              <div className="p-2 text-center flex flex-col justify-between h-24">
                <span className="text-[8px] font-bold uppercase text-slate-700">
                  for {company.name}
                </span>

                <div className="flex items-center justify-center relative my-1">
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

                <div className="border-t border-black pt-0.5 text-[8px] font-bold uppercase">
                  {signature.signatoryName || 'Authorised Signatory'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accounting Document Bottom Note */}
      <div className="mt-1 flex justify-between items-center text-[8px] text-slate-500 px-1">
        <span>SUBJECT TO MUMBAI JURISDICTION • This is a Computer Generated Document</span>
        <span className="font-mono">Page {pageNumber} of {totalPages}</span>
      </div>
    </div>
  );
};
