import { LineItem, SelectedLead, StudioInfo, QuoteOptions } from '../types';
import { formatCurrencyDecimal } from '../../../../lib/currency';
import { WatermarkOverlay } from './WatermarkOverlay';

interface Props {
  studio: StudioInfo;
  lead: SelectedLead | null;
  items: LineItem[];
  finalPrice: string;
  showDiscount: boolean;
  quoteNumber: string;
  scale?: number;
  quoteOptions?: QuoteOptions;
}

function formatEventDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const BG = '#07070E';
const BG2 = '#0E0E1C';
const GOLD = '#D4AF37';
const GOLD_LIGHT = '#E8CB6A';
const GOLD_FAINT = 'rgba(212,175,55,0.12)';
const GOLD_BORDER = 'rgba(212,175,55,0.25)';
const IVORY = '#F5F0E8';
const IVORY_MUTED = 'rgba(245,240,232,0.55)';
const IVORY_FAINT = 'rgba(245,240,232,0.08)';
const PAGE_W = 794;

function RoyalDivider({ width = 300 }: { width?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: `${width}px`, margin: '0 auto' }}>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${GOLD_BORDER})` }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill={GOLD} opacity={0.6}>
        <path d="M8 0 L9.5 5.5 L15 7 L9.5 8.5 L8 14 L6.5 8.5 L1 7 L6.5 5.5 Z" />
        <circle cx="8" cy="7" r="1.5" fill={GOLD_LIGHT} />
      </svg>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${GOLD_BORDER}, transparent)` }} />
    </div>
  );
}

function CrownSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 80 56" fill="none">
      <path d="M8 48 L8 20 L20 32 L40 8 L60 32 L72 20 L72 48 Z" stroke={GOLD} strokeWidth="1.5" fill={GOLD_FAINT} strokeLinejoin="round" />
      <circle cx="40" cy="8" r="4" fill={GOLD} opacity={0.7} />
      <circle cx="8" cy="20" r="3" fill={GOLD} opacity={0.5} />
      <circle cx="72" cy="20" r="3" fill={GOLD} opacity={0.5} />
      <line x1="8" y1="48" x2="72" y2="48" stroke={GOLD} strokeWidth="1.5" opacity={0.5} />
    </svg>
  );
}

export function RoyalDarkLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
  const enabledItems = items.filter(i => i.enabled);
  const packageHeaders = enabledItems.filter(i => i.isPackageHeader);
  const standaloneServices = enabledItems.filter(i => !i.packageId && !i.isPackageHeader);

  const subtotal = enabledItems.reduce((s, i) => s + i.price, 0);
  const finalNum = parseFloat(finalPrice) || 0;
  const hasFinalPrice = finalPrice !== '' && finalNum > 0;
  const baseAmount = hasFinalPrice ? finalNum : subtotal;
  const discountAmount = hasFinalPrice && finalNum < subtotal ? subtotal - finalNum : 0;
  const gstAmount = quoteOptions?.includeGst ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
  const displayTotal = Math.round((baseAmount + gstAmount) * 100) / 100;

  const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: `${PAGE_W}px`,
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        color: IVORY,
        lineHeight: 1.6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — COVER */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: `linear-gradient(160deg, ${BG} 0%, ${BG2} 60%, #12122a 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />

        {/* Radial glow top center */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 60, height: 60, opacity: 0.3 }}>
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <path d="M2 2 L20 2 L2 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M8 2 L8 8 L2 8" stroke={GOLD} strokeWidth="0.8" fill="none" opacity={0.5} />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 24, right: 24, width: 60, height: 60, opacity: 0.3, transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <path d="M2 2 L20 2 L2 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
            <path d="M8 2 L8 8 L2 8" stroke={GOLD} strokeWidth="0.8" fill="none" opacity={0.5} />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 120, left: 24, width: 60, height: 60, opacity: 0.3, transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <path d="M2 2 L20 2 L2 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 120, right: 24, width: 60, height: 60, opacity: 0.3, transform: 'scale(-1)' }}>
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <path d="M2 2 L20 2 L2 20" stroke={GOLD} strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        {/* Cover content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 80px 60px' }}>
          <div style={{ marginBottom: '28px' }}>
            <CrownSvg size={72} />
          </div>

          {studio.logo_url ? (
            <img
              src={studio.logo_url}
              alt={studio.name}
              crossOrigin="anonymous"
              style={{
                width: '140px', height: '140px', objectFit: 'contain',
                marginBottom: '36px',
                filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.15))',
              }}
            />
          ) : (
            <div style={{
              width: '140px', height: '140px',
              borderRadius: '50%',
              border: `2px solid ${GOLD_BORDER}`,
              background: quoteOptions?.backgroundImageUrl ? 'transparent' : IVORY_FAINT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '36px',
            }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="0.8" opacity={0.5}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              fontSize: '12.65px', letterSpacing: '0.35em', textTransform: 'uppercase',
              color: GOLD, opacity: 0.7, marginBottom: '16px', fontFamily: 'Arial, sans-serif',
            }}>
              {quoteOptions?.serviceName || 'Photography & Cinematography'}
            </div>
            <h1 style={{
              fontSize: '55.2px', fontWeight: 400, color: IVORY, margin: 0, lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}>
              {studio.name || 'Studio Name'}
            </h1>
            {studio.owner_name && (
              <p style={{ fontSize: '18.4px', color: GOLD_LIGHT, fontStyle: 'italic', margin: '12px 0 0', opacity: 0.8 }}>
                by {studio.owner_name}
              </p>
            )}
          </div>

          <RoyalDivider width={320} />

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <div style={{ fontSize: '12.65px', letterSpacing: '0.3em', textTransform: 'uppercase', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
              Exclusive Quotation
            </div>
            <div style={{ fontSize: '25.3px', color: GOLD_LIGHT, fontStyle: 'italic' }}>
              {quoteNumber}
            </div>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, opacity: 0.5, fontFamily: 'Arial, sans-serif', marginTop: '10px', marginBottom: '3px' }}>Quote Date</div>
            <div style={{ fontSize: '13.8px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>
              {today}
            </div>
          </div>

          {lead && (
            <div style={{
              marginTop: '56px',
              padding: '24px 48px',
              border: `1px solid ${GOLD_BORDER}`,
              background: quoteOptions?.backgroundImageUrl ? 'transparent' : IVORY_FAINT,
              textAlign: 'center',
              width: '100%', maxWidth: '480px',
            }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, opacity: 0.6, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
                Prepared For
              </div>
              <div style={{ fontSize: '25.3px', color: IVORY }}>{lead.full_name}</div>
              {lead.event_type && (
                <div style={{ fontSize: '13.8px', color: GOLD_LIGHT, fontStyle: 'italic', marginTop: '6px', opacity: 0.8 }}>{lead.event_type}</div>
              )}
              {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, opacity: 0.5, fontFamily: 'Arial, sans-serif', marginBottom: '3px' }}>Events</div>
                  {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                    <div key={e.id} style={{ fontSize: '13.8px', color: GOLD_LIGHT, fontStyle: 'italic', opacity: 0.8, marginBottom: '2px' }}>
                      {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                    </div>
                  ))}
                </div>
              ) : lead.event_date ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, opacity: 0.5, fontFamily: 'Arial, sans-serif', marginBottom: '3px' }}>Event Date</div>
                  <div style={{ fontSize: '13.8px', color: GOLD_LIGHT, fontStyle: 'italic', opacity: 0.8 }}>{formatEventDate(lead.event_date)}</div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          padding: '20px 64px', borderTop: `1px solid ${GOLD_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {studio.phone && <span style={{ fontSize: '12.65px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>{studio.phone}</span>}
          {studio.email && <span style={{ fontSize: '12.65px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>{studio.email}</span>}
          {studio.website && <span style={{ fontSize: '12.65px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>{studio.website.replace(/^https?:\/\//, '')}</span>}
        </div>
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />
      </div>

      {/* PAGE 2 — PACKAGES & SERVICES */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        <div style={{ padding: '56px 64px', flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, opacity: 0.6, fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
              Your Investment
            </div>
            <h2 style={{ fontSize: '39.1px', fontWeight: 400, color: IVORY, margin: '0 0 16px', fontStyle: 'italic' }}>
              {quoteOptions?.serviceName || 'Packages & Services'}
            </h2>
            <RoyalDivider width={240} />
          </div>

          {packageHeaders.length > 0 && packageHeaders.map(pkg => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{
                border: `1px solid ${GOLD_BORDER}`,
                background: quoteOptions?.backgroundImageUrl ? 'transparent' : IVORY_FAINT,
                marginBottom: '24px',
                padding: '28px 32px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, opacity: 0.6, fontFamily: 'Arial, sans-serif', marginBottom: '6px' }}>Package</div>
                    <h3 style={{ fontSize: '23px', fontWeight: 400, color: IVORY, margin: 0 }}>{pkg.name}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '25.3px', color: GOLD_LIGHT, fontStyle: 'italic' }}>{formatCurrencyDecimal(pkg.price)}</div>
                  </div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ borderTop: `1px solid ${GOLD_BORDER}`, paddingTop: '14px' }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14.95px' }}>
                        <span style={{ color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>◆ &nbsp;{inc.name}</span>
                        {inc.price > 0 && <span style={{ color: GOLD, opacity: 0.7, fontFamily: 'Arial, sans-serif' }}>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div style={{ border: `1px solid ${GOLD_BORDER}`, background: IVORY_FAINT, padding: '28px 32px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, opacity: 0.6, fontFamily: 'Arial, sans-serif', marginBottom: '16px' }}>
                Services
              </div>
              {standaloneServices.map((svc, i) => (
                <div key={svc.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid rgba(212,175,55,0.1)` : 'none',
                }}>
                  <span style={{ fontSize: '17.25px', color: IVORY }}>{svc.name}</span>
                  <span style={{ fontSize: '17.25px', color: GOLD_LIGHT, fontStyle: 'italic' }}>{formatCurrencyDecimal(svc.price)}</span>
                </div>
              ))}
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: IVORY_MUTED, fontStyle: 'italic', fontSize: '16.1px', fontFamily: 'Arial, sans-serif' }}>
              No services selected
            </div>
          )}


          {/* Totals */}
          <div style={{ maxWidth: '360px', marginLeft: 'auto', marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: IVORY_MUTED }}>
              <span>Subtotal</span>
              <span>{formatCurrencyDecimal(subtotal)}</span>
            </div>
            {showDiscount && discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: GOLD }}>
                <span>Discount Applied</span>
                <span>−{formatCurrencyDecimal(discountAmount)}</span>
              </div>
            )}
            {quoteOptions?.includeGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: IVORY_MUTED }}>
                <span>GST (18%)</span>
                <span>+{formatCurrencyDecimal(gstAmount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 0',
              borderTop: `1px solid ${GOLD_BORDER}`,
              marginTop: '8px',
            }}>
              <span style={{ fontSize: '16.1px', letterSpacing: '0.15em', textTransform: 'uppercase', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>Total Investment{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
              <span style={{ fontSize: '32.2px', color: GOLD_LIGHT, fontStyle: 'italic' }}>{formatCurrencyDecimal(displayTotal)}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 64px', borderTop: `1px solid ${GOLD_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12.65px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>{studio.name}</span>
          <span style={{ fontSize: '11.5px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif', opacity: 0.5 }}>{quoteNumber} · SnapQuote</span>
        </div>
        <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      </div>

      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${GOLD_BORDER}`, marginTop: '32px' }}>
          <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '20px' }}>
            Customer Approval
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div>
                <div style={{ width: '220px', height: '1px', background: GOLD_BORDER, marginBottom: '6px', marginTop: '32px' }} />
                <div style={{ fontSize: '11.5px', color: IVORY_MUTED, letterSpacing: '0.08em' }}>Customer Signature</div>
              </div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: IVORY, marginBottom: '2px' }}>{lead.full_name}</div>
                {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: IVORY_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: IVORY_MUTED, marginBottom: '1px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: IVORY_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: IVORY_MUTED }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
                <div style={{ height: '1px', background: GOLD_BORDER, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: IVORY_MUTED }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 3 — PORTFOLIO */}
      {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
        <div style={{
          minHeight: `${Math.round(PAGE_W * 1.414)}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
          <div style={{ padding: '56px 64px', flex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, opacity: 0.6, fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
                Our Work
              </div>
              <h2 style={{ fontSize: '39.1px', fontWeight: 400, color: IVORY, margin: '0 0 16px', fontStyle: 'italic' }}>
                Portfolio
              </h2>
              <RoyalDivider width={240} />
            </div>
            {(() => {
              const imgs = studio.portfolio_images!.slice(0, 8);
              const cols = imgs.length <= 2 ? imgs.length : imgs.length <= 4 ? 2 : 3;
              const rows: typeof imgs[] = [];
              for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
              return rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px', marginBottom: '10px' }}>
                  {row.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', border: `1px solid ${GOLD_BORDER}`, position: 'relative', background: '#1a1a22', height: '200px' }}>
                      <img src={img.url} alt={img.caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }} />
                      {img.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(7,7,14,0.8) 0%, transparent 100%)', padding: '20px 10px 8px', fontSize: '11.5px', color: GOLD_LIGHT, letterSpacing: '0.1em', textAlign: 'center', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>{img.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
          <div style={{ padding: '28px 64px', borderTop: `1px solid ${GOLD_BORDER}`, background: IVORY_FAINT, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '18.4px', color: IVORY }}>{studio.name}</div>
              {studio.phone && <div style={{ fontSize: '13.8px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif', marginTop: '4px' }}>{studio.phone}</div>}
              {studio.email && <div style={{ fontSize: '13.8px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif' }}>{studio.email}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {studio.website && <div style={{ fontSize: '14.95px', color: GOLD_LIGHT, fontStyle: 'italic' }}>{studio.website.replace(/^https?:\/\//, '')}</div>}
              {studio.gst_number && <div style={{ fontSize: '12.65px', color: IVORY_MUTED, fontFamily: 'Arial, sans-serif', marginTop: '4px' }}>GST: {studio.gst_number}</div>}
            </div>
          </div>
          <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        </div>
      )}

      {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
        <div style={{ background: BG2, padding: '36px 64px', borderTop: `1px solid ${GOLD_BORDER}` }}>
          <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD_LIGHT, marginBottom: '12px' }}>
            What You Get
          </div>
          <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '16px' }} />
          {quoteOptions.packageDeliverables.map((pkg) => (
            <div key={pkg.packageId} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '14.95px', fontWeight: 700, color: IVORY_MUTED, marginBottom: '6px' }}>
                {pkg.packageName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {pkg.deliverables.map((deliverable, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: IVORY_MUTED, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
              {pkg.terms && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${GOLD_BORDER}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_LIGHT, opacity: 0.7, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ fontSize: '12.65px', color: IVORY_MUTED, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                    {pkg.terms}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(() => {
        const deliverableMode = quoteOptions?.deliverableMode ?? 'default';
        const showDeliverablesSection = quoteOptions?.showDeliverables !== false;
        let deliverablesItems: string[] = [];
        if (deliverableMode === 'default' && studio.default_deliverables && studio.default_deliverables.length > 0) {
          deliverablesItems = studio.default_deliverables;
        } else if (deliverableMode === 'custom' && quoteOptions?.customDeliverables && quoteOptions.customDeliverables.length > 0) {
          deliverablesItems = quoteOptions.customDeliverables;
        }
        if (!showDeliverablesSection || deliverablesItems.length === 0) return null;
        return (
          <div style={{ background: BG2, padding: '36px 64px', borderTop: `1px solid ${GOLD_BORDER}` }}>
            <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD_LIGHT, marginBottom: '12px' }}>
              Deliverables
            </div>
            <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {deliverablesItems.map((item, idx) => (
                <div key={idx} style={{ fontSize: '13.8px', color: IVORY_MUTED, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                  <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
        <div style={{ background: BG2, padding: '28px 64px', borderTop: `1px solid ${GOLD_BORDER}`, marginTop: '0' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '14px' }}>
            Payment Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {studio.payment_details.account_holder && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '3px' }}>Account Holder</div>
                <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.account_holder}</div>
              </div>
            )}
            {studio.payment_details.bank_name && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '3px' }}>Bank</div>
                <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.bank_name}</div>
              </div>
            )}
            {studio.payment_details.account_number && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '3px' }}>Account Number</div>
                <div style={{ fontSize: '13.8px', color: IVORY, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
              </div>
            )}
            {studio.payment_details.ifsc_code && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '3px' }}>IFSC Code</div>
                <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.ifsc_code}</div>
              </div>
            )}
            {studio.payment_details.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '3px' }}>UPI ID</div>
                <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.upi_id}</div>
              </div>
            )}
          </div>
          {studio.payment_details.notes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${GOLD_BORDER}` }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: IVORY_MUTED, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '12.65px', color: IVORY_MUTED, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
            </div>
          )}
        </div>
      )}

      {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
        <div style={{ background: BG2, padding: '36px 64px', borderTop: `1px solid ${GOLD_BORDER}` }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD_LIGHT, opacity: 0.7, marginBottom: '12px' }}>
            Terms &amp; Conditions
          </div>
          <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '16px' }} />
          {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
            <div style={{ fontSize: '12.65px', color: IVORY_MUTED, lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
              {studio.terms_and_conditions}
            </div>
          )}
          {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
              {quoteOptions.additionalTerms.map((term, idx) => (
                <div key={idx} style={{ fontSize: '12.65px', color: IVORY_MUTED, lineHeight: '1.8' }}>
                  • {term}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
