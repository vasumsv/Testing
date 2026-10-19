import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Landmark, Hash, Smartphone, FileText } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { PaymentDetails } from '../quote-builder/types';

const EMPTY: PaymentDetails = {
  account_holder: '',
  account_number: '',
  ifsc_code: '',
  bank_name: '',
  upi_id: '',
  notes: '',
};

export function PaymentDetailsTab() {
  const { profile } = useAuth();
  const [form, setForm] = useState<PaymentDetails>(EMPTY);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!profile?.studio_id) { setLoading(false); return; }
      const { data } = await supabase
        .from('studios')
        .select('id, payment_details')
        .eq('id', profile.studio_id)
        .maybeSingle();
      if (data) {
        setStudioId(data.id);
        if (data.payment_details) {
          setForm({ ...EMPTY, ...data.payment_details });
        }
      }
      setLoading(false);
    }
    load();
  }, [profile?.studio_id]);

  function set(field: keyof PaymentDetails, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    if (!studioId) return;
    setError('');
    setSaving(true);
    const payload = {
      account_holder: form.account_holder.trim(),
      account_number: form.account_number.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase(),
      bank_name: form.bank_name.trim(),
      upi_id: form.upi_id.trim(),
      notes: form.notes.trim(),
    };
    const { error: err } = await supabase
      .from('studios')
      .update({ payment_details: payload, updated_at: new Date().toISOString() })
      .eq('id', studioId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(payload);
    setSavedAt(new Date());
  }

  const hasAnyData = Object.values(form).some(v => v.trim());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Payment Details</h3>
            <p className="text-xs text-ink-muted">Shown on quotations when "Show Payment Details" is enabled</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Account Holder Name"
              placeholder="e.g. Rahul Sharma"
              value={form.account_holder}
              onChange={e => set('account_holder', e.target.value)}
              prefix={<Landmark className="w-3.5 h-3.5" />}
            />
            <Input
              label="Bank Name"
              placeholder="e.g. HDFC Bank"
              value={form.bank_name}
              onChange={e => set('bank_name', e.target.value)}
              prefix={<Landmark className="w-3.5 h-3.5" />}
            />
            <Input
              label="Account Number"
              placeholder="e.g. 0123456789"
              value={form.account_number}
              onChange={e => set('account_number', e.target.value)}
              prefix={<Hash className="w-3.5 h-3.5" />}
            />
            <Input
              label="IFSC Code"
              placeholder="e.g. HDFC0001234"
              value={form.ifsc_code}
              onChange={e => set('ifsc_code', e.target.value.toUpperCase())}
              prefix={<Hash className="w-3.5 h-3.5" />}
            />
          </div>

          <Input
            label="UPI ID"
            placeholder="e.g. rahul@upi or +91-9876543210@paytm"
            value={form.upi_id}
            onChange={e => set('upi_id', e.target.value)}
            prefix={<Smartphone className="w-3.5 h-3.5" />}
            hint="Optional"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-ink-subtle" />
              Notes
            </label>
            <textarea
              rows={3}
              placeholder={"e.g. Please mention the quote number in the transfer description.\nPayment within 48 hours of booking confirmation."}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-all duration-150 outline-none resize-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 leading-relaxed"
            />
            <p className="text-xs text-ink-subtle">Optional — any additional payment instructions for clients</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          {savedAt ? (
            <div className="flex items-center gap-1.5 text-success">
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : (
            <span className="text-xs text-ink-subtle">
              {hasAnyData ? 'Unsaved changes' : 'No payment details saved yet'}
            </span>
          )}
          <Button onClick={handleSave} loading={saving} size="sm" disabled={!studioId}>
            Save Changes
          </Button>
        </div>
      </Card>

      {hasAnyData && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wider mb-3">Preview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {form.account_holder && (
              <div>
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">Account Holder</p>
                <p className="text-sm text-ink mt-0.5">{form.account_holder}</p>
              </div>
            )}
            {form.bank_name && (
              <div>
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">Bank</p>
                <p className="text-sm text-ink mt-0.5">{form.bank_name}</p>
              </div>
            )}
            {form.account_number && (
              <div>
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">Account Number</p>
                <p className="text-sm text-ink mt-0.5">{form.account_number}</p>
              </div>
            )}
            {form.ifsc_code && (
              <div>
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">IFSC Code</p>
                <p className="text-sm text-ink mt-0.5">{form.ifsc_code}</p>
              </div>
            )}
            {form.upi_id && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider">UPI ID</p>
                <p className="text-sm text-ink mt-0.5">{form.upi_id}</p>
              </div>
            )}
            {form.notes && (
              <div className="sm:col-span-2 pt-2 border-t border-border mt-1">
                <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider mb-1">Notes</p>
                <p className="text-xs text-ink-muted whitespace-pre-wrap">{form.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
