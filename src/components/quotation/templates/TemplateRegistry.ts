import React from 'react';
import { TemplateProps } from './types';
import { QuotationTheme, PaperSize, resolveTheme } from '../../../types/theme';

import { ClassicTemplate } from './ClassicTemplate';
import { StylishTemplate } from './StylishTemplate';
import { LuxuryTemplate } from './LuxuryTemplate';
import { AdvancedGSTTemplate } from './AdvancedGSTTemplate';
import { AdvancedGSTTallyTemplate } from './AdvancedGSTTallyTemplate';
import { BillbookTemplate } from './BillbookTemplate';
import { AdvancedGSTA5Template } from './AdvancedGSTA5Template';
import { BillbookA5Template } from './BillbookA5Template';
import { ModernTemplate } from './ModernTemplate';
import { SimpleTemplate } from './SimpleTemplate';
import { TallyTemplate } from './TallyTemplate';
import { FestivalTemplate } from './FestivalTemplate';

export interface RegisteredTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  component: React.FC<TemplateProps>;
  theme: QuotationTheme;
}

const TEMPLATE_COMPONENTS: Record<string, React.FC<TemplateProps>> = {
  classic: ClassicTemplate,
  stylish: StylishTemplate,
  luxury: LuxuryTemplate,
  advanced_gst: AdvancedGSTTemplate,
  advanced_gst_tally: AdvancedGSTTallyTemplate,
  tally: TallyTemplate,
  billbook: BillbookTemplate,
  advanced_gst_a5: AdvancedGSTA5Template,
  billbook_a5: BillbookA5Template,
  modern: ModernTemplate,
  simple: SimpleTemplate,
  // Festival themes
  diwali: FestivalTemplate,
  ganesh: FestivalTemplate,
  janmashtami: FestivalTemplate,
  ram_navami: FestivalTemplate,
  navratri: FestivalTemplate,
  jagannath: FestivalTemplate,
};

export function getTemplate(themeId?: string): RegisteredTemplate {
  const theme = resolveTheme(themeId);
  const component = TEMPLATE_COMPONENTS[theme.id] || ModernTemplate;

  return {
    id: theme.id,
    name: theme.name,
    paperSize: theme.paperSize || 'A4',
    component,
    theme,
  };
}
