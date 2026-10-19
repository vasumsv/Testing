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

const NAVY = '#0F2040';
const NAVY2 = '#1A3560';
const BLUE = '#4A9EFF';
const BLUE_LIGHT = '#6BB5FF';
const BLUE_FAINT = 'rgba(74,158,255,0.08)';
const BLUE_BORDER = 'rgba(74,158,255,0.2)';
const WHITE = '#ffffff';
const OFF_WHITE = '#F7F9FC';
const GRAY = '#8899AA';
const GRAY_BORDER = '#E2E8F0';
const DARK = '#1a2640';
const PAGE_W = 794;

export function CorporateProfessionalLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
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
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        color: DARK,
        lineHeight: 1.5,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      {/* PAGE 1 */}
      <div style={{
        minHeight: `${Math.round(PAGE_W * 1.414)}px`,
        background: quoteOptions?.backgroundImageUrl ? 'transparent' : WHITE,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
          padding: '40px 56px 36px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: -60, right: -60,
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'rgba(74,158,255,0.06)', border: `1px solid ${BLUE_BORDER}`,
          }} />
          <div style={{
            position: 'absolute', top: -40, right: 80,
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(74,158,255,0.04)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {studio.logo_url ? (
                <img src={studio.logo_url} alt={studio.name} crossOrigin="anonymous" style={{ width: '60px', height: '60px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: BLUE_FAINT, border: `1px solid ${BLUE_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '25.3px', fontWeight: 700, color: WHITE, margin: 0, letterSpacing: '-0.01em' }}>{studio.name || 'Studio Name'}</h1>
                {studio.owner_name && <p style={{ fontSize: '14.95px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{studio.owner_name}</p>}
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  {studio.phone && <span style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.5)' }}>{studio.phone}</span>}
                  {studio.email && <span style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.5)' }}>{studio.email}</span>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: BLUE, color: WHITE, fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 12px', marginBottom: '8px' }}>
                Quotation
              </div>
              <div style={{ fontSize: '27.6px', fontWeight: 700, color: WHITE }}>{quoteNumber}</div>
              <div style={{ fontSize: '10.35px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '6px', marginBottom: '2px' }}>Quote Date</div>
              <div style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.5)' }}>{today}</div>
            </div>
          </div>
        </div>

        {/* Client strip */}
        {lead && (
          <div style={{ padding: '20px 56px', background: OFF_WHITE, borderBottom: `1px solid ${GRAY_BORDER}`, display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Prepared For</div>
              <div style={{ fontSize: '19.55px', fontWeight: 700, color: DARK }}>{lead.full_name}</div>
            </div>
            {lead.phone && <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Phone</div>
              <div style={{ fontSize: '16.1px', color: DARK }}>{lead.phone}</div>
            </div>}
            {lead.email && <div>
              <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>Email</div>
              <div style={{ fontSize: '16.1px', color: DARK }}>{lead.email}</div>
            </div>}
            {(lead.event_type || (quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) || lead.event_date) && (
              <div style={{ marginLeft: 'auto' }}>
                {lead.event_type && (
                  <span style={{ background: BLUE_FAINT, border: `1px solid ${BLUE_BORDER}`, color: NAVY2, fontSize: '13.8px', fontWeight: 700, padding: '4px 12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {lead.event_type}
                  </span>
                )}
                {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: GRAY, marginBottom: '2px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '10.35px', color: GRAY, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: GRAY }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '36px 56px', flex: 1 }}>
          {/* Packages */}
          {packageHeaders.map((pkg, pi) => {
            const pkgItems = enabledItems.filter(i => i.packageId === pkg.id && !i.isPackageHeader);
            return (
              <div key={pkg.id} style={{ marginBottom: '20px', border: `1px solid ${GRAY_BORDER}`, background: OFF_WHITE}}>
                <div style={{ padding: '16px 20px', background: NAVY, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '3px', background: BLUE, alignSelf: 'stretch' }} />
                    <div>
                      <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Package {String(pi + 1).padStart(2, '0')}</div>
                      <div style={{ fontSize: '18.4px', fontWeight: 700, color: WHITE }}>{pkg.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '25.3px', fontWeight: 700, color: BLUE_LIGHT }}>{formatCurrencyDecimal(pkg.price)}</div>
                </div>
                {pkgItems.length > 0 && (
                  <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {pkgItems.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.8px', color: GRAY }}>
                        <div style={{ width: '4px', height: '4px', background: BLUE, borderRadius: '50%', flexShrink: 0 }} />
                        {inc.name}
                        {inc.price > 0 && <span style={{ marginLeft: 'auto', color: DARK, fontWeight: 600 }}>{formatCurrencyDecimal(inc.price)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {standaloneServices.length > 0 && (
            <div style={{ border: `1px solid ${GRAY_BORDER}`, marginBottom: '20px' }}>
              <div style={{ padding: '12px 20px', background: NAVY, borderBottom: `1px solid ${BLUE_BORDER}` }}>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{quoteOptions?.serviceName || 'Services'}</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GRAY_BORDER}`, background: OFF_WHITE}}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11.5px', color: GRAY, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{quoteOptions?.serviceName || 'Service'}</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11.5px', color: GRAY, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {standaloneServices.map((svc, i) => (
                    <tr key={svc.id} style={{ borderBottom: `1px solid ${GRAY_BORDER}`, background: i % 2 === 1 ? OFF_WHITE : WHITE }}>
                      <td style={{ padding: '12px 20px', fontSize: '16.1px', fontWeight: 500, color: DARK }}>{svc.name}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '16.1px', fontWeight: 700, color: DARK }}>{formatCurrencyDecimal(svc.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {enabledItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: GRAY, fontSize: '16.1px' }}>No services selected</div>
          )}


          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <div style={{ width: '300px', border: `1px solid ${GRAY_BORDER}`, background: OFF_WHITE}}>
              <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '14.95px', color: GRAY, borderBottom: `1px solid ${GRAY_BORDER}` }}>
                <span>Subtotal</span><span>{formatCurrencyDecimal(subtotal)}</span>
              </div>
              {showDiscount && discountAmount > 0 && (
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '14.95px', color: BLUE, borderBottom: `1px solid ${GRAY_BORDER}` }}>
                  <span>Discount</span><span>−{formatCurrencyDecimal(discountAmount)}</span>
                </div>
              )}
              {quoteOptions?.includeGst && (
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '14.95px', color: GRAY, borderBottom: `1px solid ${GRAY_BORDER}` }}>
                  <span>GST (18%)</span><span>+{formatCurrencyDecimal(gstAmount)}</span>
                </div>
              )}
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NAVY}}>
                <span style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
                <span style={{ fontSize: '27.6px', fontWeight: 700, color: BLUE_LIGHT }}>{formatCurrencyDecimal(displayTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {quoteOptions?.includeSignature && (
          <div style={{ padding: '32px 56px', borderTop: `1px solid ${GRAY_BORDER}`, marginTop: '32px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: GRAY, marginBottom: '20px' }}>
              Customer Approval
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div>
                  <div style={{ width: '220px', height: '1px', background: GRAY_BORDER, marginBottom: '6px', marginTop: '32px' }} />
                  <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.08em' }}>Customer Signature</div>
                </div>
              </div>
              {lead && (
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '14.95px', fontWeight: 600, color: DARK, marginBottom: '2px' }}>{lead.full_name}</div>
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
                  <div style={{ height: '1px', background: GRAY_BORDER, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                  <div style={{ fontSize: '11.5px', color: GRAY }}>Name &amp; Date</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
          <div style={{ padding: '32px 56px 0', borderTop: `1px solid ${GRAY_BORDER}`, marginTop: '20px' }}>
            <div style={{ fontSize: '11.5px', color: GRAY, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '2px', background: BLUE}} /> Our Portfolio
            </div>
            {(() => {
              const imgs = studio.portfolio_images!.slice(0, 6);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {imgs.map(img => (
                    <div key={img.url} style={{ overflow: 'hidden', background: OFF_WHITE, border: `1px solid ${GRAY_BORDER}`, height: '110px' }}>
                      <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
          <div style={{ padding: '28px 56px', borderTop: `1px solid ${BLUE_BORDER}`, marginTop: '24px' }}>
            <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: NAVY2, marginBottom: '12px' }}>
              What You Get
            </div>
            <div style={{ height: '1px', background: BLUE_BORDER, marginBottom: '14px' }} />
            {quoteOptions.packageDeliverables.map((pkg) => (
              <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                  {pkg.packageName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkg.deliverables.map((deliverable, idx) => (
                    <div key={idx} style={{ fontSize: '13.8px', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ marginTop: '1px', flexShrink: 0 }}>●</span>
                      <span>{deliverable}</span>
                    </div>
                  ))}
                </div>
                {pkg.terms && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${BLUE_BORDER}` }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '6px' }}>
                      Terms &amp; Conditions
                    </div>
                    <div style={{ fontSize: '12.65px', color: '#555', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
            <div style={{ padding: '28px 56px', borderTop: `1px solid ${BLUE_BORDER}`, marginTop: '24px' }}>
              <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: NAVY2, marginBottom: '12px' }}>
                Deliverables
              </div>
              <div style={{ height: '1px', background: BLUE_BORDER, marginBottom: '14px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {deliverablesItems.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
          <div style={{ padding: '28px 56px', borderTop: `1px solid ${BLUE_BORDER}`, marginTop: '0' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GRAY, marginBottom: '14px' }}>
              Payment Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
              {studio.payment_details.account_holder && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Account Holder</div>
                  <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.account_holder}</div>
                </div>
              )}
              {studio.payment_details.bank_name && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Bank</div>
                  <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.bank_name}</div>
                </div>
              )}
              {studio.payment_details.account_number && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>Account Number</div>
                  <div style={{ fontSize: '13.8px', color: DARK, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
                </div>
              )}
              {studio.payment_details.ifsc_code && (
                <div>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>IFSC Code</div>
                  <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.ifsc_code}</div>
                </div>
              )}
              {studio.payment_details.upi_id && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '3px' }}>UPI ID</div>
                  <div style={{ fontSize: '13.8px', color: DARK }}>{studio.payment_details.upi_id}</div>
                </div>
              )}
            </div>
            {studio.payment_details.notes && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${BLUE_BORDER}` }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY, marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '12.65px', color: GRAY, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
              </div>
            )}
          </div>
        )}

        {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
          <div style={{ padding: '28px 56px', borderTop: `1px solid ${BLUE_BORDER}`, marginTop: '24px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: BLUE_LIGHT, opacity: 0.8, marginBottom: '12px' }}>
              Terms &amp; Conditions
            </div>
            <div style={{ height: '1px', background: BLUE_BORDER, marginBottom: '14px' }} />
            {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
              <div style={{ fontSize: '12.65px', color: '#888', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                {studio.terms_and_conditions}
              </div>
            )}
            {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
                {quoteOptions.additionalTerms.map((term, idx) => (
                  <div key={idx} style={{ fontSize: '12.65px', color: '#888', lineHeight: '1.8' }}>
                    • {term}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 56px', background: NAVY, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: (studio.terms_and_conditions || studio.details_section) ? '0' : '24px' }}>
          <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>{studio.name}</span>
          {studio.address && <span style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.3)' }}>{studio.address.split('\n')[0]}</span>}
          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.25)' }}>{quoteNumber} · SnapQuote</span>
        </div>
      </div>
    </div>
  );
}
