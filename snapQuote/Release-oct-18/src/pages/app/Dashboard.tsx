import { useEffect, useState, useMemo } from 'react';
import {
  FileText, Users, IndianRupee, TrendingUp, ArrowRight, Lock, LogOut,
  Clock, CheckCircle2, AlertCircle, Phone, Plus, Calendar, MessageCircle,
  Flame, Receipt, User,
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import { quoteStatusBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { QuotaBar } from '../../components/ui/QuotaBar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSectionAuth } from '../../contexts/SectionAuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Quote, Client, QuoteStatus } from '../../types';

const CONFIRMED_STATUSES: QuoteStatus[] = ['accepted', 'invoice_created', 'paid'];
const PENDING_STATUSES: QuoteStatus[] = ['sent', 'follow_up_pending', 'interested'];
const FOLLOW_UP_STATUSES: QuoteStatus[] = ['sent', 'follow_up_pending', 'interested'];

interface DashboardData {
  todayQuotes: number;
  todayRevenue: number;
  pendingQuotes: Quote[];
  followUps: Quote[];
  recentQuotes: Quote[];
  recentClients: Client[];
  totalQuotes: number;
  activeClients: number;
  confirmedRevenue: number;
  conversionRate: number;
  newClientsToday: number;
  quotesThisWeek: number;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const QUOTE_LIST_COLS = 'id, quote_number, client_name, client_email, client_phone, amount, status, final_price, show_discount, created_at, updated_at';
const CLIENT_LIST_COLS = 'id, studio_id, full_name, phone, email, event_type, created_at, followup_count, last_followup_at, client_response';

function getEffectiveAmount(q: { amount: number; final_price?: number | null; show_discount?: boolean | null }): number {
  const fp = (q as any).final_price;
  const sd = (q as any).show_discount;
  if (sd && fp != null && Number(fp) > 0) return Number(fp);
  return Number(q.amount);
}

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { signOut: signOutDashboard, loginRequired } = useSectionAuth('dashboard');
  const { quota, planLabel, usageText, usagePercent, isTrial, isTrialExpired, isExpiringSoon, daysUntilExpiry } = useSubscription(profile?.studio_id);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const limitReached = quota?.limit_reached ?? false;
  const nearLimit = quota?.near_limit ?? false;

  useEffect(() => {
    if (profile?.studio_id) loadDashboard();
    else setLoading(false);
  }, [profile?.studio_id]);

  async function loadDashboard() {
    setLoading(true);
    const studioId = profile!.studio_id;
    const todayStart = startOfToday();
    const weekStart = startOfWeek();

    const [
      recentQuotesRes,
      recentClientsRes,
      pendingQuotesRes,
      followUpQuotesRes,
      totalQuotesRes,
      todayQuotesRes,
      weekQuotesRes,
      confirmedQuotesRes,
      nonDraftQuotesRes,
      todayConfirmedRes,
      activeClientsRes,
      newClientsTodayRes,
    ] = await Promise.all([
      // Recent 5 quotes for the table
      supabase.from('quotes').select(QUOTE_LIST_COLS).eq('studio_id', studioId).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      // Recent 5 clients for the list
      supabase.from('clients').select(CLIENT_LIST_COLS).eq('studio_id', studioId).order('created_at', { ascending: false }).limit(5),
      // Pending quotes (oldest 5)
      supabase.from('quotes').select(QUOTE_LIST_COLS).eq('studio_id', studioId).is('deleted_at', null).in('status', PENDING_STATUSES).order('created_at', { ascending: true }).limit(5),
      // Follow-up quotes (oldest 5)
      supabase.from('quotes').select(QUOTE_LIST_COLS).eq('studio_id', studioId).is('deleted_at', null).in('status', FOLLOW_UP_STATUSES).order('created_at', { ascending: true }).limit(5),
      // Total quote count
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).is('deleted_at', null),
      // Today's quote count
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).is('deleted_at', null).gte('created_at', todayStart),
      // This week's quote count
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).is('deleted_at', null).gte('created_at', weekStart),
      // Confirmed quotes (for revenue + count)
      supabase.from('quotes').select('amount, final_price, show_discount').eq('studio_id', studioId).is('deleted_at', null).in('status', CONFIRMED_STATUSES),
      // Non-draft quote count (for conversion rate)
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).is('deleted_at', null).neq('status', 'draft'),
      // Today's confirmed revenue (confirmed quotes updated today)
      supabase.from('quotes').select('amount, final_price, show_discount').eq('studio_id', studioId).is('deleted_at', null).in('status', CONFIRMED_STATUSES).gte('updated_at', todayStart),
      // Total client count
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('studio_id', studioId),
      // New clients today
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('studio_id', studioId).gte('created_at', todayStart),
    ]);

    const recentQuotes = (recentQuotesRes.data ?? []) as Quote[];
    const recentClients = (recentClientsRes.data ?? []) as Client[];
    const pendingQuotes = (pendingQuotesRes.data ?? []) as Quote[];
    const followUps = (followUpQuotesRes.data ?? []) as Quote[];

    const confirmedQuotes = confirmedQuotesRes.data ?? [];
    const todayConfirmed = todayConfirmedRes.data ?? [];

    const confirmedRevenue = confirmedQuotes.reduce((s, q) => s + getEffectiveAmount(q), 0);
    const todayRevenue = todayConfirmed.reduce((s, q) => s + getEffectiveAmount(q), 0);

    const totalQuotes = totalQuotesRes.count ?? 0;
    const todayQuotes = todayQuotesRes.count ?? 0;
    const quotesThisWeek = weekQuotesRes.count ?? 0;
    const nonDraftCount = nonDraftQuotesRes.count ?? 0;
    const activeClients = activeClientsRes.count ?? 0;
    const newClientsToday = newClientsTodayRes.count ?? 0;

    const conversionRate = nonDraftCount > 0 ? Math.round((confirmedQuotes.length / nonDraftCount) * 100) : 0;

    setData({
      todayQuotes,
      todayRevenue,
      pendingQuotes,
      followUps,
      recentQuotes,
      recentClients,
      totalQuotes,
      activeClients,
      confirmedRevenue,
      conversionRate,
      newClientsToday,
      quotesThisWeek,
    });
    setLoading(false);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  function fmtRelative(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return fmtDate(d);
  }

  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  const quickActions = useMemo(() => [
    { label: 'New Quote', icon: FileText, path: '/app/quote-builder', primary: true, disabled: limitReached },
    { label: 'Add Client', icon: User, path: '/app/clients' },
    { label: 'New Invoice', icon: Receipt, path: '/app/invoices' },
    { label: 'View Quotes', icon: CheckCircle2, path: '/app/quotes' },
  ], [limitReached]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {loginRequired && (
            <button
              onClick={() => signOutDashboard()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-border text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Dashboard Logout
            </button>
          )}
          {limitReached ? (
            <div className="flex items-center gap-2">
              <button
                disabled
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-surface border border-border text-ink-subtle cursor-not-allowed opacity-60"
              >
                <Lock className="w-3.5 h-3.5" />
                New Quote
              </button>
              <Button
                size="sm"
                onClick={() => navigate('/app/settings?tab=billing')}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
              >
                Upgrade Plan
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/app/quote-builder')} icon={<FileText className="w-3.5 h-3.5" />}>
              New Quote
            </Button>
          )}
        </div>
      </div>

      {/* Quota & subscription alerts */}
      {quota && (
        <QuotaBar
          plan={planLabel}
          used={quota.quotes_this_month}
          limit={quota.monthly_limit}
          usageText={usageText}
          usagePercent={usagePercent}
          nearLimit={quota.near_limit}
          limitReached={quota.limit_reached}
          expiresAt={quota.subscription_expires_at}
          isActive={quota.is_active && quota.status !== 'suspended'}
          isTrial={isTrial}
          onUpgrade={() => navigate('/app/settings?tab=billing')}
        />
      )}

      {isTrialExpired && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Your free trial is over.</p>
            <p className="text-xs text-red-600 mt-0.5">You've used all 10 trial quotes. Upgrade to continue creating quotes.</p>
          </div>
          <button onClick={() => navigate('/app/settings?tab=billing')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            Upgrade Now
          </button>
        </div>
      )}

      {limitReached && !isTrialExpired && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Monthly quote limit reached</p>
            <p className="text-xs text-red-600 mt-0.5">You've used all your quotes for this month. Upgrade your plan to continue creating quotes immediately.</p>
          </div>
          <button onClick={() => navigate('/app/settings?tab=billing')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            Upgrade Plan
          </button>
        </div>
      )}

      {!limitReached && nearLimit && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">{isTrial ? 'Almost out of trial quotes' : 'You are close to your limit'}</p>
            <p className="text-xs text-amber-600 mt-0.5">{isTrial ? 'Upgrade now to keep creating quotes without interruption.' : 'Upgrade now to avoid interruptions in your quoting workflow.'}</p>
          </div>
          <button onClick={() => navigate('/app/settings?tab=billing')} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            Upgrade Plan
          </button>
        </div>
      )}

      {isExpiringSoon && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-700">Your subscription expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}</p>
            <p className="text-xs text-blue-600 mt-0.5">Renew now to avoid any interruption to your quoting workflow.</p>
          </div>
          <button onClick={() => navigate('/app/settings?tab=billing')} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            Renew Plan
          </button>
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Today's summary cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              icon={<FileText className="w-4 h-4" />}
              label="Quotes Today"
              value={String(data.todayQuotes)}
              sub={`${data.quotesThisWeek} this week`}
              accent="text-blue-600 bg-blue-50"
            />
            <SummaryCard
              icon={<IndianRupee className="w-4 h-4" />}
              label="Confirmed Revenue"
              value={formatCurrency(data.confirmedRevenue)}
              sub={`${data.totalQuotes} total quotes`}
              accent="text-emerald-600 bg-emerald-50"
            />
            <SummaryCard
              icon={<Users className="w-4 h-4" />}
              label="Clients"
              value={String(data.activeClients)}
              sub={`${data.newClientsToday} new today`}
              accent="text-amber-600 bg-amber-50"
            />
            <SummaryCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Conversion Rate"
              value={`${data.conversionRate}%`}
              sub="confirmed / non-draft"
              accent="text-violet-600 bg-violet-50"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => !action.disabled && navigate(action.path)}
                  disabled={action.disabled}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    action.disabled
                      ? 'border-border bg-surface opacity-50 cursor-not-allowed'
                      : action.primary
                        ? 'border-primary-600 bg-primary-50 hover:bg-primary-100 hover:shadow-sm'
                        : 'border-border bg-white hover:bg-surface-raised hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    action.primary ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-semibold ${action.primary ? 'text-primary-700' : 'text-ink'}`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pending quotes & Follow-ups */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-ink">Pending Quotes</h3>
                  <span className="text-xs text-ink-subtle">{data.pendingQuotes.length}</span>
                </div>
                <button onClick={() => navigate('/app/quotes')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors duration-100">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {data.pendingQuotes.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-ink-subtle">No pending quotes. All caught up!</div>
              ) : (
                <div className="divide-y divide-border">
                  {data.pendingQuotes.map(q => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/app/quote-builder/${q.id}`)}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{q.client_name}</p>
                        <p className="text-xs text-ink-subtle mt-0.5"><span className="font-medium text-primary-600">{q.quote_number}</span> · {fmtRelative(q.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(Number(q.amount))}</p>
                        <div className="mt-1">{quoteStatusBadge(q.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-ink">Follow-ups Needed</h3>
                  <span className="text-xs text-ink-subtle">{data.followUps.length}</span>
                </div>
                <button onClick={() => navigate('/app/quotes')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors duration-100">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {data.followUps.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-ink-subtle">No follow-ups pending. Great work!</div>
              ) : (
                <div className="divide-y divide-border">
                  {data.followUps.map(q => {
                    const daysSince = Math.floor((Date.now() - new Date(q.created_at).getTime()) / 86400000);
                    const isStale = daysSince >= 3;
                    return (
                      <div
                        key={q.id}
                        onClick={() => navigate(`/app/quote-builder/${q.id}`)}
                        className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isStale ? 'bg-amber-50' : 'bg-slate-100'}`}>
                          <MessageCircle className={`w-4 h-4 ${isStale ? 'text-amber-500' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{q.client_name}</p>
                          <p className="text-xs text-ink-subtle mt-0.5">
                            <span className="font-medium text-primary-600">{q.quote_number}</span> · {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                            {isStale && <span className="text-amber-600 font-medium"> · Follow up!</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(Number(q.amount))}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 bg-white rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Recent Quotes</h3>
                <button onClick={() => navigate('/app/quotes')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors duration-100">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {data.recentQuotes.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-ink-subtle">
                  No quotes yet.{' '}
                  {!limitReached && (
                    <button onClick={() => navigate('/app/quote-builder')} className="text-ink underline underline-offset-2 hover:no-underline">
                      Create your first
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-th">Quote</th>
                        <th className="table-th">Client</th>
                        <th className="table-th">Amount</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentQuotes.map(q => (
                        <tr key={q.id} className="table-row cursor-pointer" onClick={() => navigate(`/app/quote-builder/${q.id}`)}>
                          <td className="table-td"><span className="text-sm font-semibold text-primary-600">{q.quote_number}</span></td>
                          <td className="table-td font-medium">{q.client_name}</td>
                          <td className="table-td font-medium">{formatCurrency(Number(q.amount))}</td>
                          <td className="table-td">{quoteStatusBadge(q.status)}</td>
                          <td className="table-td text-ink-muted">{fmtDate(q.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="xl:col-span-2 bg-white rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Recent Clients</h3>
                <button onClick={() => navigate('/app/clients')} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors duration-100">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {data.recentClients.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-ink-subtle">No clients yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {data.recentClients.map(c => (
                    <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary-600">{c.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{c.full_name}</p>
                        <p className="text-xs text-ink-subtle mt-0.5">{c.phone || c.email || 'No contact'} · {fmtDate(c.created_at)}</p>
                      </div>
                      {c.event_type && <Badge variant="neutral">{c.event_type}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-ink-subtle uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-ink tracking-tight">{value}</p>
      <p className="text-xs text-ink-subtle mt-1">{sub}</p>
    </div>
  );
}
