import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Search, X,
  Eye, EyeOff, Calendar, LogOut, Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/currency';
import { useAuth } from '../../../contexts/AuthContext';
import { useSectionAuth } from '../../../contexts/SectionAuthContext';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BillingOverview } from './BillingOverview';
import { Quote } from '../../../types';

interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  note: string | null;
  created_at: string;
  invoice_number?: string;
  client_name?: string;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
};

export function PaymentsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { signOut: signOutPayments, loginRequired } = useSectionAuth('payments');

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [paySearch, setPaySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [showAmounts, setShowAmounts] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  function applyDatePreset(preset: string) {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    let from = '';
    let to = '';
    switch (preset) {
      case 'today':
        from = fmt(today); to = fmt(today);
        break;
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        from = fmt(y); to = fmt(y);
        break;
      }
      case 'this_week': {
        const day = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        from = fmt(monday); to = fmt(today);
        break;
      }
      case 'this_month': {
        from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
        to = fmt(today);
        break;
      }
      case 'last_month': {
        from = fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        to = fmt(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      }
      case 'custom':
        return;
    }
    setDateFrom(from);
    setDateTo(to);
  }

  useEffect(() => {
    if (profile?.studio_id) {
      fetchPayments();
      fetchQuotes();
    } else {
      setPayLoading(false);
    }
  }, [profile?.studio_id]);

  async function fetchQuotes() {
    const { data } = await supabase
      .from('quotes')
      .select('id, quote_number, client_name, amount, status, final_price, show_discount, deleted_at, created_at')
      .eq('studio_id', profile!.studio_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setQuotes(data ?? []);
  }

  async function fetchPayments() {
    setPayLoading(true);
    const { data } = await supabase
      .from('invoice_payments')
      .select('id, invoice_id, amount, payment_method, payment_date, note, created_at')
      .eq('studio_id', profile!.studio_id)
      .order('payment_date', { ascending: false });

    if (data) {
      const invIds = [...new Set(data.map(p => p.invoice_id))];
      const { data: invData } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name')
        .in('id', invIds);
      const invMap = new Map<string, { invoice_number: string; client_name: string }>();
      for (const inv of invData ?? []) {
        invMap.set(inv.id, { invoice_number: inv.invoice_number, client_name: inv.client_name });
      }
      setPayments(data.map(p => ({
        ...p,
        invoice_number: invMap.get(p.invoice_id)?.invoice_number,
        client_name: invMap.get(p.invoice_id)?.client_name,
      })));
    } else {
      setPayments([]);
    }
    setPayLoading(false);
  }

  const filteredPayments = useMemo(() => {
    const q = paySearch.trim().toLowerCase();
    let result = payments;
    if (q) {
      result = result.filter(p =>
        (p.invoice_number ?? '').toLowerCase().includes(q) ||
        (p.client_name ?? '').toLowerCase().includes(q) ||
        (p.note ?? '').toLowerCase().includes(q) ||
        (METHOD_LABELS[p.payment_method] ?? '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(p => new Date(p.payment_date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.payment_date) <= to);
    }
    return result;
  }, [payments, paySearch, dateFrom, dateTo]);

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Payments</h2>
          <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">
            Track and manage payments
          </p>
        </div>
        {loginRequired && (
        <button
          onClick={() => signOutPayments()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Payments Logout
        </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1.5">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-ink-subtle mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-medium text-ink-muted mb-1.5">In Selected Range</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{formatCurrency(filteredPayments.reduce((s, p) => s + Number(p.amount), 0))}</p>
          <p className="text-xs text-ink-subtle mt-1">{filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}{dateFrom || dateTo ? ' in filter' : ''}</p>
        </div>
      </div>

      {quotes.length > 0 && <BillingOverview quotes={quotes} />}

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Payment Records</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                {showAmounts
                  ? `${filteredPayments.length} payment${filteredPayments.length !== 1 ? 's' : ''}${dateFrom || dateTo ? ' in selected range' : ''}`
                  : 'Payment amounts are hidden. Click "View Payments" to reveal them.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAmounts(s => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
              >
                {showAmounts ? <><EyeOff className="w-3.5 h-3.5" /> Hide Amounts</> : <><Eye className="w-3.5 h-3.5" /> View Payments</>}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
                <input
                  type="text"
                  value={paySearch}
                  onChange={e => setPaySearch(e.target.value)}
                  placeholder="Search invoice, client, method..."
                  className="w-full bg-surface-raised border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                <select
                  value={datePreset}
                  onChange={e => {
                    const val = e.target.value;
                    setDatePreset(val);
                    if (val !== 'custom') {
                      applyDatePreset(val);
                    }
                  }}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
                {datePreset === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                    <span className="text-xs text-ink-subtle">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                  </>
                )}
                {(dateFrom || dateTo || datePreset !== 'all') && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); setDatePreset('all'); }}
                    className="text-ink-subtle hover:text-ink transition-colors p-2"
                    title="Reset filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { applyDatePreset(datePreset); }}
                  disabled={!dateFrom && !dateTo}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="px-3 py-1 border border-border text-ink-muted hover:text-ink text-xs font-medium rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {payLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No payments recorded"
            description="Payments will appear here once you start recording them from invoice details."
          />
        ) : filteredPayments.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <Search className="w-8 h-8 text-ink-subtle opacity-30" />
            <p className="text-sm font-medium text-ink-muted">No payments match your filters</p>
            <button
              onClick={() => { setPaySearch(''); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Invoice</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden sm:table-cell">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/app/invoices/${p.invoice_id}`)}
                    className="border-b border-border last:border-0 hover:bg-[#F1F5FF] cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 text-sm text-ink-muted">{fmtDate(p.payment_date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-primary-600 hover:underline">{p.invoice_number ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-ink">{p.client_name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                        {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-ink tabular-nums">
                      {showAmounts ? formatCurrency(Number(p.amount)) : '••••••'}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-ink-subtle">{p.note ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!showAmounts && payments.length > 0 && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700 font-medium">Payment amounts are hidden by default.</p>
            <p className="text-xs text-blue-600 mt-0.5">Click "View Payments" above to reveal amounts. Clients can only see their payment details through the secure Payment Login.</p>
          </div>
        </div>
      )}
    </div>
  );
}
