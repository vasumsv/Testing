import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Building2, MoreHorizontal, CheckCircle, XCircle, RefreshCw, Calendar, ToggleLeft, ToggleRight, KeyRound, Phone, MapPin, Globe, X, FileText, Clock, LayoutDashboard, Receipt, BarChart3, Eye, EyeOff } from 'lucide-react';
import { studioStatusBadge, planBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PLAN_LIMITS } from '../../types';

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

interface StudioRow {
  id: string;
  name: string;
  email: string;
  owner_name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  tagline: string | null;
  quotes_count: number;
  plan: string;
  status: string;
  is_active: boolean;
  quotes_this_month: number;
  subscription_expires_at: string | null;
  created_at: string;
  dashboard_username: string | null;
  dashboard_access_enabled: boolean;
  payments_username: string | null;
  payments_access_enabled: boolean;
  analytics_username: string | null;
  analytics_access_enabled: boolean;
}

type ActionModal =
  | { type: 'plan'; studio: StudioRow }
  | { type: 'expiry'; studio: StudioRow }
  | { type: 'reset_password'; studio: StudioRow }
  | { type: 'dashboard_access'; studio: StudioRow }
  | { type: 'payments_access'; studio: StudioRow }
  | { type: 'analytics_access'; studio: StudioRow }
  | null;

const PLAN_QUOTA: Record<string, string> = {
  trial: '10 total',
  business: 'Unlimited',
  starter: '30/mo (legacy)',
  growth: '100/mo (legacy)',
  pro: 'Unlimited (legacy)',
};

function ActionMenu({
  studio,
  onActivate,
  onSuspend,
  onToggleActive,
  onChangePlan,
  onExtendExpiry,
  onResetPassword,
  onDashboardAccess,
  onPaymentsAccess,
  onAnalyticsAccess,
}: {
  studio: StudioRow;
  onActivate: () => void;
  onSuspend: () => void;
  onToggleActive: () => void;
  onChangePlan: () => void;
  onExtendExpiry: () => void;
  onResetPassword: () => void;
  onDashboardAccess: () => void;
  onPaymentsAccess: () => void;
  onAnalyticsAccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler as unknown as EventListener);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler as unknown as EventListener);
    };
  }, []);

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(p => !p);
  }

  return (
    <div ref={ref}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-56 bg-white rounded-xl border border-slate-200 py-1"
          style={{ top: menuPos.top, right: menuPos.right, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)' }}
        >
          <div className="px-2.5 py-1.5">
            <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-wide px-1.5 pb-1">Account</p>
            <button
              onClick={() => { onToggleActive(); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-100 ${studio.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            >
              {studio.is_active
                ? <><ToggleLeft className="w-4 h-4 shrink-0" /><span>Deactivate Account</span></>
                : <><ToggleRight className="w-4 h-4 shrink-0" /><span>Activate Account</span></>
              }
            </button>
            {studio.status === 'active' ? (
              <button
                onClick={() => { onSuspend(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors duration-100"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Suspend Studio</span>
              </button>
            ) : (
              <button
                onClick={() => { onActivate(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors duration-100"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Unsuspend Studio</span>
              </button>
            )}
          </div>
          <div className="h-px bg-slate-100 mx-2.5 my-1" />
          <div className="px-2.5 py-1.5">
            <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-wide px-1.5 pb-1">Subscription</p>
            <button
              onClick={() => { onChangePlan(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-ink hover:bg-slate-50 transition-colors duration-100"
            >
              <RefreshCw className="w-4 h-4 shrink-0 text-ink-subtle" />
              <span>Change Plan</span>
            </button>
            <button
              onClick={() => { onExtendExpiry(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-ink hover:bg-slate-50 transition-colors duration-100"
            >
              <Calendar className="w-4 h-4 shrink-0 text-ink-subtle" />
              <span>Set Expiry</span>
            </button>
          </div>
          <div className="h-px bg-slate-100 mx-2.5 my-1" />
          <div className="px-2.5 py-1.5">
            <button
              onClick={() => { onResetPassword(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors duration-100"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Reset Password</span>
            </button>
            <button
              onClick={() => { onDashboardAccess(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors duration-100"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard Access</span>
            </button>
            <button
              onClick={() => { onPaymentsAccess(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors duration-100"
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Payments Access</span>
            </button>
            <button
              onClick={() => { onAnalyticsAccess(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors duration-100"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Analytics Access</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Studios() {
  const [studios, setStudios] = useState<StudioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('business');
  const [expiryDate, setExpiryDate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [detailStudio, setDetailStudio] = useState<StudioRow | null>(null);

  // Dashboard access state
  const [daUsername, setDaUsername] = useState('');
  const [daPassword, setDaPassword] = useState('');
  const [daEnabled, setDaEnabled] = useState(false);
  const [daError, setDaError] = useState('');
  const [daSaving, setDaSaving] = useState(false);
  const [daSuccess, setDaSuccess] = useState(false);

  // Payments access state
  const [pmUsername, setPmUsername] = useState('');
  const [pmPassword, setPmPassword] = useState('');
  const [pmEnabled, setPmEnabled] = useState(false);
  const [pmError, setPmError] = useState('');
  const [pmSaving, setPmSaving] = useState(false);
  const [pmSuccess, setPmSuccess] = useState(false);

  // Analytics access state
  const [anUsername, setAnUsername] = useState('');
  const [anPassword, setAnPassword] = useState('');
  const [anEnabled, setAnEnabled] = useState(false);
  const [anError, setAnError] = useState('');
  const [anSaving, setAnSaving] = useState(false);
  const [anSuccess, setAnSuccess] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showDaPw, setShowDaPw] = useState(false);
  const [showPmPw, setShowPmPw] = useState(false);
  const [showAnPw, setShowAnPw] = useState(false);

  useEffect(() => {
    fetchStudios();
  }, []);

  async function fetchStudios() {
    setLoading(true);
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-studios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setStudios((data.studios ?? []) as StudioRow[]);
    } catch {
      setStudios([]);
    }
    setLoading(false);
  }

  async function updateStatus(studioId: string, status: string) {
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) return;
    await callAdminFunction('admin-update-studio', { token, studio_id: studioId, updates: { status } });
    setStudios(prev => prev.map(s => s.id === studioId ? { ...s, status } : s));
  }

  async function toggleActive(studioId: string, currentIsActive: boolean) {
    const newVal = !currentIsActive;
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) return;
    await callAdminFunction('admin-update-studio', { token, studio_id: studioId, updates: { is_active: newVal } });
    setStudios(prev => prev.map(s => s.id === studioId ? { ...s, is_active: newVal } : s));
  }

  async function handleChangePlan() {
    if (!actionModal || actionModal.type !== 'plan') return;
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) return;
    setSaving(true);
    await callAdminFunction('admin-update-studio', { token, studio_id: actionModal.studio.id, updates: { plan: selectedPlan } });
    setStudios(prev => prev.map(s => s.id === actionModal.studio.id ? { ...s, plan: selectedPlan } : s));
    setSaving(false);
    setActionModal(null);
  }

  async function handleExtendExpiry() {
    if (!actionModal || actionModal.type !== 'expiry') return;
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) return;
    setSaving(true);
    const expiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;
    await callAdminFunction('admin-update-studio', { token, studio_id: actionModal.studio.id, updates: { subscription_expires_at: expiresAt } });
    setStudios(prev => prev.map(s => s.id === actionModal.studio.id ? { ...s, subscription_expires_at: expiresAt } : s));
    setSaving(false);
    setActionModal(null);
    setExpiryDate('');
  }

  async function handleResetPassword() {
    if (!actionModal || actionModal.type !== 'reset_password') return;
    setPasswordError('');
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) {
      setPasswordError('Admin session expired. Please log in again.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-studio-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, email: actionModal.studio.email, new_password: newPassword }),
      });
      const data = await res.json();
      if (data.error) {
        setPasswordError(data.error);
      } else {
        setPasswordSuccess(true);
        setTimeout(() => {
          setActionModal(null);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordSuccess(false);
        }, 1500);
      }
    } catch {
      setPasswordError('Network error. Please try again.');
    }
    setSaving(false);
  }

  async function handleSaveDashboardAccess() {
    if (!actionModal || actionModal.type !== 'dashboard_access') return;
    setDaError('');
    if (!daUsername.trim()) { setDaError('Username is required.'); return; }
    if (daPassword && daPassword.length < 6) { setDaError('Password must be at least 6 characters.'); return; }

    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setDaError('Admin session expired. Please log in again.'); return; }

    setDaSaving(true);
    try {
      const updates: Record<string, unknown> = {
        dashboard_username: daUsername.trim(),
        dashboard_access_enabled: daEnabled,
      };

      if (daPassword) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-hash-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ token, password: daPassword }),
        });
        const data = await res.json();
        if (data.error || !data.hash) { setDaError(data.error ?? 'Failed to hash password.'); setDaSaving(false); return; }
        updates.dashboard_password_hash = data.hash;
      }

      await callAdminFunction('admin-update-studio', { token, studio_id: actionModal.studio.id, updates });
      setDaSuccess(true);
      setTimeout(() => { setActionModal(null); setDaSuccess(false); }, 1500);
      fetchStudios();
    } catch {
      setDaError('Network error. Please try again.');
    }
    setDaSaving(false);
  }

  async function handleSavePaymentsAccess() {
    if (!actionModal || actionModal.type !== 'payments_access') return;
    setPmError('');
    if (!pmUsername.trim()) { setPmError('Username is required.'); return; }
    if (pmPassword && pmPassword.length < 6) { setPmError('Password must be at least 6 characters.'); return; }

    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setPmError('Admin session expired. Please log in again.'); return; }

    setPmSaving(true);
    try {
      const updates: Record<string, unknown> = {
        payments_username: pmUsername.trim(),
        payments_access_enabled: pmEnabled,
      };

      if (pmPassword) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-hash-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ token, password: pmPassword }),
        });
        const data = await res.json();
        if (data.error || !data.hash) { setPmError(data.error ?? 'Failed to hash password.'); setPmSaving(false); return; }
        updates.payments_password_hash = data.hash;
      }

      await callAdminFunction('admin-update-studio', { token, studio_id: actionModal.studio.id, updates });
      setPmSuccess(true);
      setTimeout(() => { setActionModal(null); setPmSuccess(false); }, 1500);
      fetchStudios();
    } catch {
      setPmError('Network error. Please try again.');
    }
    setPmSaving(false);
  }

  async function handleSaveAnalyticsAccess() {
    if (!actionModal || actionModal.type !== 'analytics_access') return;
    setAnError('');
    if (!anUsername.trim()) { setAnError('Username is required.'); return; }
    if (anPassword && anPassword.length < 6) { setAnError('Password must be at least 6 characters.'); return; }

    const token = sessionStorage.getItem('sq_admin_session');
    if (!token) { setAnError('Admin session expired. Please log in again.'); return; }

    setAnSaving(true);
    try {
      const updates: Record<string, unknown> = {
        analytics_username: anUsername.trim(),
        analytics_access_enabled: anEnabled,
      };

      if (anPassword) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-hash-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ token, password: anPassword }),
        });
        const data = await res.json();
        if (data.error || !data.hash) { setAnError(data.error ?? 'Failed to hash password.'); setAnSaving(false); return; }
        updates.analytics_password_hash = data.hash;
      }

      await callAdminFunction('admin-update-studio', { token, studio_id: actionModal.studio.id, updates });
      setAnSuccess(true);
      setTimeout(() => { setActionModal(null); setAnSuccess(false); }, 1500);
      fetchStudios();
    } catch {
      setAnError('Network error. Please try again.');
    }
    setAnSaving(false);
  }

  const filtered = studios.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = (s.name ?? '').toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q) || (s.owner_name ?? '').toLowerCase().includes(q);
    const matchPlan = planFilter === 'all' || s.plan === planFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  function formatExpiry(d: string | null) {
    if (!d) return <span className="text-ink-subtle">—</span>;
    const date = new Date(d);
    const isExpired = date < new Date();
    return (
      <span className={isExpired ? 'text-red-600 font-medium' : 'text-ink-muted'}>
        {date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        {isExpired && ' (expired)'}
      </span>
    );
  }

  function QuotaCell({ studio }: { studio: StudioRow }) {
    const limit = PLAN_LIMITS[studio.plan as keyof typeof PLAN_LIMITS] ?? 30;
    const used = studio.quotes_this_month ?? 0;
    if (limit === null) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink tabular-nums">{used}</span>
          <span className="text-xs text-emerald-600 font-medium">unlimited</span>
        </div>
      );
    }
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const overLimit = used >= limit;
    return (
      <div className="flex flex-col gap-1">
        <span className={`text-sm tabular-nums font-medium ${overLimit ? 'text-red-600' : 'text-ink'}`}>
          {used} / {limit}
        </span>
        <div className="w-16 bg-surface-raised rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${overLimit ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-primary-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detailStudio && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailStudio(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right-8 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
              <h3 className="text-base font-semibold text-ink">Studio Details</h3>
              <button onClick={() => setDetailStudio(null)} className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${detailStudio.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                  <Building2 className={`w-5 h-5 ${detailStudio.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-semibold text-ink">{detailStudio.name || '(Unnamed)'}</h4>
                    {!detailStudio.is_active && <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Inactive</span>}
                  </div>
                  {detailStudio.tagline && <p className="text-sm text-ink-muted mt-0.5">{detailStudio.tagline}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {planBadge(detailStudio.plan)}
                    {studioStatusBadge(detailStudio.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-wide">Contact Info</p>
                <div className="bg-surface-raised rounded-lg divide-y divide-border">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <div>
                      <p className="text-[0.6875rem] text-ink-subtle">Owner</p>
                      <p className="text-sm font-medium text-ink">{detailStudio.owner_name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <div>
                      <p className="text-[0.6875rem] text-ink-subtle">Phone</p>
                      <p className="text-sm font-medium text-ink">{detailStudio.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Globe className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <div>
                      <p className="text-[0.6875rem] text-ink-subtle">Email</p>
                      <p className="text-sm font-medium text-ink">{detailStudio.email}</p>
                    </div>
                  </div>
                  {detailStudio.website && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Globe className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                      <div>
                        <p className="text-[0.6875rem] text-ink-subtle">Website</p>
                        <p className="text-sm font-medium text-ink">{detailStudio.website}</p>
                      </div>
                    </div>
                  )}
                  {detailStudio.address && (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[0.6875rem] text-ink-subtle">Address</p>
                        <p className="text-sm font-medium text-ink whitespace-pre-wrap">{detailStudio.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-wide">Activity</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-raised rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-ink-subtle" />
                      <p className="text-[0.6875rem] text-ink-subtle">Total Quotes</p>
                    </div>
                    <p className="text-xl font-bold text-ink">{detailStudio.quotes_count ?? 0}</p>
                  </div>
                  <div className="bg-surface-raised rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-ink-subtle" />
                      <p className="text-[0.6875rem] text-ink-subtle">This Month</p>
                    </div>
                    <p className="text-xl font-bold text-ink">{detailStudio.quotes_this_month ?? 0}</p>
                  </div>
                  <div className="bg-surface-raised rounded-lg px-4 py-3 col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                      <p className="text-[0.6875rem] text-ink-subtle">Registered</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {new Date(detailStudio.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-ink-subtle mt-0.5">
                      {Math.floor((Date.now() - new Date(detailStudio.created_at).getTime()) / 86400000)} days ago
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-wide">Subscription</p>
                <div className="bg-surface-raised rounded-lg divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-muted">Plan</span>
                    {planBadge(detailStudio.plan)}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-muted">Expiry</span>
                    <span className="text-sm font-medium">{formatExpiry(detailStudio.subscription_expires_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-[1.75rem] font-semibold text-ink tracking-tight">Studios</h2>
        <p className="text-[0.9375rem] text-ink-muted mt-0.5">{studios.length} studio{studios.length !== 1 ? 's' : ''} registered</p>
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search studios, owners, emails..."
              className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all">
              <option value="all">All Plans</option>
              <option value="trial">Free</option>
              <option value="business">SnapQuote Business</option>
              <option value="starter">Starter (legacy)</option>
              <option value="growth">Growth (legacy)</option>
              <option value="pro">Pro (legacy)</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
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
            icon={<Building2 className="w-5 h-5" />}
            title={studios.length === 0 ? 'No studios yet' : 'No studios found'}
            description={studios.length === 0 ? 'Studios will appear here as they register.' : 'Try adjusting your search or filters.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] sm:min-w-0">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Studio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Quotes</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setDetailStudio(s)}
                    className={`border-b border-border last:border-0 transition-colors duration-150 cursor-pointer ${!s.is_active ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-[#F1F5FF]'}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                          <Building2 className={`w-3.5 h-3.5 ${s.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-ink">{s.name || '(Unnamed)'}</p>
                            {!s.is_active && (
                              <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Inactive</span>
                            )}
                          </div>
                          <p className="text-xs text-ink-subtle">{s.owner_name || s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="space-y-0.5">
                        {s.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-ink">
                            <Phone className="w-3 h-3 text-ink-subtle shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        ) : <span className="text-xs text-ink-subtle">—</span>}
                        {s.address && (
                          <div className="flex items-start gap-1.5 text-xs text-ink-muted max-w-[160px]">
                            <MapPin className="w-3 h-3 text-ink-subtle shrink-0 mt-0.5" />
                            <span className="truncate">{s.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {planBadge(s.plan)}
                        <span className="text-xs text-ink-subtle">{PLAN_QUOTA[s.plan] ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{studioStatusBadge(s.status)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <QuotaCell studio={s} />
                        <span className="text-[0.6875rem] text-ink-subtle">Total: {s.quotes_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-muted">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <ActionMenu
                        studio={s}
                        onActivate={() => updateStatus(s.id, 'active')}
                        onSuspend={() => updateStatus(s.id, 'suspended')}
                        onToggleActive={() => toggleActive(s.id, s.is_active)}
                        onChangePlan={() => { setSelectedPlan(s.plan); setActionModal({ type: 'plan', studio: s }); }}
                        onExtendExpiry={() => {
                          setExpiryDate(s.subscription_expires_at ? s.subscription_expires_at.slice(0, 10) : '');
                          setActionModal({ type: 'expiry', studio: s });
                        }}
                        onResetPassword={() => {
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                          setPasswordSuccess(false);
                          setActionModal({ type: 'reset_password', studio: s });
                        }}
                        onDashboardAccess={() => {
                          setDaUsername(s.dashboard_username ?? '');
                          setDaPassword('');
                          setDaEnabled(s.dashboard_access_enabled ?? false);
                          setDaError('');
                          setDaSuccess(false);
                          setActionModal({ type: 'dashboard_access', studio: s });
                        }}
                        onPaymentsAccess={() => {
                          setPmUsername(s.payments_username ?? '');
                          setPmPassword('');
                          setPmEnabled(s.payments_access_enabled ?? false);
                          setPmError('');
                          setPmSuccess(false);
                          setActionModal({ type: 'payments_access', studio: s });
                        }}
                        onAnalyticsAccess={() => {
                          setAnUsername(s.analytics_username ?? '');
                          setAnPassword('');
                          setAnEnabled(s.analytics_access_enabled ?? false);
                          setAnError('');
                          setAnSuccess(false);
                          setActionModal({ type: 'analytics_access', studio: s });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={actionModal?.type === 'plan'}
        onClose={() => setActionModal(null)}
        title="Change Plan"
        description={actionModal ? `Update subscription plan for ${actionModal.studio.name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Select Plan</label>
            <div className="space-y-2">
              {([
                { value: 'trial', label: 'Free', price: 'Free', quota: '10 quotes total' },
                { value: 'business', label: 'SnapQuote Business', price: '₹699/mo', quota: 'Unlimited quotes' },
              ]).map(plan => (
                <label key={plan.value} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${selectedPlan === plan.value ? 'border-primary-600 bg-primary-50' : 'border-border hover:bg-surface-raised'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="plan" value={plan.value} checked={selectedPlan === plan.value} onChange={() => setSelectedPlan(plan.value)} className="accent-primary-600" />
                    <div>
                      <span className="text-sm font-medium text-ink">{plan.label}</span>
                      <p className="text-xs text-ink-subtle">{plan.quota}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-ink-muted">{plan.price}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleChangePlan}>Apply Plan</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={actionModal?.type === 'expiry'}
        onClose={() => { setActionModal(null); setExpiryDate(''); }}
        title="Set Subscription Expiry"
        description={actionModal ? `Set plan expiry date for ${actionModal.studio.name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} hint="Leave empty to remove expiry (no limit)" />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => { setActionModal(null); setExpiryDate(''); }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleExtendExpiry}>Save Expiry</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={actionModal?.type === 'reset_password'}
        onClose={() => { setActionModal(null); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); setPasswordSuccess(false); }}
        title="Reset Studio Password"
        description={actionModal?.type === 'reset_password' ? `Set a new password for ${actionModal.studio.name} (${actionModal.studio.email})` : ''}
        width="sm"
      >
        <div className="space-y-4">
          {passwordSuccess ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Password updated successfully.
            </div>
          ) : (
            <>
              {passwordError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {passwordError}
                </div>
              )}
              <div className="bg-surface-raised rounded-lg px-4 py-2.5">
                <p className="text-xs text-ink-subtle">Studio email</p>
                <p className="text-sm font-medium text-ink mt-0.5">{actionModal?.type === 'reset_password' ? actionModal.studio.email : ''}</p>
              </div>
              <Input
                label="New Password"
                type={showResetPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                suffix={<button type="button" onClick={() => setShowResetPw(s => !s)} className="text-ink-subtle hover:text-ink transition-colors" aria-label={showResetPw ? 'Hide password' : 'Show password'}>{showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              />
              <Input
                label="Confirm Password"
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                suffix={<button type="button" onClick={() => setShowConfirmPw(s => !s)} className="text-ink-subtle hover:text-ink transition-colors" aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>{showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => { setActionModal(null); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>
                  Cancel
                </Button>
                <Button size="sm" loading={saving} onClick={handleResetPassword}>
                  Reset Password
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={actionModal?.type === 'dashboard_access'}
        onClose={() => { setActionModal(null); setDaUsername(''); setDaPassword(''); setDaEnabled(false); setDaError(''); setDaSuccess(false); }}
        title="Dashboard Access Credentials"
        description={actionModal?.type === 'dashboard_access' ? `Set Dashboard login for ${actionModal.studio.name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          {daSuccess ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Dashboard access credentials saved successfully.
            </div>
          ) : (
            <>
              {daError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {daError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Username</label>
                <input
                  type="text"
                  value={daUsername}
                  onChange={e => setDaUsername(e.target.value)}
                  placeholder="Dashboard username"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Password</label>
                <div className="relative">
                <input
                  type={showDaPw ? 'text' : 'password'}
                  value={daPassword}
                  onChange={e => setDaPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 pr-10 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
                <button type="button" onClick={() => setShowDaPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors" aria-label={showDaPw ? 'Hide password' : 'Show password'}>
                  {showDaPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                </div>
                <p className="text-xs text-ink-subtle">Leave blank to keep the current password.</p>
              </div>
              <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
                <input type="checkbox" checked={daEnabled} onChange={e => setDaEnabled(e.target.checked)} className="accent-primary-600 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-ink">Require separate Dashboard login</p>
                  <p className="text-xs text-ink-subtle">When enabled, users must log in with these credentials to access the Dashboard. When off, Dashboard is open to all logged-in users.</p>
                </div>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => { setActionModal(null); setDaUsername(''); setDaPassword(''); setDaEnabled(false); setDaError(''); }}>Cancel</Button>
                <Button size="sm" loading={daSaving} onClick={handleSaveDashboardAccess}>Save Credentials</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={actionModal?.type === 'payments_access'}
        onClose={() => { setActionModal(null); setPmUsername(''); setPmPassword(''); setPmEnabled(false); setPmError(''); setPmSuccess(false); }}
        title="Payments Access Credentials"
        description={actionModal?.type === 'payments_access' ? `Set Payments login for ${actionModal.studio.name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          {pmSuccess ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Payments access credentials saved successfully.
            </div>
          ) : (
            <>
              {pmError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {pmError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Username</label>
                <input
                  type="text"
                  value={pmUsername}
                  onChange={e => setPmUsername(e.target.value)}
                  placeholder="Payments username"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Password</label>
                <div className="relative">
                <input
                  type={showPmPw ? 'text' : 'password'}
                  value={pmPassword}
                  onChange={e => setPmPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 pr-10 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
                <button type="button" onClick={() => setShowPmPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors" aria-label={showPmPw ? 'Hide password' : 'Show password'}>
                  {showPmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                </div>
                <p className="text-xs text-ink-subtle">Leave blank to keep the current password. These are separate from Dashboard credentials.</p>
              </div>
              <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
                <input type="checkbox" checked={pmEnabled} onChange={e => setPmEnabled(e.target.checked)} className="accent-primary-600 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-ink">Require separate Payments login</p>
                  <p className="text-xs text-ink-subtle">When enabled, users must log in with these credentials to access Payments. When off, Payments is open to all logged-in users.</p>
                </div>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => { setActionModal(null); setPmUsername(''); setPmPassword(''); setPmEnabled(false); setPmError(''); }}>Cancel</Button>
                <Button size="sm" loading={pmSaving} onClick={handleSavePaymentsAccess}>Save Credentials</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={actionModal?.type === 'analytics_access'}
        onClose={() => { setActionModal(null); setAnUsername(''); setAnPassword(''); setAnEnabled(false); setAnError(''); setAnSuccess(false); }}
        title="Analytics Access Credentials"
        description={actionModal?.type === 'analytics_access' ? `Set Analytics login for ${actionModal.studio.name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          {anSuccess ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Analytics access credentials saved successfully.
            </div>
          ) : (
            <>
              {anError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-700">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {anError}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Username</label>
                <input
                  type="text"
                  value={anUsername}
                  onChange={e => setAnUsername(e.target.value)}
                  placeholder="Analytics username"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Password</label>
                <div className="relative">
                <input
                  type={showAnPw ? 'text' : 'password'}
                  value={anPassword}
                  onChange={e => setAnPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 pr-10 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                />
                <button type="button" onClick={() => setShowAnPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors" aria-label={showAnPw ? 'Hide password' : 'Show password'}>
                  {showAnPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                </div>
                <p className="text-xs text-ink-subtle">Leave blank to keep the current password. These are separate from Dashboard and Payments credentials.</p>
              </div>
              <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
                <input type="checkbox" checked={anEnabled} onChange={e => setAnEnabled(e.target.checked)} className="accent-primary-600 w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-ink">Require separate Analytics login</p>
                  <p className="text-xs text-ink-subtle">When enabled, users must log in with these credentials to access Analytics. When off, Analytics is open to all logged-in users.</p>
                </div>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => { setActionModal(null); setAnUsername(''); setAnPassword(''); setAnEnabled(false); setAnError(''); }}>Cancel</Button>
                <Button size="sm" loading={anSaving} onClick={handleSaveAnalyticsAccess}>Save Credentials</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
