import { useState, useEffect } from 'react';
import { formatCurrency } from '../../lib/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { CheckCircle, AlertCircle, Lock, MessageCircle, Eye, EyeOff } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SESSION_KEY = 'sq_admin_session';

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

interface Toast {
  type: 'success' | 'error';
  message: string;
}

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  function show(type: Toast['type'], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  return { toast, show };
}

interface WhatsAppConfig {
  whatsapp_api_key: string;
  whatsapp_business_number: string;
  whatsapp_active: boolean;
  whatsapp_quote_template: string;
  whatsapp_followup_template_1: string;
  whatsapp_followup_template_2: string;
  whatsapp_followup_template_3: string;
  whatsapp_final_followup_template: string;
  whatsapp_payment_received_template: string;
  whatsapp_final_payment_template: string;
}

const EMPTY_WA_CONFIG: WhatsAppConfig = {
  whatsapp_api_key: '',
  whatsapp_business_number: '',
  whatsapp_active: false,
  whatsapp_quote_template: '',
  whatsapp_followup_template_1: '',
  whatsapp_followup_template_2: '',
  whatsapp_followup_template_3: '',
  whatsapp_final_followup_template: '',
  whatsapp_payment_received_template: '',
  whatsapp_final_payment_template: '',
};

const TEMPLATE_FIELDS: { key: keyof WhatsAppConfig; label: string; placeholder: string; hint: string }[] = [
  { key: 'whatsapp_quote_template', label: 'Quote Sent Template', placeholder: 'e.g. snapquote_quote_sent', hint: 'Sent when a quote is saved & downloaded. Should contain client name, studio name, and quote amount variables.' },
  { key: 'whatsapp_followup_template_1', label: 'Follow-up Template 1', placeholder: 'e.g. snapquote_followup_1', hint: 'First follow-up message sent after the quote.' },
  { key: 'whatsapp_followup_template_2', label: 'Follow-up Template 2', placeholder: 'e.g. snapquote_followup_2', hint: 'Second follow-up message.' },
  { key: 'whatsapp_followup_template_3', label: 'Follow-up Template 3', placeholder: 'e.g. snapquote_followup_3', hint: 'Third follow-up message.' },
  { key: 'whatsapp_final_followup_template', label: 'Final Follow-up Template', placeholder: 'e.g. snapquote_final_followup', hint: 'Final follow-up before marking as lost.' },
  { key: 'whatsapp_payment_received_template', label: 'Payment Received Template', placeholder: 'e.g. snapquote_payment_received', hint: 'Sent after a partial payment is recorded. Should contain amount paid and remaining balance variables.' },
  { key: 'whatsapp_final_payment_template', label: 'Final Payment Template', placeholder: 'e.g. snapquote_payment_complete', hint: 'Sent when the invoice is fully paid. Should confirm full payment and thank the client.' },
];

export function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [trialDays, setTrialDays] = useState('14');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(EMPTY_WA_CONFIG);
  const [waLoading, setWaLoading] = useState(true);
  const [savingWa, setSavingWa] = useState(false);

  const { toast, show } = useToast();

  useEffect(() => {
    loadSettings();
    loadWhatsAppConfig();
  }, []);

  async function loadSettings() {
    setSettingsLoading(true);
    const { data } = await supabase
      .from('platform_settings')
      .select('id, value')
      .in('id', ['maintenance_mode', 'signups_enabled', 'trial_days']);

    if (data) {
      for (const row of data) {
        if (row.id === 'maintenance_mode') setMaintenanceMode(row.value === true || row.value === 'true');
        if (row.id === 'signups_enabled') setSignupsEnabled(row.value === true || row.value === 'true');
        if (row.id === 'trial_days') setTrialDays(String(row.value));
      }
    }
    setSettingsLoading(false);
  }

  async function loadWhatsAppConfig() {
    setWaLoading(true);
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) { setWaLoading(false); return; }

    try {
      const data = await callAdminFunction('admin-get-whatsapp-settings', { token });
      if (data.error) {
        show('error', 'Failed to load WhatsApp settings.');
      } else if (data.config) {
        const c = data.config;
        setWaConfig({
          whatsapp_api_key: c.whatsapp_api_key ?? '',
          whatsapp_business_number: c.whatsapp_business_number ?? '',
          whatsapp_active: c.whatsapp_active === true,
          whatsapp_quote_template: c.whatsapp_quote_template ?? '',
          whatsapp_followup_template_1: c.whatsapp_followup_template_1 ?? '',
          whatsapp_followup_template_2: c.whatsapp_followup_template_2 ?? '',
          whatsapp_followup_template_3: c.whatsapp_followup_template_3 ?? '',
          whatsapp_final_followup_template: c.whatsapp_final_followup_template ?? '',
          whatsapp_payment_received_template: c.whatsapp_payment_received_template ?? '',
          whatsapp_final_payment_template: c.whatsapp_final_payment_template ?? '',
        });
      }
    } catch {
      show('error', 'Network error loading WhatsApp settings.');
    }
    setWaLoading(false);
  }

  async function saveWhatsAppConfig() {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      show('error', 'Session expired. Please log in again.');
      return;
    }
    setSavingWa(true);
    try {
      const data = await callAdminFunction('admin-save-settings', {
        token,
        settings: [
          { id: 'whatsapp_api_key', value: waConfig.whatsapp_api_key },
          { id: 'whatsapp_business_number', value: waConfig.whatsapp_business_number },
          { id: 'whatsapp_active', value: waConfig.whatsapp_active },
          { id: 'whatsapp_quote_template', value: waConfig.whatsapp_quote_template },
          { id: 'whatsapp_followup_template_1', value: waConfig.whatsapp_followup_template_1 },
          { id: 'whatsapp_followup_template_2', value: waConfig.whatsapp_followup_template_2 },
          { id: 'whatsapp_followup_template_3', value: waConfig.whatsapp_followup_template_3 },
          { id: 'whatsapp_final_followup_template', value: waConfig.whatsapp_final_followup_template },
          { id: 'whatsapp_payment_received_template', value: waConfig.whatsapp_payment_received_template },
          { id: 'whatsapp_final_payment_template', value: waConfig.whatsapp_final_payment_template },
        ],
      });
      if (data.error) {
        show('error', 'Failed to save WhatsApp settings.');
      } else {
        show('success', 'WhatsApp configuration saved successfully.');
      }
    } catch {
      show('error', 'Network error. Please try again.');
    }
    setSavingWa(false);
  }

  async function saveSettings() {
    const days = parseInt(trialDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      show('error', 'Trial days must be between 1 and 365.');
      return;
    }
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      show('error', 'Session expired. Please log in again.');
      return;
    }
    setSavingSettings(true);
    const data = await callAdminFunction('admin-save-settings', {
      token,
      settings: [
        { id: 'maintenance_mode', value: maintenanceMode },
        { id: 'signups_enabled', value: signupsEnabled },
        { id: 'trial_days', value: days },
      ],
    });
    setSavingSettings(false);
    if (data.error) {
      show('error', 'Failed to save settings. Please try again.');
    } else {
      show('success', 'Platform settings saved successfully.');
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      show('error', 'All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      show('error', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      show('error', 'New password must be at least 8 characters.');
      return;
    }

    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      show('error', 'Session expired. Please log in again.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (data.error) {
        show('error', data.error);
      } else {
        show('success', 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      show('error', 'Network error. Please try again.');
    }
    setSavingPassword(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-[1.75rem] font-semibold text-ink tracking-tight">Platform Settings</h2>
        <p className="text-[0.9375rem] text-ink-muted mt-0.5">Global configuration for the SnapQuote platform</p>
      </div>

      {toast && (
        <div className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {settingsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <Card>
            <h3 className="text-sm font-semibold text-ink mb-4">Platform Controls</h3>
            <div className="space-y-0 divide-y divide-border">
              {[
                {
                  label: 'Maintenance Mode',
                  desc: 'Disable platform access for all studio users',
                  value: maintenanceMode,
                  toggle: () => setMaintenanceMode(v => !v),
                  danger: true,
                },
                {
                  label: 'New Signups Enabled',
                  desc: 'Allow new studios to register on the platform',
                  value: signupsEnabled,
                  toggle: () => setSignupsEnabled(v => !v),
                  danger: false,
                },
              ].map(({ label, desc, value, toggle, danger }) => (
                <div key={label} className="flex items-center justify-between py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{label}</p>
                      {danger && value && <Badge variant="danger">Active</Badge>}
                    </div>
                    <p className="text-xs text-ink-muted">{desc}</p>
                  </div>
                  <button
                    onClick={toggle}
                    className={`relative w-10 rounded-full transition-colors duration-200 ${
                      value ? (danger ? 'bg-danger' : 'bg-primary-600') : 'bg-slate-200'
                    }`}
                    style={{ height: '22px' }}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        value ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-ink mb-4">Trial Configuration</h3>
            <div className="space-y-4">
              <Input
                label="Trial Duration (days)"
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                hint="Number of days for the free trial period for new studios"
              />
              <div>
                <p className="text-sm font-medium text-ink mb-3">Trial Plan Access</p>
                <ul className="space-y-1.5">
                  {['Create up to 5 quotes', 'Manage up to 10 leads', '2 team members', 'Basic reporting'].map((feature) => (
                    <li key={feature} className="text-xs text-ink-muted pl-3 border-l-2 border-border">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" loading={savingSettings} onClick={saveSettings}>
                Save Configuration
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* WhatsApp / Interakt Configuration */}
      {waLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">WhatsApp / Interakt Configuration</h3>
                  {waConfig.whatsapp_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-ink-muted">Central configuration used by all studios. Credentials are never exposed to the frontend.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Interakt API Key</label>
                <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={waConfig.whatsapp_api_key}
                  onChange={e => setWaConfig(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                  placeholder="Enter Interakt API key"
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-subtle outline-none transition-all duration-150 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors"
                  aria-label={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                </div>
                <p className="text-xs text-ink-subtle">The API key from your Interakt account. This is stored securely and only accessible by admin and backend.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">SnapQuote WhatsApp Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">+</span>
                  <input
                    type="tel"
                    value={waConfig.whatsapp_business_number}
                    onChange={e => setWaConfig(prev => ({ ...prev, whatsapp_business_number: e.target.value }))}
                    placeholder="91XXXXXXXXXX"
                    className="w-full bg-surface border border-border rounded-md pl-6 pr-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none transition-all duration-150 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
                <p className="text-xs text-ink-subtle">Include country code without + (e.g. 919876543210). This is the single sender number for all studios.</p>
              </div>

              <div className="flex items-center justify-between py-3.5 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-ink">Enable WhatsApp Sending</p>
                  <p className="text-xs text-ink-muted">When enabled, all studios can send quotes via WhatsApp. When disabled, WhatsApp is unavailable for everyone.</p>
                </div>
                <button
                  onClick={() => setWaConfig(prev => ({ ...prev, whatsapp_active: !prev.whatsapp_active }))}
                  className={`relative w-12 rounded-full transition-colors duration-200 p-1 ${waConfig.whatsapp_active ? 'bg-primary-600' : 'bg-slate-200'}`}
                  style={{ height: '28px' }}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${waConfig.whatsapp_active ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Interakt Template Names</h3>
                <p className="text-xs text-ink-muted">Approved template names from your Interakt account. These are shared across all studios.</p>
              </div>
            </div>
            <div className="space-y-4">
              {TEMPLATE_FIELDS.map(({ key, label, placeholder, hint }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">{label}</label>
                  <input
                    type="text"
                    value={waConfig[key]}
                    onChange={e => setWaConfig(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none transition-all duration-150 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 font-mono"
                  />
                  <p className="text-xs text-ink-subtle">{hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end border-t border-border pt-5">
              <Button size="sm" loading={savingWa} onClick={saveWhatsAppConfig}>
                Save WhatsApp Configuration
              </Button>
            </div>
          </Card>
        </>
      )}

          <Card>
            <h3 className="text-sm font-semibold text-ink mb-1">Pricing Plans</h3>
            <p className="text-xs text-ink-muted mb-4">Current plan pricing reference</p>
            <div className="space-y-3">
              {[
                { plan: 'Starter', monthly: 299, annual: 2999, color: 'bg-slate-100' },
                { plan: 'Growth', monthly: 699, annual: 6999, color: 'bg-primary-50' },
                { plan: 'Pro', monthly: 1299, annual: 12999, color: 'bg-emerald-50' },
              ].map(({ plan, monthly, annual, color }) => (
                <div key={plan} className={`${color} rounded-lg p-4 flex items-center justify-between`}>
                  <span className="text-sm font-semibold text-ink">{plan}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-ink-subtle">Monthly</p>
                      <p className="text-sm font-bold text-ink">{formatCurrency(monthly)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-subtle">Annual</p>
                      <p className="text-sm font-bold text-ink">{formatCurrency(annual)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-ink-subtle" />
              <h3 className="text-sm font-semibold text-ink">Change Admin Password</h3>
            </div>
            <div className="space-y-3">
              <Input
                label="Current Password"
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                suffix={<button type="button" onClick={() => setShowCurrentPw(s => !s)} className="text-ink-subtle hover:text-ink transition-colors" aria-label={showCurrentPw ? 'Hide password' : 'Show password'}>{showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              />
              <Input
                label="New Password"
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                suffix={<button type="button" onClick={() => setShowNewPw(s => !s)} className="text-ink-subtle hover:text-ink transition-colors" aria-label={showNewPw ? 'Hide password' : 'Show password'}>{showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              />
              <Input
                label="Confirm New Password"
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                suffix={<button type="button" onClick={() => setShowConfirmPw(s => !s)} className="text-ink-subtle hover:text-ink transition-colors" aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>{showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" loading={savingPassword} onClick={changePassword}>
                Update Password
              </Button>
            </div>
          </Card>
    </div>
  );
}
