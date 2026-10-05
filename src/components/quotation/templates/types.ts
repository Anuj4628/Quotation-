import { Quotation, QuotationItem, CompanyProfile, BankAccount } from '../../../types';
import { QuotationTheme, PaperSize } from '../../../types/theme';
import { ConvertedQuotationDisplay } from '../../../services/currencyService';

export interface SignatureData {
  url?: string;
  enabled: boolean;
  size: 'sm' | 'md' | 'lg';
  signatoryName?: string;
  signatoryDesignation?: string;
}

export interface StampData {
  url?: string;
  enabled: boolean;
  size: 'sm' | 'md' | 'lg';
}

export interface DocumentData {
  quotation: Quotation;
  display: ConvertedQuotationDisplay;
  company: CompanyProfile;
  bank?: BankAccount;
  terms: string[];
  signature: SignatureData;
  stamp: StampData;
  logoUrl: string;
  documentTitle: string;
  theme: QuotationTheme;
  paperSize: PaperSize;
  isFestive: boolean;
}

export interface TemplateProps {
  data: DocumentData;
  pageNumber: number;
  totalPages: number;
  items: QuotationItem[];
  startIndex: number;
  isSinglePage: boolean;
  isContinuationPage: boolean;
}
