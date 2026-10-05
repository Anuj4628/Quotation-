import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';

export const AdvancedGSTTemplate: React.FC<TemplateProps> = ({
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
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }
  >();

  quotation.items.forEach((item) => {
    const key = `${item.hsnCode || 'OTHER'}_${item.gstRate}`;
    const existing = hsnSummaryMap.get(key) || {
      hsnCode: item.hsnCode || 'N/A',
      taxableAmount: 0,
      gstRate: item.gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
    };
    existing.taxableAmount += item.taxableAmount;
    existing.cgstAmount += item.cgstAmount;
    existing.sgstAmount += item.sgstAmount;
    existing.igstAmount += item.igstAmount;
    existing.totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
    hsnSummaryMap.set(key, existing);
  });

  const hsnSummaryList = Array.from(hsnSummaryMap.values());

  return (
    <div className="flex flex-col justify-between h-full text-slate-800 font-sans">
      <div>
        {/* Top GST Compliance Header */}
        {!isContinuationPage ? (
          <div className="pb-3 mb-3 border-b-2 border-emerald-700">
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
                <h2 className="text-sm font-bold text-slate-900 tracking-tight mt-1 uppercase">
                  {company.name}
                </h2>
                <p className="text-[10px] text-emerald-800 font-semibold leading-tight">
                  {company.tagline || 'Govt. Recognized Star Export House • GST Registered Entity'}
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
                <div className="pt-1 flex items-center justify-end gap-1.5 font-mono text-[9px]">
                  <span className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    GSTIN: {company.gstin}
                  </span>
                  <span className="bg-slate-100 border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                    STATE: {company.stateCode || '27'}
                  </span>
                  {company.pan && (
                    <span className="bg-slate-100 border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                      PAN: {company.pan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-2 mb-3 border-b border-emerald-300 flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900 uppercase">{company.name}</span>
            <span className="font-mono text-slate-600">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Document Title Bar */}
        {!isContinuationPage && (
          <div className="mb-3 flex items-center justify-between bg-emerald-800 text-white px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider uppercase">
                {documentTitle || 'TAX INVOICE / QUOTATION'}
              </span>
              <span className="bg-emerald-900 text-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                GST Compliant
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-200">Doc No:</span>
              <span className="font-mono font-bold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* GST Metadata 4-Column Strip */}
        {!isContinuationPage && (
          <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-emerald-50/40 border border-emerald-200 rounded-lg text-[9.5px]">
            <div>
              <span className="text-slate-500 block">Quotation / Invoice Date</span>
              <strong className="text-slate-900">{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Place of Supply</span>
              <strong className="text-slate-900">{quotation.customerState} ({quotation.customerStateCode || '27'})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Reverse Charge (Y/N)</span>
              <strong className="text-slate-900">No</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Customer Purchase Order</span>
              <strong className="text-slate-900">{quotation.customerReference || 'N/A'}</strong>
            </div>
          </div>
        )}

        {/* Buyer & Consignee Split Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[9.5px]">
                  Details of Receiver (Billed To):
                </span>
                <span className="font-mono text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                  State: {quotation.customerStateCode || '27'}
                </span>
              </div>
              <h3 className="font-bold text-slate-950 text-[11px]">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 pt-1 border-t border-slate-200/60 flex flex-wrap gap-2 text-[9.5px]">
                <span>GSTIN / UIN: <strong className="font-mono text-emerald-900">{quotation.customerGstin || 'Unregistered'}</strong></span>
                {quotation.customerPhone && <span>Phone: <strong>{quotation.customerPhone}</strong></span>}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-[9.5px]">
                  Details of Consignee (Shipped To):
                </span>
                <span className="font-mono text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                  State: {quotation.customerStateCode || '27'}
                </span>
              </div>
              <p className="text-slate-600">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-1 pt-1 border-t border-slate-200/60 text-[9.5px] text-slate-600">
                <span>Place of Delivery: <strong>{quotation.customerCity}, {quotation.customerState}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* GST Product Table */}
        <div className="mb-3 overflow-hidden border border-emerald-700 rounded-lg">
          <table className="w-full text-[9.5px] border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-white font-semibold">
                <th className="py-2 px-1.5 text-center w-7">#</th>
                <th className="py-2 px-2 text-left">Description of Goods</th>
                <th className="py-2 px-1.5 text-center w-14">HSN/SAC</th>
                <th className="py-2 px-1.5 text-right w-12">Qty</th>
                <th className="py-2 px-1 text-center w-10">Unit</th>
                <th className="py-2 px-1.5 text-right w-16">Rate</th>
                <th className="py-2 px-1.5 text-right w-18">Taxable</th>
                {display.igstTotal > 0 ? (
                  <th className="py-2 px-1.5 text-right w-16">IGST</th>
                ) : (
                  <>
                    <th className="py-2 px-1.5 text-right w-14">CGST</th>
                    <th className="py-2 px-1.5 text-right w-14">SGST</th>
                  </>
                )}
                <th className="py-2 px-2 text-right w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-emerald-50/20' : 'bg-white'}>
                  <td className="py-1.5 px-1.5 text-center font-mono text-slate-500">{startIndex + idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-slate-900 text-[10px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-emerald-900/80 text-[8.5px]">
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-1.5 px-1.5 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-1.5 px-1 text-center text-slate-600 uppercase">{item.unit}</td>
                  <td className="py-1.5 px-1.5 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  <td className="py-1.5 px-1.5 text-right font-mono text-slate-900">{formatAmt(item.taxableAmount, display)}</td>
                  {display.igstTotal > 0 ? (
                    <td className="py-1.5 px-1.5 text-right font-mono text-slate-700">
                      <div>{formatAmt(item.igstAmount, display)}</div>
                      <span className="text-[8px] text-slate-400">({item.gstRate}%)</span>
                    </td>
                  ) : (
                    <>
                      <td className="py-1.5 px-1.5 text-right font-mono text-slate-700">
                        <div>{formatAmt(item.cgstAmount, display)}</div>
                        <span className="text-[8px] text-slate-400">({item.gstRate / 2}%)</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-mono text-slate-700">
                        <div>{formatAmt(item.sgstAmount, display)}</div>
                        <span className="text-[8px] text-slate-400">({item.gstRate / 2}%)</span>
                      </td>
                    </>
                  )}
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                    {formatAmt(item.totalAmount, display)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST Tax Summary Matrix Table (HSN/SAC Breakdown) */}
        {(isSinglePage || isContinuationPage) && (
          <div className="mb-3 border border-emerald-300 rounded-lg overflow-hidden">
            <div className="bg-emerald-100/70 px-2 py-1 border-b border-emerald-200 flex justify-between items-center text-[9px] font-bold text-emerald-950">
              <span>GST TAX SUMMARY (BY HSN/SAC)</span>
              <span>Values in {display.currency.code}</span>
            </div>
            <table className="w-full text-[8.5px] border-collapse bg-white">
              <thead>
                <tr className="bg-emerald-50 text-slate-700 font-semibold border-b border-emerald-200">
                  <th className="py-1 px-1.5 text-center">HSN/SAC</th>
                  <th className="py-1 px-1.5 text-right">Taxable Value</th>
                  <th className="py-1 px-1.5 text-center">CGST Rate</th>
                  <th className="py-1 px-1.5 text-right">CGST Amt</th>
                  <th className="py-1 px-1.5 text-center">SGST Rate</th>
                  <th className="py-1 px-1.5 text-right">SGST Amt</th>
                  <th className="py-1 px-1.5 text-center">IGST Rate</th>
                  <th className="py-1 px-1.5 text-right">IGST Amt</th>
                  <th className="py-1 px-2 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hsnSummaryList.map((hsn, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-1.5 text-center font-mono font-bold text-slate-700">{hsn.hsnCode}</td>
                    <td className="py-1 px-1.5 text-right font-mono">{formatAmt(hsn.taxableAmount, display)}</td>
                    <td className="py-1 px-1.5 text-center font-mono">{quotation.isInterstate ? '0%' : `${hsn.gstRate / 2}%`}</td>
                    <td className="py-1 px-1.5 text-right font-mono">{formatAmt(hsn.cgstAmount, display)}</td>
                    <td className="py-1 px-1.5 text-center font-mono">{quotation.isInterstate ? '0%' : `${hsn.gstRate / 2}%`}</td>
                    <td className="py-1 px-1.5 text-right font-mono">{formatAmt(hsn.sgstAmount, display)}</td>
                    <td className="py-1 px-1.5 text-center font-mono">{quotation.isInterstate ? `${hsn.gstRate}%` : '0%'}</td>
                    <td className="py-1 px-1.5 text-right font-mono">{formatAmt(hsn.igstAmount, display)}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-950">{formatAmt(hsn.totalTax, display)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Commercial Summary & Totals */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-7 space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[9.5px]">
                <span className="font-bold text-emerald-900 uppercase tracking-wider block">Invoice Amount in Words:</span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-lg text-[9.5px]">
                  <span className="font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                    Bank Account Details for Direct Transfer:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <p><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-500">A/c No:</span> <strong className="font-mono text-emerald-900">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-slate-50 border border-emerald-300 rounded-lg p-2.5 text-[9.5px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Taxable Amount:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatAmt(display.taxableAmount, display)}</span>
                </div>
                {display.cgstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>CGST Total:</span>
                    <span className="font-mono">{formatAmt(display.cgstTotal, display)}</span>
                  </div>
                )}
                {display.sgstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>SGST Total:</span>
                    <span className="font-mono">{formatAmt(display.sgstTotal, display)}</span>
                  </div>
                )}
                {display.igstTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST Total:</span>
                    <span className="font-mono">{formatAmt(display.igstTotal, display)}</span>
                  </div>
                )}
                {display.extraChargesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Freight & Packing:</span>
                    <span className="font-mono">{formatAmt(display.extraChargesTotal, display)}</span>
                  </div>
                )}
                {display.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[8.5px]">
                    <span>Round Off:</span>
                    <span className="font-mono">{display.roundOff > 0 ? `+${display.roundOff.toFixed(2)}` : display.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-emerald-900 text-white p-2 rounded mt-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider">Total Amount:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GST Terms & Signatory */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-8 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px]">
              <span className="font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                Terms & Conditions:
              </span>
              <ul className="list-disc pl-3.5 space-y-0.5 text-slate-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-slate-200 rounded-lg bg-white">
              <span className="text-[8.5px] text-slate-400 block mb-1">For {company.name}</span>
              <div className="h-12 flex items-center justify-center relative">
                {stamp.enabled && stamp.url && (
                  <img
                    src={stamp.url}
                    alt="Stamp"
                    className="h-11 w-auto object-contain opacity-85"
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
              <span className="border-t border-slate-400 pt-1 w-full text-[8.5px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorised Signatory'}
              </span>
              <span className="text-[8px] text-slate-500">
                {signature.signatoryDesignation || 'Finance & Accounts'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
        <p>GST Document generated under CGST/SGST Rules • {company.name}</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
