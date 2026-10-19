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

const BLACK = '#0a0a0a';
const WHITE = '#ffffff';
const RED = '#E8201A';
const GRAY = '#888888';
const GRAY_LIGHT = '#cccccc';
const GRAY_FAINT = 'rgba(0,0,0,0.04)';
const PAGE_W = 794;

export function MagazineEditorialLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: `${PAGE_W}px`,
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        color: BLACK,
        lineHeight: 1.4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 — COVER — Editorial full bleed */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : BLACK,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Large portfolio image full bleed */}
        {studio.portfolio_images && studio.portfolio_images.length > 0 ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img
              src={studio.portfolio_images[0].url}
              alt="Cover"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
            />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #111 0%, #1a1a1a 100%)' }} />
        )}

        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }} />

        {/* Top bar */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 52px', borderBottom: `2px solid ${RED}` }}>
          {studio.logo_url ? (
            <img src={studio.logo_url} alt={studio.name} crossOrigin="anonymous" style={{ height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          ) : (
            <span style={{ fontSize: '23px', fontWeight: 900, color: WHITE, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {studio.name || 'STUDIO'}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: RED, borderRadius: '50%' }} />
            <div style={{ width: '8px', height: '8px', background: WHITE, borderRadius: '50%', opacity: 0.4 }} />
            <div style={{ width: '8px', height: '8px', background: WHITE, borderRadius: '50%', opacity: 0.4 }} />
          </div>
        </div>

        {/* Center masthead */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 52px 64px', position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-block', background: RED, color: WHITE,
              fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.25em',
              textTransform: 'uppercase', padding: '4px 12px', marginBottom: '16px',
            }}>
              Exclusive Quotation
            </div>
          </div>

          <h1 style={{
            fontSize: '82.8px', fontWeight: 900, color: WHITE, margin: '0 0 8px',
            lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase',
          }}>
            {(studio.name || 'STUDIO').split(' ').map((word, i) => (
              <span key={i} style={{ display: 'block', color: i === 0 ? WHITE : GRAY_LIGHT }}>{word}</span>
            ))}
          </h1>

          <div style={{ width: '80px', height: '3px', background: RED, margin: '20px 0' }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Prepared For</div>
              <div style={{ fontSize: '27.6px', fontWeight: 300, color: WHITE }}>
                {lead?.full_name || 'Client Name'}
              </div>
              {lead?.event_type && (
                <div style={{ fontSize: '13.8px', color: RED, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>{lead.event_type}</div>
              )}
              {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '3px' }}>Events</div>
                  {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                    <div key={e.id} style={{ fontSize: '13.8px', color: GRAY, marginBottom: '2px' }}>
                      {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                    </div>
                  ))}
                </div>
              ) : lead?.event_date ? (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Event Date</div>
                  <div style={{ fontSize: '13.8px', color: GRAY }}>{formatEventDate(lead.event_date)}</div>
                </div>
              ) : null}
            </div>
            <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Quote</div>
              <div style={{ fontSize: '23px', fontWeight: 700, color: WHITE }}>{quoteNumber}</div>
              <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px', marginBottom: '2px' }}>Quote Date</div>
              <div style={{ fontSize: '11.5px', color: GRAY }}>{today}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 — SERVICES (magazine layout) */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 52px 24px', borderBottom: `2px solid ${BLACK}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '32px', background: RED}} />
            <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2px' }}>Investment Summary</div>
              <div style={{ fontSize: '23px', fontWeight: 900, color: BLACK, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{quoteOptions?.serviceName || 'Packages & Services'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{studio.name}</div>
          </div>
        </div>

        <div style={{ padding: '40px 52px', flex: 1 }}>
          {packageHeaders.map((pkg, pi) => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{ marginBottom: '28px', borderBottom: pi < packageHeaders.length - 1 ? `1px solid ${GRAY_LIGHT}` : 'none', paddingBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '3px', background: RED, alignSelf: 'stretch', minHeight: '24px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Package {String(pi + 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: '23px', fontWeight: 700, color: BLACK, textTransform: 'uppercase' }}>{pkg.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32.2px', fontWeight: 900, color: BLACK }}>{formatCurrencyDecimal(pkg.price)}</div>
                  </div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', paddingLeft: '20px' }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.8px', color: GRAY }}>
                        <div style={{ width: '4px', height: '4px', background: RED, borderRadius: '50%', flexShrink: 0 }} />
                        <span>{inc.name}</span>
                        {inc.price > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: BLACK }}>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '2px', background: RED}} /> Services
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {standaloneServices.map((svc, i) => (
                  <tr key={svc.id} style={{ borderBottom: `1px solid ${GRAY_FAINT}`, background: i % 2 === 1 ? GRAY_FAINT : 'transparent' }}>
                    <td style={{ padding: '12px 0', fontSize: '16.1px', fontWeight: 600, color: BLACK }}>{svc.name}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '18.4px', fontWeight: 900, color: BLACK }}>{formatCurrencyDecimal(svc.price)}</td>
                  </tr>
                ))}
              </table>
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: GRAY, fontStyle: 'italic' }}>No services selected</div>
          )}


          {/* Totals — magazine style */}
          <div style={{ marginTop: '40px', borderTop: `2px solid ${BLACK}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Subtotal</div>
                <div style={{ fontSize: '20.7px', fontWeight: 700, color: GRAY }}>{formatCurrencyDecimal(subtotal)}</div>
              </div>
              {showDiscount && discountAmount > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: RED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Discount</div>
                  <div style={{ fontSize: '20.7px', fontWeight: 700, color: RED }}>−{formatCurrencyDecimal(discountAmount)}</div>
                </div>
              )}
              {quoteOptions?.includeGst && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>GST (18%)</div>
                  <div style={{ fontSize: '20.7px', fontWeight: 700, color: GRAY }}>+{formatCurrencyDecimal(gstAmount)}</div>
                </div>
              )}
              <div style={{ textAlign: 'right', borderLeft: `2px solid ${RED}`, paddingLeft: '24px' }}>
                <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</div>
                <div style={{ fontSize: '41.4px', fontWeight: 900, color: BLACK, letterSpacing: '-0.02em' }}>{formatCurrencyDecimal(displayTotal)}</div>
              </div>
            </div>
          </div>
        </div>

        {quoteOptions?.includeSignature && (
          <div style={{ padding: '32px 56px', borderTop: `1px solid ${GRAY_LIGHT}`, marginTop: '32px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: GRAY, marginBottom: '20px' }}>
              Customer Approval
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div>
                  <div style={{ width: '220px', height: '1px', background: GRAY_LIGHT, marginBottom: '6px', marginTop: '32px' }} />
                  <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.08em' }}>Customer Signature</div>
                </div>
              </div>
              {lead && (
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '14.95px', fontWeight: 600, color: BLACK, marginBottom: '2px' }}>{lead.full_name}</div>
                  {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                    <div>
                      <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                      {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                        <div key={e.id} style={{ fontSize: '12.65px', color: GRAY, marginBottom: '1px' }}>
                          {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                        </div>
                      ))}
                    </div>
                  ) : lead.event_date ? (
                    <div>
                      <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                      <div style={{ fontSize: '12.65px', color: GRAY }}>{formatEventDate(lead.event_date)}</div>
                    </div>
                  ) : null}
                  <div style={{ height: '1px', background: GRAY_LIGHT, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                  <div style={{ fontSize: '11.5px', color: GRAY }}>Name &amp; Date</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio grid if available */}
        {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
          <div style={{ padding: '0 52px 40px', borderTop: `1px solid ${GRAY_LIGHT}`, marginTop: '20px', paddingTop: '36px' }}>
            <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '2px', background: RED}} /> Portfolio
            </div>
            {(() => {
              const imgs = studio.portfolio_images!.slice(0, 6);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {imgs.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', background: GRAY_FAINT, height: '110px' }}>
                      <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
          <div style={{ padding: '28px 52px', borderTop: `1px solid ${GRAY_LIGHT}` }}>
            <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLACK, marginBottom: '12px' }}>
              What You Get
            </div>
            <div style={{ height: '1px', background: GRAY_LIGHT, marginBottom: '14px' }} />
            {quoteOptions.packageDeliverables.map((pkg) => (
              <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                  {pkg.packageName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkg.deliverables.map((deliverable, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: GRAY, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>■</span>
                      <span>{deliverable}</span>
                    </div>
                  ))}
                </div>
                {pkg.terms && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${GRAY_LIGHT}` }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '6px' }}>
                      Terms &amp; Conditions
                    </div>
                    <div style={{ fontSize: '12.65px', color: GRAY, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
            <div style={{ padding: '28px 52px', borderTop: `1px solid ${GRAY_LIGHT}` }}>
              <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLACK, marginBottom: '12px' }}>
                Deliverables
              </div>
              <div style={{ height: '1px', background: GRAY_LIGHT, marginBottom: '14px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {deliverablesItems.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: GRAY, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
          <div style={{ padding: '28px 52px', borderTop: `1px solid ${GRAY_LIGHT}`, marginTop: '0' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GRAY, marginBottom: '14px' }}>
              Payment Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
              {studio.payment_details.account_holder && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Account Holder</div>
                  <div style={{ fontSize: '13.8px', color: BLACK }}>{studio.payment_details.account_holder}</div>
                </div>
              )}
              {studio.payment_details.bank_name && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Bank</div>
                  <div style={{ fontSize: '13.8px', color: BLACK }}>{studio.payment_details.bank_name}</div>
                </div>
              )}
              {studio.payment_details.account_number && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Account Number</div>
                  <div style={{ fontSize: '13.8px', color: BLACK, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                </div>
              )}
              {studio.payment_details.ifsc_code && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>IFSC Code</div>
                  <div style={{ fontSize: '13.8px', color: BLACK }}>{studio.payment_details.ifsc_code}</div>
                </div>
              )}
              {studio.payment_details.upi_id && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>UPI ID</div>
                  <div style={{ fontSize: '13.8px', color: BLACK }}>{studio.payment_details.upi_id}</div>
                </div>
              )}
            </div>
            {studio.payment_details.notes && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${GRAY_LIGHT}` }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '12.65px', color: GRAY, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
              </div>
            )}
          </div>
        )}

        {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
          <div style={{ padding: '28px 52px', borderTop: `1px solid ${GRAY_LIGHT}` }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: GRAY, marginBottom: '12px' }}>
              Terms &amp; Conditions
            </div>
            <div style={{ height: '1px', background: GRAY_LIGHT, marginBottom: '14px' }} />
            {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
              <div style={{ fontSize: '12.65px', color: GRAY, lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                {studio.terms_and_conditions}
              </div>
            )}
            {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
                {quoteOptions.additionalTerms.map((term, idx) => (
                  <div key={idx} style={{ fontSize: '12.65px', color: GRAY, lineHeight: '1.8' }}>
                    • {term}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '16px 52px', borderTop: `2px solid ${BLACK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: BLACK, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{studio.name}</span>
          <span style={{ fontSize: '11.5px', color: GRAY }}>{studio.phone} · {studio.email}</span>
          <span style={{ fontSize: '11.5px', color: GRAY }}>{quoteNumber}</span>
        </div>
      </div>
    </div>
  );
}
