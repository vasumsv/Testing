import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Download, Eye, X, CheckCircle2, Clock, AlertCircle, MessageCircle, XCircle,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/currency';
import { formatCurrencyDecimal } from '../../../lib/currency';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Studio } from '../../../types';
import { InvoiceDocument, InvoiceData } from './InvoiceDocument';
import { generateQuotePdf } from '../quote-builder/generatePdf';

interface InvoiceFull {
  id: string;
  studio_id: string;
  quote_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  notes: string;
  status: 'unpaid' | 'partial' | 'paid';
  items: Array<{ id: string; name: string; price: number; enabled: boolean }>;
  created_at: string;
}

interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  payment_date: string;
  note: string | null;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
};

export function BillingDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceFull | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    method: 'cash' as InvoicePayment['payment_method'],
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [waSendStatus, setWaSendStatus] = useState<'sent' | 'failed' | 'not_configured' | null>(null);

  useEffect(() => {
    if (profile?.studio_id && invoiceId) fetchAll();
  }, [profile?.studio_id, invoiceId]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: inv }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', invoiceId!).eq('studio_id', profile!.studio_id).maybeSingle(),
      supabase.from('studios').select('*').eq('id', profile!.studio_id).maybeSingle(),
      supabase.from('invoice_payments').select('*').eq('invoice_id', invoiceId!).eq('studio_id', profile!.studio_id).order('payment_date', { ascending: false }),
    ]);
    setInvoice(inv as InvoiceFull | null);
    setStudio(s);
    setPayments((p ?? []) as InvoicePayment[]);
    setLoading(false);
  }

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = invoice ? Math.max(0, Number(invoice.total) - totalPaid) : 0;
  const pct = invoice && Number(invoice.total) > 0 ? Math.min(100, (totalPaid / Number(invoice.total)) * 100) : 0;
  const isFullyPaid = remaining <= 0;

  async function updateInvoiceStatus(paid: number, total: number) {
    if (!invoice) return;
    const status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    await supabase.from('invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', invoice.id);
  }

  async function sendPaymentWhatsApp(paidAmt: number, newRemaining: number, isComplete: boolean) {
    const phone = invoice?.client_phone ?? '';
    if (!phone || !profile?.studio_id) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/interakt-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studio_id: profile.studio_id,
          quote_id: invoice?.quote_id ?? null,
          invoice_id: invoice?.id ?? null,
          message_type: isComplete ? 'payment_complete' : 'payment_received',
          phone,
          body_values: isComplete
            ? [invoice?.client_name ?? 'there', formatCurrencyDecimal(paidAmt)]
            : [invoice?.client_name ?? 'there', formatCurrencyDecimal(paidAmt), formatCurrencyDecimal(newRemaining)],
        }),
      });

      let json: any = {};
      try { json = await res.json(); } catch { /* non-JSON */ }

      if (json.configured === false) {
        setWaSendStatus('not_configured');
      } else if (json.success === true) {
        setWaSendStatus('sent');
      } else {
        setWaSendStatus('failed');
      }
    } catch (err) {
      console.error('[BillingDetail] interakt-send network error:', err);
      setWaSendStatus('failed');
    }
  }

  async function handleAddPayment() {
    if (!invoice || !profile?.studio_id) return;
    setFormError('');
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount.'); return; }
    if (amt > remaining + 0.01) { setFormError(`Amount exceeds outstanding balance of ${formatCurrency(remaining)}.`); return; }
    setSaving(true);
    const { error } = await supabase.from('invoice_payments').insert({
      studio_id: profile.studio_id,
      invoice_id: invoice.id,
      amount: amt,
      payment_method: form.method,
      payment_date: form.date,
      note: form.note.trim() || null,
    });
    if (error) { setFormError('Failed to save payment. Try again.'); setSaving(false); return; }
    const newPaid = totalPaid + amt;
    const newRemaining = Math.max(0, Number(invoice.total) - newPaid);
    const isComplete = newRemaining <= 0;
    await updateInvoiceStatus(newPaid, Number(invoice.total));
    setSaving(false);
    setAddModal(false);
    setForm({ amount: '', method: 'cash', date: new Date().toISOString().slice(0, 10), note: '' });
    fetchAll();
    await sendPaymentWhatsApp(amt, newRemaining, isComplete);
  }

  async function handleDelete() {
    if (!deleteId || !invoice) return;
    setDeleting(true);
    await supabase.from('invoice_payments').delete().eq('id', deleteId);
    const delPmt = payments.find(p => p.id === deleteId);
    const newPaid = totalPaid - (delPmt ? Number(delPmt.amount) : 0);
    await updateInvoiceStatus(newPaid, Number(invoice.total));
    setDeleting(false);
    setDeleteId(null);
    fetchAll();
  }

  function buildInvoiceData(): InvoiceData | null {
    if (!invoice || !studio) return null;
    return {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      client_phone: invoice.client_phone,
      subtotal: Number(invoice.subtotal),
      gst_rate: Number(invoice.gst_rate),
      gst_amount: Number(invoice.gst_amount),
      total: Number(invoice.total),
      notes: invoice.notes,
      items: invoice.items,
      studio: {
        name: studio.name ?? '',
        email: studio.email ?? '',
        phone: studio.phone ?? '',
        address: studio.address ?? '',
        website: studio.website ?? '',
        gst_number: studio.gst_number ?? '',
        owner_name: studio.owner_name ?? '',
        logo_url: studio.logo_url ?? '',
      },
      payments: payments.map(p => ({
        amount: Number(p.amount),
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        note: p.note,
      })),
    };
  }

  async function handleDownload() {
    if (!previewRef.current || !invoice) return;
    setDownloading(true);
    try {
      await generateQuotePdf(previewRef.current, `${invoice.invoice_number}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-ink-muted text-sm">Invoice not found.</p>
        <Button variant="secondary" onClick={() => navigate('/app/invoices')}>Back to Invoices</Button>
      </div>
    );
  }

  const invData = buildInvoiceData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/app/invoices')}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[1.5rem] font-semibold text-ink tracking-tight leading-tight">{invoice.invoice_number}</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {invoice.client_name}
            {invoice.client_email ? ` · ${invoice.client_email}` : ''}
            {' · '}Issued {fmtDate(invoice.issue_date)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-3.5 h-3.5" />}
            loading={downloading}
            onClick={() => { setPreviewOpen(true); setTimeout(handleDownload, 400); }}
          >
            Download PDF
          </Button>
          {!isFullyPaid && (
            <Button
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => { setFormError(''); setWaSendStatus(null); setAddModal(true); }}
            >
              Add Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1">Invoice Total</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{formatCurrency(Number(invoice.total))}</p>
          {invoice.gst_rate > 0 && (
            <p className="text-xs text-ink-subtle mt-0.5">incl. GST {invoice.gst_rate}%</p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
          <div className="mt-2 h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1">Balance Due</p>
          <p className={`text-2xl font-bold tabular-nums ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
            {formatCurrency(remaining)}
          </p>
          <div className="mt-1.5">
            {isFullyPaid ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Paid in Full</span>
            ) : totalPaid > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700"><AlertCircle className="w-3 h-3" /> Partially Paid</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><Clock className="w-3 h-3" /> Awaiting Payment</span>
            )}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1">Payments</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{payments.length}</p>
          <p className="text-xs text-ink-subtle mt-0.5">transaction{payments.length !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Payment History</h3>
              <p className="text-xs text-ink-muted mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
            </div>
            {!isFullyPaid && (
              <button
                onClick={() => { setFormError(''); setWaSendStatus(null); setAddModal(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center px-6">
              <Clock className="w-8 h-8 text-ink-subtle opacity-40" />
              <p className="text-sm font-medium text-ink-muted">No payments recorded yet</p>
              <p className="text-xs text-ink-subtle">Click "Add Payment" to record the first payment.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(Number(p.amount))}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {METHOD_LABELS[p.payment_method]} · {fmtDate(p.payment_date)}
                      {p.note && <span className="text-ink-subtle"> · {p.note}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-ink-subtle hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-ink">Invoice Items</h3>
            <p className="text-xs text-ink-muted mt-0.5">{invoice.items.filter(i => i.enabled !== false).length} line items</p>
          </div>
          <div className="divide-y divide-border">
            {invoice.items.filter(i => i.enabled !== false).map((item, idx) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-surface-raised text-[10px] font-bold text-ink-subtle shrink-0">{idx + 1}</span>
                  <span className="text-sm text-ink truncate">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums shrink-0">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border bg-surface-raised/40">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink tabular-nums">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {invoice.gst_rate > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-ink-muted">GST ({invoice.gst_rate}%)</span>
                <span className="font-semibold text-ink tabular-nums">{formatCurrency(Number(invoice.gst_amount))}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-sm font-bold text-ink">Total</span>
              <span className="text-sm font-bold text-ink tabular-nums">{formatCurrency(Number(invoice.total))}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Payment"
        description={`Invoice ${invoice.invoice_number} — outstanding: ${formatCurrency(remaining)}`}
        width="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">₹</span>
              <input
                type="number" min="1" step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder={String(remaining)}
                className="w-full bg-surface-raised border border-border rounded-md pl-7 pr-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Payment Method</label>
            <select
              value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value as InvoicePayment['payment_method'] }))}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            >
              {Object.entries(METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Payment Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Note <span className="text-ink-subtle font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Advance payment, Final settlement..."
              className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">A WhatsApp payment confirmation will be sent via Interakt after saving (requires API key + template configured in Settings → WhatsApp).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleAddPayment}>Save Payment</Button>
          </div>
        </div>
      </Modal>

      {waSendStatus === 'sent' && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">WhatsApp payment notification sent via Interakt.</p>
        </div>
      )}
      {waSendStatus === 'failed' && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Interakt send failed — notification not delivered.</p>
            <p className="text-xs text-red-600 mt-0.5">Check your API key and payment template in <a href="/app/settings?tab=whatsapp" className="underline font-medium">Settings → WhatsApp</a>. See Supabase edge function logs for details.</p>
          </div>
        </div>
      )}
      {waSendStatus === 'not_configured' && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-700 font-medium">WhatsApp notification not sent — Interakt not configured.</p>
            <p className="text-xs text-amber-600 mt-0.5"><a href="/app/settings?tab=whatsapp" className="underline font-medium">Add your Interakt API key and payment templates</a> to enable automatic sending.</p>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Payment"
        description="Remove this payment record? This cannot be undone."
        width="sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button size="sm" loading={deleting} onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700">Delete</Button>
        </div>
      </Modal>

      {previewOpen && invData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-[900px] w-full max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-ink">{invoice.invoice_number}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{invoice.client_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-5 bg-gray-100">
              <div className="mx-auto shadow-xl" style={{ maxWidth: '794px', width: '100%', minWidth: '320px' }}>
                <div ref={previewRef}>
                  <InvoiceDocument data={invData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
