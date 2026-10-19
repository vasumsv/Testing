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

export function LuxuryDarkLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
  const enabledItems = items.filter(i => i.enabled);
  const subtotal = enabledItems.reduce((s, i) => s + i.price, 0);
  const finalNum = parseFloat(finalPrice) || 0;
  const hasFinalPrice = finalPrice !== '' && finalNum > 0;
  const baseAmount = hasFinalPrice ? finalNum : subtotal;
  const discountAmount = hasFinalPrice && finalNum < subtotal ? subtotal - finalNum : 0;
  const gstAmount = quoteOptions?.includeGst ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
  const displayTotal = Math.round((baseAmount + gstAmount) * 100) / 100;

  const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  const bg = '#1E1E1E';
  const gold = '#C9A961';
  const goldFaint = 'rgba(201,169,97,0.12)';
  const goldBorder = 'rgba(201,169,97,0.2)';
  const goldMuted = 'rgba(201,169,97,0.55)';
  const textPrimary = '#E8E4D8';
  const textMuted = '#A09880';
  const rowAlt = 'rgba(255,255,255,0.03)';

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: '794px',
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : bg,
        color: textPrimary,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '16.1px',
        lineHeight: '1.5',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}
      <div style={{
        background: '#141414',
        padding: '44px 52px 40px',
        borderBottom: `1px solid ${goldBorder}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${gold} 30%, ${gold} 70%, transparent 100%)`,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          right: '-60px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(201,169,97,0.04) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
            {studio.logo_url ? (
              <img
                src={studio.logo_url}
                alt="Logo"
                crossOrigin="anonymous"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: `1px solid ${goldBorder}`,
                }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '10px',
                background: quoteOptions?.backgroundImageUrl ? 'transparent' : goldFaint,
                border: `1px solid ${goldBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={goldMuted} strokeWidth="1.5">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            )}

            <div>
              <div style={{ fontSize: '23px', fontWeight: 600, color: textPrimary, letterSpacing: '-0.01em' }}>
                {studio.name || 'Studio Name'}
              </div>
              {studio.owner_name && (
                <div style={{ fontSize: '13.8px', color: goldMuted, marginTop: '3px' }}>{studio.owner_name}</div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 18px', marginTop: '8px' }}>
                {studio.phone && <span style={{ fontSize: '12.65px', color: textMuted }}>{studio.phone}</span>}
                {studio.email && <span style={{ fontSize: '12.65px', color: textMuted }}>{studio.email}</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: goldMuted }}>
              Quotation
            </div>
            <div style={{ fontSize: '25.3px', fontWeight: 700, color: gold, letterSpacing: '-0.01em', marginTop: '5px' }}>
              {quoteNumber}
            </div>
            <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldMuted, marginTop: '8px', marginBottom: '2px' }}>Quote Date</div>
            <div style={{ fontSize: '12.65px', color: textMuted }}>{today}</div>
          </div>
        </div>
      </div>

      {lead && (
        <div style={{
          padding: '24px 52px',
          borderBottom: `1px solid ${goldBorder}`,
          background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{ display: 'flex', gap: '48px' }}>
            <div>
              <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldMuted, marginBottom: '8px' }}>
                Prepared For
              </div>
              <div style={{ fontSize: '18.4px', fontWeight: 600, color: textPrimary }}>{lead.full_name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', marginTop: '4px' }}>
                {lead.phone && <span style={{ fontSize: '13.8px', color: textMuted }}>{lead.phone}</span>}
                {lead.email && <span style={{ fontSize: '13.8px', color: textMuted }}>{lead.email}</span>}
              </div>
            </div>
            {(lead.event_type || (quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) || lead.event_date) && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldMuted, marginBottom: '8px' }}>
                  Events
                </div>
                {lead.event_type && <div style={{ fontSize: '16.1px', color: textPrimary }}>{lead.event_type}</div>}
                {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div style={{ marginTop: '6px' }}>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '13.8px', color: textMuted, marginBottom: '2px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldMuted, marginBottom: '2px' }}>Event Date</div>
                    <div style={{ fontSize: '13.8px', color: textMuted }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '0 52px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${goldBorder}` }}>
              <th style={{
                textAlign: 'left',
                padding: '20px 0 14px',
                fontSize: '10.35px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: goldMuted,
              }}>
                {quoteOptions?.serviceName || 'Service'}
              </th>
              <th style={{
                textAlign: 'right',
                padding: '20px 0 14px',
                fontSize: '10.35px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: goldMuted,
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {enabledItems.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '40px 0', textAlign: 'center', fontSize: '14.95px', color: '#444', fontStyle: 'italic' }}>
                  No services included
                </td>
              </tr>
            ) : (
              enabledItems.map((item, i) => {
                const isInclude = !!item.packageId;
                const isHeader = item.isPackageHeader;
                return (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: isInclude ? 'transparent' : i % 2 === 1 ? rowAlt : 'transparent',
                      borderBottom: isInclude ? 'none' : `1px solid rgba(201,169,97,0.08)`,
                    }}
                  >
                    <td style={{
                      padding: isInclude ? '5px 0 5px 20px' : '14px 0',
                      fontSize: isInclude ? '12px' : '14px',
                      color: isInclude ? textMuted : textPrimary,
                      fontWeight: isHeader ? 600 : 400,
                    }}>
                      {isInclude && (
                        <span style={{ marginRight: '8px', color: goldMuted, fontSize: '9.2px' }}>◆</span>
                      )}
                      {isHeader ? item.name.replace(/\s*\(Package\)\s*$/i, '').trim() : item.name}
                    </td>
                    <td style={{
                      padding: isInclude ? '5px 0' : '14px 0',
                      textAlign: 'right',
                      fontSize: isInclude ? '12px' : '14px',
                      color: isInclude ? textMuted : gold,
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: isHeader ? 600 : 400,
                      opacity: isInclude && item.price === 0 ? 0 : 1,
                    }}>
                      {isInclude && item.price === 0 ? '—' : formatCurrencyDecimal(item.price)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


      <div style={{ padding: '0 52px 0' }}>
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${goldBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
            <span style={{ fontSize: '13.8px', color: textMuted }}>Subtotal</span>
            <span style={{ fontSize: '13.8px', color: textMuted, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(subtotal)}</span>
          </div>

          {showDiscount && discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
              <span style={{ fontSize: '13.8px', color: goldMuted }}>Discount</span>
              <span style={{ fontSize: '13.8px', color: goldMuted, fontVariantNumeric: 'tabular-nums' }}>−{formatCurrencyDecimal(discountAmount)}</span>
            </div>
          )}

          {quoteOptions?.includeGst && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
              <span style={{ fontSize: '13.8px', color: textMuted }}>GST (18%)</span>
              <span style={{ fontSize: '13.8px', color: textMuted, fontVariantNumeric: 'tabular-nums' }}>+{formatCurrencyDecimal(gstAmount)}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            width: '260px',
            borderTop: `1px solid ${goldBorder}`,
            paddingTop: '16px',
            marginTop: '4px',
          }}>
            <span style={{ fontSize: '11.5px', fontWeight: 500, color: textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}
            </span>
            <span style={{
              fontSize: '32.2px',
              fontWeight: 700,
              color: gold,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}>
              {formatCurrencyDecimal(displayTotal)}
            </span>
          </div>
        </div>
      </div>

      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${goldBorder}`, marginTop: '32px' }}>
          <div style={{ fontSize: '11.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: goldMuted, marginBottom: '20px' }}>
            Customer Approval
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div>
                <div style={{ width: '220px', height: '1px', background: goldBorder, marginBottom: '6px', marginTop: '32px' }} />
                <div style={{ fontSize: '11.5px', color: goldMuted, letterSpacing: '0.08em' }}>Customer Signature</div>
              </div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: textPrimary, marginBottom: '2px' }}>{lead.full_name}</div>
                {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: goldMuted, marginBottom: '1px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: goldMuted }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
                <div style={{ height: '1px', background: goldBorder, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: goldMuted }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
        <div style={{ padding: '44px 52px 0', borderTop: `1px solid ${goldBorder}`, marginTop: '36px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '0.22em', textTransform: 'uppercase', color: goldMuted, marginBottom: '8px' }}>
              Our Portfolio
            </div>
            <div style={{ height: '1px', background: `linear-gradient(90deg, ${goldBorder}, transparent)`, width: '100%' }} />
          </div>
          {(() => {
            const imgs = studio.portfolio_images!.slice(0, 9);
            const count = imgs.length;
            function cell(img: { url: string; caption: string }) {
              return (
                <div key={img.url} style={{ borderRadius: '3px', overflow: 'hidden', position: 'relative', background: '#2a2a2a', border: `1px solid ${goldBorder}`, height: '200px' }}>
                  <img src={img.url} alt={img.caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }} />
                  {img.caption && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(0deg, rgba(20,20,20,0.75) 0%, transparent 100%)',
                      padding: '16px 8px 7px', fontSize: '10.35px', color: 'rgba(201,169,97,0.8)',
                      letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit', textAlign: 'center',
                    }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              );
            }
            const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
            const rows: { url: string; caption: string }[][] = [];
            for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
            return rows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: ri < rows.length - 1 ? '8px' : '0' }}>
                {row.map(img => cell(img))}
              </div>
            ));
          })()}
        </div>
      )}

      {(studio.address || studio.gst_number || studio.website) && (
        <div style={{
          padding: '20px 52px',
          marginTop: studio.portfolio_images && studio.portfolio_images.length > 0 ? '28px' : '28px',
          borderTop: `1px solid rgba(201,169,97,0.1)`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 28px',
        }}>
          {studio.address && <span style={{ fontSize: '12.65px', color: textMuted }}>{studio.address.replace(/\n/g, ', ')}</span>}
          {studio.website && <span style={{ fontSize: '12.65px', color: textMuted }}>{studio.website.replace(/^https?:\/\//, '')}</span>}
          {studio.gst_number && <span style={{ fontSize: '12.65px', color: textMuted }}>GST: {studio.gst_number}</span>}
        </div>
      )}

      {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
        <div style={{ padding: '28px 52px', borderTop: `1px solid ${goldBorder}`, background: '#141414' }}>
          <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: gold, marginBottom: '12px' }}>
            What You Get
          </div>
          <div style={{ height: '1px', background: goldBorder, marginBottom: '14px' }} />
          {quoteOptions.packageDeliverables.map((pkg) => (
            <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14.95px', fontWeight: 700, color: goldMuted, marginBottom: '6px' }}>
                {pkg.packageName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {pkg.deliverables.map((deliverable, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>◆</span>
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
              {pkg.terms && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${goldBorder}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '6px' }}>
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
          <div style={{ padding: '28px 52px', borderTop: `1px solid ${goldBorder}`, background: '#141414' }}>
            <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: gold, marginBottom: '12px' }}>
              Deliverables
            </div>
            <div style={{ height: '1px', background: goldBorder, marginBottom: '14px' }} />
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
        <div style={{ padding: '28px 52px', borderTop: `1px solid ${goldBorder}`, marginTop: '0', background: '#141414' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: goldMuted, marginBottom: '14px' }}>
            Payment Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {studio.payment_details.account_holder && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '3px' }}>Account Holder</div>
                <div style={{ fontSize: '13.8px', color: textPrimary }}>{studio.payment_details.account_holder}</div>
              </div>
            )}
            {studio.payment_details.bank_name && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '3px' }}>Bank</div>
                <div style={{ fontSize: '13.8px', color: textPrimary }}>{studio.payment_details.bank_name}</div>
              </div>
            )}
            {studio.payment_details.account_number && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '3px' }}>Account Number</div>
                <div style={{ fontSize: '13.8px', color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
              </div>
            )}
            {studio.payment_details.ifsc_code && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '3px' }}>IFSC Code</div>
                <div style={{ fontSize: '13.8px', color: textPrimary }}>{studio.payment_details.ifsc_code}</div>
              </div>
            )}
            {studio.payment_details.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '3px' }}>UPI ID</div>
                <div style={{ fontSize: '13.8px', color: textPrimary }}>{studio.payment_details.upi_id}</div>
              </div>
            )}
          </div>
          {studio.payment_details.notes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${goldBorder}` }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: goldMuted, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '12.65px', color: goldMuted, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
            </div>
          )}
        </div>
      )}

      {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
        <div style={{ padding: '28px 52px', borderTop: `1px solid ${goldBorder}`, background: '#141414' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: goldMuted, marginBottom: '12px' }}>
            Terms &amp; Conditions
          </div>
          <div style={{ height: '1px', background: goldBorder, marginBottom: '14px' }} />
          {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
            <div style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
              {studio.terms_and_conditions}
            </div>
          )}
          {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
              {quoteOptions.additionalTerms.map((term, idx) => (
                <div key={idx} style={{ fontSize: '12.65px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.8' }}>
                  • {term}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        background: '#141414',
        padding: '18px 52px',
        marginTop: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `1px solid ${goldBorder}`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${gold} 30%, ${gold} 70%, transparent 100%)`,
        }} />
        <span style={{ fontSize: '12.65px', color: 'rgba(201,169,97,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
          Thank you for your business
        </span>
        <span style={{ fontSize: '11.5px', color: 'rgba(201,169,97,0.2)', letterSpacing: '0.1em' }}>SnapQuote</span>
      </div>
    </div>
  );
}
