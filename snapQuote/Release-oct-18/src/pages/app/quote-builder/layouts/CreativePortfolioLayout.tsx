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

const BG = '#F0F4F8';
const WHITE = '#ffffff';
const DARK = '#1a202c';
const DARK2 = '#2D3748';
const SLATE = '#4A5568';
const ACCENT = '#2D3748';
const BORDER = '#CBD5E0';
const LIGHT_BG = '#EDF2F7';
const PAGE_W = 794;

export function CreativePortfolioLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        color: DARK,
        lineHeight: 1.5,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — IMAGE-FIRST COVER */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Full-width portfolio hero */}
        <div style={{ height: '460px', position: 'relative', overflow: 'hidden', background: DARK}}>
          {portfolioImgs.length > 0 ? (
            <img
              src={portfolioImgs[0].url}
              alt="Hero"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${DARK} 0%, ${DARK2} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(26,32,44,0.9) 0%, rgba(26,32,44,0.2) 60%, transparent 100%)' }} />

          {/* Logo & studio name overlay */}
          <div style={{ position: 'absolute', top: 32, left: 40, display: 'flex', alignItems: 'center', gap: '14px' }}>
            {studio.logo_url ? (
              <img src={studio.logo_url} alt={studio.name} crossOrigin="anonymous" style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            ) : null}
            <span style={{ fontSize: '18.4px', fontWeight: 700, color: WHITE, letterSpacing: '0.05em' }}>{studio.name}</span>
          </div>

          {/* Bottom overlay text */}
          <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40 }}>
            <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {quoteOptions?.serviceName || 'Photography & Cinematography'}
            </div>
            <h1 style={{ fontSize: '46px', fontWeight: 900, color: WHITE, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {lead ? lead.full_name : 'Quotation'}
            </h1>
            {lead?.event_type && (
              <div style={{ fontSize: '16.1px', color: 'rgba(255,255,255,0.65)', marginTop: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{lead.event_type}</div>
            )}
            {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10.35px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3px' }}>Events</div>
                {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                  <div key={e.id} style={{ fontSize: '14.95px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.03em', marginBottom: '2px' }}>
                    {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                  </div>
                ))}
              </div>
            ) : lead?.event_date ? (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10.35px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '3px' }}>Event Date</div>
                <div style={{ fontSize: '14.95px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.03em' }}>{formatEventDate(lead.event_date)}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quote meta strip */}
        <div style={{ padding: '20px 40px', background: DARK2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9.2px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Quote Date</span>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{today}</span>
          </div>
          <div style={{ fontSize: '16.1px', fontWeight: 700, color: WHITE }}>{quoteNumber}</div>
          <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Creative Portfolio Quote</div>
        </div>

        {/* Services */}
        <div style={{ padding: '40px 40px', flex: 1 }}>
          <div style={{ fontSize: '11.5px', color: SLATE, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', paddingBottom: '10px', borderBottom: `2px solid ${DARK}` }}>
            Your Package
          </div>

          {packageHeaders.map(pkg => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{ background: WHITE, padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pkgItems.length > 0 ? '16px' : '0' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: SLATE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Package</div>
                    <div style={{ fontSize: '20.7px', fontWeight: 700, color: DARK }}>{pkg.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '27.6px', fontWeight: 900, color: DARK }}>{formatCurrencyDecimal(pkg.price)}</div>
                  </div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.8px', color: SLATE }}>
                        <div style={{ width: '3px', height: '3px', background: ACCENT, borderRadius: '50%', flexShrink: 0 }} />
                        {inc.name}
                        {inc.price > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: DARK }}>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div style={{ background: WHITE, padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '11.5px', color: SLATE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Services</div>
              {standaloneServices.map((svc, i) => (
                <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < standaloneServices.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: '16.1px', color: DARK }}>{svc.name}</span>
                  <span style={{ fontSize: '16.1px', fontWeight: 700, color: DARK }}>{formatCurrencyDecimal(svc.price)}</span>
                </div>
              ))}
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ background: WHITE, padding: '40px', textAlign: 'center', color: SLATE, fontStyle: 'italic' }}>No services selected</div>
          )}


          {/* Total */}
          <div style={{ background: DARK, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div>
              {showDiscount && discountAmount > 0 && (
                <div style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Subtotal {formatCurrencyDecimal(subtotal)} · Discount −{formatCurrencyDecimal(discountAmount)}
                </div>
              )}
              {quoteOptions?.includeGst && (
                <div style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  GST (18%): +{formatCurrencyDecimal(gstAmount)}
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Total Investment{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</div>
            </div>
            <div style={{ fontSize: '41.4px', fontWeight: 900, color: WHITE, letterSpacing: '-0.02em' }}>{formatCurrencyDecimal(displayTotal)}</div>
          </div>
        </div>

        <div style={{ padding: '14px 40px', background: DARK, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)' }}>{studio.name}</span>
          {studio.phone && <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.3)' }}>{studio.phone}</span>}
          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.25)' }}>{quoteNumber} · SnapQuote</span>
        </div>
      </div>

      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${BORDER}`, marginTop: '32px' }}>
          <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: SLATE, marginBottom: '20px' }}>
            Customer Approval
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div>
                <div style={{ width: '220px', height: '1px', background: BORDER, marginBottom: '6px', marginTop: '32px' }} />
                <div style={{ fontSize: '11.5px', color: SLATE, letterSpacing: '0.08em' }}>Customer Signature</div>
              </div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: DARK, marginBottom: '2px' }}>{lead.full_name}</div>
                {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: SLATE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: SLATE, marginBottom: '1px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: SLATE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: SLATE }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
                <div style={{ height: '1px', background: BORDER, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: SLATE }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 2 — OUR PORTFOLIO */}
      {quoteOptions?.showPortfolio !== false && portfolioImgs.length > 0 && (
        <div style={{
          minHeight: `${Math.round(PAGE_W * 1.414)}px`,
          background: quoteOptions?.backgroundImageUrl ? 'transparent' : BG,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ height: '200px', position: 'relative', overflow: 'hidden', background: DARK2}}>
            {portfolioImgs[0] && (
              <img src={portfolioImgs[0].url} alt="Portfolio header" crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(45,55,72,0.95) 0%, rgba(45,55,72,0.5) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 40, left: 40 }}>
              <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Creative Work</div>
              <h2 style={{ fontSize: '46px', fontWeight: 900, color: WHITE, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>Our Portfolio</h2>
            </div>
            <div style={{ position: 'absolute', bottom: 40, right: 40, textAlign: 'right' }}>
              <div style={{ fontSize: '14.95px', color: 'rgba(255,255,255,0.5)' }}>{studio.name}</div>
            </div>
          </div>

          {/* Grid */}
          <div style={{ padding: '32px 40px', flex: 1 }}>
            {(() => {
              const imgs = portfolioImgs.slice(0, 9);
              const cols = imgs.length <= 2 ? imgs.length : imgs.length <= 4 ? 2 : 3;
              const rows: typeof imgs[] = [];
              for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
              return rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: '8px' }}>
                  {row.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', background: LIGHT_BG, position: 'relative', height: '200px' }}>
                      <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {img.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(26,32,44,0.8) 0%, transparent 100%)', padding: '20px 10px 8px', fontSize: '11.5px', color: WHITE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{img.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${BORDER}`, background: WHITE}}>
              <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DARK, marginBottom: '12px' }}>
                What You Get
              </div>
              <div style={{ height: '1px', background: BORDER, marginBottom: '14px' }} />
              {quoteOptions.packageDeliverables.map((pkg) => (
                <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '14.95px', fontWeight: 700, color: SLATE, marginBottom: '6px' }}>
                    {pkg.packageName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {pkg.deliverables.map((deliverable, idx) => (
                      <div key={idx} style={{ fontSize: '13.8px', color: SLATE, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                        <span>{deliverable}</span>
                      </div>
                    ))}
                  </div>
                  {pkg.terms && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${BORDER}` }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '6px' }}>
                        Terms &amp; Conditions
                      </div>
                      <div style={{ fontSize: '12.65px', color: SLATE, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
              <div style={{ padding: '28px 40px', borderTop: `1px solid ${BORDER}`, background: WHITE}}>
                <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DARK, marginBottom: '12px' }}>
                  Deliverables
                </div>
                <div style={{ height: '1px', background: BORDER, marginBottom: '14px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {deliverablesItems.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: SLATE, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${BORDER}`, background: WHITE, marginTop: '0' }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SLATE, marginBottom: '14px' }}>
                Payment Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
                {studio.payment_details.account_holder && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '3px' }}>Account Holder</div>
                    <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.account_holder}</div>
                  </div>
                )}
                {studio.payment_details.bank_name && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '3px' }}>Bank</div>
                    <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.bank_name}</div>
                  </div>
                )}
                {studio.payment_details.account_number && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '3px' }}>Account Number</div>
                    <div style={{ fontSize: '13.8px', color: DARK, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                  </div>
                )}
                {studio.payment_details.ifsc_code && (
                  <div>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '3px' }}>IFSC Code</div>
                    <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.ifsc_code}</div>
                  </div>
                )}
                {studio.payment_details.upi_id && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '3px' }}>UPI ID</div>
                    <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.upi_id}</div>
                  </div>
                )}
              </div>
              {studio.payment_details.notes && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: SLATE, marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '12.65px', color: SLATE, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
                </div>
              )}
            </div>
          )}

          {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
            <div style={{ padding: '28px 40px', borderTop: `1px solid ${BORDER}`, background: WHITE}}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: SLATE, marginBottom: '12px' }}>
                Terms &amp; Conditions
              </div>
              <div style={{ height: '1px', background: BORDER, marginBottom: '14px' }} />
              {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
                <div style={{ fontSize: '12.65px', color: SLATE, lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                  {studio.terms_and_conditions}
                </div>
              )}
              {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
                  {quoteOptions.additionalTerms.map((term, idx) => (
                    <div key={idx} style={{ fontSize: '12.65px', color: SLATE, lineHeight: '1.8' }}>
                      • {term}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '14px 40px', background: DARK, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)' }}>{studio.name}</span>
            {studio.email && <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.3)' }}>{studio.email}</span>}
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.25)' }}>{quoteNumber} · SnapQuote</span>
          </div>
        </div>
      )}
    </div>
  );
}
