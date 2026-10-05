export type ThemeCategory = 'business' | 'festive';
export type PaperSize = 'A4' | 'A5';

export interface QuotationTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  paperSize: PaperSize;
  badge?: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  headerStyle: string;
  festiveGreeting?: string;
  hasWatermark?: boolean;
}

export const QUOTATION_THEMES: QuotationTheme[] = [
  // ============================================================================
  // 10 PROFESSIONAL DOCUMENT THEMES
  // ============================================================================
  {
    id: 'classic',
    name: 'Classic Professional',
    category: 'business',
    paperSize: 'A4',
    badge: 'Corporate',
    description: 'Clean corporate white background, balanced company header, standard professional item table, and minimal borders.',
    primaryColor: '#1e3a8a', // Deep Blue-900
    accentColor: '#3b82f6', // Blue-500
    textColor: '#0f172a',
    headerStyle: 'classic',
  },
  {
    id: 'stylish',
    name: 'Stylish',
    category: 'business',
    paperSize: 'A4',
    badge: 'Trending',
    description: 'Modern typography, vibrant crimson top banner, elegant section dividers, and creative table structure.',
    primaryColor: '#e11d48', // Rose-600
    accentColor: '#881337',
    textColor: '#1f2937',
    headerStyle: 'stylish',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    category: 'business',
    paperSize: 'A4',
    badge: 'Executive',
    description: 'Prestige high-value client quotation with serif typography, sophisticated gold borders, and luxury totals card.',
    primaryColor: '#b45309', // Amber-700 / Gold
    accentColor: '#0f172a', // Deep Navy
    textColor: '#1c1917',
    headerStyle: 'luxury',
  },
  {
    id: 'advanced_gst',
    name: 'Advanced GST',
    category: 'business',
    paperSize: 'A4',
    badge: 'GST Compliance',
    description: 'Dedicated GST structure with HSN/SAC, CGST, SGST, IGST columns, and comprehensive tax summary matrix.',
    primaryColor: '#047857', // Emerald-700
    accentColor: '#064e3b',
    textColor: '#111827',
    headerStyle: 'advanced_gst',
  },
  {
    id: 'advanced_gst_tally',
    name: 'Advanced GST Tally',
    category: 'business',
    paperSize: 'A4',
    badge: 'Accounting Grid',
    description: 'Authentic Tally/ERP accounting layout with dense black/grey borders, vertical column lines, and ledger alignment.',
    primaryColor: '#1e293b', // Slate-800
    accentColor: '#334155', // Slate-700
    textColor: '#000000',
    headerStyle: 'advanced_gst_tally',
  },
  {
    id: 'tally',
    name: 'Tally',
    category: 'business',
    paperSize: 'A4',
    badge: 'Accounting',
    description: 'Structured accounting-software style with clean monochrome layout, original color logo, strict tabular grid, and tax summary.',
    primaryColor: '#000000',
    accentColor: '#1e293b',
    textColor: '#000000',
    headerStyle: 'tally',
  },
  {
    id: 'billbook',
    name: 'Billbook Style',
    category: 'business',
    paperSize: 'A4',
    badge: 'Commercial',
    description: 'Compact commercial billing document with distinct Bill To & Ship To sections and practical retail totals.',
    primaryColor: '#0284c7', // Sky-600
    accentColor: '#0369a1',
    textColor: '#0f172a',
    headerStyle: 'billbook',
  },
  {
    id: 'advanced_gst_a5',
    name: 'Advanced GST A5',
    category: 'business',
    paperSize: 'A5',
    badge: 'A5 Compact',
    description: 'True native A5 format (148mm × 210mm) with micro-typography, compact GST tables, and space-saving layout.',
    primaryColor: '#0d9488', // Teal-600
    accentColor: '#115e59',
    textColor: '#0f172a',
    headerStyle: 'advanced_gst_a5',
  },
  {
    id: 'billbook_a5',
    name: 'Billbook A5',
    category: 'business',
    paperSize: 'A5',
    badge: 'A5 Pocket',
    description: 'Distinct A5 commercial billbook with tight headers, compact customer block, and optimized receipt-style totals.',
    primaryColor: '#4f46e5', // Indigo-600
    accentColor: '#3730a3',
    textColor: '#1e1b4b',
    headerStyle: 'billbook_a5',
  },
  {
    id: 'modern',
    name: 'Modern',
    category: 'business',
    paperSize: 'A4',
    badge: 'Popular',
    description: 'Contemporary spacious design with sleek typography, minimal borders, modern section blocks, and totals card.',
    primaryColor: '#dc2626', // Red-600
    accentColor: '#0f172a', // Slate-900
    textColor: '#1e293b',
    headerStyle: 'modern',
  },
  {
    id: 'simple',
    name: 'Simple',
    category: 'business',
    paperSize: 'A4',
    badge: 'Minimal Ink',
    description: 'Clean monochrome black & white layout with crisp lines, high contrast, zero decoration, and ultra-low ink usage.',
    primaryColor: '#000000', // Pure Black
    accentColor: '#475569', // Slate-600
    textColor: '#000000',
    headerStyle: 'simple',
  },

  // ============================================================================
  // FESTIVAL THEMES (SEPARATE CATEGORY)
  // ============================================================================
  {
    id: 'diwali',
    name: 'Diwali',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Golden saffron accents with delicate Diya & Mandala watermark (5%-12% opacity) and Shubh Deepavali greeting.',
    primaryColor: '#ea580c', // Orange-600
    accentColor: '#b45309', // Amber-700
    textColor: '#292524',
    headerStyle: 'diwali',
    festiveGreeting: '✦ Shubh Deepavali ✦',
    hasWatermark: true,
  },
  {
    id: 'ganesh',
    name: 'Ganesh Chaturthi',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Sacred vermilion & saffron accents with subtle Lord Ganesha watermark and auspicious blessing.',
    primaryColor: '#dc2626', // Red-600
    accentColor: '#ea580c', // Orange-600
    textColor: '#1c1917',
    headerStyle: 'ganesh',
    festiveGreeting: '॥ श्री गणेशाय नमः ॥',
    hasWatermark: true,
  },
  {
    id: 'janmashtami',
    name: 'Janmashtami',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Peacock blue & celestial teal accents with delicate Peacock feather & Bansuri flute watermark.',
    primaryColor: '#0284c7', // Sky-600
    accentColor: '#0d9488', // Teal-600
    textColor: '#0f172a',
    headerStyle: 'janmashtami',
    festiveGreeting: '✦ Jai Shri Krishna ✦',
    hasWatermark: true,
  },
  {
    id: 'ram_navami',
    name: 'Ram Navami',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Sacred saffron & golden sun accents with noble bow and mandala watermark and auspicious greeting.',
    primaryColor: '#f97316', // Orange-500
    accentColor: '#d97706', // Amber-600
    textColor: '#1c1917',
    headerStyle: 'ram_navami',
    festiveGreeting: '✦ Jai Shri Ram ✦',
    hasWatermark: true,
  },
  {
    id: 'navratri',
    name: 'Navratri / Dussehra',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Royal magenta & warm amber accents with ornamental Lotus watermark and festive greeting.',
    primaryColor: '#c026d3', // Fuchsia-600
    accentColor: '#e11d48', // Rose-600
    textColor: '#1c1917',
    headerStyle: 'navratri',
    festiveGreeting: '✦ Shubh Navratri ✦',
    hasWatermark: true,
  },
  {
    id: 'jagannath',
    name: 'Shri Jagannath',
    category: 'festive',
    paperSize: 'A4',
    badge: 'Festival',
    description: 'Divine sacred motifs inspired by Lord Jagannath with subtle watermark and Mahaprabhu blessings.',
    primaryColor: '#b45309', // Amber-700
    accentColor: '#dc2626', // Red-600
    textColor: '#1c1917',
    headerStyle: 'jagannath',
    festiveGreeting: '॥ जय जगन्नाथ ॥',
    hasWatermark: true,
  },
];

// Fallback & Alias Resolution Map for 100% Backward Compatibility
const THEME_ALIASES: Record<string, string> = {
  professional: 'classic',
  corporate: 'classic',
  business: 'billbook',
  minimal: 'simple',
  premium_dark: 'modern',
};

export function resolveTheme(themeId?: string): QuotationTheme {
  if (!themeId) {
    return QUOTATION_THEMES.find((t) => t.id === 'modern') || QUOTATION_THEMES[0];
  }
  const resolvedId = THEME_ALIASES[themeId] || themeId;
  return (
    QUOTATION_THEMES.find((t) => t.id === resolvedId) ||
    QUOTATION_THEMES.find((t) => t.id === 'modern') ||
    QUOTATION_THEMES[0]
  );
}
