import { useState, useEffect } from 'react';
import { MessageCircle, Check, X, Bell, Receipt, FileCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { supabase } from '../../../lib/supabase';

interface WhatsAppStatus {
  active: boolean;
  businessNumber: string;
  quoteTemplate: string;
  followupTemplate1: string;
  paymentReceivedTemplate: string;
  finalPaymentTemplate: string;
}

export function WhatsAppTab() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      const { data } = await supabase
        .from('platform_settings')
        .select('id, value')
        .in('id', [
          'whatsapp_active',
          'whatsapp_business_number',
          'whatsapp_quote_template',
          'whatsapp_followup_template_1',
          'whatsapp_payment_received_template',
          'whatsapp_final_payment_template',
        ]);

      const map: Record<string, any> = {};
      for (const row of data ?? []) {
        map[row.id] = row.value;
      }

      setStatus({
        active: map.whatsapp_active === true,
        businessNumber: map.whatsapp_business_number ?? '',
        quoteTemplate: map.whatsapp_quote_template ?? '',
        followupTemplate1: map.whatsapp_followup_template_1 ?? '',
        paymentReceivedTemplate: map.whatsapp_payment_received_template ?? '',
        finalPaymentTemplate: map.whatsapp_final_payment_template ?? '',
      });
      setLoading(false);
    }
    loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = status?.active === true;

  function formatNumber(num: string): string {
    if (!num) return '';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length >= 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return `+${cleaned}`;
  }

  const automations = [
    {
      label: 'Quote Follow-ups',
      enabled: !!(status?.followupTemplate1),
      icon: <Bell className="w-3.5 h-3.5" />,
    },
    {
      label: 'Payment Notifications',
      enabled: !!(status?.paymentReceivedTemplate),
      icon: <Receipt className="w-3.5 h-3.5" />,
    },
    {
      label: 'Final Invoice',
      enabled: !!(status?.finalPaymentTemplate),
      icon: <FileCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Status card */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isActive
              ? 'bg-green-50 border border-green-100'
              : 'bg-amber-50 border border-amber-100'
          }`}>
            <MessageCircle className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">WhatsApp</h3>
            <p className="text-xs text-ink-muted">Powered by SnapQuote</p>
          </div>
        </div>

        {isActive ? (
          <div className="space-y-4">
            {/* Connected status */}
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <p className="text-sm font-medium text-emerald-700">Connected</p>
            </div>

            <p className="text-sm text-ink-muted leading-relaxed">
              Your quotations, follow-ups and payment updates are sent to customers through SnapQuote WhatsApp.
            </p>

            {/* Sending number */}
            <div className="bg-surface-raised border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-ink-subtle mb-1">Sending number</p>
              <p className="text-sm font-medium text-ink tabular-nums">
                {status?.businessNumber ? formatNumber(status.businessNumber) : 'Not set'}
              </p>
              <p className="text-xs text-ink-subtle mt-1">This number is managed by SnapQuote.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <p className="text-sm font-medium text-amber-700">Not available</p>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              WhatsApp messaging is currently unavailable. Please contact SnapQuote support.
            </p>
          </div>
        )}
      </Card>

      {/* Automation statuses */}
      {isActive && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-4">Automation Status</h3>
          <div className="space-y-0 divide-y divide-border">
            {automations.map(({ label, enabled, icon }) => (
              <div key={label} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-ink-subtle">{icon}</span>
                  <p className="text-sm font-medium text-ink">{label}</p>
                </div>
                {enabled ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                    <Check className="w-3 h-3" /> ON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-subtle bg-slate-50 border border-border rounded-full px-2.5 py-1">
                    <X className="w-3 h-3" /> OFF
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info card */}
      <Card>
        <div className="flex items-start gap-2.5">
          <MessageCircle className="w-4 h-4 text-ink-subtle shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">About WhatsApp on SnapQuote</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              WhatsApp sending is managed centrally by SnapQuote. Your studio name, contact number, and other
              business details are automatically included in customer-facing messages. You don't need to
              configure any technical settings — just use the "Send via WhatsApp" button when creating or
              managing quotes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
