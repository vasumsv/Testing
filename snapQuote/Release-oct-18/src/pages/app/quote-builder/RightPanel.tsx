import { useRef, useLayoutEffect, useState, useMemo, memo } from 'react';
import { Maximize2 } from 'lucide-react';
import { LineItem, SelectedLead, StudioInfo, QuoteOptions } from './types';
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
import { SinglePackageLayout } from './layouts/SinglePackageLayout';
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
  onOpenFullPreview?: () => void;
  visible?: boolean;
}

const FULL_WIDTH = 794;

export const RightPanel = memo(function RightPanel({ studio, lead, items, finalPrice, showDiscount, quoteNumber, themeId, quoteOptions, onOpenFullPreview, visible = true }: Props) {
  const template = getTemplate(themeId ?? DEFAULT_TEMPLATE_ID);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.476);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    if (!visible) return;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    let frame1 = 0;
    let frame2 = 0;
    let timer = 0;

    const updateDimensions = () => {
      const availableWidth = wrapper.clientWidth;
      if (availableWidth <= 0) return;
      const nextScale = Math.min(1, Math.max(0.1, (availableWidth - 2) / FULL_WIDTH));
      setScale(nextScale);
      setContentHeight(content.scrollHeight);
    };

    // Double rAF ensures the browser has laid out the newly-visible element
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(updateDimensions);
    });
    timer = window.setTimeout(updateDimensions, 200);

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(wrapper);
    observer.observe(content);

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [items, lead, themeId, quoteOptions, finalPrice, showDiscount, quoteNumber, visible]);

  const scaledHeight = contentHeight > 0 ? Math.ceil(contentHeight * scale) + 4 : undefined;
  const sharedProps = useMemo(() => ({ studio, lead, items, finalPrice, showDiscount, quoteNumber, theme: template as never, quoteOptions }), [studio, lead, items, finalPrice, showDiscount, quoteNumber, template, quoteOptions]);

  const isSinglePackage = useMemo(() => items.filter(i => i.enabled && i.isPackageHeader).length === 1, [items]);

  function renderLayout() {
    if (isSinglePackage) return <SinglePackageLayout {...sharedProps} />;
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
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-ink">
            Live Preview
          </h3>
        </div>
        {onOpenFullPreview && (
          <button
            onClick={onOpenFullPreview}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors px-3 py-1.5 rounded-lg shadow-sm"
            title="Open full-screen preview"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Preview</span>
          </button>
        )}
      </div>
      <div
        ref={wrapperRef}
        className="w-full rounded-xl border border-slate-200 shadow-elevated overflow-hidden bg-slate-50"
        style={{ height: scaledHeight ? `${scaledHeight}px` : undefined, minHeight: '200px' }}
      >
        <div
          ref={contentRef}
          style={{
            width: `${FULL_WIDTH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
          }}
        >
          {quoteOptions?.backgroundImageUrl && (
            <img
              src={quoteOptions.backgroundImageUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top left',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {renderLayout()}
          </div>
        </div>
      </div>
    </div>
  );
});
