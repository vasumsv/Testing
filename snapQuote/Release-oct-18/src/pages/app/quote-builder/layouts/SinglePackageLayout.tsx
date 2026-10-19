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

export function SinglePackageLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
  const enabledItems = items.filter(i => i.enabled);
  const subtotal = enabledItems.reduce((s, i) => s + i.price, 0);
  const finalNum = parseFloat(finalPrice) || 0;
  const hasFinalPrice = finalPrice !== '' && finalNum > 0;
  const baseAmount = hasFinalPrice ? finalNum : subtotal;
  const discountAmount = hasFinalPrice && finalNum < subtotal ? subtotal - finalNum : 0;
  const gstAmount = quoteOptions?.includeGst ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
  const displayTotal = Math.round((baseAmount + gstAmount) * 100) / 100;

  const today = new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

  const ink = '#0d0d0d';
  const muted = '#7a7a7a';
  const border = '#e4e4e4';
  const surface = '#f8f8f8';
  const accent = '#111111';

  const packageHeader = enabledItems.find(i => i.isPackageHeader);
  const packageName = packageHeader
    ? packageHeader.name.replace(/\s*\(Package\)\s*$/i, '').trim()
    : (quoteOptions?.serviceName || 'Package');

  const includeItems = enabledItems.filter(i => i.packageId === packageHeader?.id);
  const standaloneItems = enabledItems.filter(i => !i.isPackageHeader && !i.packageId);

  const pd = studio.payment_details;
  const hasPaymentDetails = quoteOptions?.showPaymentDetails && pd &&
    (pd.account_holder || pd.account_number || pd.upi_id || pd.bank_name);

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
      {/* Header */}
      <div style={{ padding: '48px 56px 32px', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          {/* Studio identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {studio.logo_url ? (
              <img
                src={studio.logo_url}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${border}` }}
              />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: surface, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: '18.4px', fontWeight: 600, color: ink }}>{studio.name || 'Studio Name'}</div>
              {studio.owner_name && <div style={{ fontSize: '12.65px', color: muted, marginTop: '2px' }}>{studio.owner_name}</div>}
              <div style={{ display: 'flex', gap: '14px', marginTop: '5px', flexWrap: 'wrap' }}>
                {studio.phone && <span style={{ fontSize: '12.65px', color: muted }}>{studio.phone}</span>}
                {studio.email && <span style={{ fontSize: '12.65px', color: muted }}>{studio.email}</span>}
              </div>
            </div>
          </div>

          {/* Quote meta */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted }}>
              Quotation
            </div>
            <div style={{ fontSize: '23px', fontWeight: 700, color: ink, letterSpacing: '-0.02em', marginTop: '3px' }}>
              {quoteNumber}
            </div>
            <div style={{ fontSize: '11.5px', color: muted, marginTop: '6px' }}>{today}</div>
          </div>
        </div>

        {/* Client info */}
        {lead && (
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: `1px solid ${border}`, display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, marginBottom: '6px' }}>Prepared For</div>
              <div style={{ fontSize: '17.25px', fontWeight: 600, color: ink }}>{lead.full_name}</div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
                {lead.phone && <span style={{ fontSize: '12.65px', color: muted }}>{lead.phone}</span>}
                {lead.email && <span style={{ fontSize: '12.65px', color: muted }}>{lead.email}</span>}
              </div>
            </div>
            {(quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0) && (
              <div style={{ flexShrink: 0, minWidth: '140px' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, marginBottom: '6px' }}>Events</div>
                {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                  <div key={e.id} style={{ fontSize: '12.65px', color: muted, marginBottom: '2px' }}>
                    {e.name}{(e.name && (e.date || e.time)) ? ' \u2014 ' : ''}{e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ', ' : ''}{e.time && !e.date ? e.time : ''}{e.date && e.time ? e.time : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Package hero section */}
      <div style={{ padding: '36px 56px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', borderBottom: `2px solid ${accent}` }}>
          <div>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: '6px' }}>
              {quoteOptions?.serviceName || 'Package'}
            </div>
            <div style={{ fontSize: '29.9px', fontWeight: 700, color: ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {packageName}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '4px' }}>Package Price</div>
            <div style={{ fontSize: '32.2px', fontWeight: 700, color: ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrencyDecimal(packageHeader?.price ?? 0)}
            </div>
          </div>
        </div>

        {/* Includes from package */}
        {includeItems.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, marginBottom: '10px' }}>
              What's Included
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px' }}>
              {includeItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginTop: '2px', flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="5.5" fill="none" stroke={accent} strokeWidth="1" />
                    <path d="M3.5 6l2 2 3-3.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: '13.8px', color: ink }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional standalone services */}
        {standaloneItems.length > 0 && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, marginBottom: '10px' }}>
              Additional Services
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {standaloneItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: '10px 0', fontSize: '14.95px', color: ink }}>{item.name}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontSize: '14.95px', color: ink, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrencyDecimal(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pricing summary */}
      <div style={{ padding: '24px 56px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '7px' }}>
          {standaloneItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
              <span style={{ fontSize: '13.8px', color: muted }}>Subtotal</span>
              <span style={{ fontSize: '13.8px', color: muted, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(subtotal)}</span>
            </div>
          )}
          {showDiscount && discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
              <span style={{ fontSize: '13.8px', color: '#555' }}>Discount</span>
              <span style={{ fontSize: '13.8px', color: '#555', fontVariantNumeric: 'tabular-nums' }}>−{formatCurrencyDecimal(discountAmount)}</span>
            </div>
          )}
          {quoteOptions?.includeGst && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px' }}>
              <span style={{ fontSize: '13.8px', color: muted }}>GST (18%)</span>
              <span style={{ fontSize: '13.8px', color: muted, fontVariantNumeric: 'tabular-nums' }}>+{formatCurrencyDecimal(gstAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '260px', borderTop: `2px solid ${ink}`, paddingTop: '12px', marginTop: '2px' }}>
            <span style={{ fontSize: '13.8px', fontWeight: 600, color: ink, letterSpacing: '0.02em' }}>
              Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}
            </span>
            <span style={{ fontSize: '32.2px', fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {formatCurrencyDecimal(displayTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Signature */}
      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px', borderTop: `1px solid ${border}`, marginTop: '36px' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, marginBottom: '20px' }}>Customer Approval</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ width: '220px', height: '1px', background: border, marginBottom: '6px', marginTop: '32px' }} />
              <div style={{ fontSize: '11.5px', color: muted, letterSpacing: '0.08em' }}>Customer Signature</div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: ink, marginBottom: '2px' }}>{lead.full_name}</div>
                <div style={{ height: '1px', background: border, marginTop: '6px', marginBottom: '4px', width: '200px' }} />
                <div style={{ fontSize: '11.5px', color: muted }}>Name &amp; Date</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {quoteOptions?.showPortfolio !== false && studio.portfolio_images && studio.portfolio_images.length > 0 && (
        <div style={{ padding: '40px 56px 0', borderTop: `1px solid ${border}`, marginTop: quoteOptions?.includeSignature ? '0' : '40px' }}>
          <div style={{ fontSize: '10.35px', letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: '16px' }}>Our Portfolio</div>
          {(() => {
            const imgs = studio.portfolio_images!.slice(0, 9);
            const cols = imgs.length <= 2 ? imgs.length : imgs.length <= 4 ? 2 : 3;
            const rows: typeof imgs[] = [];
            for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
            return rows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px', marginBottom: '8px' }}>
                {row.map(img => (
                  <div key={img.url} style={{ borderRadius: '4px', overflow: 'hidden', height: '110px', background: '#f0f0f0' }}>
                    <img src={img.url} alt={img.caption || ''} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}


      {/* Package Deliverables */}
      {quoteOptions?.showDeliverables !== false && (quoteOptions?.deliverableMode ?? 'default') === 'package' && quoteOptions?.packageDeliverables && quoteOptions.packageDeliverables.length > 0 && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '32px' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, marginBottom: '12px' }}>What You Get</div>
          <div style={{ height: '1px', background: border, marginBottom: '14px' }} />
          {quoteOptions.packageDeliverables.map((pkg) => (
            <div key={pkg.packageId} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14.95px', fontWeight: 700, color: muted, marginBottom: '6px' }}>
                {pkg.packageName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {pkg.deliverables.map((deliverable, idx) => (
                  <div key={idx} style={{ fontSize: '13.8px', color: ink, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ marginTop: '1px', flexShrink: 0 }}>•</span>
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

      {/* Default / Custom Deliverables */}
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
          <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '32px' }}>
            <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, marginBottom: '12px' }}>Deliverables</div>
            <div style={{ height: '1px', background: border, marginBottom: '14px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {deliverablesItems.map((item, idx) => (
                <div key={idx} style={{ fontSize: '13.8px', color: ink, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ marginTop: '1px', flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Payment Details */}
      {hasPaymentDetails && pd && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '0' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: '14px' }}>Payment Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
            {pd.account_holder && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Account Holder</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{pd.account_holder}</div>
              </div>
            )}
            {pd.bank_name && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Bank</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{pd.bank_name}</div>
              </div>
            )}
            {pd.account_number && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>Account Number</div>
                <div style={{ fontSize: '13.8px', color: ink, fontVariantNumeric: 'tabular-nums' }}>{pd.account_number}</div>
              </div>
            )}
            {pd.ifsc_code && (
              <div>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>IFSC Code</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{pd.ifsc_code}</div>
              </div>
            )}
            {pd.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '3px' }}>UPI ID</div>
                <div style={{ fontSize: '13.8px', color: ink }}>{pd.upi_id}</div>
              </div>
            )}
          </div>
          {pd.notes && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '12.65px', color: muted, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{pd.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Terms & Conditions (merged) */}
      {((quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions) || (quoteOptions?.showAdditionalTerms && quoteOptions?.additionalTerms?.length > 0)) && (
        <div style={{ padding: '28px 56px', borderTop: `1px solid ${border}`, marginTop: '32px' }}>
          <div style={{ fontSize: '10.35px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, marginBottom: '12px' }}>Terms &amp; Conditions</div>
          <div style={{ height: '1px', background: border, marginBottom: '14px' }} />
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

      {/* Footer */}
      <div style={{ backgroundColor: surface, padding: '14px 56px', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {(studio.address || studio.gst_number || studio.website) ? (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {studio.address && <span style={{ fontSize: '11.5px', color: '#aaaaaa' }}>{studio.address.replace(/\n/g, ', ')}</span>}
            {studio.website && <span style={{ fontSize: '11.5px', color: '#aaaaaa' }}>{studio.website.replace(/^https?:\/\//, '')}</span>}
            {studio.gst_number && <span style={{ fontSize: '11.5px', color: '#aaaaaa' }}>GST: {studio.gst_number}</span>}
          </div>
        ) : (
          <span style={{ fontSize: '12.65px', color: '#aaaaaa' }}>Thank you for your business</span>
        )}
        <span style={{ fontSize: '11.5px', color: '#cccccc', letterSpacing: '0.05em' }}>SnapQuote</span>
      </div>
    </div>
  );
}
