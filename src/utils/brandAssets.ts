// ==============================================================================
// OFFICIAL BRAND PARTNER LOGO ASSETS
// ==============================================================================

// Extracted from official collage provided in project assets
import tataSteelLogo from '../assets/Our Valued Customer/brand-tata-steel.png';
import jindalSteelLogo from '../assets/Our Valued Customer/brand-jindal-steel-power.png';
import jindalSawLogo from '../assets/Our Valued Customer/brand-jindal-saw.png';

// Individual brand assets provided in project assets
import jindalStainlessLogo from '../assets/Our Valued Customer/WhatsApp Image 2026-09-17 at 19.29.42 (2).jpeg';
import msSeamlessLogo from '../assets/Our Valued Customer/WhatsApp Image 2026-09-17 at 19.29.42.jpeg';
import virajProfileLogo from '../assets/Our Valued Customer/WhatsApp Image 2026-09-17 at 19.29.42 (1).jpeg';

export interface BrandPartner {
  id: string;
  name: string;
  src: string;
}

export const BRAND_PARTNERS: BrandPartner[] = [
  {
    id: 'tata-steel',
    name: 'Tata Steel',
    src: tataSteelLogo,
  },
  {
    id: 'jindal-stainless',
    name: 'Jindal Stainless',
    src: jindalStainlessLogo,
  },
  {
    id: 'jindal-steel-power',
    name: 'Jindal Steel & Power',
    src: jindalSteelLogo,
  },
  {
    id: 'jindal-saw',
    name: 'Jindal SAW Ltd.',
    src: jindalSawLogo,
  },
  {
    id: 'maharashtra-seamless',
    name: 'Maharashtra Seamless Limited',
    src: msSeamlessLogo,
  },
  {
    id: 'viraj-profiles',
    name: 'Viraj Profiles Limited',
    src: virajProfileLogo,
  },
];
