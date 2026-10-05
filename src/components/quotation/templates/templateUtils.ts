import { ConvertedQuotationDisplay } from '../../../services/currencyService';

export function cleanAddress(text?: string): string {
  return text ? text.replace(/\s*,\s*/g, ', ').trim() : '';
}

export function formatAmt(val: number, display: ConvertedQuotationDisplay): string {
  return display.format(val);
}

export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'sent':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'under_negotiation':
      return 'bg-amber-50 text-amber-700 border-amber-300';
    case 'converted':
      return 'bg-purple-50 text-purple-700 border-purple-300';
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}
