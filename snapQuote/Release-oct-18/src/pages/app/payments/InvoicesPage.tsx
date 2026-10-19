import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, ChevronRight, CheckCircle2, Clock, AlertCircle, FileText, Search, X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/currency';
import { useAuth } from '../../../contexts/AuthContext';
import { EmptyState } from '../../../components/ui/EmptyState';

interface Invoice {
  id: string;
  invoice_number: string;
  quote_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  quote_number?: string;
}

interface InvoiceWithPayments extends Invoice {
  paid: number;
}

function StatusPill({ status, paid, total }: { status: string; paid: number; total: number }) {
  if (status === 'paid' || paid >= total) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  }
  if (status === 'partial' || paid > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <AlertCircle className="w-3 h-3" /> Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> Unpaid
    </span>
  );
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [invoices, setInvoices] = useState<InvoiceWithPayments[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invSearch, setInvSearch] = useState('');

  useEffect(() => {
    if (profile?.studio_id) {
      fetchInvoices();
    } else {
      setInvLoading(false);
    }
  }, [profile?.studio_id]);

  async function fetchInvoices() {
    setInvLoading(true);
    const [{ data: invData }, { data: payData }, { data: quoteData }] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, quote_id, client_name, client_email, client_phone, issue_date, due_date, total, status, created_at')
        .eq('studio_id', profile!.studio_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoice_payments')
        .select('invoice_id, amount')
        .eq('studio_id', profile!.studio_id),
      supabase
        .from('quotes')
        .select('id, quote_number')
        .eq('studio_id', profile!.studio_id),
    ]);

    const totalsMap = new Map<string, number>();
    for (const p of payData ?? []) {
      totalsMap.set(p.invoice_id, (totalsMap.get(p.invoice_id) ?? 0) + Number(p.amount));
    }
    const quoteNumberMap = new Map<string, string>();
    for (const q of quoteData ?? []) quoteNumberMap.set(q.id, q.quote_number);

    setInvoices(
      (invData ?? []).map(inv => ({
        ...inv,
        paid: totalsMap.get(inv.id) ?? 0,
        quote_number: quoteNumberMap.get(inv.quote_id) ?? '',
      }))
    );
    setInvLoading(false);
  }

  const filteredInvoices = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(inv =>
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.client_name.toLowerCase().includes(q) ||
      (inv.client_email ?? '').toLowerCase().includes(q) ||
      (inv.client_phone ?? '').toLowerCase().includes(q) ||
      (inv.quote_number ?? '').toLowerCase().includes(q)
    );
  }, [invoices, invSearch]);

  const isInvSearching = invSearch.trim().length > 0;

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Invoices</h2>
        <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">
          Manage invoices and track outstanding balances
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">All Invoices</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {isInvSearching
                ? `${filteredInvoices.length} result${filteredInvoices.length !== 1 ? 's' : ''} for "${invSearch.trim()}"`
                : 'Generate invoices from accepted quotes in the Quotes section'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
              <input
                type="text"
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                placeholder="Search invoice #, client, phone..."
                className="w-full bg-surface-raised border border-border rounded-lg pl-8 pr-8 py-1.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              />
              {invSearch && (
                <button onClick={() => setInvSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors p-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => navigate('/app/quotes')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Go to Quotes</span>
            </button>
          </div>
        </div>

        {invLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No invoices yet"
            description='Accept a quote and click "Generate Invoice" to create your first invoice.'
            action={{ label: 'Go to Quotes', onClick: () => navigate('/app/quotes') }}
          />
        ) : filteredInvoices.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <Search className="w-8 h-8 text-ink-subtle opacity-30" />
            <p className="text-sm font-medium text-ink-muted">No invoices match "{invSearch.trim()}"</p>
            <button onClick={() => setInvSearch('')} className="text-xs text-primary-600 hover:underline font-medium">Clear search</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Invoice #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden sm:table-cell">Quote #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden md:table-cell">Issued</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const total = Number(inv.total);
                  const pct = total > 0 ? Math.min(100, (inv.paid / total) * 100) : 0;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/app/invoices/${inv.id}`)}
                      className="border-b border-border last:border-0 hover:bg-[#F1F5FF] cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-primary-600 hover:underline">{inv.invoice_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-ink hover:underline cursor-pointer">{inv.client_name}</p>
                        {inv.client_email && <p className="text-xs text-ink-subtle">{inv.client_email}</p>}
                        {inv.client_phone && <p className="text-xs text-ink-subtle">{inv.client_phone}</p>}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        {inv.quote_number ? (
                          <span
                            onClick={e => { e.stopPropagation(); navigate(`/app/quote-builder/${inv.quote_id}`); }}
                            className="text-xs font-medium text-ink-muted hover:text-primary-600 hover:underline cursor-pointer transition-colors"
                          >
                            {inv.quote_number}
                          </span>
                        ) : <span className="text-xs text-ink-subtle">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={inv.status} paid={inv.paid} total={total} />
                        <div className="mt-1 h-1 w-16 bg-surface-raised rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-ink-muted hidden md:table-cell">{fmtDate(inv.issue_date)}</td>
                      <td className="px-5 py-3.5">
                        <ChevronRight className="w-4 h-4 text-ink-subtle" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
