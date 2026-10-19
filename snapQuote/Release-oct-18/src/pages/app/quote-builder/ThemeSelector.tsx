import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LayoutTemplate, Check, ChevronDown, Lock, Sparkles, X, Eye } from 'lucide-react';
import { QUOTE_TEMPLATES, QuoteTemplate, canUseTemplate } from './themes';
import { StudioPlan, isBusinessPlan } from '../../../types';
import { LineItem, SelectedLead, StudioInfo, QuoteOptions } from './types';
import { QuoteDocument } from './QuoteDocument';

interface PreviewData {
  studio: StudioInfo;
  lead: SelectedLead | null;
  items: LineItem[];
  finalPrice: string;
  showDiscount: boolean;
  quoteNumber: string;
  quoteOptions?: QuoteOptions;
}

interface Props {
  selectedId: string;
  onChange: (templateId: string) => void;
  plan: StudioPlan;
  previewData?: PreviewData;
}

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Free', color: '#374151', bg: '#f3f4f6' },
  growth: { label: 'Business', color: '#0f172a', bg: '#e2e8f0' },
  pro: { label: 'Business', color: '#0f172a', bg: '#e2e8f0' },
};

// Full-screen modal that renders an actual QuoteDocument at scale
function TemplatePreviewModal({
  template,
  previewData,
  onClose,
  onSelect,
  isActive,
  isLocked,
}: {
  template: QuoteTemplate;
  previewData: PreviewData;
  onClose: () => void;
  onSelect: () => void;
  isActive: boolean;
  isLocked: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const tier = TIER_LABELS[template.tier];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex items-center justify-between px-4 sm:px-5 py-3 shrink-0"
        style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-sm font-semibold text-white truncate">{template.name}</span>
          <span style={{
            fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.05em',
            color: tier.color, background: tier.bg,
            padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase',
          }} className="shrink-0">
            {tier.label}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline truncate">{template.tagline}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isLocked && !isActive && (
            <button
              onClick={() => { onSelect(); onClose(); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Check className="w-3.5 h-3.5" />
              Use This
            </button>
          )}
          {isActive && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <Check className="w-3.5 h-3.5" /> Active
            </span>
          )}
          {isLocked && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-4 flex justify-center">
        <div
          style={{
            width: '794px',
            maxWidth: '100%',
            transformOrigin: 'top center',
            zoom: 'min(1, calc((100vw - 32px) / 794px))',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          <QuoteDocument
            studio={previewData.studio}
            lead={previewData.lead}
            items={previewData.items}
            finalPrice={previewData.finalPrice}
            showDiscount={previewData.showDiscount}
            quoteNumber={previewData.quoteNumber}
            themeId={template.id}
            quoteOptions={previewData.quoteOptions}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TemplatePreviewCard({
  template, isActive, isLocked, onClick, onPreview,
}: {
  template: QuoteTemplate;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
  onPreview: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tier = TIER_LABELS[template.tier];

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        disabled={isLocked}
        className="relative text-left transition-all duration-200 w-full"
        style={{
          background: 'white',
          border: isActive ? '2px solid #0f172a' : '2px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          opacity: isLocked ? 0.55 : 1,
          boxShadow: isActive ? '0 0 0 3px rgba(15,23,42,0.08)' : undefined,
        }}
      >
        <div style={{ height: '72px', background: template.previewGradient, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '3px' }}>
            <div style={{ height: '8px', width: '55%', borderRadius: '2px', background: template.previewAccent, opacity: 0.7 }} />
            <div style={{ height: '4px', width: '35%', borderRadius: '2px', background: template.previewAccent, opacity: 0.35 }} />
            <div style={{ height: '3px', width: '25%', borderRadius: '2px', background: template.previewAccent, opacity: 0.25 }} />
          </div>
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <span style={{
              fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.05em',
              color: tier.color, background: tier.bg,
              padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
            }}>
              {tier.label}
            </span>
          </div>
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
              <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          )}
          {isActive && !isLocked && (
            <div className="absolute top-2 left-2">
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '8px 10px 10px' }}>
          <div style={{ fontSize: '13.8px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{template.name}</div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>{template.tagline}</div>
        </div>
      </button>

      {/* Preview button — always visible on mobile, hover on desktop */}
      <button
        onClick={e => { e.stopPropagation(); onPreview(); }}
        className={`absolute bottom-[38px] right-1.5 flex items-center gap-1 px-2 py-1.5 rounded-md text-white text-[10px] font-semibold transition-all duration-150 ${
          hovered ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
        style={{
          background: 'rgba(15,23,42,0.82)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
          zIndex: 10,
        }}
        title="Preview full template"
      >
        <Eye className="w-3.5 h-3.5" />
        Preview
      </button>
    </div>
  );
}

// Mobile bottom sheet for template selection
function MobileTemplateSheet({
  open, onClose, selectedId, onChange, plan, previewData, onPreview,
}: {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  onChange: (id: string) => void;
  plan: StudioPlan;
  previewData: PreviewData;
  onPreview: (t: QuoteTemplate) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const freeTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'free');
  const growthTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'growth');
  const proTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'pro');
  const hasPremiumAccess = isBusinessPlan(plan);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh', height: '90vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Choose Template</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tap a template to select, or Preview to see it full-screen</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable template list */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-4 space-y-6">
          {/* Free */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Free</p>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {freeTemplates.map(t => (
                <TemplatePreviewCard
                  key={t.id}
                  template={t}
                  isActive={t.id === selectedId}
                  isLocked={false}
                  onClick={() => { onChange(t.id); onClose(); }}
                  onPreview={() => { onPreview(t); }}
                />
              ))}
            </div>
          </div>

          {/* Growth */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Business</p>
              <div className="h-px flex-1 bg-slate-100" />
              {!hasPremiumAccess && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Business
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {growthTemplates.map(t => (
                <TemplatePreviewCard
                  key={t.id}
                  template={t}
                  isActive={t.id === selectedId}
                  isLocked={!canUseTemplate(t.id, plan)}
                  onClick={() => {
                    if (!canUseTemplate(t.id, plan)) return;
                    onChange(t.id);
                    onClose();
                  }}
                  onPreview={() => onPreview(t)}
                />
              ))}
            </div>
          </div>

          {/* Pro */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Business</p>
              <div className="h-px flex-1 bg-slate-100" />
              {!hasPremiumAccess && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-1.5 py-0.5 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Business
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {proTemplates.map(t => (
                <TemplatePreviewCard
                  key={t.id}
                  template={t}
                  isActive={t.id === selectedId}
                  isLocked={!canUseTemplate(t.id, plan)}
                  onClick={() => {
                    if (!canUseTemplate(t.id, plan)) return;
                    onChange(t.id);
                    onClose();
                  }}
                  onPreview={() => onPreview(t)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer upgrade CTA */}
        {!hasPremiumAccess && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
            <a
              href="/app/settings?tab=billing"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-2"
              onClick={onClose}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Upgrade to unlock premium templates
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ThemeSelector({ selectedId, onChange, plan, previewData }: Props) {
  const [open, setOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = QUOTE_TEMPLATES.find(t => t.id === selectedId) ?? QUOTE_TEMPLATES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleTouchOutside(e: TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [open]);

  const freeTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'free');
  const growthTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'growth');
  const proTemplates = QUOTE_TEMPLATES.filter(t => t.tier === 'pro');

  const hasPremiumAccess = isBusinessPlan(plan);
  const hasProAccess = isBusinessPlan(plan);

  const fallbackPreview: PreviewData = previewData ?? {
    studio: { name: 'Your Studio', email: '', phone: '', address: '', website: '', gst_number: '', owner_name: '', logo_url: '', watermark_url: undefined, portfolio_images: [], details_section: '', terms_and_conditions: '' },
    lead: { id: '', full_name: 'Client Name', phone: '', email: '', event_type: 'Wedding', event_date: '' },
    items: [
      { id: '1', name: 'Photography Package', price: 75000, enabled: true },
      { id: '2', name: 'Videography Package', price: 50000, enabled: true },
      { id: '3', name: 'Album Design', price: 15000, enabled: true },
    ],
    finalPrice: '',
    showDiscount: false,
    quoteNumber: 'QT-0001',
  };

  function handlePreview(template: QuoteTemplate) {
    setPreviewTemplate(template);
    setOpen(false);
    setMobileSheetOpen(false);
  }

  function handleOpen() {
    // Use mobile sheet on small screens, dropdown on desktop
    if (window.innerWidth < 640) {
      setMobileSheetOpen(true);
    } else {
      setOpen(p => !p);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button — full width on mobile, auto on desktop */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2.5 sm:py-2 text-sm hover:bg-surface-raised transition-colors w-full sm:w-auto"
        title="Select quote template"
      >
        <LayoutTemplate className="w-4 h-4 text-ink-subtle shrink-0" />
        <div
          className="w-4 h-4 rounded shrink-0 border border-black/10"
          style={{ background: selected.previewGradient }}
        />
        <span className="text-ink font-medium flex-1 sm:flex-initial text-left truncate">{selected.name}</span>
        <ChevronDown className={`w-4 h-4 text-ink-subtle transition-transform shrink-0 ${open || mobileSheetOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {open && (
        <div
          className="hidden sm:block absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: '520px', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Choose a Template</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hover a card and click Preview to see the full layout</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Free</p>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {freeTemplates.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    isActive={t.id === selectedId}
                    isLocked={false}
                    onClick={() => { onChange(t.id); setOpen(false); }}
                    onPreview={() => handlePreview(t)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Business</p>
                <div className="h-px flex-1 bg-slate-100" />
                {!hasPremiumAccess && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> Business
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {growthTemplates.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    isActive={t.id === selectedId}
                    isLocked={!canUseTemplate(t.id, plan)}
                    onClick={() => {
                      if (!canUseTemplate(t.id, plan)) return;
                      onChange(t.id);
                      setOpen(false);
                    }}
                    onPreview={() => handlePreview(t)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Business</p>
                <div className="h-px flex-1 bg-slate-100" />
                {!hasProAccess && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-1.5 py-0.5 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> Business
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {proTemplates.map(t => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    isActive={t.id === selectedId}
                    isLocked={!canUseTemplate(t.id, plan)}
                    onClick={() => {
                      if (!canUseTemplate(t.id, plan)) return;
                      onChange(t.id);
                      setOpen(false);
                    }}
                    onPreview={() => handlePreview(t)}
                  />
                ))}
              </div>
            </div>
          </div>

          {!hasProAccess && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <a
                href="/app/settings?tab=billing"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {hasPremiumAccess ? 'Upgrade to unlock all templates' : 'Upgrade to unlock premium templates'}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom sheet */}
      <MobileTemplateSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        selectedId={selectedId}
        onChange={onChange}
        plan={plan}
        previewData={fallbackPreview}
        onPreview={handlePreview}
      />

      {/* Full-screen preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          previewData={fallbackPreview}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            onChange(previewTemplate.id);
            setPreviewTemplate(null);
          }}
          isActive={previewTemplate.id === selectedId}
          isLocked={!canUseTemplate(previewTemplate.id, plan)}
        />
      )}
    </div>
  );
}

export { canUseTemplate as BASIC_THEME_IDS };
