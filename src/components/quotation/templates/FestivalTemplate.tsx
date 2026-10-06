import React from 'react';
import { TemplateProps } from './types';
import { cleanAddress, formatAmt, getStatusBadgeStyle } from './templateUtils';
import { FestivalWatermark } from '../themes/FestivalWatermarks';

export const FestivalTemplate: React.FC<TemplateProps> = ({
  data,
  pageNumber,
  totalPages,
  items,
  startIndex,
  isSinglePage,
  isContinuationPage,
}) => {
  const { quotation, display, company, bank, terms, signature, stamp, logoUrl, documentTitle, theme } = data;
  const primaryColor = theme.primaryColor || '#ea580c';

  return (
    <div className="flex flex-col justify-between h-full text-slate-800 font-sans relative">
      {/* Subtle Background Festival Watermark (5% - 10% opacity, behind all text) */}
      <FestivalWatermark themeId={theme.id} />

      <div className="relative z-10">
        {/* Festive Top Ribbon */}
        {!isContinuationPage ? (
          <div className="pb-3 mb-3 border-b-2" style={{ borderColor: primaryColor }}>
            <div
              className="flex items-center justify-between px-3 py-1 rounded text-white text-[10px] font-bold tracking-widest uppercase mb-2 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{theme.festiveGreeting}</span>
              <span className="opacity-80">{company.name || 'Bhawal Steel & Engineering Co.'} • Commercial Quotation</span>
              <span>{theme.festiveGreeting}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col items-start gap-1 max-w-[280px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={company.name}
                    className="h-13 w-auto max-w-[240px] object-contain"
                    crossOrigin="anonymous"
                  />
                ) : null}
                <h2 className="text-sm font-bold text-slate-900 tracking-tight mt-1 uppercase">
                  {company.name}
                </h2>
                <p className="text-[9.5px] text-slate-500 font-medium leading-tight">
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
                <div className="pt-1 flex items-center justify-end gap-1.5 font-mono text-[9px]">
                  <span
                    className="border px-2 py-0.5 rounded font-bold"
                    style={{ borderColor: `${primaryColor}60`, color: primaryColor, backgroundColor: `${primaryColor}10` }}
                  >
                    GSTIN: {company.gstin}
                  </span>
                  {company.pan && (
                    <span className="bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-bold">
                      PAN: {company.pan}
                    </span>
                  )}
                  {company.stateCode && (
                    <span className="bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-bold">
                      State Code: {company.stateCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-2 mb-3 border-b flex justify-between items-center text-xs" style={{ borderColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 uppercase">{company.name}</span>
              <span className="text-slate-400">|</span>
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>{theme.festiveGreeting}</span>
            </div>
            <span className="font-mono text-slate-500">{quotation.quotationNumber} • Page {pageNumber} of {totalPages}</span>
          </div>
        )}

        {/* Title Bar & Status */}
        {!isContinuationPage && (
          <div
            className="mb-3 flex items-center justify-between text-white px-3.5 py-2 rounded-lg shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm tracking-wider uppercase">
                {documentTitle || 'COMMERCIAL QUOTATION'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${getStatusBadgeStyle(quotation.status)}`}>
                {quotation.status.replace('_', ' ')}
              </span>
              {display.isConverted && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/25 text-white">
                  {display.currency.code} ({display.currency.symbol})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-80">Quotation No:</span>
              <span className="font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded">
                {quotation.quotationNumber}
              </span>
            </div>
          </div>
        )}

        {/* Metadata Strip */}
        {!isContinuationPage && (
          <div
            className="grid grid-cols-4 gap-2 mb-3 p-2 rounded-lg text-[10px] border"
            style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}25` }}
          >
            <div>
              <span className="text-slate-500 block text-[9px]">Date</span>
              <strong className="text-slate-900">{quotation.quotationDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Valid Until</span>
              <strong className="text-slate-900">{quotation.validUntil}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Representative</span>
              <strong className="text-slate-900">{quotation.salesperson || 'Commercial Team'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Inquiry Ref</span>
              <strong className="text-slate-900">{quotation.customerReference || 'Festive Order'}</strong>
            </div>
          </div>
        )}

        {/* Customer & Destination Cards */}
        {!isContinuationPage && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-white/90 border border-slate-200 rounded-lg shadow-xs text-[10.5px]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                Billed To (Customer):
              </span>
              <h3 className="font-bold text-slate-950 text-xs">{quotation.customerName}</h3>
              <p className="text-slate-600 mt-0.5">{cleanAddress(quotation.billingAddress)}</p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                {quotation.customerGstin && (
                  <span
                    className="border px-2 py-0.5 rounded font-mono font-medium"
                    style={{ borderColor: `${primaryColor}40`, color: primaryColor, backgroundColor: `${primaryColor}08` }}
                  >
                    GSTIN: <strong>{quotation.customerGstin}</strong>
                  </span>
                )}
                {quotation.customerPhone && (
                  <span className="text-slate-600">Phone: <strong>{quotation.customerPhone}</strong></span>
                )}
              </div>
            </div>

            <div className="p-3 bg-white/90 border border-slate-200 rounded-lg shadow-xs text-[10.5px]">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dispatch / Consignee Location:
              </span>
              <p className="text-slate-600">
                {cleanAddress(quotation.shippingAddress) || cleanAddress(quotation.billingAddress)}
              </p>
              <p className="text-slate-600">
                {cleanAddress(`${quotation.customerCity}, ${quotation.customerState} - ${quotation.customerPinCode}`)}
              </p>
              <p className="text-slate-500 mt-1">Place of Supply: <strong>{quotation.customerState} ({quotation.customerStateCode || '27'})</strong></p>
            </div>
          </div>
        )}

        {/* Product Items Table */}
        <div className="mb-3 overflow-hidden border border-slate-300 rounded-lg shadow-xs bg-white/95">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="text-white font-semibold" style={{ backgroundColor: primaryColor }}>
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2 text-left">Item Description</th>
                <th className="py-2 px-2 text-center w-16">HSN</th>
                <th className="py-2 px-2 text-right w-14">Qty</th>
                <th className="py-2 px-2 text-center w-12">Unit</th>
                <th className="py-2 px-2 text-right w-20">Rate</th>
                {quotation.totalDiscount > 0 && <th className="py-2 px-2 text-right w-16">Disc</th>}
                <th className="py-2 px-2 text-right w-14">GST</th>
                <th className="py-2 px-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                  <td className="py-2 px-2 text-center font-mono text-slate-400">{startIndex + idx + 1}</td>
                  <td className="py-2 px-2">
                    <p className="font-bold text-slate-900 text-[10.5px]">{item.productName}</p>
                    {item.description && <p className="text-slate-600 text-[9.5px]">{item.description}</p>}
                    {(item.material || item.grade || item.size) && (
                      <p className="text-[9px] mt-0.5" style={{ color: primaryColor }}>
                        {[item.material, item.grade, item.size, item.schedule].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600">{item.hsnCode || '-'}</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2 px-2 text-center text-slate-600 uppercase">{item.unit}</td>
                  <td className="py-2 px-2 text-right font-mono text-slate-900">{formatAmt(item.rate, display)}</td>
                  {quotation.totalDiscount > 0 && (
                    <td className="py-2 px-2 text-right font-mono text-rose-600">
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

        {/* Commercial Summary & Totals */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-7 space-y-2">
              <div
                className="p-2.5 rounded-lg border text-[10px]"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}30` }}
              >
                <span className="font-bold uppercase tracking-wider block text-[9px]" style={{ color: primaryColor }}>
                  Total Valuation in Words:
                </span>
                <p className="font-bold text-slate-900 mt-0.5 leading-snug">{display.amountInWords}</p>
              </div>

              {bank && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] shadow-xs">
                  <span className="font-extrabold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                    Direct Bank Remittance:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <p><span className="text-slate-500">Bank:</span> <strong>{bank.bankName}</strong></p>
                    <p><span className="text-slate-500">A/c:</span> <strong className="font-mono text-slate-900">{bank.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{bank.ifscCode}</strong></p>
                    <p><span className="text-slate-500">Branch:</span> <strong>{bank.branchName}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-5">
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-[10px] space-y-1 shadow-xs">
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
                  <span>Taxable:</span>
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
                <div
                  className="flex justify-between items-center text-white p-2 rounded-lg mt-1.5 shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="font-bold text-xs uppercase tracking-wider">Grand Total:</span>
                  <span className="font-mono font-extrabold text-sm">{formatAmt(display.grandTotal, display)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Terms & Festive Signatory */}
        {(isSinglePage || isContinuationPage) && (
          <div className="grid grid-cols-12 gap-3 mt-1">
            <div className="col-span-8 p-2.5 bg-white/90 border border-slate-200 rounded-lg text-[9.5px]">
              <span className="font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                Terms & Conditions:
              </span>
              <ul className="space-y-0.5 text-slate-600 leading-tight">
                {terms.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span style={{ color: primaryColor }}>✦</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 flex flex-col justify-end items-center text-center p-2 border border-slate-200 rounded-lg bg-white/95">
              <span className="text-[9px] text-slate-400 block mb-0.5">For {company.name}</span>
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
              <span className="border-t border-slate-300 pt-0.5 w-full text-[9px] font-bold text-slate-900 block mt-1">
                {signature.signatoryName || 'Authorized Signatory'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Festive Footer */}
      <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-400 relative z-10">
        <p>Festive Quotation • {company.name} wishes you prosperity & success</p>
        <p>Page {pageNumber} of {totalPages}</p>
      </div>
    </div>
  );
};
