import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const TallyTemplate: React.FC<TemplateProps> = ({
  data,
  pageNumber,
  totalPages,
  items,
  startIndex,
  isSinglePage,
  isContinuationPage,
}) => {
  const { quotation, display, company, bank, terms, signature, stamp, logoUrl, documentTitle } = data;

  // Build GST Tax Summary grouping by HSN/SAC
  const hsnSummaryMap = new Map<
    string,
    {
      hsnCode: string;
      taxableAmount: number;
      gstRate: number;
      taxAmount: number;
    }
  >();

  quotation.items.forEach((item) => {
    const key = `${item.hsnCode || 'OTHER'}_${item.gstRate}`;
    const existing = hsnSummaryMap.get(key) || {
      hsnCode: item.hsnCode || 'N/A',
      taxableAmount: 0,
      gstRate: item.gstRate,
      taxAmount: 0,
    };
    existing.taxableAmount += item.taxableAmount;
    existing.taxAmount += item.cgstAmount + item.sgstAmount + item.igstAmount;
    hsnSummaryMap.set(key, existing);
  });

  const hsnSummaryList = Array.from(hsnSummaryMap.values());

  return (
    <div className="flex flex-col justify-between h-full text-black font-sans text-[10px] leading-tight select-none">
      <div className="border-2 border-black bg-white">
        {/* Document Top Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-black bg-slate-100">
          <span className="font-extrabold text-xs tracking-wider uppercase">
            {documentTitle || 'TAX INVOICE'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-black px-2 py-0.2">
              ORIGINAL FOR RECIPIENT
            </span>
            <span className={`px-1.5 py-0.2 text-[8.5px] font-bold uppercase border border-black ${getStatusBadgeStyle(quotation.status)}`}>
              {quotation.status.replace('_', ' ')}
            </span>
            {display.isConverted && (
              <span className="bg-black text-white text-[8.5px] font-bold px-1.5 py-0.2">
                {display.currency.code} ({display.currency.symbol})
              </span>
            )}
          </div>
        </div>

        {/* Company Header & Voucher Details */}
        {!isContinuationPage ? (
          <div className="grid grid-cols-12 border-b border-black divide-x divide-black">
            {/* Left Side: Original Company Logo & Details (7 Cols) */}
            <div className="col-span-7 p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-1.5">
                  {/* IMPORTANT: Company logo in ORIGINAL FULL COLOR */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={company.name}
                      className="h-11 w-auto max-w-[170px] object-contain shrink-0"
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div>
                    <h1 className="font-black text-sm uppercase leading-tight tracking-tight">
                      {company.name}
                    </h1>
                    <p className="text-[8.5px] text-slate-700 mt-0.5 font-medium">
                      {company.tagline || 'Govt. Recognized Star Export House • Importers, Exporters & Stockists'}
                    </p>
                  </div>
                </div>

                <div className="text-[9px] text-slate-800 space-y-0.5 mt-1">
                  <p>{cleanAddress(company.addressLine1)}</p>
                  {company.addressLine2 && <p>{cleanAddress(company.addressLine2)}</p>}
                  <p>{cleanAddress(`${company.city}, ${company.state} - ${company.pinCode}, ${company.country}`)}</p>
                  <p>
                    <span>Phone: <strong>{company.phone}</strong></span>
                    {' | '}
                    <span>Email: <strong>{company.email}</strong></span>
                  </p>
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-300 font-mono text-[9px] flex flex-wrap gap-x-3 gap-y-0.5">
                <div>GSTIN/UIN: <strong>{company.gstin}</strong></div>
                <div>State Name: <strong>{company.state}</strong> (Code: <strong>{company.stateCode || '27'}</strong>)</div>
                {company.pan && <div>PAN: <strong>{company.pan}</strong></div>}
              </div>
            </div>

            {/* Right Side: Accounting Document Metadata (5 Cols) */}
            <div className="col-span-5 text-[9px] divide-y divide-black">
              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5 bg-slate-50/50">
                  <span className="text-slate-600 block text-[8px] uppercase">Quotation / Invoice No.</span>
                  <strong className="font-mono text-xs block mt-0.5">{quotation.quotationNumber}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Dated</span>
                  <strong className="font-mono text-[10px] block mt-0.5">{quotation.quotationDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Delivery Note / Ref</span>
                  <strong className="block mt-0.5">{quotation.referenceNumber || 'N/A'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Mode / Terms of Payment</span>
                  <strong className="block mt-0.5">{quotation.paymentTerms || '100% Advance'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Buyer's Order No.</span>
                  <strong className="block mt-0.5">{quotation.customerReference || 'Direct Inquiry'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Valid Until / Due Date</span>
                  <strong className="font-mono text-[10px] block mt-0.5">{quotation.validUntil}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black">
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Despatched Through</span>
                  <strong className="block mt-0.5">{quotation.deliveryTerms || 'Road Transport'}</strong>
                </div>
                <div className="p-1.5">
                  <span className="text-slate-600 block text-[8px] uppercase">Destination</span>
                  <strong className="block mt-0.5">{quotation.customerCity}, {quotation.customerState}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-black flex justify-between items-center text-xs">
            <span className="font-black uppercase">{company.name}</span>
            <span className="font-mono">Ref: {quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Bill To / Ship To Grid Section */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
            {/* Bill To Box */}
            <div className="p-2 text-[9.5px]">
              <span className="font-bold text-[8.5px] uppercase text-slate-700 block mb-1">
                BILL TO (BUYER):
              </span>
              <div className="space-y-0.5">
                <div>
                  <span className="text-slate-600">Customer: </span>
                  <strong className="uppercase font-bold text-[10.5px]">{quotation.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-600">Address: </span>
                  <span>{cleanAddress(quotation.billingAddress)}, {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}</span>
                </div>
                {quotation.customerPhone && (
                  <div>
                    <span className="text-slate-600">Mobile / Tel: </span>
                    <strong className="font-mono">{quotation.customerPhone}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-600">GSTIN / UIN: </span>
                  <strong className="font-mono">{quotation.customerGstin || 'Unregistered'}</strong>
                </div>
                <div>
                  <span className="text-slate-600">State: </span>
                  <span>{quotation.customerState} (Code: <strong>{quotation.customerStateCode || '27'}</strong>)</span>
                </div>
              </div>
            </div>

            {/* Ship To Box */}
            <div className="p-2 text-[9.5px]">
              <span className="font-bold text-[8.5px] uppercase text-slate-700 block mb-1">
                SHIP TO (DELIVERY ADDRESS):
              </span>
              <div className="space-y-0.5">
                <div>
                  <span className="text-slate-600">Consignee: </span>
                  <strong className="uppercase font-bold text-[10.5px]">{quotation.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-600">Address: </span>
                  <span>
                    {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}, {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Place of Supply: </span>
                  <strong>{quotation.customerState}</strong>
                </div>
                <div>
                  <span className="text-slate-600">State Code: </span>
                  <strong className="font-mono">{quotation.customerStateCode || '27'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tally Main Items Table */}
        <div className="border-b border-black">
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-slate-100 font-bold divide-x divide-black text-center">
                <th className="py-1 px-1 w-8 uppercase">S.NO.</th>
                <th className="py-1 px-2 text-left uppercase">ITEMS / DESCRIPTION</th>
                <th className="py-1 px-1 w-16 uppercase">HSN/SAC</th>
                <th className="py-1 px-1 w-12 uppercase">QTY.</th>
                <th className="py-1 px-1 w-10 uppercase">UNIT</th>
                <th className="py-1 px-1 w-16 text-right uppercase">RATE</th>
                {quotation.totalDiscount > 0 && <th className="py-1 px-1 w-12 text-right uppercase">DISC.</th>}
                <th className="py-1 px-1 w-12 text-right uppercase">TAX</th>
                <th className="py-1 px-1.5 w-24 text-right uppercase">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black divide-x divide-black bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="divide-x divide-black align-top">
                  <td className="py-1.5 px-1 text-center font-mono">{startIndex + idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-[10px] uppercase text-black">{item.productName}</p>
                    {item.description && <p className="text-slate-700 text-[8.5px] mt-0.5">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-[8px] text-slate-600 mt-0.5 font-mono">
                        {[item.material, item.grade, item.size, item.schedule, item.standard].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 px-1 text-center font-mono">{item.hsnCode || '-'}</td>
                  <td className="py-1.5 px-1 text-center font-bold font-mono">{item.quantity}</td>
                  <td className="py-1.5 px-1 text-center uppercase text-[8px]">{item.unit}</td>
                  <td className="py-1.5 px-1 text-right font-mono">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-1.5 px-1 text-right font-mono text-red-700">
                      {item.discountAmount > 0 ? formatAmt(item.discountAmount, display) : '-'}
                    </td>
                  )}
                  <td className="py-1.5 px-1 text-right font-mono">{item.gstRate}%</td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accounting Tax Summary Matrix Table (HSN/SAC) */}
        {(isSinglePage || isContinuationPage) && hsnSummaryList.length > 0 && (
          <div className="border-b border-black">
            <div className="bg-slate-100 px-2 py-0.5 border-b border-black text-[8px] font-bold uppercase tracking-wider flex justify-between">
              <span>Tax Breakdown Summary (By HSN/SAC)</span>
              <span>All amounts in {display.currency.code}</span>
            </div>
            <table className="w-full text-[8px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-black divide-x divide-black text-center font-semibold">
                  <th className="py-0.5 px-1 w-20">HSN/SAC</th>
                  <th className="py-0.5 px-2 text-right">Taxable Value</th>
                  <th className="py-0.5 px-1 w-16">Tax Rate</th>
                  <th className="py-0.5 px-2 text-right">Tax Amount</th>
                  <th className="py-0.5 px-2 text-right w-24">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black divide-x divide-black bg-white">
                {hsnSummaryList.map((hsn, idx) => (
                  <tr key={idx} className="divide-x divide-black">
                    <td className="py-0.5 px-1 text-center font-mono font-bold">{hsn.hsnCode}</td>
                    <td className="py-0.5 px-2 text-right font-mono">{formatAmt(hsn.taxableAmount, display)}</td>
                    <td className="py-0.5 px-1 text-center font-mono">{hsn.gstRate}%</td>
                    <td className="py-0.5 px-2 text-right font-mono">{formatAmt(hsn.taxAmount, display)}</td>
                    <td className="py-0.5 px-2 text-right font-mono font-bold">{formatAmt(hsn.taxAmount, display)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tally Bottom Calculation, Bank Details & Signatory Grid */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 divide-x divide-black">
            {/* Left 7 Columns: Amount in Words, Bank Details, Terms & Declaration */}
            <div className="col-span-7 flex flex-col justify-between divide-y divide-black">
              {/* Amount in words */}
              <div className="p-2 text-[9px]">
                <span className="text-[8px] text-slate-600 uppercase block font-semibold">
                  Total Amount in Words:
                </span>
                <strong className="uppercase font-bold text-[9.5px] leading-tight block mt-0.5 text-black">
                  {display.amountInWords}
                </strong>
              </div>

              {/* Company Bank Details */}
              {bank && (
                <div className="p-2 text-[8.5px] space-y-0.5 bg-slate-50/40">
                  <span className="font-bold uppercase text-[8px] text-slate-700 block">
                    Company's Bank Details for Payment:
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono">
                    <div>Bank Name: <strong>{bank.bankName}</strong></div>
                    <div>A/c No.: <strong>{bank.accountNumber}</strong></div>
                    <div>Branch: <strong>{bank.branchName}</strong></div>
                    <div>IFS Code: <strong>{bank.ifscCode}</strong></div>
                  </div>
                </div>
              )}

              {/* Notes & Commercial Terms */}
              <div className="p-2 text-[8px] space-y-1">
                {quotation.notes && (
                  <div className="mb-1">
                    <span className="font-bold uppercase text-slate-700 block">Notes:</span>
                    <p className="text-slate-700">{quotation.notes}</p>
                  </div>
                )}
                <div>
                  <span className="font-bold uppercase text-slate-700 block">Terms & Conditions:</span>
                  <ol className="list-decimal pl-3.5 space-y-0.5 text-slate-700">
                    {terms.slice(0, 4).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ol>
                </div>
                <p className="text-[7.5px] text-slate-500 italic pt-1 border-t border-slate-200">
                  Declaration: We declare that this quotation/invoice shows the actual price of the goods described and that all particulars are true and correct.
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Accounting Totals Ledger & Signatory Box */}
            <div className="col-span-5 flex flex-col justify-between divide-y divide-black">
              {/* Financial Totals Breakdown */}
              <div className="p-2 text-[9px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-700">Subtotal:</span>
                  <span className="font-mono font-semibold">{formatAmt(display.subtotal, display)}</span>
                </div>
                {display.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-700">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatAmt(display.totalDiscount, display)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-700">Taxable Amount:</span>
                  <span className="font-mono font-bold">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>CGST:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>SGST:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>IGST:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Other Taxes / Charges:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                {display.roundOff !== 0 && (
                  <div className="flex justify-between text-[8px] text-slate-600">
                    <span>Round Off:</span>
                    <span className="font-mono">{display.roundOff > 0 ? `+${display.roundOff.toFixed(2)}` : display.roundOff.toFixed(2)}</span>
                  </div>
                )}
                {/* Grand Total Row */}
                <div className="flex justify-between border-t-2 border-b-2 border-black py-1 mt-1 font-bold text-xs bg-slate-50">
                  <span className="uppercase">TOTAL AMOUNT:</span>
                  <span className="font-mono font-extrabold">{formatAmt(display.grandTotal, display)}</span>
                </div>
                <div className="text-[7.5px] text-right text-slate-500">E. & O.E.</div>
              </div>

              {/* Authorised Signatory Box */}
              <div className="p-2 text-center flex flex-col justify-between h-24 bg-white">
                <span className="text-[8px] font-bold uppercase text-slate-700">
                  For {company.name}
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
        <span>SUBJECT TO JURISDICTION • This is a Computer Generated Document</span>
        <span className="font-mono">Page {pageNumber} of {totalPages}</span>
      </div>
    </div>
  );
};
