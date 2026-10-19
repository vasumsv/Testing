import { forwardRef } from 'react';
import { formatCurrency } from '../../../lib/currency';

export interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  notes: string;
  items: Array<{ id: string; name: string; price: number; enabled: boolean }>;
  studio: {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    gst_number: string;
    owner_name: string;
    logo_url: string;
  };
  payments?: Array<{
    amount: number;
    payment_method: string;
    payment_date: string;
    note: string | null;
  }>;
  quote_number?: string;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
};

export const InvoiceDocument = forwardRef<HTMLDivElement, { data: InvoiceData }>(
  ({ data }, ref) => {
    const enabledItems = data.items.filter(i => i.enabled !== false);
    const totalPaid = (data.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(0, data.total - totalPaid);
    const hasGst = data.gst_rate > 0 && data.gst_amount > 0;

    return (
      <div
        id="invoice-pdf-document"
        ref={ref}
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '14.95px',
          color: '#1a1a1a',
          lineHeight: '1.5',
          padding: '56px 60px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            {data.studio.logo_url ? (
              <img
                src={data.studio.logo_url}
                alt={data.studio.name}
                style={{ height: '48px', objectFit: 'contain', marginBottom: '10px', display: 'block' }}
                crossOrigin="anonymous"
              />
            ) : (
              <p style={{ fontSize: '23px', fontWeight: '700', color: '#111', marginBottom: '10px' }}>{data.studio.name}</p>
            )}
            <p style={{ fontSize: '13.8px', color: '#555', lineHeight: '1.7' }}>
              {data.studio.address && <span>{data.studio.address}<br /></span>}
              {data.studio.phone && <span>{data.studio.phone}<br /></span>}
              {data.studio.email && <span>{data.studio.email}<br /></span>}
              {data.studio.gst_number && <span>GSTIN: {data.studio.gst_number}</span>}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '32.2px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>INVOICE</p>
            <p style={{ fontSize: '14.95px', fontWeight: '600', color: '#444', marginTop: '6px' }}>{data.invoice_number}</p>
            {data.quote_number && (
              <p style={{ fontSize: '12.65px', color: '#888', marginTop: '4px' }}>Ref: {data.quote_number}</p>
            )}
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb', marginBottom: '28px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '8px' }}>Bill To</p>
            <p style={{ fontSize: '17.25px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>{data.client_name}</p>
            {data.client_email && <p style={{ fontSize: '13.8px', color: '#555' }}>{data.client_email}</p>}
            {data.client_phone && <p style={{ fontSize: '13.8px', color: '#555' }}>{data.client_phone}</p>}
          </div>
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '4px' }}>Issue Date</p>
              <p style={{ fontSize: '13.8px', fontWeight: '600', color: '#111' }}>{fmt(data.issue_date)}</p>
            </div>
            {data.due_date && (
              <div>
                <p style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '4px' }}>Due Date</p>
                <p style={{ fontSize: '13.8px', fontWeight: '600', color: '#111' }}>{fmt(data.due_date)}</p>
              </div>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', borderBottom: '1px solid #e5e7eb' }}>#</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', borderBottom: '1px solid #e5e7eb' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {enabledItems.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '11px 14px', fontSize: '13.8px', color: '#888', verticalAlign: 'top' }}>{idx + 1}</td>
                <td style={{ padding: '11px 14px', fontSize: '14.95px', color: '#1a1a1a', verticalAlign: 'top' }}>{item.name}</td>
                <td style={{ padding: '11px 14px', fontSize: '14.95px', color: '#1a1a1a', textAlign: 'right', fontWeight: '500', verticalAlign: 'top' }}>{formatCurrency(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div style={{ minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14.95px' }}>
              <span style={{ color: '#555' }}>Subtotal</span>
              <span style={{ fontWeight: '500', color: '#1a1a1a' }}>{formatCurrency(data.subtotal)}</span>
            </div>
            {hasGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14.95px' }}>
                <span style={{ color: '#555' }}>GST ({data.gst_rate}%)</span>
                <span style={{ fontWeight: '500', color: '#1a1a1a' }}>{formatCurrency(data.gst_amount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #111', marginTop: '2px', fontSize: '17.25px' }}>
              <span style={{ fontWeight: '700', color: '#111' }}>Total</span>
              <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(data.total)}</span>
            </div>
            {(data.payments ?? []).length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14.95px' }}>
                  <span style={{ color: '#059669', fontWeight: '600' }}>Paid</span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>- {formatCurrency(totalPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16.1px' }}>
                  <span style={{ fontWeight: '700', color: remaining > 0 ? '#b45309' : '#059669' }}>Balance Due</span>
                  <span style={{ fontWeight: '800', color: remaining > 0 ? '#b45309' : '#059669' }}>{formatCurrency(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {(data.payments ?? []).length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '10px' }}>Payment History</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '1px solid #e5e7eb' }}>Note</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.payments!.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontSize: '13.8px', color: '#444' }}>{fmt(p.payment_date)}</td>
                    <td style={{ padding: '8px 12px', fontSize: '13.8px', color: '#444' }}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</td>
                    <td style={{ padding: '8px 12px', fontSize: '13.8px', color: '#888' }}>{p.note ?? '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '13.8px', color: '#059669', fontWeight: '600', textAlign: 'right' }}>{formatCurrency(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.notes && (
          <div style={{ marginBottom: '28px', padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #d1d5db' }}>
            <p style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '6px' }}>Notes</p>
            <p style={{ fontSize: '13.8px', color: '#555', lineHeight: '1.6' }}>{data.notes}</p>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '40px', left: '60px', right: '60px' }}>
          <div style={{ width: '100%', height: '1px', backgroundColor: '#e5e7eb', marginBottom: '14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '12.65px', color: '#aaa' }}>{data.studio.name}</p>
            <p style={{ fontSize: '12.65px', color: '#aaa' }}>Thank you for your business.</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceDocument.displayName = 'InvoiceDocument';
