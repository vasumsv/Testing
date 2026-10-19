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

const BG = '#050508';
const AMBER = '#F5A623';
const AMBER_LIGHT = '#FFB940';
const AMBER_BORDER = 'rgba(245,166,35,0.2)';
const WHITE = '#ffffff';
const IVORY = 'rgba(255,255,255,0.85)';
const MUTED = 'rgba(255,255,255,0.4)';
const FAINT = 'rgba(255,255,255,0.06)';
const PAGE_W = 794;

function LetterboxBar() {
  return <div style={{ height: '20px', background: BG, borderTop: `1px solid ${AMBER_BORDER}` }} />;
}

export function CinematicLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const portfolioImgs = studio.portfolio_images ?? [];

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: `${PAGE_W}px`,
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        color: WHITE,
        lineHeight: 1.5,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — CINEMATIC COVER */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Letterbox top */}
        <div style={{ height: '22px', background: BG, borderBottom: `1px solid ${AMBER_BORDER}` }} />

        {/* Hero image — widescreen 2.39:1 ratio */}
        <div style={{ height: '332px', position: 'relative', overflow: 'hidden' }}>
          {portfolioImgs.length > 0 ? (
            <img
              src={portfolioImgs[0].url}
              alt="Cover"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, #0a0a15 0%, #151528 100%)` }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,5,8,0.7) 0%, transparent 50%, rgba(5,5,8,0.5) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.2) 40%, transparent 70%)' }} />

          {/* Studio badge top-left */}
          <div style={{ position: 'absolute', top: 20, left: 28, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {studio.logo_url ? (
              <img src={studio.logo_url} alt={studio.name} crossOrigin="anonymous" style={{ height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
            ) : (
              <span style={{ fontSize: '14.95px', fontWeight: 700, color: WHITE, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>{studio.name}</span>
            )}
          </div>

          {/* Quote number top-right */}
          <div style={{ position: 'absolute', top: 20, right: 28 }}>
            <span style={{ fontSize: '12.65px', color: AMBER, letterSpacing: '0.15em', opacity: 0.8 }}>{quoteNumber}</span>
          </div>

          {/* Bottom title */}
          <div style={{ position: 'absolute', bottom: 24, left: 28, right: 28 }}>
            <div style={{ fontSize: '12.65px', color: AMBER, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.8 }}>
              {quoteOptions?.serviceName || 'Photography & Cinematography'}
            </div>
            <h1 style={{ fontSize: '59.8px', fontWeight: 900, color: WHITE, margin: 0, lineHeight: 0.9, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
              {studio.name || 'STUDIO'}
            </h1>
          </div>
        </div>

        {/* Letterbox bottom */}
        <LetterboxBar />

        {/* Client & quote info */}
        <div style={{ padding: '36px 40px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {lead && (
            <div style={{ marginBottom: '40px', padding: '24px', border: `1px solid ${AMBER_BORDER}`, background: FAINT}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: AMBER, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.7 }}>Prepared For</div>
                  <div style={{ fontSize: '29.9px', fontWeight: 700, color: WHITE }}>{lead.full_name}</div>
                  {lead.event_type && (
                    <div style={{ fontSize: '14.95px', color: AMBER, marginTop: '6px', opacity: 0.8 }}>{lead.event_type}</div>
                  )}
                  {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '10.35px', color: AMBER, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '3px', opacity: 0.7 }}>Events</div>
                      {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                        <div key={e.id} style={{ fontSize: '14.95px', color: AMBER, opacity: 0.8, marginBottom: '2px' }}>
                          {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                        </div>
                      ))}
                    </div>
                  ) : lead.event_date ? (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '10.35px', color: AMBER, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '3px', opacity: 0.7 }}>Event Date</div>
                      <div style={{ fontSize: '14.95px', color: AMBER, opacity: 0.8 }}>{formatEventDate(lead.event_date)}</div>
                    </div>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Quote Date</div>
                  <div style={{ fontSize: '14.95px', color: IVORY }}>{today}</div>
                </div>
              </div>
            </div>
          )}

          {/* Packages */}
          {packageHeaders.map(pkg => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{ marginBottom: '16px', borderLeft: `3px solid ${AMBER}`, paddingLeft: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: pkgItems.length > 0 ? '10px' : '0' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: AMBER, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.7 }}>Package</div>
                    <div style={{ fontSize: '20.7px', fontWeight: 700, color: WHITE }}>{pkg.name}</div>
                  </div>
                  <div style={{ fontSize: '25.3px', fontWeight: 700, color: AMBER_LIGHT }}>{formatCurrencyDecimal(pkg.price)}</div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ fontSize: '13.8px', color: MUTED, display: 'flex', justifyContent: 'space-between' }}>
                        <span>▸ {inc.name}</span>
                        {inc.price > 0 && <span>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${AMBER_BORDER}` }}>Services</div>
              {standaloneServices.map((svc, i) => (
                <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < standaloneServices.length - 1 ? `1px solid ${FAINT}` : 'none' }}>
                  <span style={{ fontSize: '16.1px', color: IVORY }}>{svc.name}</span>
                  <span style={{ fontSize: '16.1px', fontWeight: 700, color: AMBER_LIGHT }}>{formatCurrencyDecimal(svc.price)}</span>
                </div>
              ))}
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: MUTED, fontStyle: 'italic' }}>No services selected</div>
          )}


          {/* Total */}
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${AMBER_BORDER}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14.95px', color: MUTED }}>
              <span>Subtotal</span><span>{formatCurrencyDecimal(subtotal)}</span>
            </div>
            {showDiscount && discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14.95px', color: AMBER }}>
                <span>Discount</span><span>−{formatCurrencyDecimal(discountAmount)}</span>
              </div>
            )}
            {quoteOptions?.includeGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14.95px', color: MUTED }}>
                <span>GST (18%)</span><span>+{formatCurrencyDecimal(gstAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '12px', borderTop: `1px solid ${AMBER_BORDER}` }}>
              <span style={{ fontSize: '12.65px', color: MUTED, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Total Investment{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
              <span style={{ fontSize: '43.7px', fontWeight: 900, color: AMBER_LIGHT, letterSpacing: '-0.02em' }}>{formatCurrencyDecimal(displayTotal)}</span>
            </div>
          </div>
        </div>

        {/* Portfolio filmstrip preview */}
        {portfolioImgs.length > 0 && (
          <>
            <LetterboxBar />
            <div style={{ padding: '0' }}>
              <div style={{ display: 'flex', gap: '3px', overflow: 'hidden' }}>
                {portfolioImgs.slice(0, 5).map(img => (
                  <div key={img.url} style={{ flex: 1, height: '100px', overflow: 'hidden', position: 'relative' }}>
                    <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                  </div>
                ))}
              </div>
            </div>
            <LetterboxBar />
          </>
        )}

        {/* Bottom info bar */}
        <div style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${FAINT}` }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {studio.phone && <span style={{ fontSize: '12.65px', color: MUTED }}>{studio.phone}</span>}
            {studio.email && <span style={{ fontSize: '12.65px', color: MUTED }}>{studio.email}</span>}
          </div>
          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>SnapQuote</span>
        </div>
      </div>

      {/* PAGE 2 — OUR PORTFOLIO */}
      {quoteOptions?.showPortfolio !== false && portfolioImgs.length > 0 && (
        <div style={{
          minHeight: `${Math.round(PAGE_W * 1.414)}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Cinematic header bar */}
          <div style={{ height: '22px', background: BG, borderBottom: `1px solid ${AMBER_BORDER}` }} />

          {/* Hero image for portfolio page */}
          {portfolioImgs[0] && (
            <div style={{ height: '280px', position: 'relative', overflow: 'hidden' }}>
              <img src={portfolioImgs[0].url} alt="Portfolio" crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(5,5,8,0.97) 0%, rgba(5,5,8,0.3) 60%, transparent 100%)' }} />
              <div style={{ position: 'absolute', bottom: 32, left: 40 }}>
                <div style={{ fontSize: '12.65px', color: AMBER, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>Our Work</div>
                <h2 style={{ fontSize: '59.8px', fontWeight: 900, color: WHITE, margin: 0, letterSpacing: '-0.03em', lineHeight: 0.9, textTransform: 'uppercase' }}>Portfolio</h2>
              </div>
              <div style={{ position: 'absolute', bottom: 32, right: 40, textAlign: 'right' }}>
                <span style={{ fontSize: '13.8px', color: MUTED }}>{studio.name}</span>
              </div>
            </div>
          )}

          <LetterboxBar />

          {/* Portfolio grid */}
          <div style={{ padding: '32px 40px', flex: 1 }}>
            {(() => {
              const imgs = portfolioImgs.slice(0, 9);
              const cols = imgs.length <= 2 ? imgs.length : imgs.length <= 4 ? 2 : 3;
              const rows: typeof imgs[] = [];
              for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
              return rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px', marginBottom: '4px' }}>
                  {row.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', position: 'relative', border: `1px solid ${AMBER_BORDER}`, background: '#0a0a0f', height: '200px' }}>
                      <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }} />
                      {img.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(5,5,8,0.85) 0%, transparent 100%)', padding: '20px 10px 8px', fontSize: '11.5px', color: AMBER, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>{img.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          {quoteOptions?.includeSignature && (
            <div style={{ padding: '32px 40px', borderTop: `1px solid ${AMBER_BORDER}`, marginTop: '32px' }}>
              <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, marginBottom: '20px' }}>
                Customer Approval
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div>
                    <div style={{ width: '220px', height: '1px', background: AMBER_BORDER, marginBottom: '6px', marginTop: '32px' }} />
                    <div style={{ fontSize: '11.5px', color: MUTED, letterSpacing: '0.08em' }}>Customer Signature</div>
                  </div>
                </div>
                {lead && (
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '14.95px', fontWeight: 600, color: WHITE, marginBottom: '2px' }}>{lead.full_name}</div>
                    {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                      <div>
                        <div style={{ fontSize: '10.35px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Events</div>
                        {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                          <div key={e.id} style={{ fontSize: '12.65px', color: MUTED, marginBottom: '2px' }}>
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
                    <div style={{ height: '1px', background: AMBER_BORDER, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                    <div style={{ fontSize: '11.5px', color: MUTED }}>Name &amp; Date</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${AMBER_BORDER}` }}>
              <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: '12px' }}>
                What You Get
              </div>
              <div style={{ height: '1px', background: AMBER_BORDER, marginBottom: '14px' }} />
              {quoteOptions.packageDeliverables.map((pkg) => (
                <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14.95px', fontWeight: 700, color: MUTED, marginBottom: '6px' }}>
                    {pkg.packageName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {pkg.deliverables.map((deliverable, idx) => (
                      <div key={idx} style={{ fontSize: '13.8px', color: IVORY, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ marginTop: '1px', flexShrink: 0 }}>▸</span>
                        <span>{deliverable}</span>
                      </div>
                    ))}
                  </div>
                  {pkg.terms && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${AMBER_BORDER}` }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: AMBER, opacity: 0.7, marginBottom: '6px' }}>
                        Terms &amp; Conditions
                      </div>
                      <div style={{ fontSize: '12.65px', color: IVORY, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
              <div style={{ padding: '28px 40px', borderTop: `1px solid ${AMBER_BORDER}` }}>
                <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: '12px' }}>
                  Deliverables
                </div>
                <div style={{ height: '1px', background: AMBER_BORDER, marginBottom: '14px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {deliverablesItems.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: IVORY, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${AMBER_BORDER}`, marginTop: '0' }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, marginBottom: '14px' }}>
                Payment Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
                {studio.payment_details.account_holder && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Holder</div>
                    <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.account_holder}</div>
                  </div>
                )}
                {studio.payment_details.bank_name && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Bank</div>
                    <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.bank_name}</div>
                  </div>
                )}
                {studio.payment_details.account_number && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>Account Number</div>
                    <div style={{ fontSize: '13.8px', color: IVORY, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                  </div>
                )}
                {studio.payment_details.ifsc_code && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>IFSC Code</div>
                    <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.ifsc_code}</div>
                  </div>
                )}
                {studio.payment_details.upi_id && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '3px' }}>UPI ID</div>
                    <div style={{ fontSize: '13.8px', color: IVORY }}>{studio.payment_details.upi_id}</div>
                  </div>
                )}
              </div>
              {studio.payment_details.notes && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${AMBER_BORDER}` }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '12.65px', color: MUTED, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
                </div>
              )}
            </div>
          )}

          {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${AMBER_BORDER}` }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: AMBER, opacity: 0.7, marginBottom: '12px' }}>
                Terms &amp; Conditions
              </div>
              <div style={{ height: '1px', background: AMBER_BORDER, marginBottom: '14px' }} />
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

          <LetterboxBar />

          {/* Bottom info */}
          <div style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${FAINT}` }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {studio.phone && <span style={{ fontSize: '12.65px', color: MUTED }}>{studio.phone}</span>}
              {studio.email && <span style={{ fontSize: '12.65px', color: MUTED }}>{studio.email}</span>}
            </div>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>SnapQuote</span>
          </div>
        </div>
      )}
    </div>
  );
}
