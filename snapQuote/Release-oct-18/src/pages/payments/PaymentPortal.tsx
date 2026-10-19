import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, LogOut, ShieldCheck, FileText, Calendar,
  ChevronDown, ChevronUp, Receipt,
} from 'lucide-react';
import { formatCurrency, formatCurrencyDecimal } from '../../lib/currency';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
};

interface PortalInvoice {
  id: string;
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
  status: string;
  items: Array<{ id: string; name: string; price: number; enabled: boolean }>;
  created_at: string;
}

interface PortalPayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  note: string | null;
  created_at: string;
}

interface PortalStudio {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  owner_name: string;
  website: string;
}

export function PaymentPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studioId = searchParams.get('studio') ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [studio, setStudio] = useState<PortalStudio | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('cp_token');
    if (!token) {
      navigate(`/payment-login?studio=${studioId}`, { replace: true });
      return;
    }
    fetchData(token);
  }, [studioId, navigate]);

  async function fetchData(token: string) {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/client-payment-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'Apikey': ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem('cp_token');
          navigate(`/payment-login?studio=${studioId}`, { replace: true });
          return;
        }
        setError(data.error ?? 'Failed to load payment data.');
      } else {
        setInvoices(data.invoices ?? []);
        setPayments(data.payments ?? []);
        setStudio(data.studio);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  async function handleLogout() {
    const token = sessionStorage.getItem('cp_token');
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/client-payment-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
            'Apikey': ANON_KEY,
          },
          body: JSON.stringify({ action: 'logout', token }),
        });
      } catch { /* best effort */ }
    }
    sessionStorage.removeItem('cp_token');
    navigate(`/payment-login?studio=${studioId}`, { replace: true });
  }

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">{error}</p>
          <button onClick={handleLogout} className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Compute totals
  const totalInvoiced = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const paymentsByInvoice = new Map<string, number>();
  for (const p of payments) {
    paymentsByInvoice.set(p.invoice_id, (paymentsByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  }
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {studio?.logo_url ? (
              <img src={studio.logo_url} alt={studio.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{studio?.name ?? 'Payment Portal'}</p>
              <p className="text-xs text-slate-400 truncate">Secure Payment Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Total Invoiced</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalInvoiced)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-medium text-slate-400">Total Paid</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-medium text-slate-400">Balance Due</p>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${totalOutstanding <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {formatCurrency(totalOutstanding)}
            </p>
            <div className="mt-1.5">
              {totalOutstanding <= 0 && invoices.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> All Paid
                </span>
              ) : totalPaid > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                  <AlertCircle className="w-3 h-3" /> Partially Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                  <Clock className="w-3 h-3" /> Awaiting Payment
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Recent Payments</h2>
            <p className="text-xs text-slate-400 mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
          </div>
          {payments.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center px-6">
              <Clock className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No payments recorded yet</p>
              <p className="text-xs text-slate-400">Your payment history will appear here once payments are made.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 10).map(p => {
                const inv = invoices.find(i => i.id === p.invoice_id);
                return (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrencyDecimal(Number(p.amount))}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(p.payment_date)}
                        <span className="text-slate-300">·</span>
                        {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                        {inv && <><span className="text-slate-300">·</span>{inv.invoice_number}</>}
                        {p.note && <span className="text-slate-400">· {p.note}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">All Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          {invoices.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center px-6">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No invoices yet</p>
              <p className="text-xs text-slate-400">Invoices will appear here once they are created.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map(inv => {
                const paid = paymentsByInvoice.get(inv.id) ?? 0;
                const total = Number(inv.total);
                const remaining = Math.max(0, total - paid);
                const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                const isExpanded = expandedInvoice === inv.id;
                const invPayments = payments.filter(p => p.invoice_id === inv.id);
                return (
                  <div key={inv.id}>
                    <button
                      onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{inv.invoice_number}</span>
                          {remaining <= 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                            </span>
                          ) : paid > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Unpaid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{inv.client_name} · Issued {fmtDate(inv.issue_date)}</p>
                        <div className="mt-2 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
                        {remaining > 0 && <p className="text-xs text-amber-600 tabular-nums">{formatCurrency(remaining)} due</p>}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-5 bg-slate-50/50 space-y-4">
                        {/* Invoice items */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className="px-4 py-2 border-b border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Items</p>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {inv.items.filter(i => i.enabled !== false).map((item, idx) => (
                              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-400 shrink-0">{idx + 1}</span>
                                  <span className="text-sm text-slate-700 truncate">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">{formatCurrency(item.price)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Subtotal</span>
                              <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(Number(inv.subtotal))}</span>
                            </div>
                            {inv.gst_rate > 0 && (
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-slate-500">GST ({inv.gst_rate}%)</span>
                                <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(Number(inv.gst_amount))}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200">
                              <span className="text-xs font-bold text-slate-900">Total</span>
                              <span className="text-xs font-bold text-slate-900 tabular-nums">{formatCurrency(Number(inv.total))}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payments for this invoice */}
                        {invPayments.length > 0 && (
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payments ({invPayments.length})</p>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {invPayments.map(p => (
                                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-900 tabular-nums">{formatCurrencyDecimal(Number(p.amount))}</p>
                                      <p className="text-xs text-slate-500">{fmtDate(p.payment_date)} · {METHOD_LABELS[p.payment_method] ?? p.payment_method}{p.note ? ` · ${p.note}` : ''}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {inv.notes && (
                          <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{inv.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
