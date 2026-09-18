// ==============================================================================
// OFFICIAL BRAND PARTNER LOGO ASSETS
// ==============================================================================

// Extracted from official collage provided in project assets
import tataSteelLogo from '../assets/Our Valued Customer/brand-tata-steel.png';
import jindalSteelLogo from '../assets/Our Valued Customer/brand-jindal-steel-power.png';
import jindalSawLogo from '../assets/Our Valued Customer/brand-jindal-saw.png';

// Individual brand assets provided in project assets
import jindalStainlessLogo from '../assets/Our Valued Customer/brand-jindal-stainless.png';
import msSeamlessLogo from '../assets/Our Valued Customer/brand-maharashtra-seamless.png';
import virajProfileLogo from '../assets/Our Valued Customer/brand-viraj-profiles.png';

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
