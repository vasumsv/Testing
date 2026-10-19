import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { StudioProfileTab } from './settings/StudioProfileTab';
import { BillingTab } from './settings/BillingTab';
import { CustomBrandingTab } from './settings/CustomBrandingTab';
import { PaymentDetailsTab } from './settings/PaymentDetailsTab';
import { WhatsAppTab } from './settings/WhatsAppTab';
import { supabase } from '../../lib/supabase';

type Tab = 'studio' | 'payment' | 'branding' | 'whatsapp' | 'notifications' | 'security' | 'billing';

const tabs: { id: Tab; label: string }[] = [
  { id: 'studio', label: 'Studio Profile' },
  { id: 'payment', label: 'Payment Details' },
  { id: 'branding', label: 'Custom Branding' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
];


function NotificationsTab() {
  const [settings, setSettings] = useState({
    newLead: true,
    quoteSent: true,
    quoteAccepted: true,
    quoteRejected: false,
    weeklyReport: true,
    emailDigest: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: 'newLead' as const, label: 'New Lead', desc: 'Notify when a new lead is added' },
    { key: 'quoteSent' as const, label: 'Quote Sent', desc: 'Notify when a quote is sent to a client' },
    { key: 'quoteAccepted' as const, label: 'Quote Accepted', desc: 'Notify when a client accepts a quote' },
    { key: 'quoteRejected' as const, label: 'Quote Rejected', desc: 'Notify when a client rejects a quote' },
    { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Receive a weekly performance summary' },
    { key: 'emailDigest' as const, label: 'Daily Email Digest', desc: 'Daily email summary of activity' },
  ];

  return (
    <div className="max-w-2xl">
      <Card>
        <h3 className="text-sm font-semibold text-ink mb-4">Notification Preferences</h3>
        <div className="space-y-0 divide-y divide-border">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-muted">{desc}</p>
              </div>
              <Toggle checked={settings[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-subtle outline-none transition-all duration-150 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors w-9 h-9 flex items-center justify-center rounded-md"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
  if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' };
  if (score === 4) return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  return { level: 5, label: 'Very Strong', color: 'bg-emerald-600' };
}

function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(next);

  async function handleUpdate() {
    setError('');
    setSuccess(false);

    if (!current.trim()) { setError('Please enter your current password.'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('New password and confirmation do not match.'); return; }
    if (current === next) { setError('New password must be different from current password.'); return; }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError('Unable to verify account. Please log in again.'); setSaving(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (signInErr) {
      setError('Current password is incorrect.');
      setSaving(false);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setCurrent('');
    setNext('');
    setConfirm('');
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Change Password</h3>
            <p className="text-xs text-ink-muted">Keep your account secure with a strong password</p>
          </div>
        </div>

        <div className="space-y-4">
          <PasswordInput
            label="Current Password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter your current password"
          />

          <div className="space-y-1.5">
            <PasswordInput
              label="New Password"
              value={next}
              onChange={v => { setNext(v); setSuccess(false); setError(''); }}
              placeholder="Min. 8 characters"
            />
            {next && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.level ? strength.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-xs text-ink-muted">
                    Password strength: <span className="font-medium text-ink">{strength.label}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm New Password"
            value={confirm}
            onChange={v => { setConfirm(v); setSuccess(false); setError(''); }}
            placeholder="Re-enter new password"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2.5">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-sm text-success">Password updated successfully.</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <p className="text-xs text-ink-subtle">
            You will remain logged in after changing your password.
          </p>
          <Button size="sm" onClick={handleUpdate} loading={saving}>
            Update Password
          </Button>
        </div>
      </Card>
    </div>
  );
}


export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = ['studio', 'payment', 'branding', 'whatsapp', 'notifications', 'security', 'billing'];
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    return (t && VALID_TABS.includes(t)) ? t as Tab : 'studio';
  });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && VALID_TABS.includes(t)) {
      setActiveTab(t as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTab]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSearchParams(tab === 'studio' ? {} : { tab });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Settings</h2>
        <p className="text-sm text-ink-muted">Manage your studio profile and account preferences</p>
      </div>

      <div className="flex gap-0.5 border-b border-border overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            ref={el => { tabRefs.current[id] = el; }}
            onClick={() => handleTabChange(id)}
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0 ${
              activeTab === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className={activeTab === 'studio' ? '' : 'hidden'}><StudioProfileTab /></div>
        <div className={activeTab === 'payment' ? '' : 'hidden'}><PaymentDetailsTab /></div>
        <div className={activeTab === 'branding' ? '' : 'hidden'}><CustomBrandingTab /></div>
        <div className={activeTab === 'whatsapp' ? '' : 'hidden'}><WhatsAppTab /></div>
        <div className={activeTab === 'notifications' ? '' : 'hidden'}><NotificationsTab /></div>
        <div className={activeTab === 'security' ? '' : 'hidden'}><SecurityTab /></div>
        <div className={activeTab === 'billing' ? '' : 'hidden'}><BillingTab /></div>
      </div>
    </div>
  );
}
