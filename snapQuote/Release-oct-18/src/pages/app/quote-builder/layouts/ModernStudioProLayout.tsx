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
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatToday() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function validUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Strict B&W palette
const C = {
  black: '#000000',
  white: '#ffffff',
  gray900: '#111111',
  gray700: '#333333',
  gray500: '#555555',
  gray400: '#777777',
  gray200: '#cccccc',
  gray100: '#e8e8e8',
  gray50: '#f5f5f5',
};

const label = {
  fontSize: '10.35px',
  fontWeight: 700 as const,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gray400,
};

const sectionTitle = {
  fontSize: '12.65px',
  fontWeight: 800 as const,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.black,
};

export function ModernStudioProLayout({ studio, lead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }: Props) {
  const enabledItems = items.filter(i => i.enabled);
  const subtotal = enabledItems.reduce((s, i) => s + i.price, 0);
  const finalNum = parseFloat(finalPrice) || 0;
  const hasFinalPrice = finalPrice !== '' && finalNum > 0;
  const baseAmount = hasFinalPrice ? finalNum : subtotal;
  const discountAmount = hasFinalPrice && finalNum < subtotal ? subtotal - finalNum : 0;
  const gstAmount = quoteOptions?.includeGst ? Math.round(baseAmount * 0.18 * 100) / 100 : 0;
  const displayTotal = Math.round((baseAmount + gstAmount) * 100) / 100;

  const hasDeliverables = quoteOptions?.showDeliverables !== false
    && (quoteOptions?.deliverableMode ?? 'default') === 'package'
    && quoteOptions?.packageDeliverables
    && quoteOptions.packageDeliverables.length > 0;

  const hasTerms = (quoteOptions?.showDefaultTerms !== false && !!studio.terms_and_conditions)
    || (quoteOptions?.showAdditionalTerms && (quoteOptions?.additionalTerms?.length ?? 0) > 0);

  const hasPaymentDetails = quoteOptions?.showPaymentDetails
    && studio.payment_details
    && (studio.payment_details.account_holder || studio.payment_details.upi_id || studio.payment_details.account_number);

  const hasPortfolio = quoteOptions?.showPortfolio !== false
    && studio.portfolio_images
    && studio.portfolio_images.length > 0;

  const Rule = ({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) => (
    <div style={{ height: '1px', background: C.gray100, marginTop: mt, marginBottom: mb }} />
  );

  const ThickRule = ({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) => (
    <div style={{ height: '2px', background: C.black, marginTop: mt, marginBottom: mb }} />
  );

  return (
    <div
      id="quote-pdf-document"
      style={{
        width: '794px',
        backgroundColor: quoteOptions?.backgroundImageUrl ? 'transparent' : C.white,
        color: C.black,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '16.1px',
        lineHeight: '1.5',
        position: 'relative',
      }}
    >
      {quoteOptions?.showWatermark && studio.watermark_url && <WatermarkOverlay url={studio.watermark_url} />}

      {/* ── TOP BAR ── */}
      <div style={{ height: '4px', background: C.black }} />

      {/* ── HEADER ── */}
      <div style={{ padding: '44px 56px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '32px' }}>

          {/* Studio identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            {studio.logo_url ? (
              <img
                src={studio.logo_url}
                alt="Logo"
                crossOrigin="anonymous"
                style={{
                  width: '56px', height: '56px', borderRadius: '4px',
                  objectFit: 'cover', border: `1px solid ${C.gray100}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: '56px', height: '56px', borderRadius: '4px',
                border: `2px solid ${C.black}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: '27.6px', fontWeight: 800, color: C.black, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {studio.name || 'Studio Name'}
              </div>
              {studio.owner_name && (
                <div style={{ fontSize: '13.8px', color: C.gray500, marginTop: '3px', fontWeight: 400 }}>
                  {studio.owner_name}
                </div>
              )}
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {studio.phone && (
                  <span style={{ fontSize: '12.65px', color: C.gray500 }}>{studio.phone}</span>
                )}
                {studio.email && (
                  <span style={{ fontSize: '12.65px', color: C.gray500 }}>{studio.email}</span>
                )}
                {studio.website && (
                  <span style={{ fontSize: '12.65px', color: C.gray500 }}>{studio.website.replace(/^https?:\/\//, '')}</span>
                )}
                {studio.address && (
                  <span style={{ fontSize: '12.65px', color: C.gray500, lineHeight: '1.5' }}>{studio.address.replace(/\n/g, ' · ')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quote meta */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ ...label, marginBottom: '6px' }}>Quotation</div>
            <div style={{ fontSize: '32.2px', fontWeight: 800, color: C.black, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {quoteNumber}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...label, marginBottom: '2px' }}>Date</div>
                <div style={{ fontSize: '12.65px', color: C.gray700 }}>{formatToday()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...label, marginBottom: '2px' }}>Valid Until</div>
                <div style={{ fontSize: '12.65px', color: C.gray700 }}>{validUntil()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ThickRule />

      {/* ── CLIENT SECTION ── */}
      {lead && (
        <div style={{ padding: '28px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '16px' }}>Prepared For</div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '25.3px', fontWeight: 800, color: C.black, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                {lead.full_name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
                {lead.phone && <span style={{ fontSize: '13.8px', color: C.gray500 }}>{lead.phone}</span>}
                {lead.email && <span style={{ fontSize: '13.8px', color: C.gray500 }}>{lead.email}</span>}
              </div>
            </div>
            <div>
              {lead.event_type && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ ...label, marginBottom: '4px' }}>Event Type</div>
                  <div style={{ fontSize: '16.1px', fontWeight: 700, color: C.black }}>{lead.event_type}</div>
                </div>
              )}
              {quoteOptions?.events && quoteOptions.events.filter(e => e.name || e.date || e.time).length > 0 ? (
                <div>
                  <div style={{ ...label, marginBottom: '6px' }}>Events</div>
                  {quoteOptions.events.filter(e => e.name || e.date || e.time).map(e => (
                    <div key={e.id} style={{
                      paddingLeft: '10px',
                      borderLeft: `2px solid ${C.black}`,
                      marginBottom: '6px',
                    }}>
                      {e.name && <div style={{ fontSize: '13.8px', fontWeight: 700, color: C.black }}>{e.name}</div>}
                      {(e.date || e.time) && (
                        <div style={{ fontSize: '12.65px', color: C.gray500, marginTop: e.name ? '1px' : '0' }}>
                          {e.date ? formatEventDate(e.date) : ''}{e.date && e.time ? ' · ' : ''}{e.time ?? ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : lead.event_date ? (
                <div>
                  <div style={{ ...label, marginBottom: '4px' }}>Event Date</div>
                  <div style={{ fontSize: '13.8px', color: C.gray700 }}>{formatEventDate(lead.event_date)}</div>
                </div>
              ) : null}
            </div>
          </div>
          <Rule mt={24} />
        </div>
      )}

      {/* ── SERVICES TABLE ── */}
      <div style={{ padding: lead ? '0 56px 0' : '28px 56px 0' }}>
        {!lead && <div style={{ ...sectionTitle, marginBottom: '20px' }}>{quoteOptions?.serviceName || 'Services & Packages'}</div>}
        {lead && <div style={{ ...sectionTitle, marginBottom: '16px' }}>{quoteOptions?.serviceName || 'Services & Packages'}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.black }}>
              <th style={{ width: '40px', padding: '11px 16px 11px 20px', textAlign: 'left', fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.white }}>#</th>
              <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.white }}>Package / Service</th>
              <th style={{ padding: '11px 20px 11px 16px', textAlign: 'right', fontSize: '10.35px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.white }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {enabledItems.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '40px 20px', textAlign: 'center', fontSize: '14.95px', color: C.gray200, fontStyle: 'italic', borderBottom: `1px solid ${C.gray100}` }}>
                  No services added yet
                </td>
              </tr>
            ) : (() => {
              let rowIndex = 0;
              return enabledItems.map((item, i) => {
                const isHeader = item.isPackageHeader;
                const isInclude = !!item.packageId && !item.isPackageHeader;
                if (!isInclude) rowIndex++;
                const displayIndex = isInclude ? null : rowIndex;
                const isEven = i % 2 === 0;

                return (
                  <tr key={item.id} style={{
                    background: isHeader ? C.gray50 : isEven ? C.white : '#fafafa',
                    borderBottom: `1px solid ${C.gray100}`,
                  }}>
                    <td style={{
                      padding: isInclude ? '5px 16px 5px 20px' : '14px 16px 14px 20px',
                      fontSize: '12.65px',
                      fontWeight: 700,
                      color: isInclude ? 'transparent' : C.gray400,
                      verticalAlign: 'middle',
                    }}>
                      {displayIndex ?? ''}
                    </td>
                    <td style={{
                      padding: isInclude ? '5px 16px' : '14px 16px',
                      verticalAlign: 'middle',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isInclude && (
                          <span style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: C.gray400, flexShrink: 0,
                            display: 'inline-block',
                          }} />
                        )}
                        <span style={{
                          fontSize: isHeader ? '13px' : isInclude ? '11px' : '13px',
                          fontWeight: isHeader ? 700 : isInclude ? 400 : 500,
                          color: isHeader ? C.black : isInclude ? C.gray500 : C.gray900,
                        }}>
                          {isHeader ? item.name.replace(/\s*\(Package\)\s*$/i, '').trim() : item.name}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: isInclude ? '5px 20px 5px 16px' : '14px 20px 14px 16px',
                      textAlign: 'right',
                      fontSize: isInclude ? '11px' : '13px',
                      fontWeight: isHeader ? 700 : isInclude ? 400 : 500,
                      color: isInclude && item.price === 0 ? 'transparent' : C.gray900,
                      fontVariantNumeric: 'tabular-nums',
                      verticalAlign: 'middle',
                    }}>
                      {isInclude && item.price === 0 ? '—' : formatCurrencyDecimal(item.price)}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* ── PRICING SUMMARY ── */}
      <div style={{ padding: '20px 56px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '260px' }}>
            {subtotal !== displayTotal && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ fontSize: '13.8px', color: C.gray500 }}>Subtotal</span>
                  <span style={{ fontSize: '13.8px', color: C.gray700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(subtotal)}</span>
                </div>
                {showDiscount && discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.gray100}` }}>
                    <span style={{ fontSize: '13.8px', color: C.gray500 }}>Discount</span>
                    <span style={{ fontSize: '13.8px', color: C.gray700, fontVariantNumeric: 'tabular-nums' }}>−{formatCurrencyDecimal(discountAmount)}</span>
                  </div>
                )}
                {quoteOptions?.includeGst && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.gray100}` }}>
                    <span style={{ fontSize: '13.8px', color: C.gray500 }}>GST (18%)</span>
                    <span style={{ fontSize: '13.8px', color: C.gray700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(gstAmount)}</span>
                  </div>
                )}
              </>
            )}
            {subtotal === displayTotal && quoteOptions?.includeGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.gray100}` }}>
                <span style={{ fontSize: '13.8px', color: C.gray500 }}>GST (18%)</span>
                <span style={{ fontSize: '13.8px', color: C.gray700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyDecimal(gstAmount)}</span>
              </div>
            )}
            {/* Grand Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0 0',
              borderTop: `2px solid ${C.black}`,
              marginTop: '8px',
            }}>
              <span style={{
                fontSize: '13.8px', fontWeight: 700, color: C.black,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Grand Total{quoteOptions?.includeGst ? ' (incl. GST)' : ''}
              </span>
              <span style={{
                fontSize: '34.5px', fontWeight: 800, color: C.black,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
              }}>
                {formatCurrencyDecimal(displayTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Rule />

      {/* ── DELIVERABLES ── */}
      {hasDeliverables && (
        <div style={{ padding: '32px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '20px' }}>What's Included</div>
          <div style={{ display: 'grid', gridTemplateColumns: quoteOptions!.packageDeliverables!.length === 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {quoteOptions!.packageDeliverables!.map(pkg => (
              <div key={pkg.packageId}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: C.black, marginBottom: '8px' }}>{pkg.packageName}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {pkg.deliverables.map((d, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', borderBottom: `1px solid ${C.gray100}` }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="M2 6l3 3 5-5" stroke={C.black} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: '13.8px', color: C.gray700, lineHeight: '1.5' }}>{d}</span>
                    </div>
                  ))}
                </div>
                {pkg.terms && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.gray100}` }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gray400, marginBottom: '6px' }}>
                      Terms &amp; Conditions
                    </div>
                    <div style={{ fontSize: '12.65px', color: C.gray700, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {pkg.terms}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Rule mt={24} />
        </div>
      )}

      {/* ── PORTFOLIO ── */}
      {hasPortfolio && (
        <div style={{ padding: hasDeliverables ? '0 56px 32px' : '32px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '20px' }}>Portfolio</div>
          {(() => {
            const imgs = studio.portfolio_images!.slice(0, 9);
            const cols = imgs.length <= 2 ? imgs.length : imgs.length <= 4 ? 2 : 3;
            const rows: typeof imgs[] = [];
            for (let i = 0; i < imgs.length; i += cols) rows.push(imgs.slice(i, i + cols));
            return rows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px', marginBottom: ri < rows.length - 1 ? '6px' : '0' }}>
                {row.map(img => (
                  <div key={img.url} style={{ borderRadius: '2px', overflow: 'hidden', position: 'relative', background: C.gray50, height: '200px', border: `1px solid ${C.gray100}` }}>
                    <img src={img.url} alt={img.caption || 'Portfolio'} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {img.caption && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '12px 8px 5px', fontSize: '10.35px', color: C.white, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
          <Rule mt={24} />
        </div>
      )}

      {/* ── DETAILS SECTION ── */}
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
          <div style={{ padding: (hasDeliverables || hasPortfolio) ? '0 56px 32px' : '32px 56px' }}>
            <div style={{ ...sectionTitle, marginBottom: '16px' }}>Deliverables</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {deliverablesItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', borderBottom: `1px solid ${C.gray100}` }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M2 6l3 3 5-5" stroke={C.black} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '13.8px', color: C.gray700, lineHeight: '1.5' }}>{item}</span>
                </div>
              ))}
            </div>
            <Rule mt={24} />
          </div>
        );
      })()}

      {/* ── SIGNATURE ── */}
      {quoteOptions?.includeSignature && (
        <div style={{ padding: '32px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '20px' }}>Customer Acceptance</div>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ height: '52px', border: `1px solid ${C.gray200}`, borderRadius: '2px', marginBottom: '8px' }} />
              <div style={{ ...label }}>Customer Signature &amp; Date</div>
            </div>
            {lead && (
              <div style={{ flex: 1, minWidth: '180px', paddingTop: '6px' }}>
                <div style={{ fontSize: '14.95px', fontWeight: 700, color: C.black }}>{lead.full_name}</div>
                {lead.event_type && <div style={{ fontSize: '13.8px', color: C.gray500, marginTop: '3px' }}>{lead.event_type}</div>}
                <div style={{ height: '1px', background: C.gray200, margin: '10px 0 6px' }} />
                <div style={{ ...label }}>Name &amp; Date</div>
              </div>
            )}
          </div>
          <Rule mt={24} />
        </div>
      )}

      {/* ── PAYMENT DETAILS ── */}
      {hasPaymentDetails && (
        <div style={{ padding: '32px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '16px' }}>Payment Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 48px' }}>
            {studio.payment_details!.account_holder && (
              <div>
                <div style={{ ...label, marginBottom: '4px' }}>Account Holder</div>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: C.black }}>{studio.payment_details!.account_holder}</div>
              </div>
            )}
            {studio.payment_details!.bank_name && (
              <div>
                <div style={{ ...label, marginBottom: '4px' }}>Bank</div>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: C.black }}>{studio.payment_details!.bank_name}</div>
              </div>
            )}
            {studio.payment_details!.account_number && (
              <div>
                <div style={{ ...label, marginBottom: '4px' }}>Account Number</div>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: C.black, fontVariantNumeric: 'tabular-nums' }}>{studio.payment_details!.account_number}</div>
              </div>
            )}
            {studio.payment_details!.ifsc_code && (
              <div>
                <div style={{ ...label, marginBottom: '4px' }}>IFSC Code</div>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: C.black }}>{studio.payment_details!.ifsc_code}</div>
              </div>
            )}
            {studio.payment_details!.upi_id && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ ...label, marginBottom: '4px' }}>UPI ID</div>
                <div style={{ fontSize: '14.95px', fontWeight: 600, color: C.black }}>{studio.payment_details!.upi_id}</div>
              </div>
            )}
          </div>
          {studio.payment_details!.notes && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.gray100}` }}>
              <div style={{ ...label, marginBottom: '4px' }}>Note</div>
              <div style={{ fontSize: '12.65px', color: C.gray700, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{studio.payment_details!.notes}</div>
            </div>
          )}
          <Rule mt={24} />
        </div>
      )}

      {/* ── TERMS & CONDITIONS ── */}
      {hasTerms && (
        <div style={{ padding: '32px 56px' }}>
          <div style={{ ...sectionTitle, marginBottom: '16px' }}>Terms &amp; Conditions</div>
          {quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions && (
            <div style={{ fontSize: '12.65px', color: C.gray700, lineHeight: '1.85', whiteSpace: 'pre-wrap' }}>
              {studio.terms_and_conditions}
            </div>
          )}
          {quoteOptions?.showAdditionalTerms && (quoteOptions?.additionalTerms?.length ?? 0) > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '8px',
              marginTop: quoteOptions?.showDefaultTerms !== false && studio.terms_and_conditions ? '12px' : '0',
            }}>
              {quoteOptions!.additionalTerms!.map((term, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.black, flexShrink: 0, minWidth: '16px', marginTop: '1px' }}>
                    •
                  </span>
                  <span style={{ fontSize: '12.65px', color: C.gray700, lineHeight: '1.85' }}>{term}</span>
                </div>
              ))}
            </div>
          )}
          <Rule mt={24} />
        </div>
      )}

      {/* ── CLOSING MESSAGE ── */}
      <div style={{ padding: '32px 56px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '2px', background: C.black, margin: '0 auto 20px' }} />
        <div style={{ fontSize: '17.25px', fontWeight: 700, color: C.black, letterSpacing: '-0.01em' }}>
          Thank you for considering {studio.name || 'us'} for your special occasion.
        </div>
        <div style={{ fontSize: '13.8px', color: C.gray500, marginTop: '6px', lineHeight: '1.6' }}>
          We would be delighted to capture your memories and make your event truly unforgettable.
        </div>
        {(studio.phone || studio.email) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '14px' }}>
            {studio.phone && <span style={{ fontSize: '12.65px', color: C.gray700, fontWeight: 600 }}>{studio.phone}</span>}
            {studio.email && <span style={{ fontSize: '12.65px', color: C.gray700, fontWeight: 600 }}>{studio.email}</span>}
            {studio.website && <span style={{ fontSize: '12.65px', color: C.gray700, fontWeight: 600 }}>{studio.website.replace(/^https?:\/\//, '')}</span>}
          </div>
        )}
        <div style={{ width: '48px', height: '2px', background: C.black, margin: '20px auto 0' }} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ height: '4px', background: C.black }} />
      <div style={{
        padding: '10px 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `1px solid ${C.gray100}`,
      }}>
        <span style={{ fontSize: '11.5px', color: C.gray400 }}>
          {studio.gst_number ? `GST: ${studio.gst_number}` : ''}
        </span>
        <span style={{ fontSize: '11.5px', color: C.gray400, letterSpacing: '0.06em' }}>
          Generated with SnapQuote
        </span>
      </div>
    </div>
  );
}
