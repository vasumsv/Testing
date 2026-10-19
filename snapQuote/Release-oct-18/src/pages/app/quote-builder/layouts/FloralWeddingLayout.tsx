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

const BLUSH = '#FDF0F3';
const BLUSH2 = '#FAD7E0';
const ROSE = '#C06080';
const ROSE_LIGHT = '#E08CA8';
const ROSE_DARK = '#8B3A54';
const DUSTY = '#9B6B7E';
const MAUVE = '#D4A0B0';
const MAUVE_FAINT = 'rgba(212,160,176,0.15)';
const BROWN_DARK = '#3A2030';
const PAGE_W = 794;

function Petal({ x = 0, y = 0, r = 0, size = 20, color = ROSE_LIGHT, opacity = 0.3 }: { x?: number; y?: number; r?: number; size?: number; color?: string; opacity?: number }) {
  return (
    <ellipse cx={x} cy={y} rx={size * 0.4} ry={size} fill={color} opacity={opacity} transform={`rotate(${r} ${x} ${y})`} />
  );
}

function FloralCircle({ size = 80, color = ROSE_LIGHT, opacity = 0.2 }: { size?: number; color?: string; opacity?: number }) {
  const petals = 8;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" fill={color} style={{ opacity }}>
      {Array.from({ length: petals }, (_, i) => {
        const angle = (i * 360) / petals;
        return <Petal key={i} x={0} y={-28} r={angle} size={22} color={color} opacity={1} />;
      })}
      <circle cx="0" cy="0" r="8" fill={color} />
    </svg>
  );
}

function FloralDivider({ width = 300 }: { width?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: `${width}px`, margin: '0 auto' }}>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${MAUVE})` }} />
      <FloralCircle size={20} color={ROSE} opacity={0.5} />
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${MAUVE}, transparent)` }} />
    </div>
  );
}

export function FloralWeddingLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : BLUSH,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        color: BROWN_DARK,
        lineHeight: 1.6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — COVER */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: `linear-gradient(160deg, ${BLUSH} 0%, ${BLUSH2} 55%, #F2C0CC 100%)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${ROSE_LIGHT}, ${ROSE}, ${ROSE_LIGHT}, transparent)` }} />

        {/* Decorative floral corners */}
        <div style={{ position: 'absolute', top: -20, left: -20, opacity: 0.18 }}>
          <FloralCircle size={180} color={ROSE} opacity={1} />
        </div>
        <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.18 }}>
          <FloralCircle size={160} color={ROSE_DARK} opacity={1} />
        </div>
        <div style={{ position: 'absolute', bottom: 80, right: -20, opacity: 0.12 }}>
          <FloralCircle size={200} color={ROSE} opacity={1} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 80px 60px', zIndex: 1 }}>
          {/* Logo */}
          {studio.logo_url ? (
            <img
              src={studio.logo_url}
              alt={studio.name}
              crossOrigin="anonymous"
              style={{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '36px' }}
            />
          ) : (
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              border: `2px solid rgba(192,96,128,0.3)`, background: 'rgba(192,96,128,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '36px',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ROSE} strokeWidth="0.8" opacity={0.5}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '12.65px', letterSpacing: '0.3em', textTransform: 'uppercase', color: DUSTY, marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
              with love & artistry
            </div>
            <h1 style={{ fontSize: '52.9px', fontWeight: 400, color: ROSE_DARK, margin: 0, lineHeight: 1.1, fontStyle: 'italic' }}>
              {studio.name || 'Studio Name'}
            </h1>
            {studio.owner_name && (
              <p style={{ fontSize: '17.25px', color: DUSTY, margin: '10px 0 0', fontFamily: 'Arial, sans-serif' }}>
                {studio.owner_name}
              </p>
            )}
          </div>

          <FloralDivider width={300} />

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '13.8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
              Quotation
            </div>
            <div style={{ fontSize: '23px', color: ROSE_DARK, fontStyle: 'italic' }}>{quoteNumber}</div>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginTop: '8px', marginBottom: '3px', opacity: 0.7 }}>Quote Date</div>
            <div style={{ fontSize: '14.95px', color: DUSTY, fontFamily: 'Arial, sans-serif' }}>{today}</div>
          </div>

          {lead && (
            <div style={{
              marginTop: '52px', padding: '24px 40px',
              background: 'rgba(192,96,128,0.07)', border: `1px solid rgba(192,96,128,0.25)`,
              textAlign: 'center', width: '100%', maxWidth: '440px',
              borderRadius: '2px',
            }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
                Prepared For
              </div>
              <div style={{ fontSize: '25.3px', color: ROSE_DARK, fontStyle: 'italic' }}>{lead.full_name}</div>
              {lead.event_type && (
                <div style={{ fontSize: '13.8px', color: DUSTY, fontFamily: 'Arial, sans-serif', marginTop: '4px' }}>{lead.event_type}</div>
              )}
              {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '3px', opacity: 0.7 }}>Events</div>
                  {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                    <div key={e.id} style={{ fontSize: '13.8px', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '2px' }}>
                      {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                    </div>
                  ))}
                </div>
              ) : lead.event_date ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10.35px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '3px', opacity: 0.7 }}>Event Date</div>
                  <div style={{ fontSize: '13.8px', color: DUSTY, fontFamily: 'Arial, sans-serif' }}>{formatEventDate(lead.event_date)}</div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 64px', borderTop: `1px solid rgba(192,96,128,0.2)`, display: 'flex', justifyContent: 'space-between' }}>
          {studio.phone && <span style={{ fontSize: '12.65px', color: DUSTY, fontFamily: 'Arial, sans-serif' }}>{studio.phone}</span>}
          {studio.email && <span style={{ fontSize: '12.65px', color: DUSTY, fontFamily: 'Arial, sans-serif' }}>{studio.email}</span>}
        </div>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${ROSE_LIGHT}, ${ROSE}, ${ROSE_LIGHT}, transparent)` }} />
      </div>

      {/* PAGE 2 — PACKAGES & SERVICES */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : BLUSH,
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${ROSE_LIGHT}, transparent)` }} />
        <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.08 }}>
          <FloralCircle size={260} color={ROSE} opacity={1} />
        </div>

        <div style={{ padding: '56px 64px', flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.25em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
              Your Investment
            </div>
            <h2 style={{ fontSize: '36.8px', fontWeight: 400, color: ROSE_DARK, margin: '0 0 16px', fontStyle: 'italic' }}>
              {quoteOptions?.serviceName || 'Packages & Services'}
            </h2>
            <FloralDivider width={260} />
          </div>

          {packageHeaders.map(pkg => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{
                border: `1px solid rgba(192,96,128,0.25)`,
                background: quoteOptions?.backgroundImageUrl ? 'transparent' : MAUVE_FAINT,
                marginBottom: '20px', padding: '24px 28px', borderRadius: '2px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: pkgItems.length > 0 ? '14px' : '0' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '4px' }}>Package</div>
                    <div style={{ fontSize: '20.7px', color: ROSE_DARK, fontStyle: 'italic' }}>{pkg.name}</div>
                  </div>
                  <div style={{ fontSize: '23px', color: ROSE, fontStyle: 'italic' }}>{formatCurrencyDecimal(pkg.price)}</div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ borderTop: `1px solid rgba(192,96,128,0.2)`, paddingTop: '12px' }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif' }}>
                        <span style={{ color: DUSTY }}>✿ &nbsp;{inc.name}</span>
                        {inc.price > 0 && <span style={{ color: ROSE }}>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div style={{ border: `1px solid rgba(192,96,128,0.2)`, background: MAUVE_FAINT, padding: '24px 28px', borderRadius: '2px' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginBottom: '14px' }}>Services</div>
              {standaloneServices.map((svc, i) => (
                <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i > 0 ? `1px solid rgba(192,96,128,0.12)` : 'none' }}>
                  <span style={{ fontSize: '17.25px', color: BROWN_DARK }}>{svc.name}</span>
                  <span style={{ fontSize: '17.25px', color: ROSE, fontStyle: 'italic' }}>{formatCurrencyDecimal(svc.price)}</span>
                </div>
              ))}
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: DUSTY, fontStyle: 'italic', fontSize: '16.1px' }}>No services selected</div>
          )}


          <div style={{ maxWidth: '320px', marginLeft: 'auto', marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: DUSTY }}>
              <span>Subtotal</span><span>{formatCurrencyDecimal(subtotal)}</span>
            </div>
            {showDiscount && discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: ROSE }}>
                <span>Discount</span><span>−{formatCurrencyDecimal(discountAmount)}</span>
              </div>
            )}
            {quoteOptions?.includeGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '14.95px', fontFamily: 'Arial, sans-serif', color: DUSTY }}>
                <span>GST (18%)</span><span>+{formatCurrencyDecimal(gstAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid rgba(192,96,128,0.3)`, marginTop: '6px' }}>
              <span style={{ fontSize: '14.95px', letterSpacing: '0.12em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif' }}>Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
              <span style={{ fontSize: '29.9px', color: ROSE_DARK, fontStyle: 'italic' }}>{formatCurrencyDecimal(displayTotal)}</span>
            </div>
          </div>
        </div>

        {quoteOptions?.includeSignature && (
          <div style={{ padding: '32px 56px', borderTop: `1px solid rgba(192,96,128,0.2)`, marginTop: '32px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: DUSTY, marginBottom: '20px' }}>
              Customer Approval
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div>
                  <div style={{ width: '220px', height: '1px', background: 'rgba(192,96,128,0.2)', marginBottom: '6px', marginTop: '32px' }} />
                  <div style={{ fontSize: '11.5px', color: DUSTY, letterSpacing: '0.08em' }}>Customer Signature</div>
                </div>
              </div>
              {lead && (
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '14.95px', fontWeight: 600, color: BROWN_DARK, marginBottom: '2px' }}>{lead.full_name}</div>
                  {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                    <div>
                      <div style={{ fontSize: '10.35px', color: DUSTY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px', opacity: 0.7 }}>Events</div>
                      {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                        <div key={e.id} style={{ fontSize: '12.65px', color: DUSTY, marginBottom: '1px' }}>
                          {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                        </div>
                      ))}
                    </div>
                  ) : lead.event_date ? (
                    <div>
                      <div style={{ fontSize: '10.35px', color: DUSTY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px', opacity: 0.7 }}>Event Date</div>
                      <div style={{ fontSize: '12.65px', color: DUSTY }}>{formatEventDate(lead.event_date)}</div>
                    </div>
                  ) : null}
                  <div style={{ height: '1px', background: 'rgba(192,96,128,0.2)', marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                  <div style={{ fontSize: '11.5px', color: DUSTY }}>Name &amp; Date</div>
                </div>
              )}
            </div>
          </div>
        )}

        {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
          <div style={{ padding: '40px 64px 0', borderTop: `1px solid rgba(192,96,128,0.2)`, marginTop: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <FloralDivider width={200} />
              <div style={{ fontSize: '12.65px', letterSpacing: '0.2em', textTransform: 'uppercase', color: DUSTY, fontFamily: 'Arial, sans-serif', marginTop: '14px' }}>Our Portfolio</div>
            </div>
            {(() => {
              const imgs = studio.portfolio_images!.slice(0, 6);
              const cols = 3;
              const rows: typeof imgs[] = [];
              for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
              return rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: '8px' }}>
                  {row.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', borderRadius: '2px', border: `1px solid rgba(192,96,128,0.2)`, background: '#fdf7f9', height: '110px' }}>
                      <img src={img.url} alt={img.caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(192,96,128,0.2)` }}>
            <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE_DARK, marginBottom: '12px' }}>
              What You Get
            </div>
            <div style={{ height: '1px', background: 'rgba(192,96,128,0.2)', marginBottom: '14px' }} />
            {quoteOptions.packageDeliverables.map((pkg) => (
              <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: DUSTY, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                  {pkg.packageName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkg.deliverables.map((deliverable, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: DUSTY, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>✿</span>
                      <span>{deliverable}</span>
                    </div>
                  ))}
                </div>
                {pkg.terms && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid rgba(192,96,128,0.2)` }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, opacity: 0.8, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                      Terms &amp; Conditions
                    </div>
                    <div style={{ fontSize: '12.65px', color: DUSTY, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
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
            <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(192,96,128,0.2)` }}>
              <div style={{ fontSize: '13.8px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ROSE_DARK, marginBottom: '12px' }}>
                Deliverables
              </div>
              <div style={{ height: '1px', background: 'rgba(192,96,128,0.2)', marginBottom: '14px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {deliverablesItems.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: DUSTY, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(192,96,128,0.2)`, marginTop: '0' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DUSTY, marginBottom: '14px' }}>
              Payment Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
              {studio.payment_details.account_holder && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '3px' }}>Account Holder</div>
                  <div style={{ fontSize: '13.8px', color: BROWN_DARK }}>{studio.payment_details.account_holder}</div>
                </div>
              )}
              {studio.payment_details.bank_name && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '3px' }}>Bank</div>
                  <div style={{ fontSize: '13.8px', color: BROWN_DARK }}>{studio.payment_details.bank_name}</div>
                </div>
              )}
              {studio.payment_details.account_number && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '3px' }}>Account Number</div>
                  <div style={{ fontSize: '13.8px', color: BROWN_DARK, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                </div>
              )}
              {studio.payment_details.ifsc_code && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '3px' }}>IFSC Code</div>
                  <div style={{ fontSize: '13.8px', color: BROWN_DARK }}>{studio.payment_details.ifsc_code}</div>
                </div>
              )}
              {studio.payment_details.upi_id && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '3px' }}>UPI ID</div>
                  <div style={{ fontSize: '13.8px', color: BROWN_DARK }}>{studio.payment_details.upi_id}</div>
                </div>
              )}
            </div>
            {studio.payment_details.notes && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid rgba(192,96,128,0.2)` }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DUSTY, marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '12.65px', color: DUSTY, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
              </div>
            )}
          </div>
        )}

        {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
          <div style={{ padding: '28px 64px', borderTop: `1px solid rgba(192,96,128,0.2)` }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: DUSTY, opacity: 0.8, marginBottom: '12px' }}>
              Terms &amp; Conditions
            </div>
            <div style={{ height: '1px', background: 'rgba(192,96,128,0.2)', marginBottom: '14px' }} />
            {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
              <div style={{ fontSize: '12.65px', color: DUSTY, lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                {studio.terms_and_conditions}
              </div>
            )}
            {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
                {quoteOptions.additionalTerms.map((term, idx) => (
                  <div key={idx} style={{ fontSize: '12.65px', color: DUSTY, lineHeight: '1.8' }}>
                    • {term}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '20px 64px', borderTop: `1px solid rgba(192,96,128,0.2)`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12.65px', color: DUSTY, fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>{studio.name}</span>
          <span style={{ fontSize: '11.5px', color: DUSTY, fontFamily: 'Arial, sans-serif', opacity: 0.5 }}>{quoteNumber} · SnapQuote</span>
        </div>
        <div style={{ height: '4px', background: `linear-gradient(90deg, transparent, ${ROSE_LIGHT}, transparent)` }} />
      </div>
    </div>
  );
}
