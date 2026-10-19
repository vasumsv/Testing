import { forwardRef } from 'react';
import { LineItem, SelectedLead, StudioInfo, QuoteOptions, DEFAULT_TYPOGRAPHY, ALL_FONT_SIZES, TEMPLATE_BASE_SIZE } from './types';
import { getTemplate, DEFAULT_TEMPLATE_ID } from './themes';
import { WeddingElegantLayout } from './layouts/WeddingElegantLayout';
import { MinimalCleanLayout } from './layouts/MinimalCleanLayout';
import { LuxuryDarkLayout } from './layouts/LuxuryDarkLayout';
import { RoyalDarkLayout } from './layouts/RoyalDarkLayout';
import { FloralWeddingLayout } from './layouts/FloralWeddingLayout';
import { MagazineEditorialLayout } from './layouts/MagazineEditorialLayout';
import { CorporateProfessionalLayout } from './layouts/CorporateProfessionalLayout';
import { SplitLayoutModern } from './layouts/SplitLayoutModern';
import { CreativePortfolioLayout } from './layouts/CreativePortfolioLayout';
import { CinematicLayout } from './layouts/CinematicLayout';
import { ModernStudioProLayout } from './layouts/ModernStudioProLayout';

interface Props {
  studio: StudioInfo;
  lead: SelectedLead | null;
  items: LineItem[];
  finalPrice: string;
  showDiscount: boolean;
  quoteNumber: string;
  themeId?: string;
  quoteOptions?: QuoteOptions;
}

export const QuoteDocument = forwardRef<HTMLDivElement, Props>(
  ({ studio, lead, items, finalPrice, showDiscount, quoteNumber, themeId, quoteOptions }, ref) => {
    const template = getTemplate(themeId ?? DEFAULT_TEMPLATE_ID);
    const sharedProps = { studio, lead, items, finalPrice, showDiscount, quoteNumber, theme: template as never, quoteOptions };
    const bgUrl = quoteOptions?.backgroundImageUrl;
    const typo = quoteOptions?.typography ?? DEFAULT_TYPOGRAPHY;
    const hasCustomTypography = !!quoteOptions?.typography;

    function renderLayout() {
      switch (template.layoutStyle) {
        case 'wedding-elegant': return <WeddingElegantLayout {...sharedProps} />;
        case 'minimal-clean': return <MinimalCleanLayout {...sharedProps} />;
        case 'luxury-dark': return <LuxuryDarkLayout {...sharedProps} />;
        case 'royal-dark': return <RoyalDarkLayout {...sharedProps} />;
        case 'floral-wedding': return <FloralWeddingLayout {...sharedProps} />;
        case 'magazine-editorial': return <MagazineEditorialLayout {...sharedProps} />;
        case 'corporate-professional': return <CorporateProfessionalLayout {...sharedProps} />;
        case 'split-layout': return <SplitLayoutModern {...sharedProps} />;
        case 'creative-portfolio': return <CreativePortfolioLayout {...sharedProps} />;
        case 'cinematic': return <CinematicLayout {...sharedProps} />;
        case 'modern-studio-pro': return <ModernStudioProLayout {...sharedProps} />;
        default: return <WeddingElegantLayout {...sharedProps} />;
      }
    }

    return (
      <div
        ref={ref}
        data-quote-bg={bgUrl ? '' : undefined}
        style={{
          position: 'relative',
          backgroundImage: bgUrl ? `url("${bgUrl}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'top left',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {bgUrl && (
          <style>{`
            [data-quote-bg] #quote-pdf-document,
            [data-quote-bg] #quote-pdf-document > div {
              background: transparent !important;
              background-color: transparent !important;
            }
            [data-quote-bg] #quote-pdf-document > div > div[style*="minHeight"],
            [data-quote-bg] #quote-pdf-document > div[style*="min-height"] {
              background: transparent !important;
              background-color: transparent !important;
            }
          `}</style>
        )}
        {hasCustomTypography && (() => {
          const scale = typo.fontSize / TEMPLATE_BASE_SIZE;
          const scaledRules = ALL_FONT_SIZES.map(sz => {
            const scaled = (sz * scale).toFixed(2).replace(/\.?0+$/, '') + 'px';
            return `#quote-pdf-document [style*="font-size: ${sz}px"] { font-size: ${scaled} !important; }`;
          }).join('\n            ');
          return (
            <style>{`
            #quote-pdf-document, #quote-pdf-document * {
              font-family: ${typo.fontFamily} !important;
              color: ${typo.textColor} !important;
            }
            ${scaledRules}
          `}</style>
          );
        })()}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {renderLayout()}
        </div>
      </div>
    );
  },
);

QuoteDocument.displayName = 'QuoteDocument';
