import { LineItem, SelectedLead, StudioInfo, QuoteOptions } from '../types';
import { QuoteTheme } from '../themes';
import { formatCurrencyDecimal } from '../../../../lib/currency';
import { WatermarkOverlay } from './WatermarkOverlay';

interface Props {
  studio: StudioInfo;
  lead: SelectedLead | null;
  items: LineItem[];
  finalPrice: string;
  showDiscount: boolean;
  quoteNumber: string;
  theme: QuoteTheme;
  scale?: number;
  quoteOptions?: QuoteOptions;
}

function formatEventDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CREAM = '#F5EDE3';
const CREAM_DARK = '#EDD9C8';
const CREAM_DEEP = '#E5C9B0';
const BROWN = '#3D2B1F';
const BROWN_LIGHT = '#6B4C37';
const GOLD = '#B07D5A';
const GOLD_LIGHT = '#C89E7A';
const GOLD_FAINT = 'rgba(176,125,90,0.12)';
const MUTED = '#9C7860';
const WHITE = '#FFFFFF';
const PAGE_W = 794;

function OrnamentDivider({ color = GOLD, width = 200 }: { color?: string; width?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: `${width}px`, margin: '0 auto' }}>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${color})` }} />
      <svg width="12" height="12" viewBox="0 0 12 12" fill={color}>
        <path d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" />
      </svg>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

function FlowerSvg({ size = 40, color = GOLD_LIGHT, opacity = 0.35 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
      <circle cx="40" cy="40" r="8" fill={color} />
      <ellipse cx="40" cy="20" rx="6" ry="12" fill={color} />
      <ellipse cx="40" cy="60" rx="6" ry="12" fill={color} />
      <ellipse cx="20" cy="40" rx="12" ry="6" fill={color} />
      <ellipse cx="60" cy="40" rx="12" ry="6" fill={color} />
      <ellipse cx="26" cy="26" rx="6" ry="12" fill={color} transform="rotate(45 26 26)" />
      <ellipse cx="54" cy="26" rx="6" ry="12" fill={color} transform="rotate(-45 54 26)" />
      <ellipse cx="26" cy="54" rx="6" ry="12" fill={color} transform="rotate(-45 26 54)" />
      <ellipse cx="54" cy="54" rx="6" ry="12" fill={color} transform="rotate(45 54 54)" />
    </svg>
  );
}

function LeafBranch({ mirror = false, size = 80, color = GOLD_LIGHT, opacity = 0.25 }: { mirror?: boolean; size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 120 72" fill="none" style={{ opacity, transform: mirror ? 'scaleX(-1)' : undefined }}>
      <path d="M10 60 Q30 40 60 36 Q90 32 110 20" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 55 Q22 42 35 38" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M35 50 Q37 37 50 34" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M50 46 Q52 35 65 32" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M65 42 Q67 32 80 28" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M80 38 Q82 28 95 24" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="28" cy="46" rx="6" ry="9" fill={color} transform="rotate(-30 28 46)" opacity="0.6" />
      <ellipse cx="44" cy="42" rx="6" ry="9" fill={color} transform="rotate(-25 44 42)" opacity="0.6" />
      <ellipse cx="60" cy="38" rx="6" ry="9" fill={color} transform="rotate(-20 60 38)" opacity="0.6" />
      <ellipse cx="76" cy="34" rx="5" ry="8" fill={color} transform="rotate(-15 76 34)" opacity="0.5" />
    </svg>
  );
}

export function WeddingElegantLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : CREAM,
        fontFamily: "'Georgia', 'Times New Roman', 'Palatino Linotype', serif",
        color: BROWN,
        lineHeight: 1.6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — COVER
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: `linear-gradient(170deg, ${CREAM} 0%, ${CREAM_DARK} 55%, ${CREAM_DEEP} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top accent line */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />

        {/* Corner botanical — top left */}
        <div style={{ position: 'absolute', top: 20, left: 20, opacity: 0.22 }}>
          <LeafBranch size={160} color={GOLD} opacity={1} />
        </div>
        {/* Corner botanical — top right */}
        <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.22 }}>
          <LeafBranch mirror size={160} color={GOLD} opacity={1} />
        </div>

        {/* Logo area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '80px',
          paddingBottom: '40px',
        }}>
          {studio.logo_url ? (
            <img
              src={studio.logo_url}
              alt={studio.name}
              crossOrigin="anonymous"
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{
              width: '180px',
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* Title block */}
        <div style={{
          textAlign: 'center',
          padding: '40px 80px 0',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <FlowerSvg size={36} color={GOLD} opacity={0.4} />
          </div>

          <div style={{
            fontSize: '50.6px',
            fontWeight: 400,
            color: BROWN,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            fontStyle: 'italic',
            marginBottom: '4px',
          }}>
            Wedding
          </div>
          <div style={{
            fontSize: '50.6px',
            fontWeight: 700,
            color: BROWN,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}>
            &amp; Events
          </div>

          <OrnamentDivider color={GOLD} width={240} />

          <div style={{
            fontSize: '14.95px',
            color: MUTED,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: '16px',
            marginBottom: '6px',
            fontFamily: "'Arial', sans-serif",
          }}>
            {quoteOptions?.serviceName || 'Photography & Cinematography'}
          </div>

          {studio.name && (
            <div style={{
              fontSize: '20.7px',
              fontWeight: 600,
              color: BROWN,
              marginTop: '4px',
            }}>
              {studio.name}
            </div>
          )}
        </div>

        {/* Lead / prepared for block */}
        {lead && (
          <div style={{
            margin: '28px 60px 0',
            padding: '20px 32px',
            background: `rgba(255,255,255,0.55)`,
            border: `1px solid ${CREAM_DEEP}`,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>
                Proposal Prepared For
              </div>
              <div style={{ fontSize: '23px', fontWeight: 600, color: BROWN }}>{lead.full_name}</div>
              {lead.event_type && (
                <div style={{ fontSize: '13.8px', color: MUTED, marginTop: '2px', fontStyle: 'italic' }}>{lead.event_type}</div>
              )}
              {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>Events</div>
                  {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                    <div key={e.id} style={{ fontSize: '13.8px', color: MUTED, fontStyle: 'italic', marginBottom: '2px' }}>
                      {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                    </div>
                  ))}
                </div>
              ) : lead.event_date ? (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '2px' }}>Event Date</div>
                  <div style={{ fontSize: '13.8px', color: MUTED, fontStyle: 'italic' }}>{formatEventDate(lead.event_date)}</div>
                </div>
              ) : null}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif' }}>{quoteNumber}</div>
              <div style={{ fontSize: '10.35px', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginTop: '8px', marginBottom: '2px' }}>Quote Date</div>
              <div style={{ fontSize: '13.8px', color: MUTED, fontStyle: 'italic' }}>{today}</div>
            </div>
          </div>
        )}

        {/* Subtitle description */}
        <div style={{
          margin: '28px 80px 0',
          textAlign: 'center',
          fontSize: '14.95px',
          color: MUTED,
          lineHeight: 1.8,
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
        }}>
          Succinct yet distinctive, seamlessly typewriting, remaining essentially unchanged, it was popularized in the 1960s with the release of Letraset.
        </div>

        {/* Bottom contact strip */}
        <div style={{
          margin: '36px 60px 0',
          paddingBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          {studio.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: GOLD_FAINT, border: `1px solid rgba(176,125,90,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                </svg>
              </div>
              <span style={{ fontSize: '13.8px', color: BROWN_LIGHT, fontFamily: 'Arial, sans-serif' }}>{studio.phone}</span>
            </div>
          )}
          {studio.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: GOLD_FAINT, border: `1px solid rgba(176,125,90,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span style={{ fontSize: '13.8px', color: BROWN_LIGHT, fontFamily: 'Arial, sans-serif' }}>{studio.email}</span>
            </div>
          )}
          {studio.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: GOLD_FAINT, border: `1px solid rgba(176,125,90,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <span style={{ fontSize: '13.8px', color: BROWN_LIGHT, fontFamily: 'Arial, sans-serif' }}>{studio.website.replace(/^https?:\/\//, '')}</span>
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div style={{ height: '4px', marginTop: '24px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — PACKAGES & PRICING
      ═══════════════════════════════════════════════════════════ */}
      {enabledItems.length > 0 && (
        <div style={{
          minHeight: `${Math.round(PAGE_W * 1.414)}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Top bar */}
          <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />

          {/* Watermark botanical */}
          <div style={{ position: 'absolute', bottom: 60, right: -20, opacity: 0.06, transform: 'rotate(-15deg)' }}>
            <FlowerSvg size={280} color={GOLD} opacity={1} />
          </div>

          <div style={{ padding: '52px 64px 0', flex: 1 }}>
            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <div style={{ fontSize: '12.65px', letterSpacing: '0.22em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
                Our Offerings
              </div>
              <div style={{
                fontSize: '41.4px',
                fontWeight: 400,
                color: BROWN,
                fontStyle: 'italic',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}>
                {quoteOptions?.serviceName || 'Wedding Services'}
              </div>
              <OrnamentDivider color={GOLD} width={280} />
            </div>

            {/* Package cards */}
            {packageHeaders.length > 0 && (
              <div>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  justifyContent: packageHeaders.length === 1 ? 'center' : packageHeaders.length === 2 ? 'center' : 'flex-start',
                }}>
                  {packageHeaders.map((pkg, pkgIdx) => {
                    const pkgIncludes = enabledItems.filter(i => i.packageId === pkg.id);
                    const cardW = packageHeaders.length === 1 ? '340px' : packageHeaders.length === 2 ? '300px' : '210px';
                    const isHighlighted = pkgIdx === Math.floor(packageHeaders.length / 2) || packageHeaders.length === 1;
                    return (
                      <div key={pkg.id} style={{
                        width: cardW,
                        background: isHighlighted
                          ? `linear-gradient(160deg, ${CREAM_DARK} 0%, ${CREAM} 100%)`
                          : WHITE,
                        border: isHighlighted ? `1.5px solid ${GOLD}` : `1px solid ${CREAM_DEEP}`,
                        borderRadius: '2px',
                        overflow: 'hidden',
                        boxShadow: isHighlighted ? '0 8px 32px rgba(176,125,90,0.15)' : '0 2px 12px rgba(61,43,31,0.06)',
                        position: 'relative',
                      }}>
                        {isHighlighted && (
                          <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})`,
                          }} />
                        )}

                        {/* Card header */}
                        <div style={{
                          padding: isHighlighted ? '28px 24px 20px' : '24px 20px 16px',
                          textAlign: 'center',
                          borderBottom: `1px solid ${isHighlighted ? CREAM_DEEP : '#f0e8e0'}`,
                        }}>
                          <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            background: quoteOptions?.backgroundImageUrl ? 'transparent' : GOLD_FAINT,
                            border: `1px solid rgba(176,125,90,0.3)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          </div>
                          <div style={{
                            fontSize: isHighlighted ? '16px' : '14px',
                            fontWeight: 600,
                            color: BROWN,
                            marginBottom: '6px',
                          }}>
                            {pkg.name.replace(' (Package)', '')}
                          </div>
                          <div style={{
                            fontSize: isHighlighted ? '32px' : '26px',
                            fontWeight: 400,
                            color: GOLD,
                            fontStyle: 'italic',
                            lineHeight: 1.1,
                          }}>
                            {formatCurrencyDecimal(pkg.price)}
                          </div>
                        </div>

                        {/* Includes list */}
                        {pkgIncludes.length > 0 && (
                          <div style={{ padding: '16px 20px 20px' }}>
                            {pkgIncludes.map((inc) => (
                              <div key={inc.id} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                marginBottom: '8px',
                              }}>
                                <div style={{
                                  width: '16px', height: '16px', borderRadius: '50%',
                                  background: quoteOptions?.backgroundImageUrl ? 'transparent' : GOLD_FAINT,
                                  border: `1px solid rgba(176,125,90,0.35)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '2px',
                                }}>
                                  <svg width="7" height="7" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4l2.5 2.5L9 1" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span style={{ fontSize: '13.8px', color: BROWN_LIGHT, lineHeight: 1.5, fontFamily: 'Arial, sans-serif' }}>
                                  {inc.name}
                                  {inc.price > 0 && (
                                    <span style={{ color: GOLD, marginLeft: '4px' }}>({formatCurrencyDecimal(inc.price)})</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standalone services */}
            {standaloneServices.length > 0 && (
              <div style={{ marginTop: packageHeaders.length > 0 ? '44px' : '0' }}>
                {packageHeaders.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <OrnamentDivider color={CREAM_DEEP} width={200} />
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14.95px', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif' }}>
                      Additional Services
                    </div>
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {standaloneServices.map((svc) => (
                    <div key={svc.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      background: quoteOptions?.backgroundImageUrl ? 'transparent' : CREAM,
                      border: `1px solid ${CREAM_DEEP}`,
                      borderRadius: '2px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: GOLD, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '14.95px', color: BROWN, fontFamily: 'Georgia, serif' }}>{svc.name}</span>
                      </div>
                      <span style={{ fontSize: '16.1px', fontWeight: 600, color: GOLD, fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>
                        {formatCurrencyDecimal(svc.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={{ marginTop: '44px' }}>
              <div style={{
                background: `linear-gradient(135deg, ${CREAM_DARK} 0%, ${CREAM} 100%)`,
                border: `1px solid ${GOLD}`,
                borderRadius: '2px',
                padding: '28px 36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '12.65px', letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>
                    Total Investment{quoteOptions?.includeGst ? ' (incl. GST)' : ''}
                  </div>
                  {showDiscount && discountAmount > 0 && (
                    <div style={{ fontSize: '13.8px', color: MUTED, fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>
                      Original: {formatCurrencyDecimal(subtotal)} · Discount: {formatCurrencyDecimal(discountAmount)}
                    </div>
                  )}
                  {quoteOptions?.includeGst && (
                    <div style={{ fontSize: '13.8px', color: MUTED, fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>
                      Base: {formatCurrencyDecimal(baseAmount)} · GST (18%): +{formatCurrencyDecimal(gstAmount)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '46px',
                    fontWeight: 400,
                    color: BROWN,
                    fontStyle: 'italic',
                    lineHeight: 1,
                  }}>
                    {formatCurrencyDecimal(displayTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 footer */}
          <div style={{
            padding: '32px 64px 24px',
            marginTop: '40px',
            borderTop: `1px solid ${CREAM_DEEP}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {studio.logo_url ? (
                <img
                  src={studio.logo_url}
                  alt={studio.name}
                  crossOrigin="anonymous"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${CREAM_DEEP}` }}
                />
              ) : (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: GOLD_FAINT, border: `1px solid rgba(176,125,90,0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
              <span style={{ fontSize: '12.65px', color: MUTED, fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>{studio.name}</span>
            </div>
            <span style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif', opacity: 0.6 }}>
              {quoteNumber} · SnapQuote
            </span>
          </div>

          <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — PORTFOLIO / GALLERY (visual grid)
      ═══════════════════════════════════════════════════════════ */}
      {quoteOptions?.showPortfolio !== false && <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : CREAM,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />

        {/* Corner botanicals */}
        <div style={{ position: 'absolute', bottom: 120, left: -10, opacity: 0.18 }}>
          <LeafBranch size={180} color={GOLD} opacity={1} />
        </div>
        <div style={{ position: 'absolute', bottom: 120, right: -10, opacity: 0.18 }}>
          <LeafBranch mirror size={180} color={GOLD} opacity={1} />
        </div>

        <div style={{ padding: '52px 64px 0', flex: 1 }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ fontSize: '12.65px', letterSpacing: '0.22em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
              Our Portfolio
            </div>
            <div style={{
              fontSize: '41.4px',
              fontWeight: 400,
              color: BROWN,
              fontStyle: 'italic',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}>
              Captured Moments
            </div>
            <OrnamentDivider color={GOLD} width={280} />
          </div>

          {quoteOptions?.includeSignature && (
            <div style={{ padding: '32px 56px', borderTop: `1px solid rgba(176,125,90,0.2)`, marginTop: '32px' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, marginBottom: '20px' }}>
                Customer Approval
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div>
                    <div style={{ width: '220px', height: '1px', background: 'rgba(176,125,90,0.2)', marginBottom: '6px', marginTop: '32px' }} />
                    <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.08em' }}>Customer Signature</div>
                  </div>
                </div>
                {lead && (
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '14.95px', fontWeight: 600, color: BROWN, marginBottom: '2px' }}>{lead.full_name}</div>
                    {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                      <div>
                        <div style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                        {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                          <div key={e.id} style={{ fontSize: '12.65px', color: MUTED, marginBottom: '1px' }}>
                            {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                          </div>
                        ))}
                      </div>
                    ) : lead.event_date ? (
                      <div>
                        <div style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                        <div style={{ fontSize: '12.65px', color: MUTED }}>{formatEventDate(lead.event_date)}</div>
                      </div>
                    ) : null}
                    <div style={{ height: '1px', background: 'rgba(176,125,90,0.2)', marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                    <div style={{ fontSize: '11.5px', color: MUTED }}>Name &amp; Date</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo grid — real portfolio images or placeholder grid */}
          {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 ? (() => {
            const imgs = studio.portfolio_images!.slice(0, 8);
            const count = imgs.length;

            function imgCell(img: { url: string; caption: string }, colSpan?: number) {
              return (
                <div key={img.url} style={{
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: `1px solid rgba(176,125,90,0.2)`,
                  background: '#f8f4ef',
                  gridColumn: colSpan ? `span ${colSpan}` : undefined,
                  height: '200px',
                }}>
                  <img
                    src={img.url}
                    alt={img.caption || 'Portfolio'}
                    crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {img.caption && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(0deg, rgba(61,43,31,0.65) 0%, transparent 100%)',
                      padding: '18px 10px 8px',
                      fontSize: '11.5px', color: 'rgba(255,255,255,0.85)',
                      letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif',
                      textTransform: 'uppercase', textAlign: 'center',
                    }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              );
            }

            if (count === 1) {
              return <div style={{ borderRadius: '2px', overflow: 'hidden', border: `1px solid rgba(176,125,90,0.2)`, background: '#f8f4ef', height: '300px' }}>
                <img src={imgs[0].url} alt={imgs[0].caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>;
            }
            if (count === 2) {
              return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {imgs.map(img => imgCell(img))}
              </div>;
            }
            if (count === 3) {
              return <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(0, 3).map(img => imgCell(img))}
                </div>
              </>;
            }
            if (count === 4) {
              return <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(0, 2).map(img => imgCell(img))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {imgs.slice(2, 4).map(img => imgCell(img))}
                </div>
              </>;
            }
            if (count === 5) {
              return <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(0, 3).map(img => imgCell(img))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {imgs.slice(3, 5).map(img => imgCell(img))}
                </div>
              </>;
            }
            if (count === 6) {
              return <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(0, 3).map(img => imgCell(img))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {imgs.slice(3, 6).map(img => imgCell(img))}
                </div>
              </>;
            }
            if (count === 7) {
              return <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(0, 3).map(img => imgCell(img))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {imgs.slice(3, 5).map(img => imgCell(img))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  {imgs.slice(5, 7).map(img => imgCell(img))}
                </div>
              </>;
            }
            return <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {imgs.slice(0, 3).map(img => imgCell(img))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {imgs.slice(3, 5).map(img => imgCell(img))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {imgs.slice(5, 8).map(img => imgCell(img))}
              </div>
            </>;
          })() : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Bridal Portrait', tint: '#D4B898' },
                  { label: 'Wedding Ceremony', tint: '#C8A882' },
                  { label: 'Couple Session', tint: '#BE9C72' },
                ].map((cell) => (
                  <div key={cell.label} style={{
                    height: '220px',
                    background: `linear-gradient(135deg, ${cell.tint} 0%, ${CREAM_DEEP} 100%)`,
                    borderRadius: '2px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    border: `1px solid rgba(176,125,90,0.2)`,
                  }}>
                    <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '1px' }} />
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', letterSpacing: '0.1em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
                      {cell.label}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Reception Evening', tint: '#BF9D80' },
                  { label: 'Drone Aerial', tint: '#C6A070' },
                ].map((cell) => (
                  <div key={cell.label} style={{
                    height: '200px',
                    background: `linear-gradient(135deg, ${cell.tint} 0%, ${CREAM_DEEP} 100%)`,
                    borderRadius: '2px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    border: `1px solid rgba(176,125,90,0.2)`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '1px' }} />
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', letterSpacing: '0.1em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
                      {cell.label}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                {[
                  { label: 'Engagement', tint: '#BE9870' },
                  { label: 'Family Portraits', tint: '#C4A278' },
                ].map((cell) => (
                  <div key={cell.label} style={{
                    height: '180px',
                    background: `linear-gradient(135deg, ${cell.tint} 0%, ${CREAM_DEEP} 100%)`,
                    borderRadius: '2px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    border: `1px solid rgba(176,125,90,0.2)`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '1px' }} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '8px', letterSpacing: '0.1em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
                      {cell.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Page 3 footer / contact */}
        <div style={{
          margin: '40px 64px 0',
          padding: '28px 36px',
          background: `linear-gradient(135deg, ${CREAM_DARK} 0%, ${CREAM_DEEP} 100%)`,
          border: `1px solid rgba(176,125,90,0.35)`,
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12.65px', letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED, fontFamily: 'Arial, sans-serif', marginBottom: '6px' }}>
              Contact Us
            </div>
            <div style={{ fontSize: '18.4px', fontWeight: 600, color: BROWN, marginBottom: '4px' }}>{studio.name}</div>
            {studio.phone && <div style={{ fontSize: '13.8px', color: BROWN_LIGHT, fontFamily: 'Arial, sans-serif' }}>{studio.phone}</div>}
            {studio.email && <div style={{ fontSize: '13.8px', color: BROWN_LIGHT, fontFamily: 'Arial, sans-serif' }}>{studio.email}</div>}
            {studio.address && <div style={{ fontSize: '12.65px', color: MUTED, fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>{studio.address.replace(/\n/g, ', ')}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            {studio.website && (
              <div style={{ fontSize: '16.1px', fontWeight: 600, color: BROWN, fontStyle: 'italic' }}>
                {studio.website.replace(/^https?:\/\//, '')}
              </div>
            )}
            {studio.gst_number && (
              <div style={{ fontSize: '12.65px', color: MUTED, marginTop: '4px', fontFamily: 'Arial, sans-serif' }}>
                GST: {studio.gst_number}
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <OrnamentDivider color={GOLD} width={120} />
            </div>
          </div>
        </div>

        {/* Final footer */}
        <div style={{
          padding: '20px 64px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {studio.logo_url ? (
              <img
                src={studio.logo_url}
                alt={studio.name}
                crossOrigin="anonymous"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${CREAM_DEEP}` }}
              />
            ) : (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: GOLD_FAINT, border: `1px solid rgba(176,125,90,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: '13.8px', fontStyle: 'italic', color: BROWN }}>{studio.name}</div>
              <div style={{ fontSize: '11.5px', color: MUTED, fontFamily: 'Arial, sans-serif' }}>
                {studio.owner_name ? `by ${studio.owner_name}` : 'Photography & Cinematography'}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: MUTED, fontFamily: 'Arial, sans-serif', letterSpacing: '0.08em' }}>
              {quoteNumber} · {today}
            </div>
            <div style={{ fontSize: '10.35px', color: 'rgba(156,120,96,0.5)', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
              Powered by SnapQuote
            </div>
          </div>
        </div>

        {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(176,125,90,0.2)` }}>
            <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BROWN, marginBottom: '12px' }}>
              What You Get
            </div>
            <div style={{ height: '1px', background: 'rgba(176,125,90,0.2)', marginBottom: '14px' }} />
            {quoteOptions.packageDeliverables.map((pkg) => (
              <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: MUTED, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                  {pkg.packageName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkg.deliverables.map((deliverable, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: MUTED, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                      <span>{deliverable}</span>
                    </div>
                  ))}
                </div>
                {pkg.terms && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid rgba(176,125,90,0.2)` }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                      Terms &amp; Conditions
                    </div>
                    <div style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
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
            <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(176,125,90,0.2)` }}>
              <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BROWN, marginBottom: '12px' }}>
                Deliverables
              </div>
              <div style={{ height: '1px', background: 'rgba(176,125,90,0.2)', marginBottom: '14px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {deliverablesItems.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: MUTED, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(176,125,90,0.2)`, marginTop: '0' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, marginBottom: '14px' }}>
              Payment Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
              {studio.payment_details.account_holder && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Holder</div>
                  <div style={{ fontSize: '13.8px', color: BROWN }}>{studio.payment_details.account_holder}</div>
                </div>
              )}
              {studio.payment_details.bank_name && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Bank</div>
                  <div style={{ fontSize: '13.8px', color: BROWN }}>{studio.payment_details.bank_name}</div>
                </div>
              )}
              {studio.payment_details.account_number && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Number</div>
                  <div style={{ fontSize: '13.8px', color: BROWN, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                </div>
              )}
              {studio.payment_details.ifsc_code && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>IFSC Code</div>
                  <div style={{ fontSize: '13.8px', color: BROWN }}>{studio.payment_details.ifsc_code}</div>
                </div>
              )}
              {studio.payment_details.upi_id && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>UPI ID</div>
                  <div style={{ fontSize: '13.8px', color: BROWN }}>{studio.payment_details.upi_id}</div>
                </div>
              )}
            </div>
            {studio.payment_details.notes && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid rgba(176,125,90,0.2)` }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
              </div>
            )}
          </div>
        )}

        {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(176,125,90,0.2)` }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, marginBottom: '12px' }}>
              Terms &amp; Conditions
            </div>
            <div style={{ height: '1px', background: 'rgba(176,125,90,0.2)', marginBottom: '14px' }} />
            {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
              <div style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                {studio.terms_and_conditions}
              </div>
            )}
            {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
                {quoteOptions.additionalTerms.map((term, idx) => (
                  <div key={idx} style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.8' }}>
                    • {term}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent)` }} />
      </div>}
    </div>
  );
}
