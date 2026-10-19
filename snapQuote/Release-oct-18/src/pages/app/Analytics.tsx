import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Minus, Lock, Sparkles, BarChart3,
  Calendar, IndianRupee, FileText, CheckCircle2, XCircle, Clock,
  TrendingUp, Receipt, CreditCard, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSectionAuth } from '../../contexts/SectionAuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { formatCurrency } from '../../lib/currency';
import { Quote, isBusinessPlan, QuoteStatus } from '../../types';

const CONFIRMED_STATUSES: QuoteStatus[] = ['accepted', 'invoice_created', 'paid'];
const PENDING_STATUSES: QuoteStatus[] = ['sent', 'follow_up_pending', 'interested'];
const LOST_STATUSES: QuoteStatus[] = ['rejected', 'expired'];

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
};

interface PaymentRecord {
  amount: number;
  payment_method: string;
  payment_date: string;
}

interface InvoiceRecord {
  total: number;
  status: string;
  subtotal: number;
  gst_amount: number;
}

interface MonthlyData {
  month: string;
  quotes: number;
  revenue: number;
  confirmed: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalQuotes: number;
  confirmedQuotes: number;
  pendingQuotes: number;
  lostQuotes: number;
  draftQuotes: number;
  acceptanceRate: number;
  avgQuoteValue: number;
  totalPayments: number;
  paymentCount: number;
  invoiceTotal: number;
  invoicePaid: number;
  invoiceUnpaid: number;
  invoicePartial: number;
  paymentsByMethod: { method: string; count: number; amount: number }[];
  monthly: MonthlyData[];
  revenueGrowth: number;
  quoteGrowth: number;
  topClients: { name: string; quotes: number; revenue: number }[];
}

interface DateRange {
  from: Date | null;
  to: Date | null;
  label: string;
}

interface CachedBaseData {
  monthly: MonthlyData[];
  revenueGrowth: number;
  quoteGrowth: number;
  invoiceTotal: number;
  invoicePaid: number;
  invoiceUnpaid: number;
  invoicePartial: number;
}

function getEffectiveAmount(q: { amount: number; final_price?: number | null; show_discount?: boolean | null }): number {
  const fp = (q as any).final_price;
  const sd = (q as any).show_discount;
  if (sd && fp != null && Number(fp) > 0) return Number(fp);
  return Number(q.amount);
}

function useCountUp(target: number, duration = 900) {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return current;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${positive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function MetricCard({ label, value, formatted, sub, growth, accent, index, icon }: {
  label: string; value: number; formatted: string; sub?: string; growth?: number; accent: string; index: number; icon: React.ReactNode;
}) {
  const _ = useCountUp(value);
  const delays = ['delay-0', 'delay-75', 'delay-150', 'delay-300'];
  return (
    <div className={`relative group rounded-2xl p-5 overflow-hidden border border-slate-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${delays[index] || ''}`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${accent}10 0%, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
            <span style={{ color: accent }}>{icon}</span>
          </div>
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{formatted}</p>
        <p className="text-[13px] font-semibold text-slate-500">{label}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function RevenueChart({ data, maxValue }: { data: { month: string; revenue: number }[]; maxValue: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const hasData = data.some(d => d.revenue > 0);
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <BarChart3 className="w-8 h-8 text-slate-200" />
        <p className="text-sm text-slate-300 font-medium">Revenue data will appear here</p>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="flex items-end gap-[6px] h-48 pt-6">
        {data.map((d, i) => {
          const heightPct = maxValue > 0 ? (d.revenue / maxValue) * 100 : 0;
          const isHovered = hovered === i;
          return (
            <div key={d.month + i} className="flex-1 flex flex-col items-center gap-2 cursor-pointer group/bar" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(hovered === i ? null : i)}>
              {isHovered && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-xl">
                  {formatCurrency(d.revenue)}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              )}
              <div className="w-full flex-1 flex items-end relative">
                <div className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden" style={{ height: `${Math.max(heightPct, 3)}%`, background: isHovered ? 'linear-gradient(to top, #1e40af, #3b82f6)' : 'linear-gradient(to top, #dbeafe, #93c5fd)' }}>
                  {isHovered && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                </div>
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${isHovered ? 'text-blue-600' : 'text-slate-400'}`}>{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ confirmed, pending, lost, draft, total }: { confirmed: number; pending: number; lost: number; draft: number; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const r = 38, cx = 50, cy = 50, circumference = 2 * Math.PI * r, gap = 2;
  const segments = [
    { key: 'confirmed', value: confirmed, color: '#10b981', label: 'Confirmed' },
    { key: 'pending', value: pending, color: '#f59e0b', label: 'Pending' },
    { key: 'lost', value: lost, color: '#f43f5e', label: 'Lost' },
    { key: 'draft', value: draft, color: '#94a3b8', label: 'Draft' },
  ];
  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = total > 0 ? seg.value / total : 0;
    const dashLen = Math.max(pct * circumference - gap, 0);
    const arc = { ...seg, dashLen, offset };
    offset += pct * circumference;
    return arc;
  });
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {total > 0 && arcs.map(arc => arc.value > 0 && (
            <circle key={arc.key} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={hovered === arc.key ? "14" : "12"} strokeDasharray={`${arc.dashLen} ${circumference}`} strokeDashoffset={-arc.offset} strokeLinecap="round" className="transition-all duration-200 cursor-pointer" onMouseEnter={() => setHovered(arc.key)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(hovered === arc.key ? null : arc.key)} style={{ filter: hovered === arc.key ? `drop-shadow(0 0 4px ${arc.color}80)` : 'none' }} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900">{total}</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Quotes</span>
        </div>
      </div>
      <div className="space-y-2 flex-1 min-w-[140px]">
        {segments.map(seg => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.key} className={`flex items-center justify-between py-1 px-2 rounded-lg transition-colors cursor-default ${hovered === seg.key ? 'bg-slate-50' : ''}`} onMouseEnter={() => setHovered(seg.key)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(hovered === seg.key ? null : seg.key)}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-xs font-medium text-slate-600">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{seg.value}</span>
                <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProGate({ loginRequired, onLogout }: { loginRequired: boolean; onLogout: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">Advanced Analytics</h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-8">
        Revenue trends, conversion funnels, payment insights, and monthly performance reports — all waiting for you on the Business plan.
      </p>
      <div className="flex items-center gap-3">
        <a href="/pricing" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">
          <Sparkles className="w-4 h-4" />
          Upgrade Plan
        </a>
        {loginRequired && (
          <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Log out
          </button>
        )}
      </div>
    </div>
  );
}

const DATE_PRESETS = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

function applyPreset(preset: string): DateRange | null {
  const now = new Date();
  if (preset === 'all') return { from: null, to: null, label: 'All time' };
  if (preset === 'custom') return null;
  const to = new Date(now);
  let from = new Date(now);
  if (preset === '30d') from.setDate(now.getDate() - 30);
  if (preset === '90d') from.setMonth(now.getMonth() - 3);
  if (preset === '6m') from.setMonth(now.getMonth() - 6);
  if (preset === '12m') from.setFullYear(now.getFullYear() - 1);
  from.setHours(0, 0, 0, 0);
  return { from, to, label: DATE_PRESETS.find(p => p.value === preset)?.label ?? '' };
}

export function Analytics() {
  const { profile } = useAuth();
  const { quota, loading: subLoading } = useSubscription(profile?.studio_id);
  const { loginRequired, signOut } = useSectionAuth('analytics');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>(() => applyPreset('all')!);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const hasBusiness = isBusinessPlan(quota?.plan);

  // Cache for base data that doesn't depend on date range (monthly chart, invoices, growth)
  const baseDataRef = useRef<CachedBaseData | null>(null);
  const baseDataStudioRef = useRef<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!profile?.studio_id) return;
    setLoading(true);
    const studioId = profile.studio_id;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    // Fetch base data (monthly chart + invoices + growth) only once per studio
    let baseData = baseDataRef.current;
    const needsBaseData = !baseData || baseDataStudioRef.current !== studioId;

    // Build date filter conditions for range-dependent queries
    const fromIso = dateRange.from ? dateRange.from.toISOString() : null;
    const toIso = dateRange.to ? dateRange.to.toISOString() : null;

    let quotesQuery = supabase
      .from('quotes')
      .select('id, client_name, amount, status, final_price, show_discount, created_at')
      .eq('studio_id', studioId)
      .is('deleted_at', null);
    if (fromIso) quotesQuery = quotesQuery.gte('created_at', fromIso);
    if (toIso) quotesQuery = quotesQuery.lte('created_at', toIso);

    let paymentsQuery = supabase
      .from('invoice_payments')
      .select('amount, payment_method, payment_date')
      .eq('studio_id', studioId);
    if (fromIso) paymentsQuery = paymentsQuery.gte('payment_date', fromIso);
    if (toIso) paymentsQuery = paymentsQuery.lte('payment_date', toIso);

    const promises: Promise<any>[] = [
      quotesQuery,
      paymentsQuery,
    ];

    if (needsBaseData) {
      // Monthly chart data: last 6 months of quotes (not date-range filtered)
      promises.push(
        supabase
          .from('quotes')
          .select('amount, status, final_price, show_discount, created_at')
          .eq('studio_id', studioId)
          .is('deleted_at', null)
          .gte('created_at', sixMonthsAgo)
      );
      // Invoice data (not date-range dependent)
      promises.push(
        supabase
          .from('invoices')
          .select('total, status, subtotal, gst_amount')
          .eq('studio_id', studioId)
      );
    }

    const results = await Promise.all(promises);
    const quotesRes = results[0];
    const paymentsRes = results[1];

    const quotes: Quote[] = quotesRes.data ?? [];
    const payments: PaymentRecord[] = paymentsRes.data ?? [];

    // Process base data if needed
    if (needsBaseData) {
      const monthlyQuotesRes = results[2];
      const invoicesRes = results[3];
      const monthlyQuotes: Quote[] = monthlyQuotesRes.data ?? [];
      const invoices: InvoiceRecord[] = invoicesRes.data ?? [];

      // Monthly aggregation (last 6 months)
      const monthlyMap: Record<string, MonthlyData> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        monthlyMap[key] = { month: label, quotes: 0, revenue: 0, confirmed: 0 };
      }
      monthlyQuotes.forEach(q => {
        const key = q.created_at.slice(0, 7);
        if (monthlyMap[key]) {
          monthlyMap[key].quotes += 1;
          if (CONFIRMED_STATUSES.includes(q.status)) {
            monthlyMap[key].revenue += getEffectiveAmount(q);
            monthlyMap[key].confirmed += 1;
          }
        }
      });
      const monthly = Object.values(monthlyMap);

      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const revenueGrowth = prevRevenue(monthlyMap, prevMonthKey, currentMonthKey);
      const quoteGrowth = prevQuoteCount(monthlyMap, prevMonthKey, currentMonthKey);

      const invoiceTotal = invoices.reduce((s, i) => s + Number(i.total || i.subtotal || 0), 0);
      const invoicePaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || i.subtotal || 0), 0);
      const invoiceUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + Number(i.total || i.subtotal || 0), 0);
      const invoicePartial = invoices.filter(i => i.status === 'partial').reduce((s, i) => s + Number(i.total || i.subtotal || 0), 0);

      baseData = { monthly, revenueGrowth, quoteGrowth, invoiceTotal, invoicePaid, invoiceUnpaid, invoicePartial };
      baseDataRef.current = baseData;
      baseDataStudioRef.current = studioId;
    }

    // Process range-dependent data
    const confirmed = quotes.filter(q => CONFIRMED_STATUSES.includes(q.status));
    const pending = quotes.filter(q => PENDING_STATUSES.includes(q.status));
    const lost = quotes.filter(q => LOST_STATUSES.includes(q.status));
    const draft = quotes.filter(q => q.status === 'draft');
    const nonDraft = quotes.filter(q => q.status !== 'draft');

    const totalRevenue = confirmed.reduce((s, q) => s + getEffectiveAmount(q), 0);
    const avgQuoteValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;
    const acceptanceRate = nonDraft.length > 0 ? Math.round((confirmed.length / nonDraft.length) * 100) : 0;

    // Payment insights
    const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
    const methodMap: Record<string, { count: number; amount: number }> = {};
    payments.forEach(p => {
      const key = p.payment_method || 'other';
      if (!methodMap[key]) methodMap[key] = { count: 0, amount: 0 };
      methodMap[key].count += 1;
      methodMap[key].amount += Number(p.amount);
    });
    const paymentsByMethod = Object.entries(methodMap).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount);

    // Top clients by revenue (within filter)
    const clientMap: Record<string, { quotes: number; revenue: number }> = {};
    quotes.forEach(q => {
      const name = q.client_name;
      if (!clientMap[name]) clientMap[name] = { quotes: 0, revenue: 0 };
      clientMap[name].quotes += 1;
      if (CONFIRMED_STATUSES.includes(q.status)) {
        clientMap[name].revenue += getEffectiveAmount(q);
      }
    });
    const topClients = Object.entries(clientMap)
      .map(([name, v]) => ({ name, ...v }))
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setData({
      totalRevenue, totalQuotes: quotes.length,
      confirmedQuotes: confirmed.length, pendingQuotes: pending.length, lostQuotes: lost.length, draftQuotes: draft.length,
      acceptanceRate, avgQuoteValue,
      totalPayments, paymentCount: payments.length,
      invoiceTotal: baseData!.invoiceTotal, invoicePaid: baseData!.invoicePaid, invoiceUnpaid: baseData!.invoiceUnpaid, invoicePartial: baseData!.invoicePartial,
      paymentsByMethod, monthly: baseData!.monthly, revenueGrowth: baseData!.revenueGrowth, quoteGrowth: baseData!.quoteGrowth, topClients,
    });
    setLoading(false);
  }, [profile?.studio_id, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (!hasBusiness || !profile?.studio_id || subLoading) return;
    loadAnalytics();
  }, [hasBusiness, profile?.studio_id, subLoading, loadAnalytics]);

  function handlePresetChange(val: string) {
    setPreset(val);
    if (val === 'custom') {
      setDateRange({ from: null, to: null, label: 'Custom' });
      return;
    }
    const range = applyPreset(val);
    if (range) setDateRange(range);
  }

  function applyCustomRange() {
    const from = customFrom ? new Date(customFrom + 'T00:00:00') : null;
    const to = customTo ? new Date(customTo + 'T23:59:59') : null;
    setDateRange({ from, to, label: 'Custom' });
  }

  const filterLabel = useMemo(() => {
    if (dateRange.from && dateRange.to) {
      return `${dateRange.from.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${dateRange.to.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return dateRange.label;
  }, [dateRange]);

  if (subLoading) {
    return <div className="flex items-center justify-center py-24"><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>;
  }
  if (!hasBusiness) return <ProGate loginRequired={loginRequired} onLogout={() => signOut()} />;
  if (loading || !data) {
    return <div className="flex items-center justify-center py-24"><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>;
  }

  const maxRevenue = Math.max(...data.monthly.map(m => m.revenue), 1);
  const maxClientRevenue = Math.max(...data.topClients.map(c => c.revenue), 1);
  const maxMethodAmount = Math.max(...data.paymentsByMethod.map(m => m.amount), 1);

  const metrics = [
    { label: 'Total Revenue', value: data.totalRevenue, formatted: formatCurrency(data.totalRevenue), growth: data.revenueGrowth, accent: '#10b981', icon: <IndianRupee className="w-4 h-4" />, sub: `${data.confirmedQuotes} confirmed quotes` },
    { label: 'Total Quotes', value: data.totalQuotes, formatted: String(data.totalQuotes), growth: data.quoteGrowth, accent: '#3b82f6', icon: <FileText className="w-4 h-4" />, sub: `${data.pendingQuotes} pending` },
    { label: 'Acceptance Rate', value: data.acceptanceRate, formatted: `${data.acceptanceRate}%`, accent: '#f59e0b', icon: <TrendingUp className="w-4 h-4" />, sub: 'confirmed / non-draft' },
    { label: 'Avg Quote Value', value: Math.round(data.avgQuoteValue), formatted: formatCurrency(data.avgQuoteValue), accent: '#6366f1', icon: <Receipt className="w-4 h-4" />, sub: 'per confirmed quote' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">Business performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          {loginRequired && (
            <button onClick={() => signOut()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0">
              <Lock className="w-3.5 h-3.5" />
              Analytics Logout
            </button>
          )}
        </div>
      </div>

      {/* Date filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePresetChange(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                preset === p.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            <button onClick={applyCustomRange} disabled={!customFrom && !customTo} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors">Apply</button>
          </div>
        )}
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full shrink-0 ml-auto">
          {filterLabel}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </div>

      {/* Revenue trend + Quote status donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months · confirmed quotes</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-blue-300 to-blue-500" />
              <span className="text-[11px] font-semibold text-slate-400">Revenue</span>
            </div>
          </div>
          <RevenueChart data={data.monthly} maxValue={maxRevenue} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Quote Status</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Within selected period</p>
          </div>
          <DonutChart confirmed={data.confirmedQuotes} pending={data.pendingQuotes} lost={data.lostQuotes} draft={data.draftQuotes} total={data.totalQuotes} />
          <div className="mt-5 pt-4 border-t border-slate-50">
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: data.confirmedQuotes, label: 'Won', color: 'text-emerald-600' },
                { val: data.pendingQuotes, label: 'Open', color: 'text-amber-500' },
                { val: data.lostQuotes, label: 'Lost', color: 'text-rose-500' },
                { val: data.draftQuotes, label: 'Draft', color: 'text-slate-400' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`text-lg font-black ${item.color}`}>{item.val}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Payment Summary</h3>
          <p className="text-[11px] text-slate-400 mb-5">Within selected period</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                <div><p className="text-xs font-medium text-emerald-700">Collected</p><p className="text-[11px] text-emerald-500">{data.paymentCount} payments</p></div>
              </div>
              <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(data.totalPayments)}</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><Receipt className="w-4 h-4 text-sky-600" /></div>
                <div><p className="text-xs font-medium text-sky-700">Invoice Total</p><p className="text-[11px] text-sky-500">All invoices</p></div>
              </div>
              <p className="text-lg font-bold text-sky-700 tabular-nums">{formatCurrency(data.invoiceTotal)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-amber-50">
                <p className="text-[11px] font-medium text-amber-600">Unpaid</p>
                <p className="text-base font-bold text-amber-700 tabular-nums mt-0.5">{formatCurrency(data.invoiceUnpaid)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-[11px] font-medium text-blue-600">Partial</p>
                <p className="text-base font-bold text-blue-700 tabular-nums mt-0.5">{formatCurrency(data.invoicePartial)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Payment Methods</h3>
          <p className="text-[11px] text-slate-400 mb-5">By collected amount</p>
          {data.paymentsByMethod.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CreditCard className="w-8 h-8 text-slate-200" />
              <p className="text-sm text-slate-300 font-medium">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.paymentsByMethod.map((m, i) => {
                const pct = maxMethodAmount > 0 ? (m.amount / maxMethodAmount) * 100 : 0;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
                const color = colors[i] || '#64748b';
                return (
                  <div key={m.method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600">{METHOD_LABELS[m.method] || m.method}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{m.count}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{formatCurrency(m.amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Top Clients</h3>
          <p className="text-[11px] text-slate-400 mb-5">By confirmed revenue</p>
          {data.topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Receipt className="w-8 h-8 text-slate-200" />
              <p className="text-sm text-slate-300 font-medium">No confirmed clients yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((c, i) => {
                const pct = maxClientRevenue > 0 ? (c.revenue / maxClientRevenue) * 100 : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 truncate">{c.name}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums shrink-0 ml-2">{formatCurrency(c.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 w-12 text-right shrink-0">{c.quotes} qt{c.quotes !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Monthly Breakdown</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Quote activity and win rate per month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3">Month</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Sent</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Confirmed</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Win Rate</th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((m, i) => {
                const winRate = m.quotes > 0 ? Math.round((m.confirmed / m.quotes) * 100) : 0;
                const isLast = i === data.monthly.length - 1;
                return (
                  <tr key={m.month + i} className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${isLast ? 'font-semibold' : ''}`}>
                    <td className="px-5 py-3.5 text-sm text-slate-700 font-semibold">{m.month}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 text-right hidden sm:table-cell">{m.quotes}</td>
                    <td className="px-5 py-3.5 text-sm text-emerald-600 font-semibold text-right hidden sm:table-cell">{m.confirmed}</td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${winRate >= 50 ? 'bg-emerald-50 text-emerald-700' : winRate > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{winRate}%</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-right">{formatCurrency(m.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function prevRevenue(monthlyMap: Record<string, MonthlyData>, prevKey: string, curKey: string): number {
  const cur = monthlyMap[curKey]?.revenue ?? 0;
  const prev = monthlyMap[prevKey]?.revenue ?? 0;
  return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
}

function prevQuoteCount(monthlyMap: Record<string, MonthlyData>, prevKey: string, curKey: string): number {
  const cur = monthlyMap[curKey]?.quotes ?? 0;
  const prev = monthlyMap[prevKey]?.quotes ?? 0;
  return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
}
