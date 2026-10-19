import { useEffect, useState } from 'react';
import { Building2, CreditCard, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import { studioStatusBadge, planBadge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/currency';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface StudioRow {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
}

interface SubRow {
  plan: string;
  status: string;
  amount: number;
  billing_cycle: string;
}

interface Stats {
  totalStudios: number;
  activeSubscriptions: number;
  totalQuotes: number;
  mrr: number;
  planDist: { trial: number; business: number; starter: number; growth: number; pro: number };
}

async function callAdminFunction(name: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudios: 0,
    activeSubscriptions: 0,
    totalQuotes: 0,
    mrr: 0,
    planDist: { trial: 0, business: 0, starter: 0, growth: 0, pro: 0 },
  });
  const [recentStudios, setRecentStudios] = useState<StudioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setLoading(false); return; }

    try {
      const data = await callAdminFunction('admin-get-stats', { token });
      const studios: StudioRow[] = data.studios ?? [];
      const subs: SubRow[] = data.subscriptions ?? [];
      const quotesCount: number = data.quotesCount ?? 0;

      const activeSubs = subs.filter(s => s.status === 'active');
      const mrr = activeSubs.reduce((sum, s) => {
        if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
        if (s.billing_cycle === 'annual') return sum + Number(s.amount) / 12;
        return sum;
      }, 0);

      const planDist = studios.reduce(
        (acc, s) => {
          if (s.plan in acc) acc[s.plan as keyof typeof acc]++;
          return acc;
        },
        { trial: 0, business: 0, starter: 0, growth: 0, pro: 0 }
      );

      setStats({ totalStudios: studios.length, activeSubscriptions: activeSubs.length, totalQuotes: quotesCount, mrr, planDist });
      setRecentStudios(studios.slice(0, 5));
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  const totalForDist = stats.planDist.trial + stats.planDist.business + stats.planDist.starter + stats.planDist.growth + stats.planDist.pro || 1;
  function pct(n: number) { return Math.round((n / totalForDist) * 100); }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.75rem] font-semibold text-ink tracking-tight">Platform Overview</h2>
        <p className="text-[0.9375rem] text-ink-muted mt-0.5">Monitor all studios and platform health</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Studios" value={stats.totalStudios} icon={<Building2 className="w-4 h-4 text-ink-subtle" />} />
            <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} icon={<CreditCard className="w-4 h-4 text-ink-subtle" />} />
            <StatCard label="Total Quotes" value={stats.totalQuotes.toLocaleString()} icon={<FileText className="w-4 h-4 text-ink-subtle" />} />
            <StatCard label="Monthly Revenue" value={formatCurrency(Math.round(stats.mrr))} icon={<TrendingUp className="w-4 h-4 text-ink-subtle" />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-surface rounded-lg border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Recently Joined Studios</h3>
                <button onClick={() => navigate('/admin/studios')} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {recentStudios.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-ink-subtle">No studios registered yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/50">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Studio</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Plan</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentStudios.map(s => (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-[#F1F5FF] transition-colors duration-150">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-primary-600" />
                              </div>
                              <span className="text-sm font-medium text-ink">{s.name || '(Unnamed)'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">{planBadge(s.plan)}</td>
                          <td className="px-5 py-3.5">{studioStatusBadge(s.status)}</td>
                          <td className="px-5 py-3.5 text-sm text-ink-muted">
                            {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-surface rounded-lg border border-border shadow-card p-5">
                <h3 className="text-sm font-semibold text-ink mb-4">Plan Distribution</h3>
                <div className="space-y-3">
                  {([
                    { label: 'SnapQuote Business', key: 'business' as const, color: 'bg-emerald-500' },
                    { label: 'Free', key: 'trial' as const, color: 'bg-blue-300' },
                    { label: 'Pro (legacy)', key: 'pro' as const, color: 'bg-slate-400' },
                    { label: 'Growth (legacy)', key: 'growth' as const, color: 'bg-slate-300' },
                    { label: 'Starter (legacy)', key: 'starter' as const, color: 'bg-slate-200' },
                  ]).map(({ label, key, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-ink">{label}</span>
                        <span className="text-xs text-ink-muted">{stats.planDist[key]} · {pct(stats.planDist[key])}%</span>
                      </div>
                      <div className="w-full bg-surface-raised rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct(stats.planDist[key])}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-lg border border-border shadow-card p-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Quick Metrics</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Est. MRR', value: formatCurrency(Math.round(stats.mrr)) },
                    { label: 'Total Studios', value: stats.totalStudios.toString() },
                    { label: 'Total Quotes', value: stats.totalQuotes.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-ink-muted">{label}</span>
                      <span className="text-xs font-semibold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
