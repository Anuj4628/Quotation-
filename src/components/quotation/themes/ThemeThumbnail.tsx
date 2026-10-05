import React from 'react';
import { QuotationTheme } from '../../../types/theme';

interface ThemeThumbnailProps {
  theme: QuotationTheme;
  isSelected?: boolean;
}

export const ThemeThumbnail: React.FC<ThemeThumbnailProps> = ({ theme, isSelected }) => {
  const { id, primaryColor, category, paperSize } = theme;
  const isA5 = paperSize === 'A5';

  return (
    <div
      className={`w-full aspect-[210/297] rounded-lg border bg-white overflow-hidden shadow-xs relative flex flex-col justify-between p-1.5 select-none transition-all ${
        isSelected
          ? 'border-red-600 ring-2 ring-red-500/30 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Paper Size Tag */}
      <div className="absolute top-1 left-1 z-10">
        <span
          className={`text-[6px] font-black px-1 py-0.2 rounded uppercase ${
            isA5 ? 'bg-teal-700 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          {paperSize}
        </span>
      </div>

      {/* Mini Layout Variations */}
      <div className="mt-2.5">
        {/* ==================================================================== */}
        {/* TALLY STYLE THUMBNAIL                                                */}
        {/* ==================================================================== */}
        {id === 'advanced_gst_tally' || id === 'tally' ? (
          <div className="border border-black bg-white p-0.5 space-y-0.5">
            <div className="text-[5px] font-black text-center border-b border-black bg-slate-100 py-0.2">
              TAX INVOICE
            </div>
            <div className="grid grid-cols-2 border-b border-black text-[4.5px] p-0.5">
              <div className="border-r border-black pr-0.5">
                <div className="w-8 h-1 bg-black rounded-xs mb-0.5" />
                <div className="w-10 h-0.5 bg-slate-400" />
              </div>
              <div className="pl-0.5 space-y-0.5">
                <div className="w-8 h-0.5 bg-slate-600" />
                <div className="w-6 h-0.5 bg-slate-400" />
              </div>
            </div>
            {/* Tally Dense Table with vertical lines */}
            <div className="border border-black">
              <div className="grid grid-cols-4 border-b border-black bg-slate-100 text-[4px] font-bold p-0.5 divide-x divide-black">
                <span>Sl</span>
                <span>Desc</span>
                <span>Qty</span>
                <span>Amt</span>
              </div>
              <div className="divide-y divide-black divide-x divide-black text-[4px]">
                <div className="grid grid-cols-4 p-0.5 divide-x divide-black">
                  <span>1</span>
                  <span>Pipe 316</span>
                  <span>10</span>
                  <span>₹5k</span>
                </div>
                <div className="grid grid-cols-4 p-0.5 divide-x divide-black bg-slate-50">
                  <span>2</span>
                  <span>Flange</span>
                  <span>5</span>
                  <span>₹2k</span>
                </div>
              </div>
            </div>
          </div>
        ) : id === 'simple' ? (
          /* ==================================================================== */
          /* SIMPLE MONOCHROME THUMBNAIL                                          */
          /* ==================================================================== */
          <div className="space-y-1">
            <div className="flex justify-between items-center pb-0.5 border-b-2 border-black">
              <div className="w-12 h-1 bg-black rounded-xs" />
              <div className="w-6 h-0.5 bg-slate-600" />
            </div>
            <div className="p-0.5 border border-black text-[5px]">
              <div className="w-8 h-0.5 bg-black" />
              <div className="w-12 h-0.5 bg-slate-400 mt-0.5" />
            </div>
            <div className="border border-black">
              <div className="bg-slate-200 h-1.5 border-b border-black" />
              <div className="h-1.5 border-b border-slate-200" />
              <div className="h-1.5" />
            </div>
          </div>
        ) : id === 'luxury' ? (
          /* ==================================================================== */
          /* LUXURY THUMBNAIL                                                     */
          /* ==================================================================== */
          <div className="space-y-1">
            <div className="border-b-2 border-amber-600 pb-0.5">
              <div className="flex justify-between items-center">
                <div className="w-10 h-1 bg-amber-900 rounded-xs" />
                <span className="text-[5px] text-amber-700 font-serif font-bold">LUXURY</span>
              </div>
              <div className="w-full h-0.5 bg-amber-500 mt-0.5" />
            </div>
            <div className="p-0.5 bg-amber-50/50 border border-amber-200 text-[5px]">
              <div className="w-7 h-0.5 bg-amber-800" />
              <div className="w-11 h-0.5 bg-slate-400 mt-0.5" />
            </div>
            <div className="border border-stone-800 rounded-xs overflow-hidden">
              <div className="bg-stone-900 h-1.5" />
              <div className="bg-amber-50/20 h-1.5 border-b border-amber-100" />
              <div className="bg-white h-1.5" />
            </div>
          </div>
        ) : id.includes('billbook') ? (
          /* ==================================================================== */
          /* BILLBOOK THUMBNAIL (DUAL BILL TO / SHIP TO)                          */
          /* ==================================================================== */
          <div className="space-y-0.5">
            <div className="flex justify-between items-center p-0.5 border border-slate-800 rounded-xs bg-slate-50">
              <div className="w-8 h-1 bg-slate-900 rounded-xs" />
              <span className="text-[4.5px] bg-slate-900 text-white px-0.5 rounded font-black">BILL</span>
            </div>
            <div className="grid grid-cols-2 gap-0.5 text-[4px]">
              <div className="p-0.5 border border-slate-300 rounded-xs bg-slate-50">
                <span className="font-bold text-sky-800">BILL TO</span>
                <div className="w-8 h-0.5 bg-slate-500 mt-0.2" />
              </div>
              <div className="p-0.5 border border-slate-300 rounded-xs bg-slate-50">
                <span className="font-bold text-slate-500">SHIP TO</span>
                <div className="w-8 h-0.5 bg-slate-400 mt-0.2" />
              </div>
            </div>
            <div className="border border-slate-700 rounded-xs overflow-hidden mt-0.5">
              <div className="bg-slate-900 h-1.5" />
              <div className="h-1.5 border-b border-slate-100" />
              <div className="h-1.5 bg-slate-50" />
            </div>
          </div>
        ) : id.includes('gst') ? (
          /* ==================================================================== */
          /* ADVANCED GST THUMBNAIL (WITH TAX COLUMNS)                            */
          /* ==================================================================== */
          <div className="space-y-1">
            <div className="border-b-2 border-emerald-700 pb-0.5 flex justify-between items-center">
              <div className="w-10 h-1 bg-emerald-900 rounded-xs" />
              <span className="text-[4.5px] bg-emerald-800 text-white px-0.5 rounded font-bold">GST</span>
            </div>
            <div className="p-0.5 bg-emerald-50/40 border border-emerald-200 text-[5px]">
              <div className="w-12 h-0.5 bg-slate-600" />
              <div className="w-8 h-0.5 bg-emerald-700 mt-0.5" />
            </div>
            <div className="border border-emerald-700 rounded-xs overflow-hidden">
              <div className="bg-emerald-900 h-1.5 flex justify-between px-1">
                <div className="w-4 h-0.5 bg-white/80" />
                <div className="w-2 h-0.5 bg-emerald-300" />
              </div>
              <div className="h-1.5 border-b border-emerald-100 bg-emerald-50/20" />
              <div className="h-1.5 bg-white" />
            </div>
          </div>
        ) : (
          /* ==================================================================== */
          /* STANDARD / MODERN / STYLISH / CLASSIC                                */
          /* ==================================================================== */
          <div className="space-y-1">
            {/* Top Brand Stripe */}
            {category === 'festive' ? (
              <div className="w-full h-1.5 rounded-xs mb-1" style={{ backgroundColor: primaryColor }} />
            ) : id === 'stylish' ? (
              <div className="w-full h-2 rounded-xs mb-1 bg-gradient-to-r from-rose-600 to-rose-800" />
            ) : (
              <div className="w-full h-1.5 rounded-xs mb-1" style={{ backgroundColor: primaryColor }} />
            )}

            <div className="flex justify-between items-center pb-0.5 border-b border-slate-100">
              <div className="w-10 h-1 bg-slate-800 rounded-xs" />
              <div className="w-6 h-0.5 bg-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-50 rounded text-[5px] border border-slate-100">
              <div className="space-y-0.5">
                <div className="w-7 h-0.5 bg-slate-700 font-bold" />
                <div className="w-10 h-0.5 bg-slate-300" />
              </div>
              <div className="space-y-0.5 text-right flex flex-col items-end">
                <div className="w-6 h-0.5 bg-slate-600" />
                <div className="w-5 h-0.5 bg-slate-300" />
              </div>
            </div>

            <div className="w-full border border-slate-200 rounded-xs overflow-hidden">
              <div className="w-full h-1.5" style={{ backgroundColor: primaryColor }} />
              <div className="h-1.5 border-b border-slate-100" />
              <div className="h-1.5 bg-slate-50/60" />
            </div>
          </div>
        )}
      </div>

      {/* Festive Background Watermark Mini-Icon */}
      {category === 'festive' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div
            className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center text-xs"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {id === 'diwali'
              ? '🪔'
              : id === 'ganesh'
                ? '🕉️'
                : id === 'navratri'
                  ? '🌸'
                  : id === 'janmashtami'
                    ? '🪶'
                    : id === 'ram_navami'
                      ? '🏹'
                      : '🪷'}
          </div>
        </div>
      )}

      {/* Bottom Mini Totals Strip */}
      <div className="pt-1 mt-auto border-t border-slate-100 flex justify-between items-center text-[5px]">
        <div className="w-8 h-0.5 bg-slate-300" />
        <div
          className="px-1 py-0.2 rounded text-white font-bold"
          style={{
            backgroundColor:
              id === 'simple' || id === 'tally'
                ? '#000000'
                : id === 'advanced_gst_tally'
                  ? '#1e293b'
                  : primaryColor,
          }}
        >
          TOTAL
        </div>
      </div>

      {/* Selected Indicator Checkmark Badge */}
      {isSelected && (
        <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-xs z-20">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};
