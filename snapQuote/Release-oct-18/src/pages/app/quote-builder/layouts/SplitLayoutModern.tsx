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

const DARK = '#12121E';
const DARK2 = '#1C1C2E';
const GOLD = '#E8C97A';
const GOLD_FAINT = 'rgba(232,201,122,0.12)';
const GOLD_BORDER = 'rgba(232,201,122,0.25)';
const WHITE = '#ffffff';
const OFF_WHITE = '#F8F8F8';
const MUTED = '#888899';
const BORDER = '#E0E0E8';
const PAGE_W = 794;
const PANEL_W = 280;

export function SplitLayoutModern({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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

  const portfolioImgs = studio.portfolio_images ?? [];

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: `${PAGE_W}px`,
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        color: DARK,
        lineHeight: 1.5,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — SPLIT COVER */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        display: 'flex',
        position: 'relative',
      }}>
        {/* LEFT PANEL — dark with portfolio image */}
        <div style={{
          width: `${PANEL_W}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : DARK,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {portfolioImgs.length > 0 && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <img
                src={portfolioImgs[0].url}
                alt="Cover"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
              />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${DARK2} 0%, rgba(18,18,30,0.7) 100%)` }} />

          {/* Gold accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${GOLD}, rgba(232,201,122,0.3))` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${GOLD}, rgba(232,201,122,0.3))` }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1, padding: '40px 28px 0' }}>
            {studio.logo_url ? (
              <img src={studio.logo_url} alt={studio.name} crossOrigin="anonymous" style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: `1px solid ${GOLD_BORDER}`, background: GOLD_FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            )}
          </div>

          {/* Studio info at bottom */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', padding: '0 28px 40px' }}>
            <div style={{ width: '40px', height: '1px', background: GOLD, marginBottom: '20px', opacity: 0.5 }} />
            <div style={{ fontSize: '18.4px', fontWeight: 700, color: WHITE, marginBottom: '8px' }}>{studio.name || 'Studio Name'}</div>
            {studio.owner_name && <div style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>{studio.owner_name}</div>}
            {studio.phone && <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>{studio.phone}</div>}
            {studio.email && <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px', wordBreak: 'break-all' }}>{studio.email}</div>}
            {studio.website && <div style={{ fontSize: '12.65px', color: GOLD, opacity: 0.7, marginTop: '8px' }}>{studio.website.replace(/^https?:\/\//, '')}</div>}
          </div>
        </div>

        {/* RIGHT PANEL — white content */}
        <div style={{ flex: 1, background: WHITE, display: 'flex', flexDirection: 'column', padding: '64px 48px' }}>
          {/* Quote metadata */}
          <div style={{ marginBottom: '56px' }}>
            <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Exclusive Quotation
            </div>
            <div style={{ fontSize: '41.4px', fontWeight: 900, color: DARK, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              {quoteNumber}
            </div>
            <div style={{ width: '40px', height: '3px', background: GOLD}} />
            <div style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '12px', marginBottom: '3px' }}>Quote Date</div>
            <div style={{ fontSize: '14.95px', color: MUTED }}>{today}</div>
          </div>

          {/* Client */}
          {lead && (
            <div style={{ marginBottom: '48px', paddingBottom: '36px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Prepared For</div>
              <div style={{ fontSize: '27.6px', fontWeight: 700, color: DARK, marginBottom: '8px' }}>{lead.full_name}</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {lead.phone && <span style={{ fontSize: '14.95px', color: MUTED }}>{lead.phone}</span>}
                {lead.email && <span style={{ fontSize: '14.95px', color: MUTED }}>{lead.email}</span>}
                {(lead.event_type || (quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) || lead.event_date) && (
                  <>
                    {lead.event_type && (
                      <span style={{ fontSize: '12.65px', fontWeight: 700, color: DARK, background: '#F0F0F0', padding: '2px 10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {lead.event_type}
                      </span>
                    )}
                    {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1px' }}>Events</span>
                        {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                          <span key={e.id} style={{ fontSize: '12.65px', color: MUTED }}>
                            {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                          </span>
                        ))}
                      </div>
                    ) : lead.event_date ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</span>
                        <span style={{ fontSize: '12.65px', color: MUTED }}>{formatEventDate(lead.event_date)}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Services summary */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Investment Summary</div>

            {packageHeaders.map(pkg => {
              const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
              return (
                <div key={pkg.id} style={{ marginBottom: '16px', padding: '16px 20px', background: OFF_WHITE, borderLeft: `3px solid ${GOLD}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pkgItems.length > 0 ? '10px' : '0' }}>
                    <span style={{ fontSize: '17.25px', fontWeight: 700, color: DARK }}>{pkg.name}</span>
                    <span style={{ fontSize: '18.4px', fontWeight: 700, color: DARK }}>{formatCurrencyDecimal(pkg.price)}</span>
                  </div>
                  {pkgItems.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {pkgItems.map(inc => (
                        <div key={inc.id} style={{ fontSize: '13.8px', color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
                          <span>· {inc.name}</span>
                          {inc.price > 0 && <span>{formatCurrencyDecimal(inc.price)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {standaloneServices.map(svc => (
              <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, fontSize: '16.1px' }}>
                <span style={{ color: DARK }}>{svc.name}</span>
                <span style={{ fontWeight: 700, color: DARK }}>{formatCurrencyDecimal(svc.price)}</span>
              </div>
            ))}

            {enabledItems.length === 0 && (
              <div style={{ color: MUTED, fontStyle: 'italic', padding: '24px 0' }}>No services selected</div>
            )}
          </div>


          {/* Totals */}
          <div style={{ borderTop: `2px solid ${DARK}`, paddingTop: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14.95px', color: MUTED }}>
              <span>Subtotal</span><span>{formatCurrencyDecimal(subtotal)}</span>
            </div>
            {showDiscount && discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14.95px', color: GOLD }}>
                <span>Discount</span><span>−{formatCurrencyDecimal(discountAmount)}</span>
              </div>
            )}
            {quoteOptions?.includeGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14.95px', color: MUTED }}>
                <span>GST (18%)</span><span>+{formatCurrencyDecimal(gstAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
              <span style={{ fontSize: '13.8px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
              <span style={{ fontSize: '36.8px', fontWeight: 900, color: DARK, letterSpacing: '-0.02em' }}>{formatCurrencyDecimal(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${GOLD_BORDER}`, marginTop: '32px', background: DARK2}}>
          <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '20px' }}>
            Customer Approval
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div>
                <div style={{ width: '220px', height: '1px', background: GOLD_BORDER, marginBottom: '6px', marginTop: '32px' }} />
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>Customer Signature</div>
              </div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: WHITE, marginBottom: '2px' }}>{lead.full_name}</div>
                {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.55)', marginBottom: '1px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.55)' }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
                <div style={{ height: '1px', background: GOLD_BORDER, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 2 — PORTFOLIO GRID (if images exist) */}
      {quoteOptions?.showPortfolio !== false && portfolioImgs.length > 0 && (
        <div style={{
          minHeight: `${Math.round(PAGE_W * 1.414)}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
          display: 'flex',
        }}>
          {/* Left dark strip */}
          <div style={{ width: `${PANEL_W}px`, background: DARK2, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '56px 28px' }}>
            <div style={{ width: '40px', height: '3px', background: GOLD, marginBottom: '24px' }} />
            <div style={{ fontSize: '25.3px', fontWeight: 700, color: WHITE, lineHeight: 1.2, marginBottom: '16px' }}>Our Portfolio</div>
            <div style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>A selection of our finest work</div>
            <div style={{ marginTop: 'auto', borderTop: `1px solid ${GOLD_BORDER}`, paddingTop: '24px' }}>
              <div style={{ fontSize: '13.8px', color: GOLD, opacity: 0.7 }}>{studio.name}</div>
              {studio.gst_number && <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>GST: {studio.gst_number}</div>}
            </div>
          </div>

          {/* Right portfolio grid */}
          <div style={{ flex: 1, padding: '40px 40px' }}>
            {(() => {
              const imgs = portfolioImgs.slice(0, 8);
              const cols = 2;
              const rows: typeof imgs[] = [];
              for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
              return rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: '8px' }}>
                  {row.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', background: OFF_WHITE, position: 'relative', height: '130px' }}>
                      <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {img.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)', padding: '20px 10px 8px', fontSize: '11.5px', color: WHITE, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' }}>{img.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
        <div style={{ background: DARK2, padding: '32px 48px', borderTop: `1px solid ${GOLD_BORDER}` }}>
          <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: '12px' }}>
            What You Get
          </div>
          <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '14px' }} />
          {quoteOptions.packageDeliverables.map((pkg) => (
            <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14.95px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}>
                {pkg.packageName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {pkg.deliverables.map((deliverable, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>▸</span>
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
              {pkg.terms && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${GOLD_BORDER}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, opacity: 0.7, marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
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
          <div style={{ background: DARK2, padding: '32px 48px', borderTop: `1px solid ${GOLD_BORDER}` }}>
            <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: '12px' }}>
              Deliverables
            </div>
            <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '14px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {deliverablesItems.map((item, idx) => (
                <div key={idx} style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                  <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
        <div style={{ background: DARK2, padding: '28px 48px', borderTop: `1px solid ${GOLD_BORDER}`, marginTop: '0' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, marginBottom: '14px' }}>
            Payment Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {studio.payment_details.account_holder && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Holder</div>
                <div style={{ fontSize: '13.8px', color: WHITE }}>{studio.payment_details.account_holder}</div>
              </div>
            )}
            {studio.payment_details.bank_name && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Bank</div>
                <div style={{ fontSize: '13.8px', color: WHITE }}>{studio.payment_details.bank_name}</div>
              </div>
            )}
            {studio.payment_details.account_number && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Number</div>
                <div style={{ fontSize: '13.8px', color: WHITE, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
              </div>
            )}
            {studio.payment_details.ifsc_code && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>IFSC Code</div>
                <div style={{ fontSize: '13.8px', color: WHITE }}>{studio.payment_details.ifsc_code}</div>
              </div>
            )}
            {studio.payment_details.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>UPI ID</div>
                <div style={{ fontSize: '13.8px', color: WHITE }}>{studio.payment_details.upi_id}</div>
              </div>
            )}
          </div>
          {studio.payment_details.notes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${GOLD_BORDER}` }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
            </div>
          )}
        </div>
      )}

      {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
        <div style={{ background: DARK2, padding: '32px 48px', borderTop: `1px solid ${GOLD_BORDER}` }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, opacity: 0.7, marginBottom: '12px' }}>
            Terms &amp; Conditions
          </div>
          <div style={{ height: '1px', background: GOLD_BORDER, marginBottom: '14px' }} />
          {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
            <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
              {studio.terms_and_conditions}
            </div>
          )}
          {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
              {quoteOptions.additionalTerms.map((term, idx) => (
                <div key={idx} style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8' }}>
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
