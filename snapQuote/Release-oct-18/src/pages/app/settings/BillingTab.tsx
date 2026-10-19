import { useState, useEffect } from 'react';
import { Check, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/currency';
import { useAuth } from '../../../contexts/AuthContext';
import { PLAN_LABELS, StudioPlan, BillingCycle, isBusinessPlan, isFreePlan } from '../../../types';
import { PLANS, loadRazorpayScript, PaymentState, RazorpayOptions, RazorpayResponse } from '../../../lib/razorpay';

interface Payment {
  id: string;
  plan: StudioPlan;
  billing_cycle: BillingCycle;
  amount: number;
  status: string;
  created_at: string;
  razorpay_payment_id: string | null;
}

const BUSINESS_FEATURES = [
  'Unlimited quotations',
  'All professional templates & themes',
  'Custom branding & logo',
  'Custom quotation backgrounds',
  'CRM & lead management',
  'Package templates & deliverables',
  'Discount display in quotes',
  'PDF generation & WhatsApp sharing',
  'Invoices & payments',
  'Advanced analytics',
  'Quotation tracking & follow-ups',
];

const FREE_FEATURES = [
  'Up to 10 quotations',
  '3 basic themes',
  'PDF download',
  'WhatsApp sharing',
  'Studio branding',
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function BillingTab() {
  const { profile } = useAuth();

  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currentPlan, setCurrentPlan] = useState<StudioPlan>('trial');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [successPlan, setSuccessPlan] = useState<StudioPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.studio_id) fetchBillingData();
    else setLoadingData(false);
  }, [profile?.studio_id]);

  async function fetchBillingData() {
    setLoadingData(true);
    try {
      const [studioRes, paymentsRes] = await Promise.all([
        supabase
          .from('studios')
          .select('plan, subscription_expires_at, billing_cycle')
          .eq('id', profile!.studio_id!)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('*')
          .eq('studio_id', profile!.studio_id!)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (studioRes.data) {
        setCurrentPlan(studioRes.data.plan as StudioPlan);
        setExpiresAt(studioRes.data.subscription_expires_at);
        setBillingCycle(studioRes.data.billing_cycle as BillingCycle ?? 'monthly');
      }
      setPayments((paymentsRes.data ?? []) as Payment[]);
    } catch {
      // non-fatal
    } finally {
      setLoadingData(false);
    }
  }

  async function handleUpgrade() {
    if (!profile?.studio_id) return;
    setPaymentState('creating');
    setErrorMsg(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Could not load payment SDK');

      const planConfig = PLANS.find(p => p.id === 'business')!;
      const priceINR = cycle === 'monthly' ? planConfig.monthlyPrice : planConfig.annualPrice;
      const amountPaise = priceINR * 100;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'business', billing_cycle: cycle, amount_paise: amountPaise }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create order');
      }

      const { order_id, amount, currency, key_id } = await res.json();
      setPaymentState('processing');

      const options: RazorpayOptions = {
        key: key_id,
        amount,
        currency,
        name: 'SnapQuote',
        description: `SnapQuote Business – ${cycle === 'monthly' ? 'Monthly' : 'Annual'}`,
        order_id,
        prefill: {
          name: profile.full_name ?? '',
          email: profile.email ?? '',
        },
        theme: { color: '#2563EB' },
        handler: async (response: RazorpayResponse) => {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: 'business' as StudioPlan,
            billing_cycle: cycle,
            amount_paise: amountPaise,
            token,
          });
        },
        modal: {
          ondismiss: () => {
            setPaymentState('idle');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function verifyPayment(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: StudioPlan;
    billing_cycle: BillingCycle;
    amount_paise: number;
    token: string;
  }) {
    setPaymentState('processing');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/razorpay-verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
          plan: params.plan,
          billing_cycle: params.billing_cycle,
          amount_paise: params.amount_paise,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Payment verification failed');
      }

      const result = await res.json();
      setCurrentPlan(params.plan);
      setBillingCycle(params.billing_cycle);
      setExpiresAt(result.expires_at ?? null);
      setSuccessPlan(params.plan);
      setPaymentState('success');
      await fetchBillingData();
    } catch (err) {
      setPaymentState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (paymentState === 'success' && successPlan) {
    return (
      <div className="max-w-md mx-auto py-8">
        <Card>
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-1">Your plan has been upgraded successfully</h3>
            <p className="text-sm text-ink-muted mb-1">
              You are now on the <span className="font-semibold text-ink">{PLAN_LABELS[successPlan]}</span> plan.
            </p>
            {expiresAt && (
              <p className="text-xs text-ink-subtle">
                Valid until {formatDateLong(expiresAt)}
              </p>
            )}
            <div className="mt-6">
              <Button
                size="sm"
                onClick={() => { setPaymentState('idle'); setSuccessPlan(null); }}
              >
                Continue
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const userIsBusiness = isBusinessPlan(currentPlan);
  const userIsFree = isFreePlan(currentPlan);
  const businessConfig = PLANS.find(p => p.id === 'business')!;
  const activePrice = billingCycle === 'annual' ? businessConfig.annualPrice : businessConfig.monthlyPrice;
  const upgradePrice = cycle === 'monthly' ? businessConfig.monthlyPrice : businessConfig.annualPrice;
  const annualSaving = 699 * 12 - 6990;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Error banner */}
      {paymentState === 'error' && errorMsg && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600">{errorMsg}</p>
            <button
              onClick={() => { setPaymentState('idle'); setErrorMsg(null); }}
              className="text-xs text-red-500 underline underline-offset-2 mt-1 hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Subscription Summary ── */}
      <div>
        <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
          Your Subscription
        </p>

        {userIsBusiness && !isExpired ? (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
              {/* Left: plan identity */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-ink">SnapQuote Business</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    Everything you need to create, send, track and manage professional quotations.
                  </p>
                </div>
              </div>

              {/* Right: price + renewal */}
              <div className="flex items-center gap-6 sm:text-right shrink-0">
                <div>
                  <p className="text-2xl font-bold text-ink leading-none">
                    {formatCurrency(activePrice)}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </p>
                </div>
                {expiresAt && (
                  <div className="hidden sm:block w-px h-10 bg-border" />
                )}
                {expiresAt && (
                  <div>
                    <p className="text-xs text-ink-subtle">Renews</p>
                    <p className="text-sm font-medium text-ink mt-0.5">{formatDate(expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : userIsBusiness && isExpired ? (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-ink">SnapQuote Business</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Expired
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    Your Business subscription expired{expiresAt ? ` on ${formatDate(expiresAt)}` : ''}. Renew to restore access.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                loading={paymentState === 'creating' || paymentState === 'processing'}
                disabled={paymentState === 'creating' || paymentState === 'processing'}
                onClick={handleUpgrade}
              >
                Renew Business
              </Button>
            </div>
          </div>
        ) : (
          /* Free plan summary */
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-ink">SnapQuote Free</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Current Plan
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  You're currently using SnapQuote Free. Upgrade whenever you need the full Business experience.
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-2xl font-bold text-ink leading-none">₹0</p>
                <p className="text-xs text-ink-muted mt-1">Free plan</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── What's Included (Business users) ── */}
      {userIsBusiness && !isExpired && (
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
            What's Included
          </p>
          <div className="bg-white border border-border rounded-xl px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {BUSINESS_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-xs text-ink-muted leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Billing Details (Business users) ── */}
      {userIsBusiness && !isExpired && (
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
            Billing Details
          </p>
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <dl className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-xs text-ink-muted">Plan</dt>
                <dd className="text-sm font-medium text-ink">SnapQuote Business</dd>
              </div>
              <div className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-xs text-ink-muted">Billing cycle</dt>
                <dd className="text-sm font-medium text-ink capitalize">{billingCycle}</dd>
              </div>
              <div className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-xs text-ink-muted">Amount</dt>
                <dd className="text-sm font-medium text-ink">
                  {formatCurrency(activePrice)} / {billingCycle === 'annual' ? 'year' : 'month'}
                </dd>
              </div>
              <div className="flex items-center justify-between px-6 py-3.5">
                <dt className="text-xs text-ink-muted">Status</dt>
                <dd className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">Active</span>
                </dd>
              </div>
              {expiresAt && (
                <div className="flex items-center justify-between px-6 py-3.5">
                  <dt className="text-xs text-ink-muted">Next renewal</dt>
                  <dd className="text-sm font-medium text-ink">{formatDateLong(expiresAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* ── Upgrade section (Free users) ── */}
      {userIsFree && (
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
            Upgrade to SnapQuote Business
          </p>

          {/* Cycle toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-0 bg-surface-raised border border-border rounded-lg p-0.5">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  cycle === 'monthly'
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle('annual')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  cycle === 'annual'
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Annual
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-px leading-tight">
                  Save ₹{annualSaving.toLocaleString('en-IN')}
                </span>
              </button>
            </div>
          </div>

          {/* Upgrade card */}
          <div className="relative bg-white border-2 border-primary-600 rounded-xl shadow-md shadow-primary-600/10 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-ink">SnapQuote Business</h3>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs leading-relaxed">
                    Ready to take your quotations to the next level? Get the full professional experience.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-ink leading-none">
                    {formatCurrency(upgradePrice)}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    /{cycle === 'monthly' ? 'month' : 'year'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-6">
                {BUSINESS_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-xs text-ink-muted leading-snug">{f}</span>
                  </div>
                ))}
              </div>

              <Button
                size="md"
                variant="primary"
                loading={paymentState === 'creating' || paymentState === 'processing'}
                disabled={paymentState === 'creating' || paymentState === 'processing'}
                onClick={handleUpgrade}
                className="w-full"
              >
                {paymentState === 'creating' || paymentState === 'processing'
                  ? 'Processing…'
                  : `Upgrade to SnapQuote Business — ${formatCurrency(upgradePrice)}/${cycle === 'monthly' ? 'mo' : 'yr'}`}
              </Button>

              <p className="text-center text-xs text-ink-subtle mt-3">
                Cancel anytime. No commitment required.
              </p>
            </div>
          </div>

          {/* Free plan features */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
              Your Free Plan Includes
            </p>
            <div className="bg-white border border-border rounded-xl px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-xs text-ink-muted leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-widest mb-3">
            Payment History
          </p>
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left text-[10px] font-semibold text-ink-subtle uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-[10px] font-semibold text-ink-subtle uppercase tracking-wider px-5 py-3">Description</th>
                  <th className="text-right text-[10px] font-semibold text-ink-subtle uppercase tracking-wider px-5 py-3">Amount</th>
                  <th className="text-right text-[10px] font-semibold text-ink-subtle uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-ink-muted whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink">
                      {PLAN_LABELS[p.plan] ?? p.plan} · {p.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-ink text-right whitespace-nowrap">
                      {formatCurrency(p.amount / 100)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
