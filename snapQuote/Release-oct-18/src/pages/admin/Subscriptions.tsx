import { useState, useEffect } from 'react';
import { Search, Filter, CreditCard, IndianRupee, TrendingUp, AlertCircle, Plus, Pencil } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/currency';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

interface SubRow {
  id: string;
  studio_id: string;
  plan: string;
  status: string;
  billing_cycle: string;
  amount: number;
  current_period_end: string;
  notes: string;
  studios: { name: string; email: string } | null;
}

interface StudioOption {
  id: string;
  name: string;
  email: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  active: 'success',
  trialing: 'info',
  past_due: 'danger',
  cancelled: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
};

const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  business: { monthly: 699, annual: 6990 },
};

// Legacy plans kept for historical record display only — not selectable for new subscriptions
const LEGACY_PLANS = ['starter', 'growth', 'pro'];

const PLAN_DISPLAY: Record<string, string> = {
  trial: 'Free',
  business: 'SnapQuote Business',
  starter: 'Starter (legacy)',
  growth: 'Growth (legacy)',
  pro: 'Pro (legacy)',
};

interface AssignForm {
  studio_id: string;
  plan: string;
  billing_cycle: string;
  status: string;
  period_end: string;
  notes: string;
  amount: number;
}

const EMPTY_FORM: AssignForm = {
  studio_id: '',
  plan: 'business',
  billing_cycle: 'monthly',
  status: 'active',
  period_end: '',
  notes: '',
  amount: PLAN_AMOUNTS['business']['monthly'],
};

export function Subscriptions() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [studios, setStudios] = useState<StudioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubRow | null>(null);
  const [form, setForm] = useState<AssignForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setLoading(false); return; }

    try {
      const [statsData, studiosData] = await Promise.all([
        callAdminFunction('admin-get-stats', { token }),
        callAdminFunction('admin-get-studios', { token }),
      ]);

      const studios: StudioOption[] = (studiosData.studios ?? []) as StudioOption[];

      const subsRaw: Array<{
        id: string; studio_id: string; plan: string; status: string;
        billing_cycle: string; amount: number; current_period_end: string; notes: string;
      }> = statsData.subscriptions ?? [];

      const studioMap = new Map(studios.map(s => [s.id, s]));
      const subsWithStudios: SubRow[] = subsRaw.map(sub => ({
        ...sub,
        studios: studioMap.get(sub.studio_id) ? { name: studioMap.get(sub.studio_id)!.name, email: studioMap.get(sub.studio_id)!.email } : null,
      }));

      setSubs(subsWithStudios);
      setStudios(studios);
    } catch {
      setSubs([]);
      setStudios([]);
    }
    setLoading(false);
  }

  function openAdd() {
    setEditTarget(null);
    const defaultEnd = new Date();
    defaultEnd.setMonth(defaultEnd.getMonth() + 1);
    setForm({ ...EMPTY_FORM, period_end: defaultEnd.toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEdit(sub: SubRow) {
    setEditTarget(sub);
    setForm({
      studio_id: sub.studio_id,
      plan: sub.plan,
      billing_cycle: sub.billing_cycle,
      status: sub.status,
      period_end: sub.current_period_end ? sub.current_period_end.slice(0, 10) : '',
      notes: sub.notes ?? '',
      amount: PLAN_AMOUNTS[sub.plan]?.[sub.billing_cycle] ?? Number(sub.amount) ?? 0,
      // Note: legacy plans (starter/growth/pro) retain their original amount for display
    });
    setModalOpen(true);
  }

  function handlePlanChange(plan: string) {
    const amount = PLAN_AMOUNTS[plan]?.[form.billing_cycle] ?? 0;
    setForm(p => ({ ...p, plan, amount }));
  }

  function handleCycleChange(cycle: string) {
    const amount = PLAN_AMOUNTS[form.plan]?.[cycle] ?? 0;
    setForm(p => ({ ...p, billing_cycle: cycle, amount }));
  }

  async function handleSave() {
    if (!form.studio_id) return;
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) return;
    setSaving(true);

    const amount = PLAN_AMOUNTS[form.plan]?.[form.billing_cycle] ?? form.amount ?? 0;
    const periodEnd = form.period_end
      ? new Date(form.period_end).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString();

    await callAdminFunction('admin-manage-subscription', {
      token,
      action: 'upsert',
      subscription_id: editTarget?.id ?? null,
      payload: {
        studio_id: form.studio_id,
        plan: form.plan,
        billing_cycle: form.billing_cycle,
        status: form.status,
        amount,
        notes: form.notes,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
      },
    });

    setSaving(false);
    setModalOpen(false);
    loadAll();
  }

  const filtered = subs.filter(s => {
    const name = s.studios?.name ?? '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const mrr = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
      if (s.billing_cycle === 'annual') return sum + Number(s.amount) / 12;
      return sum;
    }, 0);

  const arr = mrr * 12;
  const pastDue = subs.filter(s => s.status === 'past_due').length;

  function fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-ink tracking-tight">Subscriptions</h2>
          <p className="text-[0.9375rem] text-ink-muted mt-0.5">Manage and assign studio billing plans</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} size="sm" onClick={openAdd}>
          Assign Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Est. MRR" value={formatCurrency(Math.round(mrr))} icon={<IndianRupee className="w-4 h-4 text-ink-subtle" />} />
        <StatCard label="Est. ARR" value={formatCurrency(Math.round(arr))} icon={<TrendingUp className="w-4 h-4 text-ink-subtle" />} />
        <StatCard label="Past Due" value={pastDue} icon={<AlertCircle className="w-4 h-4 text-ink-subtle" />} />
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search studios..."
              className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-5 h-5" />}
            title={subs.length === 0 ? 'No subscriptions yet' : 'No subscriptions found'}
            description={subs.length === 0 ? 'Assign a plan to a studio to get started.' : 'Try adjusting your search or filter.'}
            action={subs.length === 0 ? { label: 'Assign Plan', onClick: openAdd } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Studio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden sm:table-cell">Cycle</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden sm:table-cell">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide hidden sm:table-cell">Period End</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-[#F1F5FF] transition-colors duration-150">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-ink">{s.studios?.name ?? '—'}</p>
                      <p className="text-xs text-ink-subtle">{s.studios?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-ink">{PLAN_DISPLAY[s.plan] ?? s.plan}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[s.status] ?? 'neutral'}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-muted capitalize hidden sm:table-cell">{s.billing_cycle}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-ink tabular-nums hidden sm:table-cell">
                      {Number(s.amount) === 0 ? 'Free' : `${formatCurrency(Number(s.amount))}/mo`}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-muted hidden sm:table-cell">{fmtDate(s.current_period_end)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Subscription' : 'Assign Plan'}
        description={editTarget ? 'Update this studio\'s subscription details.' : 'Manually assign a subscription plan to a studio.'}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Studio <span className="text-danger">*</span></label>
            <select
              value={form.studio_id}
              onChange={e => setForm(p => ({ ...p, studio_id: e.target.value }))}
              disabled={!!editTarget}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all disabled:opacity-60"
            >
              <option value="">Select a studio...</option>
              {studios.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Plan</label>
              <select
                value={form.plan}
                onChange={e => handlePlanChange(e.target.value)}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              >
                <option value="trial">Free — ₹0 (10 quotes total)</option>
                <option value="business">SnapQuote Business — ₹699/mo (Unlimited)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Billing Cycle</label>
              <select
                value={form.billing_cycle}
                onChange={e => handleCycleChange(e.target.value)}
                disabled={form.plan === 'trial'}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all disabled:opacity-60"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Input
              label="Period End"
              type="date"
              value={form.period_end}
              onChange={e => setForm(p => ({ ...p, period_end: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Notes <span className="text-ink-subtle font-normal">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Internal notes about this subscription..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle resize-none outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>

          <div className="bg-surface-raised rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-ink-muted">Calculated amount</span>
            <span className="text-sm font-bold text-ink">
              {form.plan === 'trial' ? 'Free' : `${formatCurrency(PLAN_AMOUNTS[form.plan]?.[form.billing_cycle] ?? 0)}${form.billing_cycle === 'annual' ? '/yr' : '/mo'}`}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave} disabled={!form.studio_id}>
              {editTarget ? 'Save Changes' : 'Assign Plan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
