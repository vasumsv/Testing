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

// Shared heading style: black, bold, uppercase, larger
const sectionHeading = {
  fontSize: '14.95px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#0a0a0a',
};

export function MinimalCleanLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
  const enabledItems = items.filter(i => i.enabled);
  const subtotal = enabledItems.reduce((s, i) => s + i.price, 0);
  const finalNum = parseFloat(finalPrice) || 0;
  const hasFinalPrice = finalPrice !== '' && finalNum > 0;
  const baseAmount = hasFinalPrice ? finalNum : subtotal;
  const discountAmount = hasFinalPrice && finalNum < subtotal ? subtotal - finalNum : 0;
  const gstAmount = quoteOptions?.includeGst ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
  const displayTotal = Math.round((baseAmount + gstAmount) * 100) / 100;

  const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  const ink = '#0a0a0a';
  const muted = '#888888';
  const border = '#e8e8e8';
  const surface = '#fafafa';

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: '794px',
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : '#ffffff',
        color: ink,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '16.1px',
        lineHeight: '1.5',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}

      {/* ── Header ── */}
      <div style={{ padding: '52px 56px 36px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {studio.logo_url ? (
              <img
                src={studio.logo_url}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${border}` }}
              />
            ) : (
              <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: surface, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: '23px', fontWeight: 700, color: ink, letterSpacing: '-0.01em' }}>
                {studio.name || 'Studio Name'}
              </div>
              {studio.owner_name && <div style={{ fontSize: '13.8px', color: muted, marginTop: '2px' }}>{studio.owner_name}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', marginTop: '6px' }}>
                {studio.phone && <span style={{ fontSize: '13.8px', color: muted }}>{studio.phone}</span>}
                {studio.email && <span style={{ fontSize: '13.8px', color: muted }}>{studio.email}</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '12.65px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted }}>
              Invoice / Quotation
            </div>
            <div style={{ fontSize: '25.3px', fontWeight: 700, color: ink, letterSpacing: '-0.02em', marginTop: '4px' }}>{quoteNumber}</div>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginTop: '8px', marginBottom: '2px' }}>Quote Date</div>
            <div style={{ fontSize: '12.65px', color: muted }}>{today}</div>
          </div>
        </div>

        {lead && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${border}`, display: 'flex', gap: '32px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ ...sectionHeading, marginBottom: '8px' }}>Prepared For</div>
              <div style={{ fontSize: '20.7px', fontWeight: 700, color: ink }}>{lead.full_name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', marginTop: '4px' }}>
                {lead.phone && <span style={{ fontSize: '13.8px', color: muted }}>{lead.phone}</span>}
                {lead.email && <span style={{ fontSize: '13.8px', color: muted }}>{lead.email}</span>}
              </div>
            </div>
            {(lead.event_type || (quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) || lead.event_date) && (
              <div style={{ flexShrink: 0 }}>
                <div style={{ ...sectionHeading, marginBottom: '8px' }}>Events</div>
                {lead.event_type && <div style={{ fontSize: '18.4px', fontWeight: 700, color: ink }}>{lead.event_type}</div>}
                {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div style={{ marginTop: '6px' }}>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '13.8px', color: muted, marginBottom: '2px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '2px' }}>Event Date</div>
                    <div style={{ fontSize: '13.8px', color: muted }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Services table ── */}
      <div style={{ padding: '36px 56px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${ink}` }}>
              <th style={{ textAlign: 'left', padding: '0 0 14px', ...sectionHeading }}>
                {quoteOptions?.serviceName || 'Services'}
              </th>
              <th style={{ textAlign: 'right', padding: '0 0 14px', ...sectionHeading }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {enabledItems.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '40px 0', textAlign: 'center', fontSize: '14.95px', color: '#cccccc', fontStyle: 'italic' }}>
                  No services included
                </td>
              </tr>
            ) : (
              enabledItems.map((item) => {
                const isInclude = !!item.packageId;
                const isHeader = item.isPackageHeader;
                return (
                  <tr key={item.id} style={{ borderBottom: isInclude ? 'none' : `1px solid ${border}` }}>
                    <td style={{ padding: isInclude ? '5px 0 5px 20px' : '16px 0', fontSize: isInclude ? '12px' : '14px', color: isInclude ? muted : ink, fontWeight: isHeader ? 700 : 400 }}>
                      {isInclude && (
                        <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cccccc', marginRight: '10px', verticalAlign: 'middle' }} />
                      )}
                      {isHeader ? item.name.replace(/\s*\(Package\)\s*$/i, '').trim() : item.name}
                    </td>
                    <td style={{ padding: isInclude ? '5px 0' : '16px 0', textAlign: 'right', fontSize: isInclude ? '12px' : '14px', color: isInclude ? muted : ink, fontVariantNumeric: 'tabular-nums', fontWeight: isHeader ? 700 : 400, opacity: isInclude && item.price === 0 ? 0 : 1 }}>
                      {isInclude && item.price === 0 ? '—' : formatCurrencyDecimal(item.price)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div style={{ padding: '0 56px 0' }}>
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px' }}>
            <span style={{ fontSize: '13.8px', color: muted }}>Subtotal</span>
            <span style={{ fontSize: '13.8px', color: muted, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(subtotal)}</span>
          </div>
          {showDiscount && discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px' }}>
              <span style={{ fontSize: '13.8px', color: '#555555' }}>Discount</span>
              <span style={{ fontSize: '13.8px', color: '#555555', fontVariantNumeric: 'tabular-nums' }}>−{formatCurrencyDecimal(discountAmount)}</span>
            </div>
          )}
          {quoteOptions?.includeGst && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px' }}>
              <span style={{ fontSize: '13.8px', color: muted }}>GST (18%)</span>
              <span style={{ fontSize: '13.8px', color: muted, fontVariantNumeric: 'tabular-nums' }}>+{formatCurrencyDecimal(gstAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '240px', borderTop: `2px solid ${ink}`, paddingTop: '14px', marginTop: '4px' }}>
            <span style={{ fontSize: '17.25px', fontWeight: 700, color: ink, letterSpacing: '0.02em' }}>Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}</span>
            <span style={{ fontSize: '29.9px', fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatCurrencyDecimal(displayTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Signature ── */}
      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${border}`, marginTop: '36px' }}>
          <div style={{ ...sectionHeading, marginBottom: '20px' }}>Customer Approval</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ width: '220px', height: '1px', background: border, marginBottom: '6px', marginTop: '32px' }} />
              <div style={{ fontSize: '11.5px', color: muted, letterSpacing: '0.08em' }}>Customer Signature</div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: ink, marginBottom: '2px' }}>{lead.full_name}</div>
                {(quoteOptions.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Events</div>
                    {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                      <div key={e.id} style={{ fontSize: '12.65px', color: muted, marginBottom: '1px' }}>
                        {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                      </div>
                    ))}
                  </div>
                ) : lead.event_date ? (
                  <div>
                    <div style={{ fontSize: '10.35px', color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Event Date</div>
                    <div style={{ fontSize: '12.65px', color: muted }}>{formatEventDate(lead.event_date)}</div>
                  </div>
                ) : null}
                <div style={{ height: '1px', background: border, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: muted }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Portfolio ── */}
      {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
        <div style={{ padding: '48px 56px 0', borderTop: `1px solid ${border}`, marginTop: quoteOptions?.includeSignature ? '0' : '40px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ ...sectionHeading, marginBottom: '10px' }}>Our Portfolio</div>
            <div style={{ height: '2px', background: ink, width: '100%' }} />
          </div>
          {(() => {
            const imgs = studio.portfolio_images!.slice(0, 9);
            const count = imgs.length;
            function cell(img: { url: string; caption: string }) {
              return (
                <div key={img.url} style={{ borderRadius: '4px', overflow: 'hidden', position: 'relative', background: '#f0f0f0', height: '200px' }}>
                  <img src={img.url} alt={img.caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {img.caption && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)', padding: '16px 8px 6px', fontSize: '10.35px', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit', textAlign: 'center' }}>
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

      {/* ── Studio footer info ── */}
      {(studio.address || studio.gst_number || studio.website) && (
        <div style={{ padding: '24px 56px', marginTop: studio.portfolio_images && studio.portfolio_images.length > 0 ? '32px' : '36px', borderTop: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', gap: '4px 28px' }}>
          {studio.address && <span style={{ fontSize: '12.65px', color: muted }}>{studio.address.replace(/\n/g, ', ')}</span>}
          {studio.website && <span style={{ fontSize: '12.65px', color: muted }}>{studio.website.replace(/^https?:\/\//, '')}</span>}
          {studio.gst_number && <span style={{ fontSize: '12.65px', color: muted }}>GST: {studio.gst_number}</span>}
        </div>
      )}

      {/* ── Package Deliverables ── */}
      {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '0' }}>
          <div style={{ ...sectionHeading, marginBottom: '12px' }}>What You Get</div>
          <div style={{ height: '2px', background: ink, marginBottom: '16px' }} />
          {quoteOptions.packageDeliverables.map((pkg) => (
            <div key={pkg.packageId} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14.95px', fontWeight: 700, color: muted, marginBottom: '6px' }}>
                {pkg.packageName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {pkg.deliverables.map((deliverable, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: muted, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ marginTop: '2px', flexShrink: 0 }}>•</span>
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
              {pkg.terms && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${border}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '6px' }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ fontSize: '12.65px', color: muted, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {pkg.terms}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Deliverables (text) ── */}
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
          <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '0' }}>
            <div style={{ ...sectionHeading, marginBottom: '12px' }}>Deliverables</div>
            <div style={{ height: '2px', background: ink, marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {deliverablesItems.map((item, idx) => (
                <div key={idx} style={{ fontSize: '13.8px', color: muted, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ marginTop: '2px', flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Payment Details ── */}
      {quoteOptions?.showPaymentDetails && studio.payment_details && (studio.payment_details.account_holder || studio.payment_details.account_number || studio.payment_details.upi_id || studio.payment_details.bank_name) && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '0' }}>
          <div style={{ ...sectionHeading, marginBottom: '14px' }}>Payment Details</div>
          <div style={{ height: '2px', background: ink, marginBottom: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {studio.payment_details.account_holder && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Account Holder</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{studio.payment_details.account_holder}</div>
              </div>
            )}
            {studio.payment_details.bank_name && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Bank</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{studio.payment_details.bank_name}</div>
              </div>
            )}
            {studio.payment_details.account_number && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Account Number</div>
                <div style={{ fontSize: '13.8px', color: ink, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details.account_number}</div>
              </div>
            )}
            {studio.payment_details.ifsc_code && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>IFSC Code</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{studio.payment_details.ifsc_code}</div>
              </div>
            )}
            {studio.payment_details.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>UPI ID</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{studio.payment_details.upi_id}</div>
              </div>
            )}
          </div>
          {studio.payment_details.notes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '12.65px', color: muted, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Terms & Conditions (merged) ── */}
      {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '0' }}>
          <div style={{ ...sectionHeading, marginBottom: '12px' }}>Terms &amp; Conditions</div>
          <div style={{ height: '2px', background: ink, marginBottom: '16px' }} />
          {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
            <div style={{ fontSize: '12.65px', color: muted, lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{studio.terms_and_conditions}</div>
          )}
          {quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0' }}>
              {quoteOptions.additionalTerms.map((term, idx) => (
                <div key={idx} style={{ fontSize: '12.65px', color: muted, lineHeight: '1.8' }}>
                  • {term}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ backgroundColor: surface, padding: '14px 56px', marginTop: '0', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12.65px', color: '#aaaaaa' }}>Thank you for your business</span>
        <span style={{ fontSize: '11.5px', color: '#cccccc', letterSpacing: '0.05em' }}>SnapQuote</span>
      </div>
    </div>
  );
}
