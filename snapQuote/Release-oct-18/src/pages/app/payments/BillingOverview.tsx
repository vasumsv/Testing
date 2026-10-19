import {
  CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';
import { Quote, QuoteStatus } from '../../../types';

const ACTIVE_STATUSES = new Set<QuoteStatus>(['sent', 'follow_up_pending', 'interested']);

export function BillingOverview({ quotes }: { quotes: Quote[] }) {
  const accepted = quotes.filter(q => q.status === 'accepted' || q.status === 'invoice_created' || q.status === 'paid');
  const sent = quotes.filter(q => ACTIVE_STATUSES.has(q.status));
  const draft = quotes.filter(q => q.status === 'draft');
  const rejected = quotes.filter(q => q.status === 'rejected' || q.status === 'expired');

  const getEffectiveAmount = (q: Quote) => {
    const fp = (q as any).final_price;
    const sd = (q as any).show_discount;
    if (sd && fp != null && Number(fp) > 0) return Number(fp);
    return Number(q.amount);
  };
  const totalAccepted = accepted.reduce((s, q) => s + getEffectiveAmount(q), 0);
  const totalPending = sent.reduce((s, q) => s + getEffectiveAmount(q), 0);
  const totalDraft = draft.reduce((s, q) => s + getEffectiveAmount(q), 0);
  const totalLost = rejected.reduce((s, q) => s + getEffectiveAmount(q), 0);
  const nonDraft = quotes.filter(q => q.status !== 'draft');
  const conversionRate = nonDraft.length > 0 ? Math.round((accepted.length / nonDraft.length) * 100) : 0;

  const clientMap = new Map<string, { name: string; email: string; accepted: number; pending: number }>();
  for (const q of quotes) {
    const existing = clientMap.get(q.client_name) ?? { name: q.client_name, email: q.client_email ?? '', accepted: 0, pending: 0 };
    if (accepted.some(a => a.id === q.id)) existing.accepted += getEffectiveAmount(q);
    if (sent.some(s => s.id === q.id)) existing.pending += getEffectiveAmount(q);
    clientMap.set(q.client_name, existing);
  }
  const clients = Array.from(clientMap.values())
    .filter(c => c.accepted > 0 || c.pending > 0)
    .sort((a, b) => (b.accepted + b.pending) - (a.accepted + a.pending))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-ink-subtle" />
        <h3 className="text-base font-semibold text-ink">Billing Overview</h3>
        <span className="text-xs text-ink-muted">based on all quotes</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'Confirmed', total: totalAccepted, count: accepted.length },
          { icon: <Clock className="w-4 h-4 text-amber-500" />, label: 'Awaiting', total: totalPending, count: sent.length },
          { icon: <AlertCircle className="w-4 h-4 text-ink-subtle" />, label: 'Drafts', total: totalDraft, count: draft.length },
          { icon: <XCircle className="w-4 h-4 text-red-400" />, label: 'Lost / Expired', total: totalLost, count: rejected.length },
        ].map(row => (
          <div key={row.label} className="bg-surface border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">{row.icon}<span className="text-xs font-medium text-ink-muted">{row.label}</span></div>
            <p className="text-xl font-bold text-ink tabular-nums">{formatCurrency(row.total)}</p>
            <p className="text-xs text-ink-muted mt-0.5">{row.count} quote{row.count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h4 className="text-sm font-semibold text-ink">Revenue Breakdown</h4>
            <p className="text-xs text-ink-muted mt-0.5">By quote status</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Confirmed Revenue', amount: totalAccepted, color: 'bg-emerald-500', count: accepted.length },
              { label: 'Pipeline Value', amount: totalPending, color: 'bg-amber-400', count: sent.length },
              { label: 'Draft Value', amount: totalDraft, color: 'bg-slate-300', count: draft.length },
              { label: 'Lost Revenue', amount: totalLost, color: 'bg-red-300', count: rejected.length },
            ].map(row => {
              const total = totalAccepted + totalPending + totalDraft + totalLost;
              const pct = total > 0 ? (row.amount / total) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      <span className="text-xs text-ink-muted">{row.label}</span>
                      <span className="text-xs text-ink-subtle">({row.count})</span>
                    </div>
                    <span className="text-xs font-semibold text-ink tabular-nums">{formatCurrency(row.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-muted">Conversion rate (sent → accepted)</span>
              <span className="text-sm font-bold text-ink">{conversionRate}%</span>
            </div>
          </div>
        </div>

        {clients.length > 0 && (
          <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h4 className="text-sm font-semibold text-ink">Top Clients by Value</h4>
              <p className="text-xs text-ink-muted mt-0.5">Accepted + pending amounts</p>
            </div>
            <div className="divide-y divide-border">
              {clients.map(c => (
                <div key={c.name} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    {c.email && <p className="text-xs text-ink-subtle truncate">{c.email}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {c.accepted > 0 && <p className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(c.accepted)}</p>}
                    {c.pending > 0 && <p className="text-xs text-amber-600 tabular-nums">+{formatCurrency(c.pending)} pending</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
